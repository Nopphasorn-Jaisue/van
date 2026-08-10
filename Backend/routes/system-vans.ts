import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function handleListVans() {
  try {
    const vans = await prisma.van.findMany({
      include: { faculty: { include: { drivers: { include: { user: true } } } } },
      orderBy: { id: "asc" },
    });

    const mapped = vans.map(v => ({
      id: v.id.toString(),
      vanName: v.name || `รถตู้${v.faculty.nameTh} ${v.id.toString().padStart(2, '0')}`,
      plate: v.plate,
      capacity: v.capacity,
      fuelType: v.engine || "ดีเซล",

      status: v.isActive ? "ready" : "maintenance",
      isShared: v.isShared ?? true,
      image: v.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80",
      driverName: v.faculty.drivers && v.faculty.drivers.length > 0 ? v.faculty.drivers[0].user.name : "ยังไม่ระบุ",
      taxExp: v.taxExp ? v.taxExp.toISOString() : null,
      insExp: v.insExp ? v.insExp.toISOString() : null
    }));

    return NextResponse.json({ vans: mapped });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function handleCreateVan(request: Request) {
  try {
    const body = await request.json();
    // Default to first faculty if none provided (for simplicity since faculty selection is not in UI)
    const faculty = await prisma.faculty.findFirstOrThrow();
    
    const van = await prisma.van.create({
      data: {
        facultyId: faculty.id,
        name: body.vanName,
        plate: body.plate,
        capacity: body.capacity || 12,
        engine: body.fuelType || "ดีเซล",
        isActive: body.status === "ready",
        isShared: body.isShared !== undefined ? body.isShared : true,
        image: body.image,
        taxExp: body.taxExp ? new Date(body.taxExp) : null,
        insExp: body.insExp ? new Date(body.insExp) : null,
      }
    });

    return NextResponse.json({ success: true, van: { id: van.id.toString() } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function handleUpdateVan(request: Request, id: string) {
  try {
    const numericId = parseInt(id.replace(/\D/g, ''));
    const body = await request.json();

    const van = await prisma.van.update({
      where: { id: numericId },
      data: {
        name: body.vanName,
        plate: body.plate,
        capacity: body.capacity,
        engine: body.fuelType,
        isActive: body.status === "ready",
        isShared: body.isShared !== undefined ? body.isShared : true,
        image: body.image,
        taxExp: body.taxExp ? new Date(body.taxExp) : null,
        insExp: body.insExp ? new Date(body.insExp) : null,
      }
    });

    return NextResponse.json({ success: true, van });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function handleDeleteVan(_request: Request, id: string) {
  try {
    const numericId = parseInt(id.replace(/\D/g, ''));
    await prisma.van.delete({
      where: { id: numericId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
