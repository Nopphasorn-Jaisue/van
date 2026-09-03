"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getAuthUser } from "@/app/actions/auth";

export interface AppNotification {
  id: string;
  numericId?: number;
  message: string;
  title?: string;
  type: 'booking' | 'borrow' | 'approved' | 'rejected' | 'driver' | 'maintenance' | 'system' | 'info';
  isRead: boolean;
  createdAt: string;
  link: string;
  badgeText?: string;
}

export async function getNotifications(role?: Role, userId?: number): Promise<AppNotification[]> {
  try {
    const user = await getAuthUser();
    const currentRole = role || user?.role || "USER";
    const currentUserId = userId || (typeof user?.id === 'number' ? user.id : undefined);
    const facultyId = user?.facultyId || 1;

    const results: AppNotification[] = [];

    // 1. Fetch real DB bookings for notifications based on role
    if (currentRole === 'FACULTY_ADMIN' || currentRole === 'SUPER_ADMIN') {
      const recentBookings = await prisma.booking.findMany({
        where: currentRole === 'FACULTY_ADMIN' 
          ? { OR: [{ targetFacultyId: facultyId }, { requesterId: currentUserId }] }
          : {},
        include: {
          requester: { include: { faculty: true } },
          targetFaculty: true
        },
        orderBy: { departureDate: 'desc' },
        take: 8
      });

      recentBookings.forEach(b => {
        const isIncomingBorrow = b.targetFacultyId === facultyId && b.requester?.facultyId !== facultyId;
        const isPending = b.status === 'WAITING_ADMIN' || b.status === 'WAITING_EXEC';
        const isApproved = b.status === 'APPROVED';
        const isRejected = b.status === 'REJECTED';

        let title = `คำขอใช้รถ ${b.id}`;
        let msg = `${b.requester?.name || 'ผู้ขอใช้บริการ'} (${b.requester?.faculty?.nameTh || 'คณะ'}) ขอใช้รถไป ${b.destination}`;
        let type: AppNotification['type'] = 'booking';
        let badge = 'คำขอใหม่';

        if (isIncomingBorrow && isPending) {
          title = `คำขอยืมรถข้ามคณะ ${b.id}`;
          msg = `${b.requester?.faculty?.nameTh || 'คณะอื่น'} ส่งคำขอยืมรถตู้คณะเรา ไป ${b.destination}`;
          type = 'borrow';
          badge = 'ขอยืมรถเรา';
        } else if (isApproved) {
          title = `คำขอ ${b.id} อนุมัติแล้ว`;
          msg = `คำขอเดินทางไป ${b.destination} ได้รับการอนุมัติเรียบร้อยแล้ว`;
          type = 'approved';
          badge = 'อนุมัติแล้ว';
        } else if (isRejected) {
          title = `คำขอ ${b.id} ถูกปฏิเสธ`;
          msg = `คำขอเดินทางไป ${b.destination} ไม่ได้รับอนุมัติ ${b.rejectReason ? `(${b.rejectReason})` : ''}`;
          type = 'rejected';
          badge = 'ปฏิเสธ';
        }

        results.push({
          id: `notif-bk-${b.id}`,
          title,
          message: msg,
          type,
          isRead: false,
          createdAt: b.departureDate.toISOString(),
          link: currentRole === 'FACULTY_ADMIN' ? `/faculty-admin/approvals?id=${b.id}` : `/super-admin/dashboard`,
          badgeText: badge
        });
      });
    } else if (currentRole === 'DRIVER') {
      const driverRecords = await prisma.booking.findMany({
        where: {
          assignedDriver: { userId: currentUserId },
          status: 'APPROVED'
        },
        include: { requester: true },
        orderBy: { departureDate: 'desc' },
        take: 6
      });

      driverRecords.forEach(b => {
        results.push({
          id: `notif-drv-${b.id}`,
          title: `ภารกิจเดินทาง ${b.id}`,
          message: `คุณได้รับมอบหมายเดินทางไป ${b.destination} (ผู้ขอ: ${b.requester?.name || 'ผู้ขอใช้รถ'})`,
          type: 'driver',
          isRead: false,
          createdAt: b.departureDate.toISOString(),
          link: `/driver/schedule`,
          badgeText: 'ภารกิจคนขับ'
        });
      });
    } else {
      // General USER
      const userBookings = await prisma.booking.findMany({
        where: currentUserId ? { requesterId: currentUserId } : {},
        orderBy: { departureDate: 'desc' },
        take: 6
      });

      userBookings.forEach(b => {
        let badge = 'รอพิจารณา';
        let type: AppNotification['type'] = 'booking';
        let msg = `คำขอเดินทางไป ${b.destination} อยู่ระหว่างรอแอดมินพิจารณา`;

        if (b.status === 'APPROVED') {
          badge = 'อนุมัติแล้ว';
          type = 'approved';
          msg = `คำขอ [${b.id}] เดินทางไป ${b.destination} ได้รับการอนุมัติแล้ว`;
        } else if (b.status === 'REJECTED') {
          badge = 'ปฏิเสธ';
          type = 'rejected';
          msg = `คำขอ [${b.id}] เดินทางไป ${b.destination} ไม่ได้รับอนุมัติ`;
        }

        results.push({
          id: `notif-user-${b.id}`,
          title: `สถานะคำขอ ${b.id}`,
          message: msg,
          type,
          isRead: false,
          createdAt: b.departureDate.toISOString(),
          link: `/bookings/tracking?id=${b.id}`,
          badgeText: badge
        });
      });
    }

    // 2. Fetch custom DB notifications if any
    try {
      const dbNotifs = await prisma.notification.findMany({
        where: {
          OR: [
            ...(currentRole ? [{ role: currentRole }] : []),
            ...(currentUserId ? [{ userId: currentUserId }] : [])
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      dbNotifs.forEach(n => {
        results.unshift({
          id: `notif-db-${n.id}`,
          numericId: n.id,
          title: 'แจ้งเตือนระบบ',
          message: n.message,
          type: (n.type as AppNotification['type']) || 'info',
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          link: currentRole === 'SUPER_ADMIN' ? '/super-admin/dashboard' : currentRole === 'FACULTY_ADMIN' ? '/faculty-admin/dashboard' : '/user/calendar',
          badgeText: 'ระบบ'
        });
      });
    } catch {}

    return results;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(id: number | string) {
  try {
    const numId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10);
    if (!isNaN(numId)) {
      await prisma.notification.updateMany({
        where: { id: numId },
        data: { isRead: true }
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}
