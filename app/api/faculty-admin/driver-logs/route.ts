import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-util";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'FACULTY_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const facultyId = user.role === 'SUPER_ADMIN' ? undefined : (user.facultyId || undefined);
    const where = facultyId ? { driver: { facultyId } } : {};

    const logs = await prisma.driverLog.findMany({
      where,
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

    return NextResponse.json({ success: true, logs: logs || [] });
  } catch (error) {
    console.error("Error in GET /driver-logs:", error);
    return NextResponse.json({ success: true, logs: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'FACULTY_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const bookingId = body.bookingId;

    if (!bookingId) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุรหัสคำขอใช้รถ (bookingId) เพื่อบันทึกการเดินทางของคนขับ ไม่สามารถสุ่มคำขอได้" 
      }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: String(bookingId) },
      include: { assignedDriver: true }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: `ไม่พบคำขอใช้รถรหัส ${bookingId}` }, { status: 404 });
    }

    if (user.role === 'FACULTY_ADMIN' && booking.targetFacultyId !== user.facultyId) {
      return NextResponse.json({ success: false, error: "คุณไม่มีสิทธิ์บันทึกการเดินทางสำหรับคำขอต่างคณะ" }, { status: 403 });
    }

    let driverId = body.driverId ? Number(String(body.driverId).replace(/\D/g, '')) : undefined;
    if (!driverId) {
      driverId = booking.assignedDriverId || (await prisma.driver.findFirst({
        where: { facultyId: user.facultyId || booking.targetFacultyId }
      }))?.id;
    }

    if (!driverId) {
      return NextResponse.json({ success: false, error: "คำขอนี้ยังไม่ได้ระบุพนักงานขับรถ กรุณาจัดสรรคนขับก่อนบันทึกการเดินทาง" }, { status: 400 });
    }

    const mStart = Number(body.mileageStart || 0);
    const mEnd = Number(body.mileageEnd || 0);
    const totalDist = mEnd >= mStart && mStart > 0 ? (mEnd - mStart) : Number(body.totalDistance || 0);

    const dbLog = await prisma.driverLog.create({
      data: {
        bookingId,
        driverId,
        mileageStart: mStart,
        mileageEnd: mEnd,
        totalDistance: totalDist,
        fuelRemark: body.fuelRemark || body.objective || "",
      },
      include: {
        driver: {
          include: {
            user: true,
            assignedVan: true
          }
        },
        booking: true
      }
    });

    return NextResponse.json({ success: true, log: dbLog });
  } catch (error) {
    console.error("Error creating driver log in DB:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลการใช้รถ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'FACULTY_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        await prisma.driverLog.deleteMany({ where: { id: numId } });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver log:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบรายการ" }, { status: 500 });
  }
}
