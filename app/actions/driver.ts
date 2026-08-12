"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface TripLegInput {
  deptDate: string;
  deptTime: string;
  passenger: string;
  destination: string;
  startMileage: string;
  returnDate: string;
  returnTime: string;
  endMileage: string;
  remark?: string;
}

interface DriverLogData {
  mileageStart: number | string;
  mileageEnd: number | string;
  totalDistance: number | string;
  fuelRemark?: string;
  imgStartUrl?: string;
  imgEndUrl?: string;
  legs: TripLegInput[];
}

interface ExpenseData {
  category: string;
  amount: number | string;
  remark?: string;
}

export async function getDriverDashboardData(driverId: number) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: true,
        faculty: {
          include: {
            vans: true
          }
        }
      }
    });

    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const bookings = await prisma.booking.findMany({
      where: {
        assignedDriverId: driverId,
        status: "APPROVED"
      },
      include: {
        requester: true,
        targetFaculty: true,
        driverLog: true
      },
      orderBy: {
        departureDate: 'asc'
      }
    });

    // Find today's trip
    const todaysTrip = bookings.find((b) => 
      new Date(b.departureDate) >= today && new Date(b.departureDate) < tomorrow
    );

    // Find upcoming trips
    const upcomingTrips = bookings.filter((b) => 
      new Date(b.departureDate) >= tomorrow
    );

    // Calculate stats for current month
    const thisMonthBookings = bookings.filter((b) => 
      new Date(b.departureDate) >= firstDayOfMonth && b.driverLog
    );
    
    const totalTrips = thisMonthBookings.length;
    const totalDistance = thisMonthBookings.reduce((sum: number, b) => 
      sum + (b.driverLog?.totalDistance || 0), 0
    );

    return { 
      success: true, 
      data: {
        driver: {
          name: driver.user.name,
          faculty: driver.faculty.nameTh,
          vanPlate: driver.faculty.vans?.[0]?.plate || "ยังไม่ระบุรถตู้"
        },
        todaysTrip: todaysTrip || null,
        upcomingTrips: upcomingTrips,
        stats: {
          totalTrips,
          totalDistance
        }
      } 
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

export async function getAssignedBookings(driverId: number) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { faculty: true }
    });

    const bookings = await prisma.booking.findMany({
      where: {
        assignedDriverId: driverId,
        status: "APPROVED"
      },
      include: {
        requester: {
          include: { faculty: true }
        },
        targetFaculty: true,
        driverLog: {
          include: { tripLegs: true }
        }
      },
      orderBy: {
        departureDate: 'asc'
      }
    });

    const latestDriverLog = await prisma.driverLog.findFirst({
      where: { driverId: driverId },
      orderBy: { createdAt: 'desc' },
      select: { mileageEnd: true }
    });

    return { 
      success: true, 
      bookings, 
      driverFacultyName: driver?.faculty?.nameTh || "มหาวิทยาลัยพะเยา",
      latestMileage: latestDriverLog?.mileageEnd || null
    };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return { success: false, error: "Failed to fetch bookings" };
  }
}

export interface AdhocFormData {
  destination: string;
  date: string;
  startTime: string;
  endTime: string;
  pickup: string;
}

export async function createAdhocBooking(driverId: number, data?: AdhocFormData) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true }
    });

    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    const newBookingId = `UP-ADHOC-${Date.now()}`;
    
    let departureDate = new Date();
    let returnDate = new Date();
    
    if (data?.date) {
      const startStr = data.startTime || '00:00';
      const endStr = data.endTime || '23:59';
      departureDate = new Date(`${data.date}T${startStr}:00`);
      returnDate = new Date(`${data.date}T${endStr}:00`);
      
      if (isNaN(departureDate.getTime())) departureDate = new Date();
      if (isNaN(returnDate.getTime())) returnDate = new Date();
    }

    const booking = await prisma.booking.create({
      data: {
        id: newBookingId,
        requesterId: driver.userId,
        targetFacultyId: driver.facultyId,
        destination: data?.destination || "การใช้รถนอกแผน",
        objective: data?.pickup ? `จุดรับ: ${data.pickup}` : "ใช้งานนอกแผน / ภารกิจเร่งด่วน",
        departureDate,
        returnDate,
        passengersCount: 0,
        budgetSource: "-",
        status: "APPROVED",
        assignedDriverId: driverId
      }
    });

    revalidatePath('/driver/records');
    
    return { success: true, booking };
  } catch (error) {
    console.error("Error creating ad-hoc booking:", error);
    return { success: false, error: "Failed to create ad-hoc booking" };
  }
}

export async function updateAdhocBooking(bookingId: string, data: AdhocFormData) {
  try {
    let departureDate = new Date();
    let returnDate = new Date();
    
    if (data?.date) {
      const startStr = data.startTime || '00:00';
      const endStr = data.endTime || '23:59';
      departureDate = new Date(`${data.date}T${startStr}:00`);
      returnDate = new Date(`${data.date}T${endStr}:00`);
      
      if (isNaN(departureDate.getTime())) departureDate = new Date();
      if (isNaN(returnDate.getTime())) returnDate = new Date();
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        destination: data.destination || "การใช้รถนอกแผน",
        objective: data.pickup ? `จุดรับ: ${data.pickup}` : "ใช้งานนอกแผน / ภารกิจเร่งด่วน",
        departureDate,
        returnDate,
      }
    });

    revalidatePath('/driver/schedule');
    revalidatePath('/driver/records');
    
    return { success: true, booking };
  } catch (error) {
    console.error("Error updating ad-hoc booking:", error);
    return { success: false, error: "Failed to update ad-hoc booking" };
  }
}

export async function deleteAdhocBooking(bookingId: string) {
  try {
    await prisma.booking.delete({
      where: { id: bookingId }
    });
    revalidatePath('/driver/schedule');
    revalidatePath('/driver/records');
    return { success: true };
  } catch (error) {
    console.error("Error deleting ad-hoc booking:", error);
    return { success: false, error: "Failed to delete ad-hoc booking" };
  }
}

export async function submitDriverLog(bookingId: string, driverId: number, data: DriverLogData) {
  try {
    const existingLog = await prisma.driverLog.findUnique({
      where: { bookingId }
    });

    if (existingLog) {
      return { success: false, error: "Log already exists for this booking." };
    }

    const { mileageStart, mileageEnd, totalDistance, fuelRemark, imgStartUrl, imgEndUrl, legs } = data;

    const newLog = await prisma.driverLog.create({
      data: {
        bookingId,
        driverId,
        mileageStart: Number(mileageStart),
        mileageEnd: Number(mileageEnd),
        totalDistance: Number(totalDistance),
        fuelRemark,
        imgStartUrl,
        imgEndUrl,
        tripLegs: {
          create: legs.map((leg: TripLegInput) => ({
            deptDate: leg.deptDate,
            deptTime: leg.deptTime,
            passenger: leg.passenger,
            destination: leg.destination,
            startMileage: leg.startMileage,
            returnDate: leg.returnDate,
            returnTime: leg.returnTime,
            endMileage: leg.endMileage,
            remark: leg.remark
          }))
        }
      }
    });

    revalidatePath('/driver/records');
    revalidatePath('/driver/schedule');
    
    return { success: true, log: newLog };
  } catch (error) {
    console.error("Error submitting log:", error);
    return { success: false, error: "Failed to submit log" };
  }
}

export async function getDriverExpensesHistory(driverId: number) {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        driverLog: {
          driverId: driverId
        }
      },
      include: {
        driverLog: {
          include: {
            booking: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, expenses };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, error: "Failed to fetch expenses" };
  }
}

export async function submitTripExpenses(driverLogId: number, expenses: ExpenseData[]) {
  try {
    await prisma.expense.createMany({
      data: expenses.map((exp: ExpenseData) => ({
        driverLogId,
        category: exp.category,
        amount: Number(exp.amount),
        remark: exp.remark,
        status: "PENDING"
      }))
    });

    revalidatePath('/driver/report');
    
    return { success: true };
  } catch (error) {
    console.error("Error submitting expenses:", error);
    return { success: false, error: "Failed to submit expenses" };
  }
}

export async function getAllFacultyBookingsWithLogs() {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: "APPROVED",
        driverLog: {
          isNot: null
        }
      },
      include: {
        requester: {
          include: { faculty: true }
        },
        targetFaculty: true,
        assignedDriver: {
          include: { user: true }
        },
        driverLog: {
          include: { tripLegs: true }
        }
      },
      orderBy: {
        departureDate: 'desc'
      }
    });
    return { success: true, bookings };
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return { success: false, error: "Failed to fetch bookings" };
  }
}

export async function submitRepairNotification(driverId: number, vanId: number, detail: string) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { 
        faculty: { 
          include: { 
            users: { where: { role: 'FACULTY_ADMIN' } } 
          } 
        } 
      }
    });

    if (!driver) return { success: false, error: "Driver not found" };

    const record = await prisma.maintenanceRecord.create({
      data: {
        vanId,
        type: "MAINTENANCE",
        detail,
        amount: 0,
        date: new Date(),
      }
    });

    // Notify faculty admins
    const facultyAdmins = driver.faculty?.users || [];
    if (facultyAdmins.length > 0) {
      await prisma.notification.createMany({
        data: facultyAdmins.map(admin => ({
          userId: admin.id,
          type: 'alert',
          message: `แจ้งซ่อมรถตู้จากพนักงานขับรถ: ${detail}`
        }))
      });
    }

    revalidatePath("/driver/inspection");
    return { success: true, record };
  } catch (error) {
    console.error("Error submitting repair notification:", error);
    return { success: false, error: "Failed to submit repair notification" };
  }
}
