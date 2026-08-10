import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // 1. Verify user is authenticated and is SUPER_ADMIN
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: authData.user.email! },
      select: { role: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Calculate Dashboard Stats
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
        departureDate: { lte: tomorrow }, // departure is before the end of today
        returnDate: { gte: today }, // return is after the start of today
      }
    });

    const utilizationPercent = totalVans > 0 ? Math.round((activeMissions / totalVans) * 100) : 0;

    // 3. Maintenance Alerts
    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const maintenanceAlerts: Array<{
      plate: string;
      faculty: string;
      type: string;
      issue: string;
      dueDate: string;
      urgency: string;
    }> = [];
    // Sort alerts: critical first, then by days left
    maintenanceAlerts.sort((a, b) => {
      if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
      if (a.urgency !== 'critical' && b.urgency === 'critical') return 1;
      return 0; // simplistic sort
    });

    return NextResponse.json({
      totalVans,
      totalFaculties,
      activeMissions,
      utilizationPercent,
      maintenanceAlerts
    });

  } catch (error) {
    console.error('Super Admin Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
