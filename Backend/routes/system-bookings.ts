import { NextResponse } from "next/server";
import {
  assignDriver,
  createBooking,
  getBookingById,
  listBookings,
  updateBookingStatus,
} from "@/Backend/services/booking-system-store";
import { SystemBookingStatus } from "@/lib/booking-system-types";

import { getAuthUser } from "@/app/actions/auth";

export async function handleListBookings(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") as SystemBookingStatus | null;
  const status = statusParam || undefined;
  
  const user = await getAuthUser();
  let facultyId: number | undefined;
  if (user && (user.role === 'FACULTY_ADMIN' || user.role === 'EXECUTIVE') && user.facultyId) {
    facultyId = user.facultyId;
  }
  
  return NextResponse.json({ bookings: await listBookings(status, facultyId) });
}

export async function handleCreateSystemBooking(request: Request) {
  try {
    const body = await request.json();
    const booking = await createBooking({
      requester: body.requester || "ผู้ใช้งานระบบ",
      requesterFaculty: body.requesterFaculty || "ไม่ระบุ",
      destination: body.destination,
      purpose: body.purpose || "ไม่ระบุ",
      passengers: Number(body.passengers || 1),
      startAt: body.startAt,
      endAt: body.endAt,
      tripType: body.tripType,
      budgetSource: body.budgetSource,
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CREATE_FAILED";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function handleAssignDriverToBooking(request: Request, bookingId: string) {
  try {
    const body = await request.json();
    const booking = await assignDriver(bookingId, body.driverId);
    return NextResponse.json({ success: true, booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ASSIGN_FAILED";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function handleBookingStatusUpdate(request: Request, bookingId: string) {
  try {
    const body = await request.json();
    const status = body.status as SystemBookingStatus;

    if (!status) {
      return NextResponse.json({ success: false, message: "STATUS_REQUIRED" }, { status: 400 });
    }

    const booking = await updateBookingStatus(bookingId, status, body.reason);
    return NextResponse.json({ success: true, booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : "STATUS_UPDATE_FAILED";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function handleGetBookingDetail(_request: Request, bookingId: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    return NextResponse.json({ success: false, message: "BOOKING_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ success: true, booking });
}
