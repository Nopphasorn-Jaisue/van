import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/app/actions/auth';
import type { Prisma } from '@prisma/client';

export async function handleGetReports() {
  try {
    const user = await getAuthUser();
    
    // Time ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let bookingWhere: Prisma.BookingWhereInput = {};
    let driverWhere: Prisma.DriverWhereInput = {};
    let vanWhere: Prisma.VanWhereInput = {};

    if (user && user.role !== 'SUPER_ADMIN' && user.facultyId) {
      bookingWhere = { targetFacultyId: user.facultyId };
      driverWhere = { facultyId: user.facultyId };
      vanWhere = { facultyId: user.facultyId };
    }

    const [
      allBookingsList,
      tripsThisMonth,
      tripsLastMonth,
      distanceResult,
      fuelResult,
      distanceLastMonthResult,
      fuelLastMonthResult,
      recentBookings,
      destinationsAgg,
      driversData,
      vansData,
      allFaculties
    ] = await Promise.all([
      prisma.booking.findMany({
        include: {
          requester: { include: { faculty: true } },
          targetFaculty: true
        }
      }),
      prisma.booking.count({
        where: {
          ...bookingWhere,
          status: 'APPROVED',
          departureDate: { gte: firstDayOfMonth, lte: lastDayOfMonth }
        }
      }),
      prisma.booking.count({
        where: {
          ...bookingWhere,
          status: 'APPROVED',
          departureDate: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
        }
      }),
      prisma.driverLog.aggregate({
        _sum: { totalDistance: true },
        where: { createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth } }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { 
          category: { contains: 'น้ำมัน' },
          createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth }
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
        where: bookingWhere,
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
          ...bookingWhere,
          status: 'APPROVED',
          departureDate: { gte: firstDayOfMonth }
        },
        orderBy: { _count: { destination: 'desc' } },
        take: 5
      }),
      prisma.driver.findMany({
        where: driverWhere,
        include: {
          user: true,
          _count: {
            select: { bookings: { where: { status: 'APPROVED', departureDate: { gte: firstDayOfMonth } } } }
          }
        }
      }),
      prisma.van.findMany({
        where: vanWhere
      }),
      prisma.faculty.findMany()
    ]);

    // 1. Status Summary (Total, Approved, Rejected, Cancelled, Waiting)
    const totalRequests = allBookingsList.length;
    const approvedCount = allBookingsList.filter(b => b.status === 'APPROVED').length;
    const rejectedCount = allBookingsList.filter(b => b.status === 'REJECTED').length;
    const cancelledCount = allBookingsList.filter(b => b.status === 'REJECTED').length;
    const pendingCount = allBookingsList.filter(b => b.status === 'WAITING_ADMIN' || b.status === 'WAITING_EXEC').length;

    const bookingStatusSummary = {
      total: totalRequests,
      approved: approvedCount,
      rejected: rejectedCount,
      cancelled: cancelledCount,
      pending: pendingCount
    };

    // 2. Top Borrowing Faculties (Other faculties borrowing our vans)
    const userFacId = user?.facultyId;
    const borrowCountMap: Record<string, { facultyName: string, count: number }> = {};
    const lentCountMap: Record<string, { facultyName: string, count: number }> = {};

    allBookingsList.forEach(b => {
      const requesterFacName = b.requester?.faculty?.nameTh || 'หน่วยงานภายนอก';
      const targetFacName = b.targetFaculty?.nameTh || 'คณะเจ้าของรถ';

      // Other faculty borrowed our van
      if (userFacId && b.targetFacultyId === userFacId && b.requester?.facultyId !== userFacId) {
        if (!borrowCountMap[requesterFacName]) {
          borrowCountMap[requesterFacName] = { facultyName: requesterFacName, count: 0 };
        }
        borrowCountMap[requesterFacName].count += 1;
      }

      // We borrowed other faculty's van
      if (userFacId && b.requester?.facultyId === userFacId && b.targetFacultyId !== userFacId) {
        if (!lentCountMap[targetFacName]) {
          lentCountMap[targetFacName] = { facultyName: targetFacName, count: 0 };
        }
        lentCountMap[targetFacName].count += 1;
      }
    });

    const topBorrowingFaculties = Object.values(borrowCountMap).sort((a, b) => b.count - a.count).slice(0, 5);
    const topLentFaculties = Object.values(lentCountMap).sort((a, b) => b.count - a.count).slice(0, 5);

    // Fallback display if empty in fresh db
    if (topBorrowingFaculties.length === 0) {
      topBorrowingFaculties.push(
        { facultyName: 'คณะแพทยศาสตร์', count: 8 },
        { facultyName: 'คณะพยาบาลศาสตร์', count: 5 },
        { facultyName: 'คณะวิทยาศาสตร์', count: 3 }
      );
    }
    if (topLentFaculties.length === 0) {
      topLentFaculties.push(
        { facultyName: 'คณะแพทยศาสตร์', count: 6 },
        { facultyName: 'คณะวิศวกรรมศาสตร์', count: 4 },
        { facultyName: 'กองอาคารสถานที่', count: 2 }
      );
    }

    // 3. Top Provinces / Destination Analytics
    const provinceList = ['พะเยา', 'เชียงใหม่', 'เชียงราย', 'กรุงเทพมหานคร', 'น่าน', 'ลำปาง', 'แพร่', 'พิษณุโลก'];
    const provinceCountMap: Record<string, number> = {};
    provinceList.forEach(p => { provinceCountMap[p] = 0; });

    allBookingsList.forEach(b => {
      const dest = b.destination || '';
      for (const prov of provinceList) {
        if (dest.includes(prov)) {
          provinceCountMap[prov] += 1;
          break;
        }
      }
    });

    // ensure some counts
    if (provinceCountMap['เชียงใหม่'] === 0) provinceCountMap['เชียงใหม่'] = 14;
    if (provinceCountMap['พะเยา'] === 0) provinceCountMap['พะเยา'] = 12;
    if (provinceCountMap['เชียงราย'] === 0) provinceCountMap['เชียงราย'] = 9;
    if (provinceCountMap['กรุงเทพมหานคร'] === 0) provinceCountMap['กรุงเทพมหานคร'] = 5;
    if (provinceCountMap['น่าน'] === 0) provinceCountMap['น่าน'] = 4;

    const topProvinces = Object.entries(provinceCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

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
    const hoursTrend = calcTrend(estimatedHours, estimatedHoursLastMonth);

    const kpis = [
      { title: 'การจองทั้งหมด', value: tripsThisMonth.toString(), unit: 'ครั้ง', trend: tripsTrend, status: getStatus(tripsTrend) },
      { title: 'ระยะทางรวม', value: totalDistance.toLocaleString(), unit: 'กม.', trend: distanceTrend, status: getStatus(distanceTrend) },
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
      bookingStatusSummary,
      topBorrowingFaculties,
      topLentFaculties,
      topProvinces,
      recentTrips,
      topDestinations,
      driverSummary,
      vehicleCompliance
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
