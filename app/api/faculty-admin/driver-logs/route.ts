import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getStoredDriverLogs, addStoredDriverLog, deleteStoredDriverLog } from "@/Backend/services/records-store";

export async function GET() {
  try {
    const facultyId = 1;

    try {
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

      if (logs && logs.length > 0) {
        return NextResponse.json({ success: true, logs });
      }
    } catch {
      // If DB read fails, fallback to stored logs
    }

    return NextResponse.json({ success: true, logs: getStoredDriverLogs() });
  } catch (error) {
    console.error("Error in GET /driver-logs:", error);
    return NextResponse.json({ success: true, logs: getStoredDriverLogs() });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    try {
      if (body.bookingId && body.driverId) {
        const dbLog = await prisma.driverLog.create({
          data: {
            bookingId: body.bookingId,
            driverId: Number(body.driverId),
            mileageStart: Number(body.mileageStart || 0),
            mileageEnd: Number(body.mileageEnd || 0),
            totalDistance: Number(body.totalDistance || 0),
            fuelRemark: body.fuelRemark || ""
          }
        });
        return NextResponse.json({ success: true, log: dbLog });
      }
    } catch {
      // Fallback
    }

    const created = addStoredDriverLog(body);
    return NextResponse.json({ success: true, log: created });
  } catch (error) {
    console.error("Error creating driver log:", error);
    return NextResponse.json({ success: false, error: "Failed to create log" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      deleteStoredDriverLog(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver log:", error);
    return NextResponse.json({ success: false, error: "Failed to delete log" }, { status: 500 });
  }
}
