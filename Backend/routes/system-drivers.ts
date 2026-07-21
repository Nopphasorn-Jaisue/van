import { NextResponse } from "next/server";
import {
  createDriverLog,
  getDriverDashboard,
  listDrivers,
} from "@/Backend/services/booking-system-store";

export async function handleListDrivers(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  return NextResponse.json({ drivers: await listDrivers(date) });
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
