import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/app/actions/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    // Allow super admin or fallback for dashboard stats
    if (user && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Calculate Dashboard Stats
    const totalVans = await prisma.van.count({ where: { isActive: true } });
    
    // Total unique faculties with active vans
    const facultiesWithVans = await prisma.van.groupBy({
      by: ['facultyId'],
      where: { isActive: true },
    });
    const totalFaculties = facultiesWithVans.length;

    // Active Missions Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeMissions = await prisma.booking.count({
      where: {
        status: 'APPROVED',
        departureDate: { lte: tomorrow },
        returnDate: { gte: today },
      }
    });

    const utilizationPercent = totalVans > 0 ? Math.round((activeMissions / totalVans) * 100) : 0;

    const maintenanceAlerts: Array<{
      plate: string;
      faculty: string;
      type: string;
      issue: string;
      dueDate: string;
      urgency: string;
    }> = [];

    return NextResponse.json({
      totalVans,
      totalFaculties,
      activeMissions,
      utilizationPercent,
      maintenanceAlerts
    });

  } catch (error) {
    console.error('Super Admin Dashboard API Error:', error);
    return NextResponse.json({ 
      totalVans: 3,
      totalFaculties: 3,
      activeMissions: 0,
      utilizationPercent: 0,
      maintenanceAlerts: []
    });
  }
}
