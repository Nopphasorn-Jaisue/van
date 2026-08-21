"use server";

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit";
import { getAuthUser } from "./auth";

export interface MaintenanceAlert {
  plate: string;
  faculty: string;
  type: string;
  issue: string;
  dueDate: string;
  urgency: string;
}

export async function getFaculties() {
  const faculties = await prisma.faculty.findMany({
    where: {
      nameTh: {
        not: "ศูนย์จัดการระบบส่วนกลาง"
      }
    },
    include: {
      users: {
        where: { role: "FACULTY_ADMIN" },
        take: 1
      },
      vans: true,
      drivers: true
    }
  });

  return faculties.map(f => ({
    id: f.id,
    name: f.nameTh,
    adminName: f.users.length > 0 ? f.users[0].name : "ไม่มีข้อมูล",
    adminPhone: "-", 
    vansCount: f.vans.length,
    driversCount: f.drivers.length,
  }));
}

export async function getVans() {
  const vans = await prisma.van.findMany({
    include: {
      faculty: {
        include: {
          drivers: {
            include: {
              user: true
            }
          }
        }
      },
      assignedDrivers: {
        include: {
          user: true
        }
      }
    }
  });

  return vans.map(v => {
    let status = "READY";
    if (!v.isActive) status = "MAINTENANCE";

    const assignedDriver = v.assignedDrivers.length > 0 
      ? v.assignedDrivers[0] 
      : (v.faculty?.drivers && v.faculty.drivers.length > 0 ? v.faculty.drivers[0] : null);
    const driverName = assignedDriver ? assignedDriver.user.name : "ไม่มีคนขับประจำ";
    const driverAvatar = assignedDriver && assignedDriver.avatar 
      ? assignedDriver.avatar 
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150";

    return {
      id: v.id,
      plate: v.plate,
      brand: v.name || "Toyota Commuter",
      capacity: v.capacity,
      faculty: v.faculty?.nameTh || "ส่วนกลาง",
      status: status,
      driver: driverName,
      driverAvatar: driverAvatar,
      mileage: v.nextCheckMileage ? v.nextCheckMileage - 1000 : 50000,
      nextMaintenance: v.nextCheckMileage ? `${v.nextCheckMileage} กม.` : "ไม่ระบุ",
      image: v.image,
      taxExp: v.taxExp ? v.taxExp.toISOString() : null,
      insExp: v.insExp ? v.insExp.toISOString() : null
    };
  });
}

export async function getDrivers() {
  const drivers = await prisma.driver.findMany({
    include: {
      user: true,
      faculty: {
        include: {
          vans: true
        }
      },
      assignedVan: true,
      availabilities: {
        where: {
          date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      bookings: {
        take: 3,
        orderBy: { departureDate: 'desc' },
        include: { targetFaculty: true }
      }
    }
  });

  return drivers.map(d => {
    let status = "READY";
    if (!d.isActive) status = "SICK";

    const assignedPlate = d.assignedVan?.plate || (d.faculty?.vans && d.faculty.vans.length > 0 ? d.faculty.vans[0].plate : "ไม่มีรถประจำ");
    const vanName = d.assignedVan?.name || (d.faculty?.vans && d.faculty.vans.length > 0 ? d.faculty.vans[0].name : "Toyota Commuter") || "Toyota Commuter";

    return {
      id: d.id,
      avatar: d.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      name: d.user?.name || "ไม่ระบุชื่อ",
      employeeId: `DRV-${d.id.toString().padStart(3, '0')}`,
      faculty: d.faculty?.nameTh || "ส่วนกลาง",
      type: d.type === "PRIMARY" ? "MAIN" : "SUB",
      assignedVan: assignedPlate,
      vanModel: vanName,
      phone: d.phone || "-",
      email: d.user?.email || "-",

      status: status,

      recentTrips: d.bookings.map(b => ({
        title: `เดินทางไป ${b.targetFaculty?.nameTh || b.destination || "ต่างจังหวัด"}`,
        van: assignedPlate !== "ไม่มีรถประจำ" ? `รถตู้ ${assignedPlate}` : "ไม่ระบุรถตู้",
        date: b.departureDate ? b.departureDate.toISOString() : new Date().toISOString()
      })),
      
      availabilities: d.availabilities.map(a => ({
        date: a.date.toISOString(),
        status: a.status
      }))
    };
  });
}

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalVans, facultiesWithVans, activeMissions] = await Promise.all([
    prisma.van.count({ where: { isActive: true } }),
    prisma.van.groupBy({
      by: ['facultyId'],
      where: { isActive: true },
    }),
    prisma.booking.count({
      where: {
        status: 'APPROVED',
        departureDate: { lte: tomorrow },
        returnDate: { gte: today },
      }
    })
  ]);

  const totalFaculties = facultiesWithVans.length;
  const utilizationPercent = totalVans > 0 ? Math.round((activeMissions / totalVans) * 100) : 0;

  // 3. Maintenance Alerts
  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(now.getDate() + 30);

  const maintenanceAlerts: MaintenanceAlert[] = [];
  // Sort alerts: critical first, then by days left
  maintenanceAlerts.sort((a, b) => {
    if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
    if (a.urgency !== 'critical' && b.urgency === 'critical') return 1;
    return 0; // simplistic sort
  });

  return {
    totalVans,
    totalFaculties,
    activeMissions,
    utilizationPercent,
    maintenanceAlerts
  };
}

export async function deleteFaculty(facultyId: number) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return { success: false, message: "Unauthorized: คุณไม่มีสิทธิ์ในการลบข้อมูลคณะ" };
    }

    // Check if the faculty has associated vans, drivers, or users
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        vans: true,
        drivers: true,
        users: true
      }
    });

    if (!faculty) {
      return { success: false, message: "ไม่พบคณะที่ต้องการลบ" };
    }

    if (faculty.vans.length > 0 || faculty.drivers.length > 0 || faculty.users.length > 0) {
      return { 
        success: false, 
        message: "ไม่สามารถลบคณะได้ เนื่องจากมีข้อมูลรถประจำคณะ พนักงานขับรถ หรือผู้ใช้งานผูกอยู่ กรุณาลบข้อมูลที่เกี่ยวข้องก่อน" 
      };
    }

    await prisma.faculty.delete({
      where: { id: facultyId }
    });

    await createAuditLog({
      action: `ลบข้อมูลคณะ`,
      target: `คณะ: ${faculty.nameTh}`,
      type: 'danger',
      userId: typeof user.id === 'number' ? user.id : undefined
    });

    return { success: true, message: "ลบคณะเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Failed to delete faculty:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบคณะ" };
  }
}
