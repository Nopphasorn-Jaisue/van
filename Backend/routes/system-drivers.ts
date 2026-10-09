import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-util";


type DriverCacheStore = { [key: string]: { data: unknown[]; timestamp: number } };

function getDriverCache(): DriverCacheStore {
  const g = globalThis as unknown as { __driversCache?: DriverCacheStore };
  if (!g.__driversCache) {
    g.__driversCache = {};
  }
  return g.__driversCache;
}

export function invalidateDriversCache() {
  const g = globalThis as unknown as { __driversCache?: DriverCacheStore };
  g.__driversCache = {};
}

export async function handleListDrivers(request?: Request) {
  const url = request?.url ? new URL(request.url) : null;
  const bypass =
    url?.searchParams.has('_t') ||
    url?.searchParams.has('nocache') ||
    request?.headers.get('cache-control')?.includes('no-cache') ||
    request?.headers.get('cache-control')?.includes('no-store');

  const user = await getAuthUser();
  const facultyId = user?.facultyId;
  const facultyName = user?.faculty?.nameTh;
  const cacheKey = facultyId ? String(facultyId) : (facultyName || 'all');
  const driverCache = getDriverCache();
  const existing = !bypass ? driverCache[cacheKey] : null;
  // 120s memory cache to dramatically reduce Supabase DB queries and egress
  if (existing && (Date.now() - existing.timestamp < 120 * 1000)) {
    return NextResponse.json({ drivers: existing.data }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
    });
  }

  try {
    const rawDrivers = await prisma.$queryRaw<Array<{
      id: number;
      phone: string | null;
      age: number | null;
      type: string | null;
      isActive: boolean;
      avatar: string | null;
      facultyId: number;
      assignedVanId: number | null;
      userName: string | null;
      userEmail: string | null;
      userAvatar: string | null;
      facultyName: string | null;
      vanPlate: string | null;
    }>>`
      SELECT 
        d.id,
        d.phone,
        d.age,
        d.type,
        d.is_active AS "isActive",
        d.avatar AS avatar,
        d.faculty_id AS "facultyId",
        d.assigned_van_id AS "assignedVanId",
        u.name AS "userName",
        u.email AS "userEmail",
        u.avatar AS "userAvatar",
        f.name_th AS "facultyName",
        v.plate AS "vanPlate"
      FROM drivers d
      LEFT JOIN users u ON u.id = d.user_id
      LEFT JOIN faculties f ON f.id = d.faculty_id
      LEFT JOIN vans v ON v.id = d.assigned_van_id
      ORDER BY d.id ASC;
    `;

    let filtered = rawDrivers;
    if (user?.role === "FACULTY_ADMIN" || user?.role === "EXECUTIVE") {
      if (facultyId) filtered = filtered.filter(d => d.facultyId === facultyId);
      else if (facultyName) filtered = filtered.filter(d => d.facultyName === facultyName);
    }

    const mapped = filtered.map((d) => ({
      id: `drv-${d.id.toString().padStart(3, "0")}`,
      dbId: d.id,
      name: d.userName || "พนักงานขับรถ",
      email: d.userEmail || "-",
      phone: d.phone || "-",
      faculty: d.facultyName || "กองอาคารสถานที่",
      facultyName: d.facultyName || "กองอาคารสถานที่",
      facultyId: d.facultyId,
      vanAssigned: d.vanPlate || "ยังไม่ผูกทะเบียน",
      vanPlate: d.vanPlate || "ยังไม่ผูกทะเบียน",
      vanId: d.assignedVanId ? `van-${d.assignedVanId.toString().padStart(3, "0")}` : "",
      assignedVanId: d.assignedVanId ? String(d.assignedVanId) : "",
      status: d.isActive ? "ready" : "offline",
      availability: d.isActive ? "AVAILABLE" : "OFF_DUTY",
      rating: 5.0,
      score: 5.0,
      experienceYears: 5,
      assignedCount: 0,
      tripsCount: 0,
      avatar: (d.avatar && !d.avatar.includes('unsplash.com')) ? d.avatar : ((d.userAvatar && !d.userAvatar.includes('unsplash.com')) ? d.userAvatar : ""),
      licenseExpiry: "2029-01-01",
      isLocked: !d.isActive,
      isActive: d.isActive,
    }));

    driverCache[cacheKey] = { data: mapped, timestamp: Date.now() };
    return NextResponse.json({ drivers: mapped }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
    });
  } catch (error) {
    console.error("Error fetching live drivers from database:", error);
    if (existing) {
      return NextResponse.json({ drivers: existing.data });
    }
    return NextResponse.json({ drivers: [], error: (error as Error)?.message || String(error) }, { status: 500 });
  }
}

export async function handleCreateDriver(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FACULTY_ADMIN')) {
      return NextResponse.json({ error: "Unauthorized: คุณไม่มีสิทธิ์เพิ่มพนักงานขับรถ" }, { status: 403 });
    }
    const body = await request.json();
    let facultyId = body.facultyId;
    if (user.role === 'FACULTY_ADMIN' && user.facultyId) {
      facultyId = user.facultyId;
    } else if (!facultyId && user?.facultyId) {
      facultyId = user.facultyId;
    }
    if (!facultyId) {
      const defaultFac = await prisma.faculty.findFirst();
      facultyId = defaultFac?.id || 1;
    }

    let assignedVanId: number | null = null;
    if (body.assignedVanId) {
      const vanNum = parseInt(String(body.assignedVanId).replace(/\D/g, ''), 10);
      if (!isNaN(vanNum)) assignedVanId = vanNum;
    }

    const createdUser = await prisma.user.create({
      data: {
        name: body.name || "พนักงานขับรถ",
        email: body.email || `driver-${Date.now()}@up.ac.th`,
        role: "DRIVER",
        facultyId: Number(facultyId),
        avatar: body.avatar || null,
        phone: body.phone || null,
      }
    });

    const createdDriver = await prisma.driver.create({
      data: {
        userId: createdUser.id,
        facultyId: Number(facultyId),
        phone: body.phone || "-",
        age: Number(body.age || 35),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : (body.isLocked !== undefined ? !Boolean(body.isLocked) : true),
        assignedVanId,
        avatar: body.avatar || null,
        contractStart: body.contractStart ? new Date(body.contractStart) : new Date(),
      }
    });

    invalidateDriversCache();
    return NextResponse.json({ success: true, driver: createdDriver });
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message || String(error) || "Failed to create driver" }, { status: 500 });
  }
}

export async function handleGetDriverDashboard(_request: Request, id: string) {
  void _request;
  try {
    const numericId = parseInt(id.replace('drv-', ''));
    const driver = await prisma.driver.findFirst({
      where: isNaN(numericId) ? undefined : { id: numericId },
      include: { user: true, assignedVan: true, faculty: true }
    });

    return NextResponse.json({
      dashboard: {
        driverId: id,
        name: driver?.user?.name || "พนักงานขับรถ",
        plate: driver?.assignedVan?.plate || "ไม่ระบุ",
        faculty: driver?.faculty?.nameTh || "กองอาคารสถานที่",
        status: driver?.isActive ? "พร้อมปฏิบัติงาน" : "ไม่พร้อมปฏิบัติงาน",
        totalTrips: 0,
        completedTrips: 0,
        pendingTrips: 0,
        recentTrips: []
      }
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleCreateDriverLog(request: Request, id: string) {
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ success: true, log: { id: Date.now(), driverId: id, ...body } });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleUpdateDriver(request: Request, id: string) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FACULTY_ADMIN')) {
      return NextResponse.json({ error: "Unauthorized: คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานขับรถ" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const numericId = parseInt(id.replace('drv-', ''), 10);
    if (!isNaN(numericId)) {
      const driver = await prisma.driver.findUnique({ where: { id: numericId } });
      if (!driver) {
        return NextResponse.json({ error: "ไม่พบข้อมูลพนักงานขับรถ" }, { status: 404 });
      }
      if (user.role === 'FACULTY_ADMIN' && driver.facultyId !== user.facultyId) {
        return NextResponse.json({ error: "Forbidden: คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานขับรถของหน่วยงานอื่น" }, { status: 403 });
      }

      const driverUpdateData: {
        phone?: string;
        isActive?: boolean;
        assignedVanId?: number | null;
        avatar?: string;
        contractStart?: Date;
        facultyId?: number;
      } = {};

      if (body.phone !== undefined) driverUpdateData.phone = body.phone;
      if (body.isLocked !== undefined) driverUpdateData.isActive = !Boolean(body.isLocked);
      if (body.isActive !== undefined) driverUpdateData.isActive = Boolean(body.isActive);
      if (body.assignedVanId !== undefined) {
        const vanNum = body.assignedVanId ? parseInt(String(body.assignedVanId).replace(/\D/g, ''), 10) : null;
        driverUpdateData.assignedVanId = (vanNum && !isNaN(vanNum)) ? vanNum : null;
      }
      if (body.avatar !== undefined) driverUpdateData.avatar = body.avatar;
      if (body.contractStart !== undefined) driverUpdateData.contractStart = new Date(body.contractStart);
      if (user.role === 'SUPER_ADMIN' && body.facultyId !== undefined && !isNaN(Number(body.facultyId))) {
        driverUpdateData.facultyId = Number(body.facultyId);
      }

      if (Object.keys(driverUpdateData).length > 0) {
        await prisma.driver.update({ where: { id: numericId }, data: driverUpdateData });
      }

      const userUpdateData: { name?: string; email?: string; avatar?: string; facultyId?: number; phone?: string } = {};
      if (body.name !== undefined) userUpdateData.name = body.name;
      if (body.email !== undefined) userUpdateData.email = body.email;
      if (body.avatar !== undefined) userUpdateData.avatar = body.avatar;
      if (body.phone !== undefined) userUpdateData.phone = body.phone;
      if (user.role === 'SUPER_ADMIN' && body.facultyId !== undefined && !isNaN(Number(body.facultyId))) {
        userUpdateData.facultyId = Number(body.facultyId);
      }

      if (driver.userId && Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({ where: { id: driver.userId }, data: userUpdateData });
      }
    }
    invalidateDriversCache();
    return NextResponse.json({ success: true, driver: { id, ...body } });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleDeleteDriver(_request: Request, id: string) {
  void _request;
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FACULTY_ADMIN')) {
      return NextResponse.json({ error: "Unauthorized: คุณไม่มีสิทธิ์ลบพนักงานขับรถ" }, { status: 403 });
    }
    const numericId = parseInt(id.replace('drv-', ''), 10);
    if (!isNaN(numericId)) {
      if (user.role === 'FACULTY_ADMIN') {
        const driver = await prisma.driver.findUnique({ where: { id: numericId } });
        if (!driver || driver.facultyId !== user.facultyId) {
          return NextResponse.json({ error: "Forbidden: คุณไม่มีสิทธิ์ลบพนักงานขับรถของหน่วยงานอื่น" }, { status: 403 });
        }
      }
      await prisma.driver.delete({ where: { id: numericId } });
    }
    invalidateDriversCache();
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}
