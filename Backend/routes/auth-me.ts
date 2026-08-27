import { NextResponse } from "next/server";
import { getAuthUser } from "@/app/actions/auth";


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

    return NextResponse.json({
      authenticated: true,
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      fullName: user.name,
      facultyId: user.facultyId,
      faculty: user.faculty?.nameTh || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
      facultyName: user.faculty?.nameTh || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    });
  } catch (err: any) {
    return NextResponse.json({
      authenticated: false,
      role: "USER",
      email: null,
      name: "ผู้ขอใช้บริการ",
      faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
      facultyId: 1
    });
  }
}
