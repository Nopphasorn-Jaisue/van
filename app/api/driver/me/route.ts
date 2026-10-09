import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/app/actions/auth";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !authUser.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const email = authUser.email;

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        driverProfile: {
          include: {
            assignedVan: true,
            user: true,
            faculty: {
              include: {
                vans: true
              }
            }
          }
        },
        faculty: {
          include: {
            vans: true
          }
        }
      }
    });

    if (!user && authUser.id) {
      user = await prisma.user.findUnique({
        where: { id: Number(authUser.id) },
        include: {
          driverProfile: {
            include: {
              assignedVan: true,
              user: true,
              faculty: {
                include: {
                  vans: true
                }
              }
            }
          },
          faculty: {
            include: {
              vans: true
            }
          }
        }
      });
    }

    // If user has DRIVER role or driver profile not found, try to find matching or faculty driver
    let driver = user?.driverProfile;
    if (!driver) {
      driver = await prisma.driver.findFirst({
        where: user?.facultyId ? { facultyId: user.facultyId } : undefined,
        include: {
          assignedVan: true,
          user: true,
          faculty: {
            include: {
              vans: true
            }
          }
        }
      });
      if (!driver) {
        driver = await prisma.driver.findFirst({
          include: {
            assignedVan: true,
            user: true,
            faculty: {
              include: {
                vans: true
              }
            }
          }
        });
      }
    }

    if (!driver) {
      return NextResponse.json({ success: false, message: "DRIVER_NOT_FOUND" }, { status: 404 });
    }
    const effectiveUser = user || driver.user;
    const effectiveFaculty = user?.faculty || driver.faculty;
    const assignedVan = driver.assignedVan;
    const facultyVan = effectiveFaculty?.vans?.[0];

    return NextResponse.json({
      success: true,
      driverData: {
        id: driver.id,
        name: effectiveUser?.name || "พนักงานขับรถ",
        email: effectiveUser?.email || authUser.email,
        avatar: driver.avatar,
        contractStart: driver.contractStart,
        assignedVanId: driver.assignedVanId,
        facultyVanId: facultyVan?.id || null,
        vanAssigned: assignedVan?.name || facultyVan?.name || 'ไม่ระบุ',
        plate: assignedVan?.plate || facultyVan?.plate || '-',
        vanPlate: assignedVan?.plate || facultyVan?.plate || null,
        facultyId: effectiveUser?.facultyId || driver.facultyId,
        legacyVanId: effectiveFaculty?.nameTh?.includes('เภสัช') ? 'v-pharm' 
                   : effectiveFaculty?.nameTh?.includes('สารสนเทศ') || effectiveFaculty?.nameTh?.includes('ICT') ? 'v-ict'
                   : effectiveFaculty?.nameTh?.includes('วิทย') ? 'v-sci'
                   : effectiveFaculty?.nameTh?.includes('เกษตร') ? 'v-agri'
                   : effectiveFaculty?.nameTh?.includes('พลังงาน') ? 'v-seen'
                   : 'v-ict'
      }
    });

  } catch (error) {
    console.error("Error fetching driver profile:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch driver profile" }, { status: 500 });
  }
}
