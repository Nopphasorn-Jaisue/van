import { isFacultyMatch } from "@/Frontend/data/faculties";
import { getStoredCalendarEvents } from "./calendar-store";
import { prisma } from "@/lib/prisma";


export interface RankedVanItem {
  id: string;
  vanName: string;
  plate: string;
  facultyId: string;
  facultyName: string;
  shortFacultyName: string;
  driverName: string;
  driverPhone: string;
  driverImage: string;
  vanImage: string;
  capacity: number; // 10-12 ที่นั่งมาตรฐาน
  isAvailable: boolean;
  conflictReason?: string;
  workloadScore: number; // จำนวนภารกิจสะสม
  rank?: number;
  isPreference?: boolean;
}

export interface OptimizationRecommendationResult {
  requestedCount: number;
  availableCount: number;
  missingCount: number;
  isPartialFulfillment: boolean;
  rankedAvailableVans: RankedVanItem[];
  allVansStatus: RankedVanItem[];
  capacityWarning: boolean;
  totalCapacityOfAvailable: number;
  passengerCount: number;
}

/**
 * คำนวณความว่างและการจัดอันดับตาม Vehicle-Driver Pair และ Driver Workload
 * ตามข้อกำหนด 11, 12, 13, 14, 16
 * - Fixed Time Window: ไม่ขยับเวลา ตรวจสอบตลอดช่วง
 * - ไม่มี Buffer time (จบ 12:00 เริ่ม 12:00 ถือว่าไม่ Overlap)
 * - Vehicle-Driver Pair: รถไม่ว่าง = คนขับไม่ว่าง
 * - Ranking: เรียงตามภาระงานสะสมของคนขับ (Workload) น้อยไปหามาก
 */
export async function getRankedRecommendedVans(params: {
  startAt: string | Date;
  endAt: string | Date;
  requestedCount?: number;
  passengerCount?: number;
  preferredFaculty?: string;
}): Promise<OptimizationRecommendationResult> {
  const reqCount = Number(params.requestedCount) || 1;
  const passCount = Number(params.passengerCount) || 1;
  const startReq = new Date(params.startAt).getTime();
  const endReq = new Date(params.endAt).getTime();

  // 1. ดึงข้อมูลภารกิจทั้งหมดในระบบเพื่อตรวจ Time Overlap และคำนวณ Workload
  let dbBookings: Array<{
    departureDate: Date;
    returnDate: Date;
    targetFacultyId: number;
    assignedDriverId?: number | null;
    status: string;
  }> = [];

  try {
    dbBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['APPROVED', 'WAITING_ADMIN', 'WAITING_EXEC'] }
      },
      select: {
        departureDate: true,
        returnDate: true,
        targetFacultyId: true,
        assignedDriverId: true,
        status: true
      }
    });
  } catch (e) {
    console.warn("Prisma query warning:", e);
  }

  // 1.5 Fetch live vans and drivers strictly from Supabase DB
  let baseVans: Array<{
    id: string;
    facultyId: string;
    facultyName: string;
    shortFacultyName: string;
    vanName: string;
    plate: string;
    driverName: string;
    driverPhone: string;
    driverImage: string;
    vanImage: string;
  }> = [];

  try {
    const dbVans = await prisma.van.findMany({
      where: { isActive: true },
      include: {
        faculty: true,
        assignedDrivers: {
          include: { user: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    if (dbVans && dbVans.length > 0) {
      baseVans = dbVans.map(v => {
        const assignedDriver = v.assignedDrivers && v.assignedDrivers.length > 0 ? v.assignedDrivers[0] : null;
        const driverUser = assignedDriver?.user;

        // Pull avatars directly from Supabase DB (supports Base64, Supabase Storage URLs, /uploads/)
        const rawDriverAvatar = (assignedDriver?.avatar && !assignedDriver.avatar.includes('unsplash.com'))
          ? assignedDriver.avatar
          : (driverUser?.avatar && !driverUser.avatar.includes('unsplash.com'))
            ? driverUser.avatar
            : "";

        // Pull van image directly from Supabase DB
        const vanImage = (v.image && !v.image.includes('unsplash.com'))
          ? v.image
          : "";

        const facultyName = v.faculty?.nameTh || "มหาวิทยาลัยพะเยา";
        const shortFacultyName = facultyName.replace("คณะ", "").trim();

        return {
          id: String(v.id),
          facultyId: String(v.facultyId),
          facultyName: facultyName,
          shortFacultyName: shortFacultyName,
          vanName: v.name || `รถตู้ ${facultyName} (${v.plate})`,
          plate: v.plate,
          driverName: driverUser?.name || "พนักงานขับรถ",
          driverPhone: assignedDriver?.phone || driverUser?.phone || "-",
          driverImage: rawDriverAvatar,
          vanImage: vanImage,
        };
      });
    }
  } catch (err) {
    console.error("Notice: Error fetching real vans from Supabase DB:", err);
  }

  const storedCalendarEvents = getStoredCalendarEvents();

  // 2. คำนวณภาระงานสะสม (Driver Workload)
  const workloadMap: Record<string, number> = {};
  baseVans.forEach(v => {
    workloadMap[v.id] = 0;
  });

  // นับจาก DB
  dbBookings.forEach(b => {
    const fid = String(b.targetFacultyId);
    if (workloadMap[fid] !== undefined) {
      workloadMap[fid] += 1;
    }
  });

  // นับจาก Calendar Store
  storedCalendarEvents.forEach(e => {
    const vid = String(e.vanId || e.facultyId || '');
    if (workloadMap[vid] !== undefined) {
      workloadMap[vid] += 1;
    }
  });

  // 3. ตรวจสอบความว่างแบบ Fixed Time Window (No Buffer Time)
  const allRanked: RankedVanItem[] = baseVans.map(v => {
    let isAvailable = true;
    let conflictReason: string | undefined = undefined;

    // ตรวจสอบใน DB Bookings
    for (const b of dbBookings) {
      if (String(b.targetFacultyId) === v.id || String(b.targetFacultyId) === v.facultyId) {
        const bStart = new Date(b.departureDate).getTime();
        const bEnd = new Date(b.returnDate).getTime();
        // ไม่ซ้อนทับถ้าเริ่มตรงกับเวลาที่งานก่อนหน้าจบพอดี (startReq >= bEnd หรือ endReq <= bStart)
        const isOverlap = startReq < bEnd && endReq > bStart;
        if (isOverlap) {
          isAvailable = false;
          conflictReason = 'ติดภารกิจในระบบช่วงเวลาดังกล่าว';
          break;
        }
      }
    }

    // ตรวจสอบใน Calendar Store
    if (isAvailable) {
      for (const e of storedCalendarEvents) {
        const matchesVan = e.vanId === v.id || e.facultyId === v.facultyId || isFacultyMatch(e.bookingFaculty, v.facultyName);
        if (matchesVan && e.date) {
          const cStart = new Date(e.date).getTime();
          const cEnd = new Date(e.returnDate || e.date).getTime() + (24 * 60 * 60 * 1000 - 1);
          const isOverlap = startReq <= cEnd && endReq >= cStart;
          if (isOverlap) {
            isAvailable = false;
            conflictReason = 'ติดภารกิจตามตารางปฏิทิน';
            break;
          }
        }
      }
    }

    const isPreference = params.preferredFaculty && params.preferredFaculty !== 'all' 
      ? isFacultyMatch(v.facultyName, params.preferredFaculty) 
      : false;

    return {
      id: v.id,
      vanName: v.vanName,
      plate: v.plate,
      facultyId: v.facultyId,
      facultyName: v.facultyName,
      shortFacultyName: v.shortFacultyName,
      driverName: v.driverName,
      driverPhone: v.driverPhone,
      driverImage: v.driverImage,
      vanImage: v.vanImage,
      capacity: 12, // มาตรฐาน 12 ที่นั่ง
      isAvailable,
      conflictReason,
      workloadScore: workloadMap[v.id] || 0,
      isPreference
    };
  });

  // 4. จัดอันดับรถที่ว่าง (Availability -> Preference -> Driver Workload น้อยไปหามาก)
  const availableVans = allRanked.filter(v => v.isAvailable);
  availableVans.sort((a, b) => {
    // 4.1 คณะที่ผู้ใช้เลือก (Preference) ขึ้นก่อนหากว่าง
    if (a.isPreference && !b.isPreference) return -1;
    if (!a.isPreference && b.isPreference) return 1;

    // 4.2 Driver Workload: ภาระงานสะสมน้อยกว่าได้รับคัดเลือกก่อน เพื่อกระจายงานอย่างเป็นธรรม
    if (a.workloadScore !== b.workloadScore) {
      return a.workloadScore - b.workloadScore;
    }

    return a.id.localeCompare(b.id);
  });

  // ใส่ลำดับ rank
  availableVans.forEach((v, index) => {
    v.rank = index + 1;
  });

  const availableCount = availableVans.length;
  const missingCount = Math.max(0, reqCount - availableCount);
  const isPartialFulfillment = reqCount > availableCount && availableCount > 0;
  const totalCapacityOfAvailable = availableVans.slice(0, reqCount).reduce((acc, curr) => acc + curr.capacity, 0);
  const capacityWarning = passCount > (totalCapacityOfAvailable || 12);

  return {
    requestedCount: reqCount,
    availableCount,
    missingCount,
    isPartialFulfillment,
    rankedAvailableVans: availableVans,
    allVansStatus: allRanked,
    capacityWarning,
    totalCapacityOfAvailable,
    passengerCount: passCount
  };
}
