import { handleCreateDriverLog } from "@/Backend/routes/system-drivers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleCreateDriverLog(request, params.id);
}
