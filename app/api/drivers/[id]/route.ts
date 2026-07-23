import { handleUpdateDriver, handleDeleteDriver } from "@/Backend/routes/system-drivers";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleUpdateDriver(request, params.id);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleDeleteDriver(request, params.id);
}
