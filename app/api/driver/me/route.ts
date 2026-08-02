import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authData } } = await supabase.auth.getUser();
    let email = authData?.email;
    
    // Mock email for local testing if not logged in
    if (!email) {
      const firstDriver = await prisma.user.findFirst({ 
        where: { 
          role: "DRIVER",
          driverProfile: {
            assignedVanId: { not: null }
          }
        } 
      });
      // Fallback to the known real driver email if no one with a van is found, or testdriver
      email = firstDriver ? firstDriver.email : "66012555@up.ac.th";
      console.log("No Supabase user, using mock email:", email);
    }
    console.log("Current user email:", email);

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
      console.log("Auto-creating test user and driver profile for:", email);
      // Auto create a dummy faculty if none exist
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
      console.log("Auto-creating driver profile for existing user:", email);
      
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
      
      // Update role to DRIVER just in case
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "DRIVER" }
      });
      
      user.driverProfile = newDriverProfile;
    }

    if (!user || !user.driverProfile) {
      return NextResponse.json({ success: false, message: "DRIVER_NOT_FOUND" }, { status: 404 });
    }

    // Auto-assign van for local testing if the driver doesn't have one
    if (!user.driverProfile.assignedVanId) {
      const firstVan = await prisma.van.findFirst();
      if (firstVan) {
        console.log("Auto-assigning first van to driver:", email);
        const updatedDriver = await prisma.driver.update({
          where: { id: user.driverProfile.id },
          data: { assignedVanId: firstVan.id },
          include: { assignedVan: true }
        });
        user.driverProfile = updatedDriver;
      }
    }

    const driver = user.driverProfile;
    const assignedVan = driver.assignedVan;

    return NextResponse.json({
      success: true,
      driverData: {
        name: user.name,
        avatar: driver.avatar,
        vanAssigned: assignedVan ? assignedVan.name || `รถตู้ ${assignedVan.plate}` : "ยังไม่ได้ระบุรถตู้ประจำตัว",
        plate: assignedVan ? assignedVan.plate : "-",
        contractStart: driver.contractStart ? driver.contractStart.toISOString() : new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Error fetching driver me:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ success: false, message: "INTERNAL_SERVER_ERROR", error: errorMessage, stack: errorStack }, { status: 500 });
  }
}
