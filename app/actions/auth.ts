"use server"
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-for-development-only"
);

export async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function setMockSession(role: string, email?: string) {
  const cookieStore = await cookies();
  
  let dbUser = email ? await prisma.user.findUnique({
    where: { email },
    include: { faculty: true }
  }) : null;

  if (!dbUser) {
    // If no email or user not found, create or find mock user
    const mockEmail = email || `mock.${role.toLowerCase()}@up.ac.th`;
    dbUser = await prisma.user.findUnique({
      where: { email: mockEmail },
      include: { faculty: true }
    });
    
    if (!dbUser) {
      const fallbackFaculty = await prisma.faculty.findFirst() || await prisma.faculty.create({ data: { nameTh: 'ศูนย์จัดการระบบส่วนกลาง' } });
      dbUser = await prisma.user.create({
        data: {
          email: mockEmail,
          name: role === 'DRIVER' ? "พนักงานขับรถ ทดสอบ" : role === 'USER' ? "ผู้ใช้งานทั่วไป ทดสอบ" : "ผู้ดูแลระบบ ทดสอบ",
          role: role as import("@prisma/client").Role,
          facultyId: fallbackFaculty.id,
        },
        include: { faculty: true }
      });
    }
  }

  // Generate JWT token containing essential user info
  const token = await signToken({
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    facultyId: dbUser.facultyId,
    faculty: dbUser.faculty
  });

  // Set the token as a cookie
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 // 1 day
  });

  // Keep these for backward compatibility if needed temporarily
  cookieStore.set("mock_role", role, { path: "/", maxAge: 60 * 60 * 24 });
  if (email) {
    cookieStore.set("mock_email", email, { path: "/", maxAge: 60 * 60 * 24 });
  }
}

export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  cookieStore.delete("mock_role");
  cookieStore.delete("mock_email");
}

import { Prisma } from "@prisma/client";

type AuthUserType = Prisma.UserGetPayload<{ include: { faculty: true } }>;

export async function getAuthUser(): Promise<AuthUserType | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        // Fast path: local JWT verified in 0.01ms with zero network latency
        return payload as unknown as AuthUserType;
      }
    }
  } catch (e) {
    // Ignore error
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
