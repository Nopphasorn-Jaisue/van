import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bookings = await prisma.booking.findMany({
    where: { assignedDriverId: 9 }, // Driver 555
    include: { driverLog: true }
  });
  return NextResponse.json({ count: bookings.length, bookings });
}
