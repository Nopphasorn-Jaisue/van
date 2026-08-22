import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/app/actions/auth";
import { Prisma } from "@prisma/client";

export async function handleListVans() {
  try {
    const user = await getAuthUser();
    const where: Prisma.VanWhereInput = {};
    if (user && (user.role === 'FACULTY_ADMIN' || user.role === 'EXECUTIVE')) {
      const orList: Prisma.VanWhereInput[] = [];
      if (user.facultyId) {
        orList.push({ facultyId: user.facultyId });
      }
      if (user.faculty?.nameTh) {
        orList.push({ faculty: { nameTh: user.faculty.nameTh } });
      }
      if (orList.length > 0) {
        where.OR = orList;
      }
    }

    const vans = await prisma.van.findMany({
      where,
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
    const userRoleInfo = await getAuthUser();

    let facultyIdToUse: number;

    if (body.facultyId) {
      facultyIdToUse = Number(body.facultyId);
    } else if (body.faculty) {
      const fac = await prisma.faculty.findFirst({
        where: {
          OR: [
            { nameTh: { contains: body.faculty } },
            { nameEn: { contains: body.faculty } }
          ]
        }
      });
      if (fac) {
        facultyIdToUse = fac.id;
      } else if (userRoleInfo && userRoleInfo.facultyId) {
        facultyIdToUse = userRoleInfo.facultyId;
      } else {
        const defaultFaculty = await prisma.faculty.findFirstOrThrow();
        facultyIdToUse = defaultFaculty.id;
      }
    } else if (userRoleInfo && userRoleInfo.facultyId) {
      facultyIdToUse = userRoleInfo.facultyId;
    } else {
      const defaultFaculty = await prisma.faculty.findFirstOrThrow();
      facultyIdToUse = defaultFaculty.id;
    }

    const van = await prisma.van.create({
      data: {
        facultyId: facultyIdToUse,
        name: body.vanName || `รถตู้ (${body.plate || 'ใหม่'})`,
        plate: body.plate || "ยังไม่ระบุทะเบียน",
        capacity: Number(body.capacity || 12),
        engine: body.fuelType || "ดีเซล",
        isActive: body.status === "ready" || body.status === "READY",
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

    let facultyIdToUpdate: number | undefined;
    if (body.facultyId) {
      facultyIdToUpdate = Number(body.facultyId);
    } else if (body.faculty) {
      const fac = await prisma.faculty.findFirst({
        where: {
          OR: [
            { nameTh: { contains: body.faculty } },
            { nameEn: { contains: body.faculty } }
          ]
        }
      });
      if (fac) {
        facultyIdToUpdate = fac.id;
      }
    }

    const van = await prisma.van.update({
      where: { id: numericId },
      data: {
        facultyId: facultyIdToUpdate,
        name: body.vanName || undefined,
        plate: body.plate || undefined,
        capacity: body.capacity ? Number(body.capacity) : undefined,
        engine: body.fuelType || undefined,
        isActive: body.status !== undefined ? (body.status === "ready" || body.status === "READY") : undefined,
        isShared: body.isShared !== undefined ? body.isShared : undefined,
        image: body.image || undefined,
        taxExp: body.taxExp ? new Date(body.taxExp) : undefined,
        insExp: body.insExp ? new Date(body.insExp) : undefined,
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
    if (isNaN(numericId)) {
      return NextResponse.json({ success: false, message: "INVALID_ID" }, { status: 400 });
    }

    // Disconnect drivers assigned to this van
    await prisma.driver.updateMany({
      where: { assignedVanId: numericId },
      data: { assignedVanId: null }
    });

    // Delete the van record
    await prisma.van.delete({
      where: { id: numericId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
