import { handleAssignDriverToBooking } from "@/Backend/routes/system-bookings";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleAssignDriverToBooking(request, params.id);
}
