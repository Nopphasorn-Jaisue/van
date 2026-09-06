import { NextResponse } from "next/server";
import { getRankedRecommendedVans } from "@/Backend/services/van-ranking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await getRankedRecommendedVans({
      startAt: body.startAt,
      endAt: body.endAt,
      requestedCount: body.requestedCount ? Number(body.requestedCount) : 1,
      passengerCount: body.passengerCount ? Number(body.passengerCount) : 1,
      preferredFaculty: body.preferredFaculty || undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating van ranking:", error);
    return NextResponse.json({ error: (error as Error)?.message || String(error) }, { status: 500 });
  }
}
