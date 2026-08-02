import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // จำลองว่าเป็น Faculty Admin ของคณะที่ 1
    const facultyId = 1;

    const logs = await prisma.driverLog.findMany({
      where: {
        driver: {
          facultyId: facultyId
        }
      },
      include: {
        driver: {
          include: {
            user: true,
            assignedVan: true
          }
        },
        booking: true,
        tripLegs: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Failed to fetch driver logs:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
  }
}
