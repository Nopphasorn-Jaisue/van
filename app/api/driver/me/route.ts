import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/app/actions/auth";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    let email = authUser.email;

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        driverProfile: {
          include: {
            assignedVan: true,
          }
        },
        faculty: {
          include: {
            vans: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found in database' }, { status: 404 });
    }

    if (!user.driverProfile) {
      return NextResponse.json({ success: false, message: "DRIVER_NOT_FOUND" }, { status: 404 });
    }

    const driver = user.driverProfile;
    const assignedVan = driver.assignedVan;
    const facultyVan = user.faculty?.vans?.[0];

    return NextResponse.json({
      success: true,
      driverData: {
        id: driver.id,
        name: user.name,
        email: user.email,
        avatar: driver.avatar,
        contractStart: driver.contractStart,
        assignedVanId: driver.assignedVanId,
        facultyVanId: facultyVan?.id || null,
        vanAssigned: assignedVan?.name || facultyVan?.name || 'ไม่ระบุ',
        plate: assignedVan?.plate || facultyVan?.plate || '-',
        vanPlate: assignedVan?.plate || facultyVan?.plate || null,
        facultyId: user.facultyId,
        legacyVanId: user.faculty?.nameTh?.includes('เภสัช') ? 'v-pharm' 
                   : user.faculty?.nameTh?.includes('สารสนเทศ') || user.faculty?.nameTh?.includes('ICT') ? 'v-ict'
                   : user.faculty?.nameTh?.includes('วิทย') ? 'v-sci'
                   : user.faculty?.nameTh?.includes('เกษตร') ? 'v-agri'
                   : user.faculty?.nameTh?.includes('พลังงาน') ? 'v-seen'
                   : 'v-ict'
      }
    });

  } catch (error) {
    console.error("Error fetching driver profile:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch driver profile" }, { status: 500 });
  }
}
