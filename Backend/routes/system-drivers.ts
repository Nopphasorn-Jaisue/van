import type { Prisma } from '@prisma/client';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/app/actions/auth";


let cachedDrivers: { [key: string]: { data: unknown[]; timestamp: number } } = {};

export function invalidateDriversCache() {
  cachedDrivers = {};
}

export async function handleListDrivers() {
  const user = await getAuthUser();
  const facultyId = user?.facultyId;
  const facultyName = user?.faculty?.nameTh;
  const cacheKey = facultyId ? String(facultyId) : (facultyName || 'all');

  const existing = cachedDrivers[cacheKey];
  if (existing && (Date.now() - existing.timestamp < 30 * 1000)) {
    return NextResponse.json({ drivers: existing.data });
  }

  try {
    const where: Prisma.DriverWhereInput = {};
    if (user?.role === "FACULTY_ADMIN" || user?.role === "EXECUTIVE") {
      if (facultyId) where.facultyId = facultyId;
      else if (facultyName) where.faculty = { nameTh: facultyName };
    }

    const dbDrivers = await prisma.driver.findMany({
      where,
      include: { user: true, faculty: true, assignedVan: true },
      orderBy: { id: "asc" },
    });

    const mapped = dbDrivers.map((d) => ({
      id: `drv-${d.id.toString().padStart(3, "0")}`,
      dbId: d.id,
      name: d.user?.name || "พนักงานขับรถ",
      email: d.user?.email || "-",
      phone: d.phone || "-",
      facultyName: d.faculty?.nameTh || "กองอาคารสถานที่",
      facultyId: d.facultyId,
      vanAssigned: d.assignedVan?.plate || (d.facultyId === 1 ? "1นช3009 กรุงเทพมหานคร" : "ยังไม่ผูกทะเบียน"),
      vanPlate: d.assignedVan?.plate || (d.facultyId === 1 ? "1นช3009 กรุงเทพมหานคร" : "ยังไม่ผูกทะเบียน"),
      vanId: d.assignedVanId ? `van-${d.assignedVanId.toString().padStart(3, "0")}` : (d.facultyId === 1 ? "van-003" : ""),
      status: d.isActive ? "ready" : "offline",
      rating: 4.9,
      tripsCount: 24,
      avatar: d.avatar || d.user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      licenseExpiry: "2029-01-01",
      isLocked: !d.isActive,
      isActive: d.isActive,
    }));

    cachedDrivers[cacheKey] = { data: mapped, timestamp: Date.now() };
    return NextResponse.json({ drivers: mapped });
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
    if (!facultyId && user?.facultyId) facultyId = user.facultyId;
    if (!facultyId) {
      const defaultFac = await prisma.faculty.findFirst();
      facultyId = defaultFac?.id || 1;
    }

    const createdUser = await prisma.user.create({
      data: {
        name: body.name || "พนักงานขับรถ",
        email: body.email || `driver-${Date.now()}@up.ac.th`,
        role: "DRIVER",
        facultyId: Number(facultyId),
      }
    });

    const createdDriver = await prisma.driver.create({
      data: {
        userId: createdUser.id,
        facultyId: Number(facultyId),
        phone: body.phone || "-",
        age: Number(body.age || 35),
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
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
        assignedVan: driver?.assignedVan?.plate || "1นช3009 กรุงเทพมหานคร",
        status: driver?.isActive ? "ready" : "offline",
        todayMissions: [],
        upcomingMissions: [],
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
    const numericId = parseInt(id.replace('drv-', ''));
    if (!isNaN(numericId)) {
      const driver = await prisma.driver.findUnique({ where: { id: numericId } });
      if (driver) {
        if (body.phone !== undefined) {
          await prisma.driver.update({ where: { id: numericId }, data: { phone: body.phone } });
        }
        if (body.name !== undefined && driver.userId) {
          await prisma.user.update({ where: { id: driver.userId }, data: { name: body.name } });
        }
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
    const numericId = parseInt(id.replace('drv-', ''));
    if (!isNaN(numericId)) {
      await prisma.driver.delete({ where: { id: numericId } });
    }
    invalidateDriversCache();
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}
