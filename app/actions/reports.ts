'use server';

import { prisma } from '@/lib/prisma';
import { getAuthUser } from './auth';

export async function getDashboardReports() {
  const user = await getAuthUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const role = user.role;
  const facultyId = user.facultyId;

  try {
    let facultyTripStats = { internal: 0, external: 0, inProvince: 0, outProvince: 0 };
    let driverWorkload: any[] = [];
    let fleetStatus: any[] = [];
    let weeklyDensity: any[] = [];
    let crossFacultyUsage: any[] = [];

    if (role === 'SUPER_ADMIN') {
      // 1. Fleet Status (Super Admin)
      const allVans = await prisma.van.findMany({ include: { faculty: true } });
      const facultiesMap = new Map();
      allVans.forEach(van => {
        const facName = van.faculty.nameTh;
        if (!facultiesMap.has(facName)) {
          facultiesMap.set(facName, { faculty: facName, total_vans: 0, active: 0, maintenance: 0, usage_rate: '0%' });
        }
        const fac = facultiesMap.get(facName);
        fac.total_vans++;
        if (van.isActive) fac.active++;
        else fac.maintenance++;
      });
      // Mock usage_rate for now until we have actual booking count per van
      fleetStatus = Array.from(facultiesMap.values()).map(fac => {
        fac.usage_rate = fac.total_vans > 0 ? Math.round((fac.active / fac.total_vans) * 100) + '%' : '0%';
        return fac;
      });

      // 2. Weekly Density (Super Admin)
      const recentBookings = await prisma.booking.findMany({
        where: { departureDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Last 30 days
        select: { departureDate: true }
      });
      const daysCount = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
      recentBookings.forEach(b => {
        daysCount[b.departureDate.getDay()]++;
      });
      const totalRecent = recentBookings.length || 1;
      const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
      weeklyDensity = dayNames.map((day, idx) => ({
        day,
        trips: daysCount[idx],
        percent: Math.round((daysCount[idx] / totalRecent) * 100)
      }));

      // 3. Cross Faculty Usage (Super Admin)
      const crossBookings = await prisma.booking.findMany({
        where: {
          NOT: {
            requester: {
              facultyId: { equals: prisma.booking.fields.targetFacultyId }
            }
          }
        },
        include: {
          requester: { include: { faculty: true } },
          targetFaculty: true
        }
      });
      
      const crossMap = new Map();
      crossBookings.forEach(b => {
        const borrower = b.requester.faculty.nameTh;
        const lender = b.targetFaculty.nameTh;
        const key = `${borrower}-${lender}`;
        if (!crossMap.has(key)) crossMap.set(key, { borrower, lender, count: 0, percent: 0 });
        crossMap.get(key).count++;
      });
      
      const totalCross = crossBookings.length || 1;
      crossFacultyUsage = Array.from(crossMap.values()).map(c => ({
        ...c,
        percent: Math.round((c.count / totalCross) * 100)
      })).sort((a, b) => b.count - a.count).slice(0, 5);

    } else if (role === 'FACULTY_ADMIN') {
      // 1. Faculty Trip Stats
      const bookings = await prisma.booking.findMany({
        where: { targetFacultyId: facultyId },
        include: { requester: true }
      });
      
      bookings.forEach(b => {
        if (b.requester.facultyId === facultyId) facultyTripStats.internal++;
        else facultyTripStats.external++;
        
        // Infer province from destination (simplistic approach, default to outProvince if contains จังหวัด)
        if (b.destination.includes('พะเยา') || !b.destination.includes('จังหวัด')) facultyTripStats.inProvince++;
        else facultyTripStats.outProvince++;
      });

      // 2. Driver Workload
      const drivers = await prisma.driver.findMany({
        where: { facultyId: facultyId },
        include: { user: true, bookings: { where: { departureDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } }
      });
      
      driverWorkload = drivers.map(d => {
        const trips = d.bookings.length;
        const hours = trips * 8; // Estimate 8 hours per trip
        return {
          id: d.id.toString(),
          name: d.user.name,
          hours_this_week: hours,
          max_safe_hours: 48,
          trips,
          status: hours >= 40 ? 'warning' : 'safe'
        };
      });
    }

    return {
      success: true,
      data: {
        role,
        facultyTripStats,
        driverWorkload,
        fleetStatus,
        weeklyDensity,
        crossFacultyUsage
      }
    };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return { success: false, error: 'Failed to load reports' };
  }
}
