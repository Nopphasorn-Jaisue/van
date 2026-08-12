import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createDriverLog,
  getDriverDashboard,
  listDrivers,
} from "@/Backend/services/booking-system-store";
import { getAuthUser } from "@/app/actions/auth";

export async function handleListDrivers(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  
  const user = await getAuthUser();
  let facultyId: number | undefined;
  if (user && (user.role === 'FACULTY_ADMIN' || user.role === 'EXECUTIVE') && user.facultyId) {
    facultyId = user.facultyId;
  }

  return NextResponse.json({ drivers: await listDrivers(date, facultyId) });
}

export async function handleGetDriverDashboard(_request: Request, driverId: string) {
  try {
    return NextResponse.json({ success: true, dashboard: await getDriverDashboard(driverId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DASHBOARD_ERROR";
    return NextResponse.json({ success: false, message }, { status: 404 });
  }
}

export async function handleCreateDriverLog(request: Request, driverId: string) {
  try {
    const body = await request.json();
    const mileageStart = Number(body.mileageStart || 0);
    const mileageEnd = Number(body.mileageEnd || 0);

    if (!body.bookingId) {
      return NextResponse.json({ success: false, message: "BOOKING_REQUIRED" }, { status: 400 });
    }

    const log = await createDriverLog(driverId, body.bookingId, mileageStart, mileageEnd, body.fuelRemark);
    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CREATE_LOG_ERROR";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function handleCreateDriver(request: Request) {
  try {
    const body = await request.json();
    if (!body.email || !body.name) {
      return NextResponse.json({ success: false, message: "NAME_AND_EMAIL_REQUIRED" }, { status: 400 });
    }

    const faculty = await prisma.faculty.findFirstOrThrow();

    let user = await prisma.user.findFirst({ where: { email: body.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          facultyId: faculty.id,
          name: body.name,
          email: body.email,
          role: "DRIVER",
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name }
      });
    }

    const existingDriver = await prisma.driver.findFirst({ where: { userId: user.id } });
    let driver;
    if (existingDriver) {
      driver = await prisma.driver.update({
        where: { id: existingDriver.id },
        data: {
          phone: body.phone || existingDriver.phone,
          isActive: body.isLocked !== undefined ? !body.isLocked : existingDriver.isActive,
          avatar: body.avatar !== undefined ? body.avatar : existingDriver.avatar,
          contractStart: body.contractStart ? new Date(body.contractStart) : existingDriver.contractStart,
        }
      });
    } else {
      driver = await prisma.driver.create({
        data: {
          userId: user.id,
          facultyId: faculty.id,
          phone: body.phone || "",
          age: 35,
          isActive: !body.isLocked,
          avatar: body.avatar || null,
          contractStart: body.contractStart ? new Date(body.contractStart) : new Date(),
        }
      });
    }

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function handleUpdateDriver(request: Request, id: string) {
  try {
    const numericId = parseInt(id.replace(/\D/g, ''));
    if (isNaN(numericId)) {
      return NextResponse.json({ success: false, message: "INVALID_ID" }, { status: 400 });
    }
    const body = await request.json();

    const driver = await prisma.driver.update({
      where: { id: numericId },
      data: {
        phone: body.phone !== undefined ? body.phone : undefined,
        isActive: body.isLocked !== undefined ? !body.isLocked : undefined,
        contractStart: body.contractStart ? new Date(body.contractStart) : undefined,
        avatar: body.avatar !== undefined ? body.avatar : undefined,
      }
    });

    if (body.name || body.email) {
      await prisma.user.update({
        where: { id: driver.userId },
        data: {
          name: body.name || undefined,
          email: body.email || undefined
        }
      });
    }

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function handleDeleteDriver(_request: Request, id: string) {
  try {
    const numericId = parseInt(id.replace(/\D/g, ''));
    if (isNaN(numericId)) {
      return NextResponse.json({ success: false, message: "INVALID_ID" }, { status: 400 });
    }
    await prisma.driver.delete({
      where: { id: numericId }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
