"use server";

import { prisma } from "@/lib/prisma";

export async function createAuditLog({
  action,
  userId,
  target,
  type
}: {
  action: string;
  userId?: number;
  target?: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        action,
        userId,
        target,
        type,
      },
    });

    // If it's a danger or warning, also create a notification for SUPER_ADMIN
    if (type === 'danger' || type === 'warning') {
      await prisma.notification.create({
        data: {
          role: 'SUPER_ADMIN',
          type: type === 'danger' ? 'alert' : 'urgent',
          message: `แจ้งเตือนระบบ: ${action} - ${target || ''}`,
        }
      });
    }

    return { success: true, data: log };
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return { success: false, error: "Failed to create audit log" };
  }
}

export async function getAuditLogs(search: string = "") {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: search, mode: 'insensitive' } },
          { target: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } }
        ]
      },
      include: {
        user: {
          select: { name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for now
    });
    
    return logs;
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}
