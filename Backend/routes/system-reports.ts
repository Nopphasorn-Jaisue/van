import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function handleGetReports() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      tripsThisMonth,
      distanceResult,
      fuelResult,
      tripsLastMonth,
      distanceLastMonthResult,
      fuelLastMonthResult,
      recentBookings,
      destinationsAgg,
      objectivesAgg,
      expensesAgg,
      driversData,
      vansData
    ] = await Promise.all([
      prisma.booking.count({ 
        where: { 
          status: 'APPROVED',
          departureDate: { gte: firstDayOfMonth }
        } 
      }),
      prisma.driverLog.aggregate({
        _sum: { totalDistance: true },
        where: { createdAt: { gte: firstDayOfMonth } }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { 
          category: { contains: 'น้ำมัน' },
          createdAt: { gte: firstDayOfMonth }
        }
      }),
      prisma.booking.count({ 
        where: { 
          status: 'APPROVED',
          departureDate: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
        } 
      }),
      prisma.driverLog.aggregate({
        _sum: { totalDistance: true },
        where: { createdAt: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth } }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { 
          category: { contains: 'น้ำมัน' },
          createdAt: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
        }
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { departureDate: 'desc' },
        include: {
          requester: { include: { faculty: true } },
          assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
          driverLog: { include: { expenses: true } }
        }
      }),
      prisma.booking.groupBy({
        by: ['destination'],
        _count: { destination: true },
        where: {
          status: 'APPROVED',
          departureDate: { gte: firstDayOfMonth }
        },
        orderBy: { _count: { destination: 'desc' } },
        take: 4
      }),
      prisma.booking.groupBy({
        by: ['objective'],
        _count: { objective: true },
        where: {
          status: 'APPROVED',
          departureDate: { gte: firstDayOfMonth }
        }
      }),
      prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
        where: { createdAt: { gte: firstDayOfMonth } }
      }),
      prisma.driver.findMany({
        include: {
          user: true,
          _count: {
            select: { bookings: { where: { status: 'APPROVED', departureDate: { gte: firstDayOfMonth } } } }
          }
        }
      }),
      prisma.van.findMany()
    ]);

    const totalDistance = distanceResult._sum.totalDistance || 0;
    const fuelCost = fuelResult._sum.amount || 0;
    const estimatedHours = tripsThisMonth * 3.5;

    const distanceLastMonth = distanceLastMonthResult._sum.totalDistance || 0;
    const fuelCostLastMonth = fuelLastMonthResult._sum.amount || 0;
    const estimatedHoursLastMonth = tripsLastMonth * 3.5;

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const diff = current - previous;
      const percentage = Math.round((diff / previous) * 100);
      return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
    };
    
    const getStatus = (trendStr: string, inverse: boolean = false) => {
      if (trendStr === '0%') return 'neutral';
      const isPositive = trendStr.startsWith('+');
      return (isPositive !== inverse) ? 'positive' : 'negative';
    };

    const tripsTrend = calcTrend(tripsThisMonth, tripsLastMonth);
    const distanceTrend = calcTrend(totalDistance, distanceLastMonth);
    const fuelTrend = calcTrend(fuelCost, fuelCostLastMonth);
    const hoursTrend = calcTrend(estimatedHours, estimatedHoursLastMonth);

    const kpis = [
      { title: 'การจองทั้งหมด', value: tripsThisMonth.toString(), unit: 'ครั้ง', trend: tripsTrend, status: getStatus(tripsTrend) },
      { title: 'ระยะทางรวม', value: totalDistance.toLocaleString(), unit: 'กม.', trend: distanceTrend, status: getStatus(distanceTrend) },
      { title: 'ค่าเชื้อเพลิง', value: fuelCost.toLocaleString(), unit: 'บาท', trend: fuelTrend, status: getStatus(fuelTrend, true) },
      { title: 'ชั่วโมงใช้งานรถ', value: estimatedHours.toString(), unit: 'ชม.', trend: hoursTrend, status: getStatus(hoursTrend) }
    ];

    const recentTrips = recentBookings.map(b => {
      let cost = 0;
      if (b.driverLog && b.driverLog.expenses) {
        cost = b.driverLog.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      }
      return {
        id: b.id,
        date: b.departureDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        requester: b.requester?.name || 'ยังไม่ระบุ',
        destination: b.destination,
        driver: b.assignedDriver?.user?.name || 'ยังไม่ระบุ',
        distance: b.driverLog ? `${b.driverLog.totalDistance} กม.` : '-',
        cost: cost > 0 ? `${cost.toLocaleString()} ฿` : '-',
        status: b.status === 'APPROVED' ? (b.driverLog ? 'เสร็จสิ้น' : 'รอเดินทาง') : b.status
      };
    });

    const topDestinations = destinationsAgg.map(d => ({
      name: d.destination,
      count: d._count.destination,
      percentage: destinationsAgg.length > 0 ? (d._count.destination / destinationsAgg[0]._count.destination) * 100 : 0
    }));

    const colors = ['bg-indigo-500', 'bg-amber-500', 'bg-sky-500', 'bg-orange-500'];
    const tripTypesRaw = objectivesAgg.map(o => ({
       label: o.objective || 'ไม่ระบุ',
       count: o._count.objective
    })).sort((a,b) => b.count - a.count).slice(0, 4);
    
    const totalTripTypesCount = tripTypesRaw.reduce((sum, t) => sum + t.count, 0);
    const tripTypes = tripTypesRaw.map((t, i) => ({
      label: t.label,
      val: totalTripTypesCount > 0 ? Math.round((t.count / totalTripTypesCount) * 100) + '%' : '0%',
      col: colors[i % colors.length]
    }));

    const totalExpense = expensesAgg.reduce((sum, e) => sum + (e._sum.amount || 0), 0);
    const expenseMapping: Record<string, { icon: string; color: string }> = {
      'ค่าน้ำมัน': { icon: 'Fuel', color: 'indigo' },
      'น้ำมัน': { icon: 'Fuel', color: 'indigo' },
      'ซ่อมบำรุง': { icon: 'AlertCircle', color: 'orange' },
      'ทางด่วน': { icon: 'MapPin', color: 'sky' }
    };
    
    const defaultCategories = ['ค่าน้ำมัน', 'ซ่อมบำรุง', 'ทางด่วน'];
    const mergedExpenses: {category: string, amount: number}[] = [];
    
    defaultCategories.forEach(cat => {
      const found = expensesAgg.find(e => e.category === cat || (cat === 'ค่าน้ำมัน' && e.category === 'น้ำมัน'));
      mergedExpenses.push({
        category: cat,
        amount: found ? (found._sum.amount || 0) : 0
      });
    });

    expensesAgg.forEach(e => {
      if (!defaultCategories.includes(e.category) && e.category !== 'น้ำมัน') {
        mergedExpenses.push({
          category: e.category,
          amount: e._sum.amount || 0
        });
      }
    });

    const expenseBreakdown = mergedExpenses.map(e => {
       const mapping = expenseMapping[e.category] || { icon: 'AlertCircle', color: 'slate' };
       const amount = e.amount;
       return {
         category: e.category,
         amount: amount,
         percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
         icon: mapping.icon,
         colorClass: `bg-${mapping.color}-500`,
         textClass: `text-${mapping.color}-600`,
         bgClass: `bg-${mapping.color}-50`
       }
    }).sort((a, b) => b.amount - a.amount);

    const driverSummary = driversData.map(d => ({
       name: d.user.name,
       role: d.type === 'PRIMARY' ? 'พนักงานประจำ' : 'พนักงานชั่วคราว',
       tripsCount: d._count.bookings,
       status: d.isActive ? 'กำลังปฏิบัติงาน' : 'ไม่มีภารกิจ',
       initials: d.user.name.substring(0, 2)
    }));

    const vehicleCompliance = vansData.map(v => {
       return {
         plate: v.plate,
         taxExp: '-',
         taxStatus: 'OK',
         insExp: '-',
         insStatus: 'OK',
         nextCheck: v.nextCheckMileage ? `${v.nextCheckMileage.toLocaleString()} กม.` : '-'
       };
    });

    return NextResponse.json({
      success: true,
      kpis,
      recentTrips,
      topDestinations,
      tripTypes,
      expenseBreakdown,
      totalExpense,
      driverSummary,
      vehicleCompliance
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

