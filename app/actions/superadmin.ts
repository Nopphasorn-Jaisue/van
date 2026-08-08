"use server";

import { prisma } from "@/lib/prisma";

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
    // mock status calculation based on taxExp or isActive
    let status = "READY";
    if (!v.isActive) status = "MAINTENANCE";
    else if (v.taxExp && v.taxExp < new Date()) status = "TAX_EXPIRED";

    return {
      id: v.id,
      plate: v.plate,
      brand: v.name || "Toyota Commuter",
      capacity: v.capacity,
      faculty: v.faculty?.nameTh || "ส่วนกลาง",
      status: status,
      driver: v.assignedDrivers.length > 0 ? v.assignedDrivers[0].user.name : "ไม่มีคนขับประจำ",
      mileage: v.nextCheckMileage ? v.nextCheckMileage - 1000 : 50000,
      nextMaintenance: v.nextCheckMileage ? `${v.nextCheckMileage} กม.` : "ไม่ระบุ"
    };
  });
}

export async function getDrivers() {
  const drivers = await prisma.driver.findMany({
    include: {
      user: true,
      faculty: true,
      assignedVan: true
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
      licenseNo: "-",
      licenseType: "ท.2",
      issueDate: "-",
      expiryDate: "-",
      expiryDays: 999, // mock for now
      status: status
    };
  });
}
