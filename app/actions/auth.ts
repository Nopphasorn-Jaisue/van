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
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { faculty: true }
    });
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
    return {
      id: "mock-id",
      name: mockRole === 'DRIVER' ? "พนักงานขับรถ ทดสอบ" : "ผู้ดูแลระบบ ทดสอบ",
      email: "test@up.ac.th",
      role: mockRole,
      facultyId: null,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      faculty: { nameTh: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร" }
    };
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
