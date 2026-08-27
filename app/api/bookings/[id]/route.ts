import { type NextRequest } from "next/server";
import { handleGetBookingDetail, handleUpdateSystemBooking, handleDeleteSystemBooking } from "@/Backend/routes/system-bookings";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleGetBookingDetail(request, id);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleUpdateSystemBooking(request, id);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleDeleteSystemBooking(request, id);
}
