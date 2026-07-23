import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function handleListMaintenance() {
  try {
    const records = await prisma.maintenanceRecord.findMany({
      include: { van: true },
      orderBy: { date: "desc" },
    });

    const vans = await prisma.van.findMany({
      select: { id: true, plate: true, taxExp: true, insExp: true, nextCheckMileage: true }
    });

    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    const [maintenanceYtd, taxInsYtd] = await Promise.all([
      prisma.maintenanceRecord.aggregate({
        _sum: { amount: true },
        where: { type: 'MAINTENANCE', date: { gte: firstDayOfYear } }
      }),
      prisma.maintenanceRecord.aggregate({
        _sum: { amount: true },
        where: { type: { in: ['TAX', 'INSURANCE'] }, date: { gte: firstDayOfYear } }
      })
    ]);

    const kpiCostYTD = maintenanceYtd._sum.amount || 0;
    const kpiTaxInsYTD = taxInsYtd._sum.amount || 0;

    const maintenanceHistory = records.map(r => {
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

    const upcomingDueItems = [];
    let itemId = 1;

    for (const v of vans) {
      if (v.taxExp) {
        const diffTime = v.taxExp.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          upcomingDueItems.push({
            id: itemId++,
            title: `ภาษีรถ ${v.plate}`,
            dueDate: `ครบกำหนด ${v.taxExp.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`,
            daysLeft: `${daysLeft} วัน`,
            iconType: 'tax',
            iconBg: 'bg-emerald-100/70 text-emerald-600'
          });
        }
      }
      
      if (v.insExp) {
        const diffTime = v.insExp.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft <= 45) {
          upcomingDueItems.push({
            id: itemId++,
            title: `ประกันรถ ${v.plate}`,
            dueDate: `ครบกำหนด ${v.insExp.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`,
            daysLeft: `${daysLeft} วัน`,
            iconType: 'insurance',
            iconBg: 'bg-purple-100/70 text-purple-600'
          });
        }
      }
    }

    const mappedVans = vans.map(v => ({ id: v.id.toString(), plate: v.plate }));

    return NextResponse.json({
      success: true,
      maintenanceHistory,
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

    // Optionally update Van taxExp / insExp by 1 year if type is TAX or INSURANCE
    if (body.type === 'TAX') {
      const nextYear = new Date(date);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      await prisma.van.update({ where: { id: parseInt(body.vanId) }, data: { taxExp: nextYear } });
    } else if (body.type === 'INSURANCE') {
      const nextYear = new Date(date);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      await prisma.van.update({ where: { id: parseInt(body.vanId) }, data: { insExp: nextYear } });
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
