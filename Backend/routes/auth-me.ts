import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-util";


export async function handleGetCurrentUser() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        role: "USER",
        email: null,
        fullName: null,
        name: "ผู้ขอใช้บริการ",
        faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
        facultyId: 1
      });
    }

    const facultyName = user.faculty?.nameTh || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร";
    return NextResponse.json({
      authenticated: true,
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      fullName: user.name,
      facultyId: user.facultyId,
      faculty: facultyName,
      facultyName: facultyName,
      avatar: user.avatar || null,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        facultyId: user.facultyId,
        faculty: facultyName,
        facultyName: facultyName,
        avatar: user.avatar || null
      }
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      role: "USER",
      email: null,
      name: "ผู้ขอใช้บริการ",
      faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
      facultyId: 1,
      user: null
    });
  }
}
