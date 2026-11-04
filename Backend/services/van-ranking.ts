import { isFacultyMatch } from "@/Frontend/data/faculties";
import { getStoredCalendarEvents } from "./calendar-store";
import { prisma } from "@/lib/prisma";

export * from "@/lib/trip-calculation";
import { 
  checkMultiDayTrip, 
  calculateTripWorkProfile, 
  DUTY_DAY_START_HOUR, 
  MIN_REST_HOURS, 
  MAX_DAILY_HOURS, 
  MAX_WEEKLY_HOURS 
} from "@/lib/trip-calculation";

export interface DriverSafetyInfo {
  safetyStatus: 'SAFE' | 'WARNING' | 'REST_CONFLICT' | 'OVER_LIMIT';
  safetyBadgeText: string;
  restHours: number;
  dailyHours: number;
  weeklyHours: number;
  failedReasons?: string[];
}

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
  capacity: number;
  isAvailable: boolean;
  conflictReason?: string;
  workloadScore: number;
  rank?: number;
  isPreference?: boolean;
  safety?: DriverSafetyInfo;
}

export interface LargeGroupSuggestion {
  isNeeded: boolean;
  suggestedVehicles: number;
  suggestedVanIds: string[];
  message: string;
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
  multiDayInfo?: import("@/lib/trip-calculation").MultiDayTripInfo;
  largeGroupSuggestion?: LargeGroupSuggestion;
}

/**
 * Calculate recommended vans with Model v5 safety constraints, 08:00 cutoff, and large group suggestions
 */
export async function getRankedRecommendedVans(params: {
  startAt: string | Date;
  endAt: string | Date;
  requestedCount?: number;
  passengerCount?: number;
  preferredFaculty?: string;
  userFaculty?: string;
}): Promise<OptimizationRecommendationResult> {
  const passCount = Number(params.passengerCount) || 1;
  // If passengerCount > 11 and user did not specify requestedCount, auto suggest 2 or more vans
  const calculatedVehicles = passCount > 11 ? Math.max(2, Math.ceil(passCount / 11)) : 1;
  const reqCount = params.requestedCount ? Number(params.requestedCount) : calculatedVehicles;

  const startReq = new Date(params.startAt).getTime();
  const endReq = new Date(params.endAt).getTime();

  // Multi-day check and work profile calculation
  const multiDayCheck = checkMultiDayTrip(params.startAt, params.endAt);
  const workProfile = calculateTripWorkProfile(params.startAt, params.endAt);
  const tripWorkHours = workProfile.totalWorkHours;

  // 1. Fetch active bookings from DB
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

  // 2. Fetch live vans and drivers strictly from DB
  let baseVans: Array<{
    id: string;
    facultyId: string;
    facultyName: string;
    shortFacultyName: string;
    vanName: string;
    plate: string;
    driverId?: number;
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

        const rawDriverAvatar = (assignedDriver?.avatar && !assignedDriver.avatar.includes('unsplash.com'))
          ? assignedDriver.avatar
          : (driverUser?.avatar && !driverUser.avatar.includes('unsplash.com'))
            ? driverUser.avatar
            : "";

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
          driverId: assignedDriver?.id,
          driverName: driverUser?.name || "พนักงานขับรถ",
          driverPhone: assignedDriver?.phone || driverUser?.phone || "-",
          driverImage: rawDriverAvatar,
          vanImage: vanImage,
        };
      });
    }
  } catch (err) {
    console.error("Notice: Error fetching real vans from DB:", err);
  }

  const storedCalendarEvents = getStoredCalendarEvents();

  // 3. Calculate Driver Workload
  const workloadMap: Record<string, number> = {};
  baseVans.forEach(v => {
    workloadMap[v.id] = 0;
  });

  dbBookings.forEach(b => {
    const fid = String(b.targetFacultyId);
    if (workloadMap[fid] !== undefined) {
      workloadMap[fid] += 1;
    }
  });

  storedCalendarEvents.forEach(e => {
    const vid = String(e.vanId || e.facultyId || '');
    if (workloadMap[vid] !== undefined) {
      workloadMap[vid] += 1;
    }
  });

  // 4. Evaluate Availability & Model v5 Safety Constraints for each van
  const sevenDaysAgo = startReq - 7 * 24 * 3600 * 1000;
  const startDayFloor = new Date(params.startAt);
  startDayFloor.setHours(DUTY_DAY_START_HOUR, 0, 0, 0);
  const dutyDayStart = startDayFloor.getTime() <= startReq ? startDayFloor.getTime() : startDayFloor.getTime() - 24 * 3600 * 1000;
  const dutyDayEnd = dutyDayStart + 24 * 3600 * 1000;

  const allRanked: RankedVanItem[] = baseVans.map(v => {
    let isAvailable = true;
    let conflictReason: string | undefined = undefined;
    const failedReasons: string[] = [];

    // Collect all existing trips for this van / driver
    const existingTrips: Array<{ start: number; end: number }> = [];

    // Trips from DB Bookings
    for (const b of dbBookings) {
      const matchVan = String(b.targetFacultyId) === v.id || String(b.targetFacultyId) === v.facultyId || (v.driverId && b.assignedDriverId === v.driverId);
      if (matchVan) {
        const bStart = new Date(b.departureDate).getTime();
        const bEnd = new Date(b.returnDate).getTime();
        existingTrips.push({ start: bStart, end: bEnd });

        // Overlap checking: startReq < bEnd && endReq > bStart
        const isOverlap = startReq < bEnd && endReq > bStart;
        if (isOverlap) {
          isAvailable = false;
          conflictReason = 'ติดภารกิจในระบบช่วงเวลาดังกล่าว';
          failedReasons.push(conflictReason);
        }
      }
    }

    // Trips from Calendar Store
    for (const e of storedCalendarEvents) {
      const matchesVan = e.vanId === v.id || e.facultyId === v.facultyId || isFacultyMatch(e.bookingFaculty, v.facultyName);
      if (matchesVan && e.date) {
        const cStart = new Date(e.date).getTime();
        const cEnd = new Date(e.returnDate || e.date).getTime() + (24 * 60 * 60 * 1000 - 1);
        existingTrips.push({ start: cStart, end: cEnd });

        const isOverlap = startReq <= cEnd && endReq >= cStart;
        if (isOverlap && isAvailable) {
          isAvailable = false;
          conflictReason = 'ติดภารกิจตามตารางปฏิทิน';
          failedReasons.push(conflictReason);
        }
      }
    }

    // Safety Constraint 1: Rest period (MIN_REST_HOURS = 10 hrs)
    // Find closest previous trip ending before startReq
    const previousTrips = existingTrips.filter(t => t.end <= startReq);
    let restHours = 24.0; // Default assuming well-rested
    if (previousTrips.length > 0) {
      const lastTripEnd = Math.max(...previousTrips.map(t => t.end));
      restHours = Math.max(0, (startReq - lastTripEnd) / (3600 * 1000));
    }

    let isRestOk = true;
    if (previousTrips.length > 0 && restHours < MIN_REST_HOURS) {
      isRestOk = false;
      const restMsg = `เวลาพักผ่อนก่อนหน้าเพียง ${restHours.toFixed(1)} ชม. (เกณฑ์ปลอดภัยต้องอย่างน้อย ${MIN_REST_HOURS} ชม.)`;
      failedReasons.push(restMsg);
      if (isAvailable) {
        isAvailable = false;
        conflictReason = restMsg;
      }
    }

    // Safety Constraint 2: Daily driving hours (MAX_DAILY_HOURS = 14 hrs)
    const sameDayTrips = existingTrips.filter(t => t.start < dutyDayEnd && t.end > dutyDayStart);
    let dailyHours = 0;
    sameDayTrips.forEach(t => {
      const overlapStart = Math.max(dutyDayStart, t.start);
      const overlapEnd = Math.min(dutyDayEnd, t.end);
      dailyHours += Math.max(0, (overlapEnd - overlapStart) / (3600 * 1000));
    });

    const dailyHoursAfter = dailyHours + tripWorkHours;
    let isDailyOk = true;
    if (dailyHoursAfter > MAX_DAILY_HOURS) {
      isDailyOk = false;
      const dailyMsg = `ชั่วโมงงานรายวันเดิม ${dailyHours.toFixed(1)} + ทริปนี้ ${tripWorkHours.toFixed(1)} = ${dailyHoursAfter.toFixed(1)} ชม. (เกินเกณฑ์ ${MAX_DAILY_HOURS} ชม.)`;
      failedReasons.push(dailyMsg);
      if (isAvailable) {
        isAvailable = false;
        conflictReason = dailyMsg;
      }
    }

    // Safety Constraint 3: Weekly rolling hours (MAX_WEEKLY_HOURS = 72 hrs)
    const pastSevenDayTrips = existingTrips.filter(t => t.end > sevenDaysAgo && t.start < startReq);
    let weeklyHours = 0;
    pastSevenDayTrips.forEach(t => {
      weeklyHours += Math.max(0, (Math.min(startReq, t.end) - Math.max(sevenDaysAgo, t.start)) / (3600 * 1000));
    });

    const weeklyHoursAfter = weeklyHours + tripWorkHours;
    let isWeeklyOk = true;
    if (weeklyHoursAfter > MAX_WEEKLY_HOURS) {
      isWeeklyOk = false;
      const weeklyMsg = `ชั่วโมงงานสะสม 7 วัน ${weeklyHoursAfter.toFixed(1)} ชม. เกินเกณฑ์ ${MAX_WEEKLY_HOURS} ชม.`;
      failedReasons.push(weeklyMsg);
      if (isAvailable) {
        isAvailable = false;
        conflictReason = weeklyMsg;
      }
    }

    // Determine Driver Safety Status
    let safetyStatus: DriverSafetyInfo['safetyStatus'] = 'SAFE';
    let safetyBadgeText = `พักผ่อน ≥10 ชม. • สะสม ${weeklyHours.toFixed(0)}/72 ชม.`;

    if (!isRestOk) {
      safetyStatus = 'REST_CONFLICT';
      safetyBadgeText = `พักเพียง ${restHours.toFixed(1)} ชม. (< 10 ชม.)`;
    } else if (!isDailyOk || !isWeeklyOk) {
      safetyStatus = 'OVER_LIMIT';
      safetyBadgeText = !isDailyOk ? `เกิน 14 ชม./วัน` : `เกิน 72 ชม./สัปดาห์`;
    } else if (weeklyHours > 50) {
      safetyStatus = 'WARNING';
      safetyBadgeText = `ภาระงานสูง (${weeklyHours.toFixed(0)}/72 ชม.)`;
    }

    const isOwnFaculty = Boolean(params.userFaculty && isFacultyMatch(v.facultyName, params.userFaculty));

    // Preference evaluation:
    // 1. If user explicitly picked a specific other faculty (not 'all' and not 'own'), prioritize that faculty.
    // 2. Otherwise (whether 'all', 'own', or omitted), the user's OWN faculty is ALWAYS given top preference!
    const isPreference = (params.preferredFaculty && params.preferredFaculty !== 'all' && params.preferredFaculty !== 'own')
      ? isFacultyMatch(v.facultyName, params.preferredFaculty)
      : isOwnFaculty;

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
      capacity: 12,
      isAvailable,
      conflictReason,
      workloadScore: workloadMap[v.id] || 0,
      isPreference,
      safety: {
        safetyStatus,
        safetyBadgeText,
        restHours: Number(restHours.toFixed(1)),
        dailyHours: Number(dailyHours.toFixed(1)),
        weeklyHours: Number(weeklyHours.toFixed(1)),
        failedReasons
      }
    };
  });

  // 5. Ranking Available Vans:
  // (1) Availability -> (2) Preference (own faculty first) -> (3) Safe status -> (4) Driver workload ascending
  const availableVans = allRanked.filter(v => v.isAvailable);
  availableVans.sort((a, b) => {
    // 5.1 Preference (Own faculty first)
    if (a.isPreference && !b.isPreference) return -1;
    if (!a.isPreference && b.isPreference) return 1;

    // 5.2 Safety status: SAFE over WARNING
    if (a.safety?.safetyStatus === 'SAFE' && b.safety?.safetyStatus !== 'SAFE') return -1;
    if (a.safety?.safetyStatus !== 'SAFE' && b.safety?.safetyStatus === 'SAFE') return 1;

    // 5.3 Workload: lower score first
    if (a.workloadScore !== b.workloadScore) {
      return a.workloadScore - b.workloadScore;
    }

    return a.id.localeCompare(b.id);
  });

  // Assign ranks
  availableVans.forEach((v, index) => {
    v.rank = index + 1;
  });

  const availableCount = availableVans.length;
  const missingCount = Math.max(0, reqCount - availableCount);
  const isPartialFulfillment = reqCount > availableCount && availableCount > 0;
  const totalCapacityOfAvailable = availableVans.slice(0, reqCount).reduce((acc, curr) => acc + curr.capacity, 0);
  const capacityWarning = passCount > (totalCapacityOfAvailable || 12);

  // 6. Large Group Multi-van Suggestion (suggest_vans_for_large_group)
  let largeGroupSuggestion: LargeGroupSuggestion | undefined = undefined;
  if (passCount > 11) {
    const neededVans = Math.max(2, Math.ceil(passCount / 11));
    const suggestedIds = availableVans.slice(0, neededVans).map(v => v.id);
    const hasEnough = suggestedIds.length >= neededVans;

    largeGroupSuggestion = {
      isNeeded: true,
      suggestedVehicles: neededVans,
      suggestedVanIds: suggestedIds,
      message: hasEnough
        ? `ตรวจพบผู้โดยสาร ${passCount} คน (เกิน 11 ที่นั่ง) ระบบแนะนำจัดรถตู้ ${neededVans} คัน พร้อมคนขับ`
        : `ตรวจพบผู้โดยสาร ${passCount} คน ต้องการรถ ${neededVans} คัน แต่มีรถที่ผ่านเกณฑ์เพียง ${suggestedIds.length} คัน`
    };
  }

  return {
    requestedCount: reqCount,
    availableCount,
    missingCount,
    isPartialFulfillment,
    rankedAvailableVans: availableVans,
    allVansStatus: allRanked,
    capacityWarning,
    totalCapacityOfAvailable,
    passengerCount: passCount,
    multiDayInfo: {
      isMultiDay: multiDayCheck.isMultiDay,
      description: multiDayCheck.description,
      daysCount: multiDayCheck.daysCount,
      countedWorkHours: Number(tripWorkHours.toFixed(1))
    },
    largeGroupSuggestion
  };
}
