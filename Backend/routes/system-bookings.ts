import type { Prisma } from '@prisma/client';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SystemBookingStatus } from "@/lib/booking-system-types";
import { getAuthUser } from "@/app/actions/auth";
import { invalidateDbBookingsCache, pushBookingToGoogleCalendar } from "@/Backend/routes/system-calendar";
import { BookingStatus } from "@prisma/client";

let cachedBookings: { [key: string]: { data: unknown[]; timestamp: number } } = {};

export function invalidateBookingsCache() {
  cachedBookings = {};
}

export async function handleListBookings(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") as SystemBookingStatus | null;
  const status = statusParam || undefined;
  
  const user = await getAuthUser();
  let facultyId: number | undefined;
  if (user && (user.role === 'FACULTY_ADMIN' || user.role === 'EXECUTIVE') && user.facultyId) {
    facultyId = user.facultyId;
  }

  const cacheKey = `${status || 'all'}_${facultyId || 'all'}`;
  const existing = cachedBookings[cacheKey];

  if (existing && (Date.now() - existing.timestamp < 30 * 1000)) {
    return NextResponse.json({ bookings: existing.data });
  }

  try {
    const rawRows = await prisma.$queryRaw<any[]>`
      SELECT 
        b.id,
        b.destination,
        b.objective AS purpose,
        b.passengers_count AS "passengers",
        b.departure_date AS "startAt",
        b.return_date AS "endAt",
        b.created_at AS "submittedAt",
        b.budget_source AS "budgetSource",
        b.trip_type AS "tripType",
        b.status,
        b.phone,
        b.requester_id AS "requesterId",
        b.target_faculty_id AS "targetFacultyId",
        u.name AS "requester",
        f.name_th AS "requesterFaculty",
        f.id AS "requesterFacultyId",
        tf.name_th AS "targetFaculty",
        du.name AS "assignedDriverName"
      FROM bookings b
      LEFT JOIN users u ON u.id = b.requester_id
      LEFT JOIN faculties f ON f.id = u.faculty_id
      LEFT JOIN faculties tf ON tf.id = b.target_faculty_id
      LEFT JOIN drivers d ON d.id = b.assigned_driver_id
      LEFT JOIN users du ON du.id = d.user_id
      ORDER BY b.created_at DESC;
    `;

    let filtered = rawRows;
    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }
    if (facultyId) {
      filtered = filtered.filter(b => b.requesterFacultyId === facultyId || b.targetFacultyId === facultyId);
    }

    const mapped = filtered.map((b) => ({
      id: b.id,
      requester: b.requester || "ผู้ขอใช้บริการ",
      phone: b.phone || "-",
      requesterFaculty: b.requesterFaculty || (b.requesterFacultyId === 6 ? "คณะเภสัชฯ" : "คณะเทคโนโลยีสารสนเทศและการสื่อสาร"),
      requesterFacultyId: b.requesterFacultyId || 1,
      targetFaculty: b.targetFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
      targetFacultyId: b.targetFacultyId || 1,
      destination: b.destination,
      purpose: b.purpose,
      passengers: Number(b.passengers || 1),
      passengersCount: Number(b.passengers || 1),
      startAt: b.startAt ? new Date(b.startAt).toISOString() : new Date().toISOString(),
      endAt: b.endAt ? new Date(b.endAt).toISOString() : new Date().toISOString(),
      submittedAt: b.submittedAt ? new Date(b.submittedAt).toISOString() : new Date().toISOString(),
      budgetSource: b.budgetSource || "งบประมาณคณะ",
      tripType: (b.tripType as "ในจังหวัดพะเยา" | "ต่างจังหวัด") || "ในจังหวัดพะเยา",
      status: b.status as SystemBookingStatus,
      assignedDriverName: b.assignedDriverName || (b.targetFacultyId === 1 ? "นาย" : "พนักงานขับรถ"),
      assignedVanPlate: b.targetFacultyId === 1 ? "1นช3009 กรุงเทพมหานคร" : "ยังไม่ผูกทะเบียน",
    }));

    cachedBookings[cacheKey] = { data: mapped, timestamp: Date.now() };
    return NextResponse.json({ bookings: mapped });
  } catch (error) {
    console.error("Error fetching live bookings with single SQL:", error);
    if (existing) {
      return NextResponse.json({ bookings: existing.data });
    }
    return NextResponse.json({ bookings: [], error: (error as Error)?.message || String(error) }, { status: 500 });
  }
}

export async function handleCreateSystemBooking(request: Request) {
  try {
    const body = await request.json();
    const user = await getAuthUser();
    
    let requesterId = user?.id;
    if (!requesterId) {
      const defaultUser = await prisma.user.findFirst();
      requesterId = defaultUser?.id || 1;
    }

    const bookingId = `UPV-2569-${Math.floor(1000 + Math.random() * 9000)}`;

    const created = await prisma.booking.create({
      data: {
        id: bookingId,
        requesterId: typeof requesterId === 'number' ? requesterId : 1,
        destination: body.destination || "ไม่ระบุจุดหมาย",
        objective: body.purpose || body.objective || "ปฏิบัติภารกิจ",
        passengersCount: Number(body.passengers || 1),
        departureDate: body.startAt ? new Date(body.startAt) : new Date(),
        returnDate: body.endAt ? new Date(body.endAt) : new Date(),
        tripType: body.tripType || "ในจังหวัดพะเยา",
        budgetSource: body.budgetSource || "งบประมาณคณะ",
        phone: body.phone || "-",
        targetFacultyId: body.targetFacultyId ? Number(body.targetFacultyId) : 1,
        status: "WAITING_ADMIN",
      }
    });

    invalidateBookingsCache();
    invalidateDbBookingsCache();

    return NextResponse.json({ success: true, booking: created });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ success: false, error: (error as Error)?.message || String(error) }, { status: 500 });
  }
}

export async function handleGetBookingDetail(request: Request, id: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        requester: { include: { faculty: true } },
        assignedDriver: { include: { user: true } },
        targetFaculty: true
      }
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleUpdateSystemBooking(request: Request, id: string) {
  try {
    const body = await request.json();
    const updateData: Prisma.BookingUpdateInput = {
      destination: body.destination,
      objective: body.purpose || body.objective || body.reason,
      passengersCount: body.passengers ? Number(body.passengers) : (body.passengersCount ? Number(body.passengersCount) : undefined),
      phone: body.phone,
      tripType: body.tripType,
      budgetSource: body.budgetSource || body.budget,
    };
    if (body.startAt || body.startDate) {
      updateData.departureDate = new Date(body.startAt || body.startDate);
    }
    if (body.endAt || body.returnDate) {
      updateData.returnDate = new Date(body.endAt || body.returnDate);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData
    });
    invalidateBookingsCache();
    invalidateDbBookingsCache();
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleDeleteSystemBooking(request: Request, id: string) {
  try {
    await prisma.booking.delete({
      where: { id }
    });
    invalidateBookingsCache();
    invalidateDbBookingsCache();
    return NextResponse.json({ success: true, message: `ลบคำขอ ${id} เรียบร้อยแล้ว` });
  } catch (err) {
    console.error("Failed to delete booking:", err);
    return NextResponse.json({ success: false, error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleBookingStatusUpdate(request: Request, id: string) {
  try {
    const body = await request.json();
    const { status, rejectReason } = body;
    const updateData: Prisma.BookingUpdateInput = { status: status as BookingStatus };
    if (rejectReason) updateData.rejectReason = rejectReason;

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        requester: { include: { faculty: true } },
        assignedDriver: { include: { user: true } }
      }
    });

    if (status === 'APPROVED') {
      try {
        await pushBookingToGoogleCalendar({
          assignedVanId: updated.targetFacultyId ? String(updated.targetFacultyId) : '1',
          requesterFaculty: updated.requester?.faculty?.nameTh,
          destination: updated.destination,
          purpose: updated.objective,
          tripType: updated.tripType || undefined,
          passengers: updated.passengersCount,
          requester: updated.requester?.name,
          assignedDriverName: updated.assignedDriver?.user?.name,
          startAt: updated.departureDate.toISOString(),
          endAt: updated.returnDate.toISOString(),
        });
      } catch (gcalErr) {
        console.warn("Failed to push booking to Google Calendar:", gcalErr);
      }
    }

    invalidateBookingsCache();
    invalidateDbBookingsCache();
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleAssignDriverToBooking(request: Request, id: string) {
  try {
    const body = await request.json();
    const { driverId } = body;
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        assignedDriverId: driverId ? Number(driverId) : null
      }
    });
    invalidateBookingsCache();
    invalidateDbBookingsCache();
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}
