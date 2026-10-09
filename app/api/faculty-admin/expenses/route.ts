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
    const where = facultyId ? { driverLog: { driver: { facultyId } } } : {};

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        driverLog: {
          include: {
            driver: {
              include: {
                user: true,
                assignedVan: true
              }
            },
            booking: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, expenses: expenses || [] });
  } catch (error) {
    console.error("Error in GET /expenses:", error);
    return NextResponse.json({ success: true, expenses: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'FACULTY_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let logId = body.driverLogId ? Number(body.driverLogId) : undefined;

    if (!logId && body.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: String(body.bookingId) },
        include: { assignedDriver: true }
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: `ไม่พบคำขอใช้รถรหัส ${body.bookingId}` }, { status: 404 });
      }

      if (user.role === 'FACULTY_ADMIN' && booking.targetFacultyId !== user.facultyId) {
        return NextResponse.json({ success: false, error: "คุณไม่มีสิทธิ์บันทึกค่าใช้จ่ายของคำขอต่างคณะ" }, { status: 403 });
      }

      let dLog = await prisma.driverLog.findFirst({
        where: { bookingId: booking.id },
        orderBy: { id: 'desc' }
      });

      if (!dLog) {
        const driverIdToUse = booking.assignedDriverId || (await prisma.driver.findFirst({
          where: { facultyId: user.facultyId || booking.targetFacultyId }
        }))?.id;

        if (!driverIdToUse) {
          return NextResponse.json({ success: false, error: "คำขอนี้ยังไม่ได้ระบุพนักงานขับรถ" }, { status: 400 });
        }

        dLog = await prisma.driverLog.create({
          data: {
            bookingId: booking.id,
            driverId: driverIdToUse,
            mileageStart: 0,
            mileageEnd: 0,
            totalDistance: 0
          }
        });
      }
      logId = dLog.id;
    }

    if (!logId) {
      return NextResponse.json({ 
        success: false, 
        error: "กรุณาระบุรหัสคำขอใช้รถ (bookingId) หรือรหัสบันทึกคนขับ (driverLogId) ให้ชัดเจน ไม่สามารถสุ่มผูกคำขอได้" 
      }, { status: 400 });
    }

    if (!logId) {
      return NextResponse.json({ success: false, error: "ไม่พบข้อมูลภารกิจหรือคนขับสำหรับผูกรายการค่าใช้จ่าย" }, { status: 400 });
    }

    const createdExpense = await prisma.expense.create({
      data: {
        driverLogId: logId,
        category: body.category || body.type || 'น้ำมันเชื้อเพลิง',
        amount: Number(body.amount || 0),
        remark: body.remark || '',
        status: 'PENDING',
        imgUrl: body.receiptUrl || body.imgUrl || null,
      },
      include: {
        driverLog: {
          include: {
            driver: { include: { user: true, assignedVan: true } },
            booking: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, expense: createdExpense });
  } catch (error) {
    console.error("Error creating expense in DB:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'FACULTY_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { expenseId, status } = body;

    if (!expenseId || !status) {
      return NextResponse.json({ success: false, error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const updated = await prisma.expense.update({
      where: { id: Number(expenseId) },
      data: { status }
    });

    return NextResponse.json({ success: true, expense: updated });
  } catch (error) {
    console.error("Failed to update expense status:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" }, { status: 500 });
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
        await prisma.expense.deleteMany({ where: { id: numId } });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบรายการ" }, { status: 500 });
  }
}
