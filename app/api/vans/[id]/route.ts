import { handleUpdateVan, handleDeleteVan } from "@/Backend/routes/system-vans";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleUpdateVan(request, params.id);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return handleDeleteVan(request, params.id);
}
