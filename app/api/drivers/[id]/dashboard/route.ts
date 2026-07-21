import { handleGetDriverDashboard } from "@/Backend/routes/system-drivers";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleGetDriverDashboard(request, params.id);
}
