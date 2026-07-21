import {
  handleBookingStatusUpdate,
  handleGetBookingDetail,
} from "@/Backend/routes/system-bookings";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleBookingStatusUpdate(request, params.id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleGetBookingDetail(request, params.id);
}
