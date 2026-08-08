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

    // 2. Fetch all users
    const users = await prisma.user.findMany({
      include: {
        faculty: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    // 3. Map to match UI format
    // Notice: employeeId, status, lastLogin, avatar are not in schema currently, so we use fallbacks.
    const mappedUsers = users.map(u => ({
      id: u.id,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150", // Placeholder
      name: u.name,
      faculty: u.faculty?.nameTh || "ไม่ระบุ",
      role: u.role,
      email: u.email,
      status: "ACTIVE", // Placeholder
      lastLogin: "-" // Placeholder
    }));

    return NextResponse.json({ users: mappedUsers });

  } catch (error) {
    console.error('Super Admin Users API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
