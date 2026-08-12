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

    return NextResponse.json({
      success: true,
      driverData: {
        id: driver.id,
        name: user.name,
        email: user.email,
        assignedVanId: driver.assignedVanId,
        vanPlate: assignedVan ? assignedVan.plate : null,
      }
    });

  } catch (error) {
    console.error("Error fetching driver profile:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch driver profile" }, { status: 500 });
  }
}
