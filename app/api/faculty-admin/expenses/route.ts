import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getStoredExpenses, addStoredExpense, updateStoredExpenseStatus, deleteStoredExpense } from "@/Backend/services/records-store";

export async function GET() {
  try {
    const facultyId = 1;

    try {
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

      if (expenses && expenses.length > 0) {
        return NextResponse.json({ success: true, expenses });
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({ success: true, expenses: getStoredExpenses() });
  } catch (error) {
    console.error("Error in GET /expenses:", error);
    return NextResponse.json({ success: true, expenses: getStoredExpenses() });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = addStoredExpense(body);
    return NextResponse.json({ success: true, expense: created });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ success: false, error: "Failed to create expense" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { expenseId, status } = body;

    if (!expenseId || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    try {
      await prisma.expense.update({
        where: { id: Number(expenseId) },
        data: { status }
      });
    } catch {
      // Fallback
    }

    const updated = updateStoredExpenseStatus(expenseId, status);
    return NextResponse.json({ success: true, expense: updated });
  } catch (error) {
    console.error("Failed to update expense status:", error);
    return NextResponse.json({ success: false, error: "Failed to update data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      deleteStoredExpense(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ success: false, error: "Failed to delete expense" }, { status: 500 });
  }
}
