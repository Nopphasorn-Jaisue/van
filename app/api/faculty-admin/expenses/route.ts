import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const facultyId = 1; // จำลอง

    const expenses = await prisma.expense.findMany({
      where: {
        driverLog: {
          driver: {
            facultyId: facultyId
          }
        }
      },
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

    return NextResponse.json({ success: true, expenses });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { expenseId, status } = body;

    if (!expenseId || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const updated = await prisma.expense.update({
      where: { id: Number(expenseId) },
      data: { status }
    });

    return NextResponse.json({ success: true, expense: updated });
  } catch (error) {
    console.error("Failed to update expense status:", error);
    return NextResponse.json({ success: false, error: "Failed to update data" }, { status: 500 });
  }
}
