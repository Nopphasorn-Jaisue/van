"use server";

import { prisma } from "@/lib/prisma";
import { AvailabilityStatus, ApprovalStatus } from "@prisma/client";
import { createAuditLog } from "./audit";
import { getAuthUser } from "./auth";

// สำหรับคนขับ: ส่งคำขอระบุความพร้อม (ลางาน/พร้อมทำงาน/ปฏิบัติงานแทน)
export async function requestAvailabilityChange(
  driverId: number,
  date: Date,
  status: AvailabilityStatus,
  reason?: string
) {
  try {
    const existing = await prisma.driverAvailability.findFirst({
      where: { driverId, date }
    });

    let result;
    // ถ้าสถานะเป็น READY ให้ถือว่าผ่านเลย ไม่ต้องรออนุมัติ
    const initialApprovalStatus = status === 'READY' ? 'APPROVED' : 'PENDING';

    if (existing) {
      result = await prisma.driverAvailability.update({
        where: { id: existing.id },
        data: { status, reason, approval: initialApprovalStatus }
      });
    } else {
      result = await prisma.driverAvailability.create({
        data: { driverId, date, status, reason, approval: initialApprovalStatus }
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to request availability change:", error);
    return { success: false, error: "Failed to save request" };
  }
}

// สำหรับคนขับ/ระบบ: ดึงปฏิทินความพร้อม
export async function getDriverCalendar(driverId: number, start: Date, end: Date) {
  try {
    return await prisma.driverAvailability.findMany({
      where: {
        driverId,
        date: { gte: start, lte: end }
      }
    });
  } catch (error) {
    return [];
  }
}

// สำหรับแอดมินคณะ: ดึงคำขอที่รอการอนุมัติ (หรือทั้งหมด)
export async function getPendingAvailabilityRequests() {
  try {
    const user = await getAuthUser();
    let facultyId: number | undefined;
    let facultyName: string | undefined;
    if (user && (user.role === 'FACULTY_ADMIN' || user.role === 'EXECUTIVE')) {
      facultyId = user.facultyId;
      facultyName = user.faculty?.nameTh;
    }

    const whereDriver: Record<string, unknown> = {};
    if (facultyId || facultyName) {
      whereDriver.OR = [
        ...(facultyId ? [{ facultyId }, { user: { facultyId } }] : []),
        ...(facultyName ? [{ faculty: { nameTh: facultyName } }, { user: { faculty: { nameTh: facultyName } } }] : [])
      ];
    }

    return await prisma.driverAvailability.findMany({
      where: {
        approval: 'PENDING',
        ...(facultyId || facultyName ? { driver: whereDriver } : {})
      },
      include: {
        driver: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Failed to get pending requests:", error);
    return [];
  }
}

// สำหรับแอดมินคณะ: อนุมัติ/ปฏิเสธคำขอ
export async function updateAvailabilityApproval(id: number, approval: ApprovalStatus, adminUserId: number) {
  try {
    const updated = await prisma.driverAvailability.update({
      where: { id },
      data: { approval },
      include: { driver: { include: { user: true } } }
    });

    // แจ้งเตือน Audit Log
    const driverName = updated.driver.user.name;
    const actionText = approval === 'APPROVED' ? 'อนุมัติคำขอลางาน/เปลี่ยนสถานะ' : 'ปฏิเสธคำขอลางาน/เปลี่ยนสถานะ';
    
    await createAuditLog({
      action: actionText,
      target: `คนขับ: ${driverName} สำหรับวันที่ ${updated.date.toLocaleDateString('th-TH')}`,
      userId: adminUserId,
      type: approval === 'APPROVED' ? 'success' : 'danger'
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update approval:", error);
    return { success: false, error: "Failed to update" };
  }
}
