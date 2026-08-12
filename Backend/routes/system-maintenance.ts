import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/app/actions/auth";

export async function handleListMaintenance() {
  try {
    const user = await getAuthUser();
    let facultyIdFilter: number | undefined;
    
    if (user && (user.role === 'FACULTY_ADMIN' || user.role === 'EXECUTIVE') && user.facultyId) {
      facultyIdFilter = user.facultyId;
    }

    const recordWhere = facultyIdFilter ? { van: { facultyId: facultyIdFilter } } : {};
    const vanWhere = facultyIdFilter ? { facultyId: facultyIdFilter } : {};

    const records = await prisma.maintenanceRecord.findMany({
      where: recordWhere,
      include: { van: true },
      orderBy: { date: "desc" },
    });

    const vans = await prisma.van.findMany({
      where: vanWhere,
      select: { id: true, plate: true, nextCheckMileage: true }
    });

    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    const [maintenanceYtd, taxInsYtd] = await Promise.all([
      prisma.maintenanceRecord.aggregate({
        _sum: { amount: true },
        where: { type: 'MAINTENANCE', date: { gte: firstDayOfYear }, ...recordWhere }
      }),
      prisma.maintenanceRecord.aggregate({
        _sum: { amount: true },
        where: { type: { in: ['TAX', 'INSURANCE'] }, date: { gte: firstDayOfYear }, ...recordWhere }
      })
    ]);

    const kpiCostYTD = maintenanceYtd._sum.amount || 0;
    const kpiTaxInsYTD = taxInsYtd._sum.amount || 0;

    const pendingRepairs = records
      .filter(r => r.type === 'MAINTENANCE' && r.amount === 0)
      .map(r => ({
        id: r.id,
        date: r.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        van: r.van.plate,
        detail: r.detail,
      }));

    const maintenanceHistory = records
      .filter(r => !(r.type === 'MAINTENANCE' && r.amount === 0))
      .map(r => {
      let typeStr = "ซ่อมบำรุง";
      let typeColor = "bg-blue-50 text-blue-600 border-blue-100";
      if (r.type === "TAX") {
        typeStr = "ต่อภาษี";
        typeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
      } else if (r.type === "INSURANCE") {
        typeStr = "ประกันภัย";
        typeColor = "bg-purple-50 text-purple-600 border-purple-100";
      }

      return {
        id: `M-${r.id.toString().padStart(3, '0')}`,
        date: r.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        van: r.van.plate,
        province: "พะเยา", // Mock for now
        type: typeStr,
        typeColor,
        detail: r.detail,
        amount: r.amount.toLocaleString(),
        garage: r.garage || "-",
      };
    });

    const upcomingDueItems: Array<{
      id: number;
      title: string;
      dueDate: string;
      daysLeft: string;
      iconType: string;
    }> = [];

    const mappedVans = vans.map(v => ({ id: v.id.toString(), plate: v.plate }));

    return NextResponse.json({
      success: true,
      maintenanceHistory,
      pendingRepairs,
      upcomingDueItems,
      vans: mappedVans,
      kpiCostYTD,
      kpiTaxInsYTD,
      facultyVan: vans.length > 0 ? { plate: vans[0].plate, status: 'พร้อมใช้งาน' } : null
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function handleCreateMaintenance(request: Request) {
  try {
    const body = await request.json();
    
    // Body: { vanId: '1', date: '2024-07-23', type: 'MAINTENANCE', detail: '...', amount: 2500, garage: '...' }
    const date = new Date(body.date);
    
    const record = await prisma.maintenanceRecord.create({
      data: {
        vanId: parseInt(body.vanId),
        date: date,
        type: body.type, // 'MAINTENANCE', 'TAX', 'INSURANCE'
        detail: body.detail,
        amount: parseFloat(body.amount),
        garage: body.garage
      }
    });



    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function handleUpdateMaintenance(request: Request) {
  try {
    const body = await request.json();
    const { id, amount, garage } = body;
    
    if (!id || amount === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const record = await prisma.maintenanceRecord.update({
      where: { id: parseInt(id) },
      data: {
        amount: parseFloat(amount),
        garage: garage || null,
        date: new Date(), // Update the date to when it was actually repaired
      }
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function handleDeleteMaintenance(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }

    await prisma.maintenanceRecord.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
