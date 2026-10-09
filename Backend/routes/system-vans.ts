import type { Prisma } from '@prisma/client';

export function formatVanImage(img?: string | null): string {
  if (!img || typeof img !== 'string') {
    return "";
  }
  const trimmed = img.trim();
  if (trimmed.length < 5) {
    return "";
  }
  if (trimmed.includes('unsplash.com') || trimmed.includes('LOGO.png')) {
    return "";
  }
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return "";
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-util";


type VanCacheStore = { [key: string]: { data: unknown[]; timestamp: number } };

function getVanCache(): VanCacheStore {
  const g = globalThis as unknown as { __vansCache?: VanCacheStore };
  if (!g.__vansCache) {
    g.__vansCache = {};
  }
  return g.__vansCache;
}

export function invalidateVansCache() {
  const g = globalThis as unknown as { __vansCache?: VanCacheStore };
  g.__vansCache = {};
}

export async function handleListVans(request?: Request) {
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

  const vanCache = getVanCache();
  const existing = !bypass ? vanCache[cacheKey] : null;
  // 120s memory cache to dramatically reduce Supabase DB queries and egress
  if (existing && (Date.now() - existing.timestamp < 120 * 1000)) {
    return NextResponse.json({ vans: existing.data }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
    });
  }

  try {
    const rawVans = await prisma.$queryRaw<Array<{
      id: number;
      facultyId: number;
      facultyName: string | null;
      name: string | null;
      plate: string | null;
      engine: string | null;
      capacity: number | null;
      isActive: boolean;
      isShared: boolean;
      image: string | null;
      taxExp: Date | null;
      insExp: Date | null;
      nextCheckMileage: number | null;
      driverName: string | null;
      driverPhone: string | null;
      driverAvatar: string | null;
    }>>`
      SELECT 
        v.id,
        v.faculty_id AS "facultyId",
        f.name_th AS "facultyName",
        v.name,
        v.plate,
        v.engine,
        v.capacity,
        v.is_active AS "isActive",
        v.is_shared AS "isShared",
        v.image AS image,
        v.tax_exp AS "taxExp",
        v.ins_exp AS "insExp",
        v.next_check_mileage AS "nextCheckMileage",
        u.name AS "driverName",
        d.phone AS "driverPhone",
        COALESCE(
          d.avatar,
          u.avatar
        ) AS "driverAvatar"
      FROM vans v
      LEFT JOIN faculties f ON f.id = v.faculty_id
      LEFT JOIN drivers d ON d.assigned_van_id = v.id
      LEFT JOIN users u ON u.id = d.user_id
      ORDER BY v.id ASC;
    `;

    let filtered = rawVans;
    if (user?.role === "FACULTY_ADMIN" || user?.role === "EXECUTIVE") {
      if (facultyId) filtered = filtered.filter(v => v.facultyId === facultyId);
      else if (facultyName) filtered = filtered.filter(v => v.facultyName === facultyName);
    }

    const mapped = filtered.map((v) => ({
      id: `van-${v.id.toString().padStart(3, "0")}`,
      dbId: v.id,
      plate: v.plate,
      brand: v.name || "Toyota Commuter",
      vanName: v.name || "Toyota Commuter",
      seats: v.capacity || 12,
      capacity: v.capacity || 12,
      fuelType: v.engine || "ดีเซล",
      driverName: v.driverName || "ยังไม่ระบุคนขับ",
      driverPhone: v.driverPhone || "-",
      driverAvatar: (v.driverAvatar && !v.driverAvatar.includes('unsplash.com')) ? v.driverAvatar : "",
      faculty: v.facultyName || "ไม่ระบุคณะ",
      facultyName: v.facultyName || "ไม่ระบุคณะ",
      facultyId: v.facultyId,
      status: v.isActive ? "ready" : "maintenance",
      image: formatVanImage(v.image),
      imageUrl: formatVanImage(v.image),
      mileage: v.nextCheckMileage ? `${v.nextCheckMileage.toLocaleString()} กม.` : "-",
      taxExp: v.taxExp ? new Date(v.taxExp).toISOString().split('T')[0] : "",
      taxExpiry: v.taxExp ? new Date(v.taxExp).toISOString().split('T')[0] : "",
      insExp: v.insExp ? new Date(v.insExp).toISOString().split('T')[0] : "",
      insuranceExpiry: v.insExp ? new Date(v.insExp).toISOString().split('T')[0] : "",
      isShared: v.isShared !== undefined ? v.isShared : true,
      isActive: v.isActive,
    }));

    vanCache[cacheKey] = { data: mapped, timestamp: Date.now() };
    return NextResponse.json({ vans: mapped }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
    });
  } catch (error) {
    console.error("Error fetching live vans from database:", error);
    if (existing) {
      return NextResponse.json({ vans: existing.data });
    }
    return NextResponse.json({ vans: [], error: (error as Error)?.message || String(error) }, { status: 500 });
  }
}

export async function handleCreateVan(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FACULTY_ADMIN')) {
      return NextResponse.json({ error: "Unauthorized: คุณไม่มีสิทธิ์เพิ่มรถตู้" }, { status: 403 });
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

    const created = await prisma.van.create({
      data: {
        plate: body.plate || "นข 9999 พะเยา",
        name: body.brand || body.vanName || body.name || "Toyota Commuter",
        capacity: Number(body.seats || body.capacity || 12),
        facultyId: Number(facultyId),
        engine: body.engine || body.fuelType || "ดีเซล",
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        isShared: body.isShared !== undefined ? Boolean(body.isShared) : true,
        image: body.imageUrl || body.image || null,
        taxExp: body.taxExpiry || body.taxExp ? new Date(body.taxExpiry || body.taxExp) : null,
        insExp: body.insuranceExpiry || body.insExp ? new Date(body.insuranceExpiry || body.insExp) : null,
      }
    });
    invalidateVansCache();
    return NextResponse.json({ success: true, van: created });
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message || String(error) || "Failed to create van" }, { status: 500 });
  }
}

export async function handleUpdateVan(request: Request, id: string) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FACULTY_ADMIN')) {
      return NextResponse.json({ error: "Unauthorized: คุณไม่มีสิทธิ์แก้ไขข้อมูลรถตู้" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const numericId = parseInt(id.replace('van-', ''), 10);
    if (!isNaN(numericId)) {
      if (user.role === 'FACULTY_ADMIN') {
        const existingVan = await prisma.van.findUnique({ where: { id: numericId } });
        if (!existingVan || existingVan.facultyId !== user.facultyId) {
          return NextResponse.json({ error: "Forbidden: คุณไม่มีสิทธิ์แก้ไขข้อมูลรถตู้ของหน่วยงานอื่น" }, { status: 403 });
        }
      }

      const updateData: Prisma.VanUpdateInput = {};
      if (body.plate !== undefined) updateData.plate = body.plate;
      if (user.role === 'SUPER_ADMIN' && body.facultyId !== undefined && body.facultyId !== "" && !isNaN(Number(body.facultyId))) {
        updateData.faculty = { connect: { id: Number(body.facultyId) } };
      }
      if (body.vanName !== undefined || body.brand !== undefined) updateData.name = body.vanName || body.brand;
      if (body.capacity !== undefined || body.seats !== undefined) updateData.capacity = Number(body.capacity || body.seats);
      if (body.fuelType !== undefined || body.engine !== undefined) updateData.engine = body.fuelType || body.engine;
      if (body.isShared !== undefined) updateData.isShared = Boolean(body.isShared);
      if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
      if (body.taxExp !== undefined || body.taxExpiry !== undefined) updateData.taxExp = new Date(body.taxExp || body.taxExpiry);
      if (body.insExp !== undefined || body.insuranceExpiry !== undefined) updateData.insExp = new Date(body.insExp || body.insuranceExpiry);
      if (body.image !== undefined || body.imageUrl !== undefined) {
        updateData.image = body.image || body.imageUrl;
      }

      await prisma.van.update({
        where: { id: numericId },
        data: updateData
      });
    }
    invalidateVansCache();
    return NextResponse.json({ success: true, van: { id, ...body } });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleDeleteVan(_request: Request, id: string) {
  void _request;
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FACULTY_ADMIN')) {
      return NextResponse.json({ error: "Unauthorized: คุณไม่มีสิทธิ์ลบรถตู้" }, { status: 403 });
    }
    const numericId = parseInt(id.replace('van-', ''), 10);
    if (!isNaN(numericId)) {
      if (user.role === 'FACULTY_ADMIN') {
        const existingVan = await prisma.van.findUnique({ where: { id: numericId } });
        if (!existingVan || existingVan.facultyId !== user.facultyId) {
          return NextResponse.json({ error: "Forbidden: คุณไม่มีสิทธิ์ลบรถตู้ของหน่วยงานอื่น" }, { status: 403 });
        }
      }
      await prisma.van.delete({ where: { id: numericId } });
    }
    invalidateVansCache();
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}
