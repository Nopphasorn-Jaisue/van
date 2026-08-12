import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const email = "66012555@up.ac.th";
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        driverProfile: {
          include: {
            assignedVan: true,
          }
        }
      }
    });

    if (!user) {
      let faculty = await prisma.faculty.findFirst();
      if (!faculty) {
        faculty = await prisma.faculty.create({
          data: { nameTh: "คณะทดสอบ", nameEn: "Test Faculty" }
        });
      }
      user = await prisma.user.create({
        data: {
          email,
          name: "Test Driver User",
          role: "DRIVER",
          facultyId: faculty.id,
          driverProfile: {
            create: {
              facultyId: faculty.id,
              phone: "0812345678",
              age: 35,
              type: "PRIMARY",
              isActive: true,
              contractStart: new Date(),
            }
          }
        },
        include: {
          driverProfile: {
            include: { assignedVan: true }
          }
        }
      });
    } else if (!user.driverProfile) {
      const newDriverProfile = await prisma.driver.create({
        data: {
          userId: user.id,
          facultyId: user.facultyId,
          phone: "0812345678",
          age: 35,
          type: "PRIMARY",
          isActive: true,
          contractStart: new Date(),
        },
        include: {
          assignedVan: true
        }
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "DRIVER" }
      });
      user.driverProfile = newDriverProfile;
    }

    if (!user || !user.driverProfile) {
      return NextResponse.json({ success: false, message: "DRIVER_NOT_FOUND" }, { status: 404 });
    }

    const driver = user.driverProfile;
    const assignedVan = driver.assignedVan;

    return NextResponse.json({
      success: true,
      driverData: {
        name: user.name,
        vanAssigned: assignedVan ? assignedVan.name || `รถตู้ ${assignedVan.plate}` : "ยังไม่ได้ระบุรถตู้ประจำตัว",
        plate: assignedVan ? assignedVan.plate : "-",
        contractStart: driver.contractStart ? driver.contractStart.toISOString() : new Date().toISOString(),
      }
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ success: false, message: "INTERNAL_SERVER_ERROR", error: errMessage, stack: errStack }, { status: 500 });
  }
}
