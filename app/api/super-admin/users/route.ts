import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



interface DbUserItem {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  faculty?: {
    nameTh: string;
  } | null;
}

export async function GET() {
  try {
    let dbUsers: DbUserItem[] = [];
    try {
      dbUsers = await prisma.user.findMany({
        include: {
          faculty: true
        },
        orderBy: {
          id: 'desc'
        }
      });
    } catch (dbErr) {
      console.warn("Prisma users fetch notice:", dbErr);
    }

    if (dbUsers && dbUsers.length > 0) {
      const mappedUsers = dbUsers.map(u => ({
        id: u.id,
        avatar: u.avatar || null,
        name: u.name,
        faculty: u.faculty?.nameTh || "ศูนย์จัดการระบบส่วนกลาง",
        role: u.role,
        email: u.email,
        status: "ACTIVE",
        lastLogin: "เข้าใช้งานแล้ว"
      }));
      return NextResponse.json({ users: mappedUsers });
    }

    return NextResponse.json({ users: [] });

  } catch (error) {
    console.error('Super Admin Users API Error:', error);
    return NextResponse.json({ users: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, faculty } = body;
    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let facultyId: number;
    if (role === 'SUPER_ADMIN') {
      let defaultFaculty = await prisma.faculty.findFirst({ where: { nameTh: 'ศูนย์จัดการระบบส่วนกลาง' } });
      if (!defaultFaculty) {
        defaultFaculty = await prisma.faculty.create({ data: { nameTh: 'ศูนย์จัดการระบบส่วนกลาง' } });
      }
      facultyId = defaultFaculty.id;
    } else {
      let facultyRecord = await prisma.faculty.findFirst({ where: { nameTh: faculty } });
      if (!facultyRecord) {
        facultyRecord = await prisma.faculty.create({ data: { nameTh: faculty || 'ทั่วไป' } });
      }
      facultyId = facultyRecord.id;
    }

    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role || 'USER',
        facultyId
      }
    });

    if (role === 'DRIVER') {
      try {
        await prisma.driver.create({
          data: {
            userId: createdUser.id,
            facultyId: facultyId,
            phone: "-",
            age: 35,
            type: "PRIMARY",
            isActive: true
          }
        });
      } catch (dErr) {
        console.warn("Notice creating driver profile:", dErr);
      }
    }

    return NextResponse.json({ success: true, user: createdUser });
  } catch (error: unknown) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, role, faculty } = body;
    if (!id || !name || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let facultyId: number;
    if (role === 'SUPER_ADMIN') {
      let defaultFaculty = await prisma.faculty.findFirst({ where: { nameTh: 'ศูนย์จัดการระบบส่วนกลาง' } });
      if (!defaultFaculty) {
        defaultFaculty = await prisma.faculty.create({ data: { nameTh: 'ศูนย์จัดการระบบส่วนกลาง' } });
      }
      facultyId = defaultFaculty.id;
    } else {
      let facultyRecord = await prisma.faculty.findFirst({ where: { nameTh: faculty } });
      if (!facultyRecord) {
        facultyRecord = await prisma.faculty.create({ data: { nameTh: faculty || 'ทั่วไป' } });
      }
      facultyId = facultyRecord.id;
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name,
        email,
        role: role || 'USER',
        facultyId
      }
    });

    if (role === 'DRIVER') {
      try {
        const existingDriver = await prisma.driver.findFirst({ where: { userId: updatedUser.id } });
        if (!existingDriver) {
          await prisma.driver.create({
            data: {
              userId: updatedUser.id,
              facultyId: facultyId,
              phone: "-",
              age: 35,
              type: "PRIMARY",
              isActive: true
            }
          });
        } else {
          await prisma.driver.update({
            where: { id: existingDriver.id },
            data: { facultyId: facultyId }
          });
        }
      } catch (dErr) {
        console.warn("Notice updating driver profile:", dErr);
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing user ID' }, { status: 400 });
    }

    const userId = Number(id);
    if (!isNaN(userId)) {
      try {
        await prisma.$transaction(async (tx) => {
          // Delete related bookings first (this handles the foreign key constraint)
          await tx.booking.deleteMany({
            where: { requesterId: userId }
          });
          // Delete the user
          await tx.user.delete({
            where: { id: userId }
          });
        });
      } catch (dbError: unknown) {
        if (typeof dbError === 'object' && dbError !== null && 'code' in dbError) {
          const code = (dbError as { code: string }).code;
          // P2025: Record to delete does not exist
          if (code === 'P2025') {
            console.warn('User not found in DB, might be mock data. Continuing...');
          } 
          // P2003: Foreign key constraint failed
          else if (code === 'P2003') {
            return NextResponse.json({ 
              success: false, 
              error: 'ไม่สามารถลบผู้ใช้งานได้ เนื่องจากมีข้อมูลที่เกี่ยวข้องผูกพันอยู่ (เช่น ประวัติการจอง หรือข้อมูลคนขับ)' 
            }, { status: 400 });
          } else {
            throw dbError;
          }
        } else {
          throw dbError; // Rethrow other errors
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
