import type { Prisma } from '@prisma/client';

export function formatVanImage(img?: string | null): string {
  if (!img || typeof img !== 'string') {
    return "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80";
  }
  const trimmed = img.trim();
  if (trimmed.length < 5) {
    return "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80";
  }
  if (trimmed.includes('Foto01') || trimmed.includes('LOGO.png')) {
    return "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80";
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
  return "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80";
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/app/actions/auth";


let cachedVans: { [key: string]: { data: unknown[]; timestamp: number } } = {};

export function invalidateVansCache() {
  cachedVans = {};
}

export async function handleListVans() {
  const user = await getAuthUser();
  const facultyId = user?.facultyId;
  const facultyName = user?.faculty?.nameTh;
  const cacheKey = facultyId ? String(facultyId) : (facultyName || 'all');

  const existing = cachedVans[cacheKey];
  // Short 5s cache to avoid hammering Supabase on rapid re-renders
  if (existing && (Date.now() - existing.timestamp < 30 * 1000)) {
    return NextResponse.json({ vans: existing.data });
  }

  try {
    const where: Prisma.VanWhereInput = {};
    if (user?.role === "FACULTY_ADMIN" || user?.role === "EXECUTIVE") {
      if (facultyId) where.facultyId = facultyId;
      else if (facultyName) where.faculty = { nameTh: facultyName };
    }

    const dbVans = await prisma.van.findMany({
      where,
      include: { faculty: true },
      orderBy: { id: "asc" },
    });

    const mapped = dbVans.map((v) => ({
      id: `van-${v.id.toString().padStart(3, "0")}`,
      dbId: v.id,
      plate: v.plate,
      brand: v.name || "Toyota Commuter",
      vanName: v.name || "Toyota Commuter",
      seats: v.capacity || 12,
      capacity: v.capacity || 12,
      fuelType: v.engine || "ดีเซล",
      driverName: v.facultyId === 1 ? "นาย" : "พนักงานขับรถ",
      faculty: v.faculty?.nameTh || "ไม่ระบุคณะ",
      facultyName: v.faculty?.nameTh || "ไม่ระบุคณะ",
      facultyId: v.facultyId,
      status: v.isActive ? "ready" : "maintenance",
      image: formatVanImage(v.image),
      imageUrl: formatVanImage(v.image),
      mileage: v.nextCheckMileage ? `${v.nextCheckMileage.toLocaleString()} กม.` : "45,000 กม.",
      taxExp: v.taxExp ? new Date(v.taxExp).toISOString().split('T')[0] : "2027-03-15",
      taxExpiry: v.taxExp ? new Date(v.taxExp).toISOString().split('T')[0] : "2027-03-15",
      insExp: v.insExp ? new Date(v.insExp).toISOString().split('T')[0] : "2027-03-15",
      insuranceExpiry: v.insExp ? new Date(v.insExp).toISOString().split('T')[0] : "2027-03-15",
      isShared: v.isShared !== undefined ? v.isShared : true,
      isActive: v.isActive,
    }));

    cachedVans[cacheKey] = { data: mapped, timestamp: Date.now() };
    return NextResponse.json({ vans: mapped });
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
    if (!facultyId && user?.facultyId) facultyId = user.facultyId;
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
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        image: body.imageUrl || body.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
        taxExp: body.taxExpiry || body.taxExp ? new Date(body.taxExpiry || body.taxExp) : new Date("2027-01-01"),
        insExp: body.insuranceExpiry || body.insExp ? new Date(body.insuranceExpiry || body.insExp) : new Date("2027-01-01"),
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
    const numericId = parseInt(id.replace('van-', ''));
    if (!isNaN(numericId)) {
      const updateData: Prisma.VanUpdateInput = {};
      if (body.plate !== undefined) updateData.plate = body.plate;
      if (body.facultyId !== undefined && body.facultyId !== "" && !isNaN(Number(body.facultyId))) {
        updateData.faculty = { connect: { id: Number(body.facultyId) } };
      }
      if (body.vanName !== undefined || body.brand !== undefined) updateData.name = body.vanName || body.brand;
      if (body.capacity !== undefined || body.seats !== undefined) updateData.capacity = Number(body.capacity || body.seats);
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
    const numericId = parseInt(id.replace('van-', ''));
    if (!isNaN(numericId)) {
      await prisma.van.delete({ where: { id: numericId } });
    }
    invalidateVansCache();
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}
