"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/app/actions/auth";

export async function getExecutiveReportData(monthName: string, yearStr: string) {
  console.log(">>> getExecutiveReportData called for", monthName, yearStr);
  try {
    const userRoleInfo = await getAuthUser();
    console.log(">>> userRoleInfo", userRoleInfo?.role);
    if (!userRoleInfo || !['EXECUTIVE', 'SUPER_ADMIN', 'FACULTY_ADMIN'].includes(userRoleInfo.role)) {
      console.log(">>> Unauthorized access attempt");
      return { success: false, error: "Unauthorized" };
    }

    // SUPER_ADMIN might not have a faculty, let them see all or default
    const facultyId = userRoleInfo.facultyId;
    let facultyFilter = {};
    if (facultyId) {
      facultyFilter = { targetFacultyId: facultyId };
    }

    // Convert Thai month name to index (0-11)
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const monthIndex = thaiMonths.indexOf(monthName);
    
    // Convert Buddhist year to Gregorian
    const year = parseInt(yearStr) - 543;

    if (monthIndex === -1 || isNaN(year)) {
      return { success: false, error: "Invalid date" };
    }

    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    // Fetch all approved bookings with logs for this faculty in this month
    const bookings = await prisma.booking.findMany({
      where: {
        ...facultyFilter,
        status: "APPROVED",
        departureDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        },
        driverLog: {
          isNot: null
        }
      },
      include: {
        requester: true,
        assignedDriver: {
          include: { user: true }
        },
        driverLog: true
      },
      orderBy: {
        departureDate: 'desc'
      }
    });

    let totalDistance = 0;
    let totalPassengers = 0;
    const uniqueRequesters = new Set<string | number>();
    
    const distanceBreakdown = {
      short: 0, // < 50
      medium: 0, // 50 - 200
      long: 0 // > 200
    };

    type TripStats = { id: string; destination: string; distance: number; date: string };
    let longestTrip: TripStats | null = null;
    let shortestTrip: TripStats | null = null;

    const requesterStats: Record<string, number> = {};
    const destinationStats: Record<string, number> = {};

    const tableRows = bookings.map(b => {
      const dist = b.driverLog?.totalDistance || 0;
      totalDistance += dist;
      totalPassengers += b.passengersCount || 0;
      
      if (b.requester) {
        uniqueRequesters.add(b.requester.id);
        const reqName = b.requester.name || 'ไม่ระบุ';
        requesterStats[reqName] = (requesterStats[reqName] || 0) + 1;
      }
      
      const dest = b.destination || 'ไม่ระบุ';
      destinationStats[dest] = (destinationStats[dest] || 0) + 1;

      // Distance breakdown
      if (dist < 50) distanceBreakdown.short++;
      else if (dist <= 200) distanceBreakdown.medium++;
      else distanceBreakdown.long++;

      // Longest / Shortest
      if (!longestTrip || dist > longestTrip.distance) {
        longestTrip = { id: b.id, destination: b.destination, distance: dist, date: b.departureDate.toISOString() };
      }
      if (dist > 0 && (!shortestTrip || dist < shortestTrip.distance)) {
        shortestTrip = { id: b.id, destination: b.destination, distance: dist, date: b.departureDate.toISOString() };
      }

      return {
        id: b.id,
        date: b.departureDate.toISOString(),
        requesterName: b.requester?.name || 'ไม่ระบุ',
        destination: b.destination,
        objective: b.objective,
        driverName: b.assignedDriver?.user?.name || 'ไม่ระบุ',
        distance: dist
      };
    });

    const totalTrips = bookings.length;
    const avgDistance = totalTrips > 0 ? (totalDistance / totalTrips).toFixed(1) : "0.0";

    // Top Traveler
    let topTraveler = { name: '-', count: 0 };
    for (const [name, count] of Object.entries(requesterStats)) {
      if (count > topTraveler.count) {
        topTraveler = { name, count };
      }
    }

    // Top Destination
    let topDestination = { name: '-', count: 0 };
    for (const [name, count] of Object.entries(destinationStats)) {
      if (count > topDestination.count) {
        topDestination = { name, count };
      }
    }

    const resultPayload = {
      success: true,
      data: {
        kpis: {
          totalTrips,
          totalDistance,
          avgDistance,
          uniqueRequesters: uniqueRequesters.size,
          totalPassengers
        },
        longestTrip,
        shortestTrip,
        distanceBreakdown,
        topTraveler,
        topDestination,
        tableRows
      },
      facultyName: userRoleInfo.faculty?.nameTh || "ศูนย์จัดการระบบส่วนกลาง"
    };

    return JSON.parse(JSON.stringify(resultPayload));

  } catch (error) {
    console.error("Error fetching executive report:", error);
    return { success: false, error: "Failed to fetch report data" };
  }
}
