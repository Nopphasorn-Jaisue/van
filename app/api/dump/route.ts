import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await prisma.user.findFirst({
    where: { name: '555' },
    include: { driverProfile: true, faculty: true }
  });
  const facs = await prisma.faculty.findMany();
  
  return NextResponse.json({ user, faculties: facs });
}
