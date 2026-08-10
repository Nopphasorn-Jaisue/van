"use server";

import { prisma } from "@/lib/prisma";

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
    adminPhone: "-", // User table doesn't have phone, would need to join driver or separate profile, mock for now
    vansCount: f.vans.length,
    driversCount: f.drivers.length,
  }));
}

export async function getVans() {
  const vans = await prisma.van.findMany({
    include: {
      faculty: true,
      assignedDrivers: {
        include: {
          user: true
        }
      }
    }
  });

  return vans.map(v => {
    // mock status calculation based on isActive
    let status = "READY";
    if (!v.isActive) status = "MAINTENANCE";

    return {
      id: v.id,
      plate: v.plate,
      brand: v.name || "Toyota Commuter",
      capacity: v.capacity,
      faculty: v.faculty?.nameTh || "ส่วนกลาง",
      status: status,
      driver: v.assignedDrivers.length > 0 ? v.assignedDrivers[0].user.name : "ไม่มีคนขับประจำ",
      driverAvatar: v.assignedDrivers.length > 0 && v.assignedDrivers[0].avatar 
        ? v.assignedDrivers[0].avatar 
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
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
      faculty: true,
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

    return {
      id: d.id,
      avatar: d.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      name: d.user?.name || "ไม่ระบุชื่อ",
      employeeId: `DRV-${d.id.toString().padStart(3, '0')}`,
      faculty: d.faculty?.nameTh || "ส่วนกลาง",
      type: d.type === "PRIMARY" ? "MAIN" : "SUB",
      assignedVan: d.assignedVan?.plate || "ไม่มีรถประจำ",
      vanModel: d.assignedVan?.name || "Toyota Commuter",
      phone: d.phone || "-",
      email: d.user?.email || "-",

      status: status,

      recentTrips: d.bookings.map(b => ({
        title: `เดินทางไป ${b.targetFaculty.nameTh}`,
        van: d.assignedVan ? `รถตู้ ${d.assignedVan.plate}` : "ไม่ระบุรถตู้",
        date: b.departureDate.toISOString()
      })),
      
      availabilities: d.availabilities.map(a => ({
        date: a.date.toISOString(),
        status: a.status
      }))
    };
  });
}

export async function getDashboardStats() {
  const totalVans = await prisma.van.count({ where: { isActive: true } });
  
  // Total unique faculties with active vans
  const facultiesWithVans = await prisma.van.groupBy({
    by: ['facultyId'],
    where: { isActive: true },
  });
  const totalFaculties = facultiesWithVans.length;

  // Active Missions Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activeMissions = await prisma.booking.count({
    where: {
      status: 'APPROVED',
      departureDate: { lte: tomorrow }, // departure is before the end of today
      returnDate: { gte: today }, // return is after the start of today
    }
  });

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
