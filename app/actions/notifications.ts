"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function getNotifications(role: Role, userId?: number) {
  if (!role) return [];
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { role: role },
          { userId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return notifications;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}
