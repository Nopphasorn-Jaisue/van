"use server"
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function setMockSession(role: string, email?: string) {
  const cookieStore = await cookies();
  cookieStore.set("mock_role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 // 1 day
  });
  if (email) {
    cookieStore.set("mock_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24
    });
  }
}

export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("mock_role");
  cookieStore.delete("mock_email");
}

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user && user.email) {
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { faculty: true }
    });

    // Auto-provisioning Logic (วิธีที่ 1: ดึงจาก Department Claim ของ Microsoft)
    if (!dbUser) {
      // 1. อ่านค่าคณะ/แผนก จากข้อมูลที่ Microsoft ส่งมาให้ผ่าน Supabase
      const department = user.user_metadata?.department || user.user_metadata?.custom_claims?.department;
      
      let facultyId: number;
      
      if (department) {
        // ค้นหาว่ามีคณะนี้ในระบบเราหรือยัง
        let facultyRecord = await prisma.faculty.findFirst({
           where: { nameTh: { contains: department } } 
        });
        
        // ถ้ายังไม่มีคณะนี้ ให้สร้างใหม่ในระบบอัตโนมัติ
        if (!facultyRecord) {
           facultyRecord = await prisma.faculty.create({ data: { nameTh: department } });
        }
        facultyId = facultyRecord.id;
      } else {
        // ถ้า Microsoft ไม่ได้ส่งข้อมูลคณะมา ให้จัดเข้า "ส่วนกลาง" ชั่วคราวไปก่อน
        let fallbackFaculty = await prisma.faculty.findFirst({ where: { nameTh: 'ศูนย์จัดการระบบส่วนกลาง' } });
        if (!fallbackFaculty) {
          fallbackFaculty = await prisma.faculty.create({ data: { nameTh: 'ศูนย์จัดการระบบส่วนกลาง' } });
        }
        facultyId = fallbackFaculty.id;
      }

      // 2. สร้างบัญชีผู้ใช้ใหม่ในระบบ (ยัดเข้าคณะที่ดึงมาได้อัตโนมัติ)
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
          role: 'USER',
          facultyId: facultyId,
          avatar: user.user_metadata?.avatar_url || null
        },
        include: { faculty: true }
      });
    }

    if (dbUser) return dbUser;
  }
  
  // Fallback to mock session for bypass login
  const cookieStore = await cookies();
  const mockEmail = cookieStore.get("mock_email")?.value;
  
  if (mockEmail) {
    const dbUser = await prisma.user.findUnique({
      where: { email: mockEmail },
      include: { faculty: true }
    });
    if (dbUser) return dbUser;
  }

  const mockRole = cookieStore.get("mock_role")?.value;
  if (mockRole) {
    // Find a real user with this role in the DB to ensure IDs match Prisma relations
    const mockEmail = `mock.${mockRole.toLowerCase()}@up.ac.th`;
    let dbUser = await prisma.user.findUnique({
      where: { email: mockEmail },
      include: { faculty: true }
    });
    
    if (!dbUser) {
      const fallbackFaculty = await prisma.faculty.findFirst() || await prisma.faculty.create({ data: { nameTh: 'ศูนย์จัดการระบบส่วนกลาง' } });
      dbUser = await prisma.user.create({
        data: {
          email: mockEmail,
          name: mockRole === 'DRIVER' ? "พนักงานขับรถ ทดสอบ" : mockRole === 'USER' ? "ผู้ใช้งานทั่วไป ทดสอบ" : "ผู้ดูแลระบบ ทดสอบ",
          role: mockRole as import("@prisma/client").Role,
          facultyId: fallbackFaculty.id,
        },
        include: { faculty: true }
      });
    }
    return dbUser;
  }
  
  return null;
}

export async function getRoleByEmail(email: string) {
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { role: true }
  });
  return dbUser?.role || null;
}
