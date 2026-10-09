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
        assignedVan: true,
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

    // Helper to get Year & Month in Asia/Bangkok (+07:00)
    const getBangkokYearMonth = (date: Date) => {
      const bangkokTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return {
        year: bangkokTime.getUTCFullYear(),
        month: bangkokTime.getUTCMonth()
      };
    };

    const currentBangkokYM = getBangkokYearMonth(new Date());

    const bookings = await prisma.booking.findMany({
      where: {
        assignedDriverId: driverId,
        OR: [
          { status: "APPROVED" },
          { driverLog: { isNot: null } }
        ]
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

    // คำนวณจำนวนทริปที่ "กดจบงานแล้ว" (มี driverLog) เฉพาะในเดือนปัจจุบัน
    const thisMonthCompletedBookings = bookings.filter((b) => {
      if (!b.driverLog) return false;
      const tripDate = b.departureDate ? new Date(b.departureDate) : new Date(b.driverLog.createdAt);
      const bBangkokYM = getBangkokYearMonth(tripDate);
      return bBangkokYM.year === currentBangkokYM.year && bBangkokYM.month === currentBangkokYM.month;
    });
    
    const totalTrips = thisMonthCompletedBookings.length;
    const totalAllCompletedTrips = bookings.filter((b) => Boolean(b.driverLog)).length;

    // คำนวณระยะทางขับขี่รวมทั้งหมดจากทริปที่มีบันทึกการเดินทาง (driverLog)
    const totalDistance = bookings.reduce((sum: number, b) => 
      sum + (b.driverLog?.totalDistance || 0), 0
    );

    return { 
      success: true, 
      data: {
        driver: {
          name: driver.user?.name || "พนักงานขับรถ",
          faculty: driver.faculty?.nameTh || "มหาวิทยาลัยพะเยา",
          vanPlate: driver.assignedVan?.plate || driver.faculty?.vans?.[0]?.plate || "ยังไม่ระบุรถตู้"
        },
        todaysTrip: JSON.parse(JSON.stringify(todaysTrip || null)),
        upcomingTrips: JSON.parse(JSON.stringify(upcomingTrips)),
        stats: {
          totalTrips,
          totalAllCompletedTrips,
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
      bookings: JSON.parse(JSON.stringify(bookings)), 
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
    
    return { success: true, booking: JSON.parse(JSON.stringify(booking)) };
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
    
    return { success: true, booking: JSON.parse(JSON.stringify(booking)) };
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
    // Ensure booking exists in database if it's a calendar event ID
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!existingBooking) {
      const driverObj = await prisma.driver.findUnique({
        where: { id: driverId }
      });

      if (driverObj) {
        await prisma.booking.create({
          data: {
            id: bookingId,
            requesterId: driverObj.userId,
            targetFacultyId: driverObj.facultyId,
            destination: "ภารกิจตามตารางปฏิทิน",
            objective: "บันทึกการเดินทางตามปฏิทินระบบ",
            departureDate: new Date(),
            returnDate: new Date(),
            passengersCount: 1,
            budgetSource: "-",
            status: "APPROVED",
            assignedDriverId: driverId
          }
        });
      }
    }

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
    revalidatePath('/driver/dashboard');
    revalidatePath('/driver/usage-report');
    
    return { success: true, log: JSON.parse(JSON.stringify(newLog)) };
  } catch (error) {
    console.error("Error submitting log:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit log" };
  }
}

export async function updateDriverLog(bookingId: string, driverId: number, data: DriverLogData) {
  try {
    const existingLog = await prisma.driverLog.findUnique({
      where: { bookingId }
    });

    if (!existingLog) {
      return { success: false, error: "ไม่พบบันทึกการเดินทางสำหรับคำขอนี้" };
    }

    const { mileageStart, mileageEnd, totalDistance, fuelRemark, imgStartUrl, imgEndUrl, legs } = data;

    await prisma.tripLeg.deleteMany({
      where: { driverLogId: existingLog.id }
    });

    const updatedLog = await prisma.driverLog.update({
      where: { id: existingLog.id },
      data: {
        driverId,
        mileageStart: Number(mileageStart),
        mileageEnd: Number(mileageEnd),
        totalDistance: Number(totalDistance),
        fuelRemark: fuelRemark !== undefined ? fuelRemark : existingLog.fuelRemark,
        imgStartUrl: imgStartUrl !== undefined ? imgStartUrl : existingLog.imgStartUrl,
        imgEndUrl: imgEndUrl !== undefined ? imgEndUrl : existingLog.imgEndUrl,
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

    // Update booking destination and dates if booking exists
    if (legs[0]?.destination) {
      try {
        const updateData: { destination?: string; departureDate?: Date; returnDate?: Date } = {
          destination: legs[0].destination
        };
        if (legs[0].deptDate && legs[0].deptTime) {
          const dDate = new Date(`${legs[0].deptDate}T${legs[0].deptTime}:00`);
          if (!isNaN(dDate.getTime())) updateData.departureDate = dDate;
        }
        if (legs[0].returnDate && legs[0].returnTime) {
          const rDate = new Date(`${legs[0].returnDate}T${legs[0].returnTime}:00`);
          if (!isNaN(rDate.getTime())) updateData.returnDate = rDate;
        }
        await prisma.booking.update({
          where: { id: bookingId },
          data: updateData
        });
      } catch (err) {
        console.error("Non-critical: could not update booking table:", err);
      }
    }

    revalidatePath('/driver/records');
    revalidatePath('/driver/schedule');
    revalidatePath('/driver/dashboard');
    revalidatePath('/driver/usage-report');

    return { success: true, log: JSON.parse(JSON.stringify(updatedLog)) };
  } catch (error) {
    console.error("Error updating log:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update log" };
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

    return { success: true, expenses: JSON.parse(JSON.stringify(expenses)) };
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

    revalidatePath('/driver/usage-report');
    
    return { success: true };
  } catch (error) {
    console.error("Error submitting expenses:", error);
    return { success: false, error: "Failed to submit expenses" };
  }
}

import { getAuthUser } from "@/app/actions/auth";

export async function getAllFacultyBookingsWithLogs() {
  try {
    const userRoleInfo = await getAuthUser();
    if (!userRoleInfo || !['SUPER_ADMIN', 'FACULTY_ADMIN', 'DRIVER'].includes(userRoleInfo.role)) {
      return { success: false, error: "Unauthorized" };
    }

    let roleFilter: Record<string, unknown> = {};
    if (userRoleInfo.role === 'DRIVER') {
      roleFilter = {
        assignedDriver: { userId: userRoleInfo.id }
      };
    } else if (userRoleInfo.role === 'FACULTY_ADMIN' && userRoleInfo.facultyId) {
      roleFilter = { targetFacultyId: userRoleInfo.facultyId };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        status: "APPROVED",
        driverLog: {
          isNot: null
        },
        ...roleFilter
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
    return { success: true, bookings: JSON.parse(JSON.stringify(bookings)) };
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return { success: false, error: "Failed to fetch bookings" };
  }
}

export async function submitInspectionRecord(driverId: number, vanId: number, detail: string, needsRepair: boolean, inspectionDate: Date) {
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

    let validVanId = vanId;
    const vanExists = await prisma.van.findUnique({ where: { id: vanId } });
    if (!vanExists) {
      const firstVan = await prisma.van.findFirst({ where: { facultyId: driver.facultyId } });
      if (!firstVan) return { success: false, error: "ไม่พบข้อมูลรถตู้ในระบบ" };
      validVanId = firstVan.id;
    }

    const recordDetail = needsRepair ? `แจ้งซ่อม/ผิดปกติ: ${detail}` : `ตรวจสภาพปกติ: ${detail || '-'}`;

    await prisma.maintenanceRecord.create({
      data: {
        vanId: validVanId,
        type: "MAINTENANCE",
        detail: recordDetail,
        amount: 0,
        date: inspectionDate,
      }
    });

    // Notify faculty admins ONLY if needsRepair is true
    if (needsRepair) {
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
    }

    revalidatePath("/driver/records");
    return { success: true };
  } catch (error) {
    console.error("Error submitting inspection record:", error);
    return { success: false, error: "Failed to submit inspection record" };
  }
}

function normalizeThaiPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("+66")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("66") && cleaned.length >= 11) {
    cleaned = "0" + cleaned.slice(2);
  }
  cleaned = cleaned.replace(/\D/g, "");
  return cleaned.slice(0, 10);
}

export async function lookupUniversityUser(email: string) {
  try {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { found: false };

    // 1. Try to fetch live from Microsoft Graph if Azure credentials configured
    let msGraphPhoto: string | null = null;
    let msGraphName: string | null = null;
    let msGraphPhone: string | null = null;

    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (tenantId && clientId && clientSecret) {
      try {
        const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
            scope: "https://graph.microsoft.com/.default"
          })
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;
          if (accessToken) {
            // Attempt to get user photo from MS Graph
            const photoRes = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(trimmed)}/photo/$value`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (photoRes.ok) {
              const buf = await photoRes.arrayBuffer();
              const base64 = Buffer.from(buf).toString("base64");
              const ct = photoRes.headers.get("content-type") || "image/jpeg";
              msGraphPhoto = `data:${ct};base64,${base64}`;
            }

            // Attempt to get user details from MS Graph (including all phone fields)
            const userRes = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(trimmed)}?$select=displayName,givenName,surname,mail,userPrincipalName,mobilePhone,businessPhones,telephoneNumber`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (userRes.ok) {
              const uData = await userRes.json();
              msGraphName = uData.displayName || uData.givenName || null;
              msGraphPhone = uData.mobilePhone || (uData.businessPhones && uData.businessPhones[0]) || uData.telephoneNumber || null;
            }
          }
        }
      } catch (graphErr) {
        console.warn("MS Graph direct lookup note:", graphErr);
      }
    }

    // 2. Query Prisma database
    const user = await prisma.user.findUnique({
      where: { email: trimmed },
      include: {
        driverProfile: true,
        faculty: true
      }
    });

    // Also look up driver directly in case relation is not yet linked or driver was created separately
    const driver = user?.id ? await prisma.driver.findFirst({
      where: { userId: user.id },
      include: { assignedVan: true }
    }) : await prisma.driver.findFirst({
      where: { user: { email: trimmed } },
      include: { assignedVan: true }
    });

    // Check recent bookings if phone is missing
    let bookingPhone: string | null = null;
    if (user?.id && !user.phone && !driver?.phone) {
      const recentBooking = await prisma.booking.findFirst({
        where: { requesterId: user.id, phone: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { phone: true }
      });
      if (recentBooking?.phone) bookingPhone = recentBooking.phone;
    }

    const rawPhone = msGraphPhone || user?.phone || user?.driverProfile?.phone || driver?.phone || bookingPhone || "";
    const cleanPhone = normalizeThaiPhone(rawPhone);

    // Sync phone back to User if missing
    if (user?.id && cleanPhone && !user.phone) {
      prisma.user.update({
        where: { id: user.id },
        data: { phone: cleanPhone }
      }).catch(console.error);
    }

    const chosenAvatar = msGraphPhoto || 
      (user?.avatar && user.avatar.startsWith('data:image') ? user.avatar : "") ||
      user?.driverProfile?.avatar || 
      driver?.avatar ||
      user?.avatar || 
      "";

    if (user || msGraphName || msGraphPhoto || cleanPhone) {
      return {
        found: true,
        user: {
          id: user?.id,
          name: msGraphName || user?.name || trimmed.split('@')[0],
          email: trimmed,
          phone: cleanPhone,
          avatar: chosenAvatar,
          facultyId: user?.facultyId || driver?.facultyId,
          facultyName: user?.faculty?.nameTh || "",
          assignedVanId: driver?.assignedVanId ? String(driver.assignedVanId) : "",
          vanPlate: driver?.assignedVan?.plate || ""
        }
      };
    }
    return { found: false };
  } catch (err) {
    console.error("Lookup university user error:", err);
    return { found: false, error: (err as Error).message };
  }
}

