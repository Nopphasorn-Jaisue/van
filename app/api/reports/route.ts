import { handleGetReports } from "@/Backend/routes/system-reports";

export async function GET(request: Request) {
  return handleGetReports(request);
}
