import {
  CreateBookingPayload,
  DriverAvailability,
  SystemBookingStatus,
} from "@/lib/booking-system-types";
import { prisma } from "@/lib/prisma";
import { BookingStatus, DriverType, Prisma } from "@prisma/client";

type CalendarRow = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: string;
  assignedDriverName: string;
  assignedVanPlate: string;
};

type SeedDriver = {
  name: string;
  phone: string;
  facultyName: string;
  vanPlate: string;
  age: number;
};

type SeedBooking = {
  id: string;
  requester: string;
  requesterFaculty: string;
  destination: string;
  purpose: string;
  passengers: number;
  startAt: string;
  endAt: string;
  status: "WAITING_ADMIN" | "WAITING_EXEC" | "APPROVED" | "REJECTED";
  assignedDriverName?: string;
};

const seedDrivers: SeedDriver[] = [];

const seedBookings: SeedBooking[] = [];

const globalForSeed = globalThis as unknown as { seeded?: boolean };
let seeded = true;

function normalizeRole(rawRole: unknown): string {
  const role = String(rawRole || "USER").toUpperCase();
  if (["USER", "FACULTY_ADMIN", "EXECUTIVE", "SUPER_ADMIN", "DRIVER"].includes(role)) {
    return role;
  }
  return "USER";
}

function mapStatus(status: string): SystemBookingStatus {
  return status as SystemBookingStatus;
}

function makeDriverCode(id: number) {
  return `drv-${id.toString().padStart(3, "0")}`;
}

function parseDriverCode(code: string) {
  const matched = code.match(/(\d+)/);
  if (!matched) {
    throw new Error("DRIVER_NOT_FOUND");
  }
  return Number(matched[1]);
}

async function ensureSeedData() { /* real DB only */ }

function toThaiDate(value: Date) {
  return value.toISOString();
}

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    requester: { include: { faculty: true } };
    assignedDriver: { include: { user: true; faculty: { include: { vans: true } } } };
  };
}>;

type DriverWithRelations = Prisma.DriverGetPayload<{
  include: {
    user: true;
    faculty: { include: { vans: true } };
    assignedVan: true;
  };
}>;

async function toBookingDto(row: BookingWithRelations) {
  return {
    id: row.id,
    requester: row.requester.name,
    requesterFaculty: row.requester.faculty.nameTh,
    requesterFacultyId: row.requester.facultyId,
    destination: row.destination,
    purpose: row.objective,
    passengers: row.passengersCount,
    startAt: toThaiDate(row.departureDate),
    endAt: toThaiDate(row.returnDate),
    submittedAt: toThaiDate(row.createdAt),
    budgetSource: row.budgetSource,
    tripType: row.tripType as ("ในจังหวัดพะเยา" | "ต่างจังหวัด") | undefined,
    status: mapStatus(row.status),
    rejectReason: row.rejectReason || undefined,
    assignedDriverId: row.assignedDriver ? makeDriverCode(row.assignedDriver.id) : undefined,
    assignedDriverName: row.assignedDriver?.user.name,
    assignedVanId: row.assignedDriver?.faculty.vans?.[0]?.id ? `van-${row.assignedDriver.faculty.vans[0].id.toString().padStart(3, "0")}` : undefined,
    assignedVanPlate: row.assignedDriver?.faculty.vans?.[0]?.plate,
  };
}

export async function listBookings(status?: SystemBookingStatus, facultyId?: number) {
  const where: Prisma.BookingWhereInput = {};
  if (status) {
    where.status = status === "COMPLETED" ? BookingStatus.APPROVED : (status as BookingStatus);
  }
  if (facultyId) {
    where.OR = [
      { requester: { facultyId } },
      { targetFacultyId: facultyId }
    ];
  }

  const rows = await prisma.booking.findMany({
    where,
    include: {
      requester: { include: { faculty: true } },
      assignedDriver: { include: { user: true, faculty: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(rows.map((row) => toBookingDto(row as any)));
}

export async function getBookingById(id: string) {
  await ensureSeedData();

  const row = await prisma.booking.findUnique({
    where: { id },
    include: {
      requester: { include: { faculty: true } },
      assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
    },
  });

  if (!row) {
    return null;
  }

  return toBookingDto(row);
}

export async function createBooking(payload: CreateBookingPayload) {
  await ensureSeedData();

  const targetFacultyNames = payload.targetFaculties && payload.targetFaculties.length > 0 
    ? payload.targetFaculties 
    : [payload.requesterFaculty];

  let facultyRecords = await prisma.faculty.findMany({
    where: { nameTh: { in: targetFacultyNames } }
  });

  if (facultyRecords.length === 0) {
    const fallback = await prisma.faculty.findFirstOrThrow({ orderBy: { id: "asc" } });
    facultyRecords = [fallback];
  }

  const requesterFaculty = await prisma.faculty.findFirst({ where: { nameTh: payload.requesterFaculty } })
    || facultyRecords[0];

  let requester = payload.requesterId 
    ? await prisma.user.findUnique({ where: { id: payload.requesterId } })
    : await prisma.user.findFirst({ where: { name: payload.requester } });
  
  if (!requester) {
    requester = await prisma.user.create({
      data: {
        facultyId: requesterFaculty.id,
        name: payload.requester,
        email: `${Date.now()}-${payload.requester.replace(/\s+/g, ".").toLowerCase().replace(/[^a-z0-9.]/g, "") || "user"}@example.local`,
        role: "USER",
      },
    });
  }

  const latest = await prisma.booking.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
  const lastNumber = latest ? Number((latest.id.match(/(\d+)/)?.[1] || "0")) : 64;
  const baseBookingId = `UPV-2569-${(lastNumber + 1).toString().padStart(4, "0")}`;

  const createdRows = [];

  for (let i = 0; i < facultyRecords.length; i++) {
    const faculty = facultyRecords[i];
    const bookingId = facultyRecords.length > 1 ? `${baseBookingId}-${i + 1}` : baseBookingId;
    
    const row = await prisma.booking.create({
      data: {
        id: bookingId,
        requesterId: requester.id,
        targetFacultyId: faculty.id,
        destination: payload.destination,
        objective: payload.purpose,
        departureDate: new Date(payload.startAt),
        returnDate: new Date(payload.endAt),
        passengersCount: payload.passengers,
        phone: payload.phone || null,
        passengerNames: payload.passengerNames || null,
        budgetSource: payload.budgetSource || "งบส่วนกลางของคณะ",
        tripType: payload.tripType || "ในจังหวัดพะเยา",
        status: (payload.status as BookingStatus) || "WAITING_ADMIN",
      },
      include: {
        requester: { include: { faculty: true } },
        assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
      },
    });
    createdRows.push(row);
  }

  const dtos = await Promise.all(createdRows.map(row => toBookingDto(row as unknown as BookingWithRelations)));
  return facultyRecords.length > 1 ? dtos : dtos[0];
}

function detectAvailability(driverId: number, bookings: Array<{ assignedDriverId: number | null; status: string; departureDate: Date; returnDate: Date }>): DriverAvailability {
  const now = new Date();
  const active = bookings.some((booking) => {
    if (booking.assignedDriverId !== driverId) {
      return false;
    }
    if (booking.status !== "APPROVED") {
      return false;
    }
    return now >= booking.departureDate && now <= booking.returnDate;
  });

  return active ? "ON_TRIP" : "AVAILABLE";
}

export async function listDrivers(date?: string, facultyId?: number, facultyName?: string) {
  const whereDriver: Prisma.DriverWhereInput = {};
  const whereUser: Prisma.UserWhereInput = { role: "DRIVER" };

  if (facultyId || facultyName) {
    const driverOr: Prisma.DriverWhereInput[] = [];
    const userOr: Prisma.UserWhereInput[] = [];

    if (facultyId) {
      driverOr.push({ facultyId }, { user: { facultyId } });
      userOr.push({ facultyId });
    }
    if (facultyName) {
      driverOr.push({ faculty: { nameTh: facultyName } }, { user: { faculty: { nameTh: facultyName } } });
      userOr.push({ faculty: { nameTh: facultyName } });
    }

    whereDriver.OR = driverOr;
    whereUser.OR = userOr;
  }

  const [dbDrivers, dbDriverUsers, bookings] = await Promise.all([
    prisma.driver.findMany({
      where: whereDriver,
      include: {
        user: true,
        faculty: { include: { vans: true } },
        assignedVan: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.user.findMany({
      where: whereUser,
      include: {
        faculty: { include: { vans: true } },
        driverProfile: { include: { assignedVan: true } }
      },
      orderBy: { id: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        status: "APPROVED",
        departureDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: {
        id: true,
        assignedDriverId: true,
        status: true,
        destination: true,
        departureDate: true,
        returnDate: true,
      },
      take: 100
    }),
  ]);

  const drivers: DriverWithRelations[] = [...dbDrivers];
  const existingUserIds = new Set(drivers.map(d => d.userId));

  for (const u of dbDriverUsers) {
    if (!existingUserIds.has(u.id)) {
      drivers.push({
        id: u.driverProfile?.id || u.id,
        userId: u.id,
        user: u,
        facultyId: u.facultyId,
        faculty: u.faculty,
        phone: u.driverProfile?.phone || "-",
        age: u.driverProfile?.age || 35,
        type: u.driverProfile?.type || DriverType.PRIMARY,
        isActive: u.driverProfile?.isActive !== undefined ? u.driverProfile.isActive : true,
        avatar: u.driverProfile?.avatar || u.avatar || null,
        contractStart: u.driverProfile?.contractStart || new Date(),
        assignedVanId: u.driverProfile?.assignedVanId || null,
        assignedVan: u.driverProfile?.assignedVan || null,
      });
      existingUserIds.add(u.id);
    }
  }

  const normalizedDate = date ? new Date(date).toISOString().slice(0, 10) : null;

  return drivers.map((driver) => {
    const availability = detectAvailability(driver.id, bookings);
    const driverBookings = bookings.filter((booking) => {
      if (booking.assignedDriverId !== driver.id) {
        return false;
      }
      if (!normalizedDate) {
        return true;
      }
      return booking.departureDate.toISOString().slice(0, 10) === normalizedDate;
    });

    const experienceYears = Math.max(1, driver.age - 30);
    const score = 4 + Math.min(0.9, experienceYears / 20);

    return {
      id: makeDriverCode(driver.id),
      name: driver.user.name,
      email: driver.user.email,
      phone: driver.phone,
      avatar: driver.avatar || `https://i.pravatar.cc/150?u=${driver.id}`,
      faculty: driver.faculty.nameTh,
      facultyId: driver.facultyId,
      assignedVanId: driver.assignedVanId,
      vanId: driver.assignedVan?.id ? `van-${driver.assignedVan.id.toString().padStart(3, "0")}` : (driver.faculty.vans?.[0] ? `van-${driver.faculty.vans[0].id.toString().padStart(3, "0")}` : ""),
      vanPlate: driver.assignedVan?.plate || driver.faculty.vans?.[0]?.plate || "ยังไม่ผูกทะเบียน",
      contractStart: driver.contractStart ? driver.contractStart.toISOString().split('T')[0] : "2024-01-01",
      experienceYears,
      score: Number(score.toFixed(1)),
      availability,
      unavailableReason: availability === "ON_TRIP" ? "กำลังขับ" : undefined,
      assignedCount: driverBookings.length,
      currentTrip: driverBookings[0]
        ? {
            bookingId: driverBookings[0].id,
            timeRange: `${driverBookings[0].departureDate.toLocaleString("th-TH")} - ${driverBookings[0].returnDate.toLocaleString("th-TH")}`,
            destination: driverBookings[0].destination,
          }
        : null,
      isActive: driver.isActive,
    };
  });
}

export async function assignDriver(bookingId: string, driverCode: string) {
  await ensureSeedData();

  const driverId = parseDriverCode(driverCode);

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: true },
  });

  if (!driver) {
    throw new Error("DRIVER_NOT_FOUND");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (driver.facultyId !== booking.targetFacultyId) {
    throw new Error("DRIVER_FACULTY_MISMATCH");
  }

  const row = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      assignedDriverId: driver.id,
      status: "APPROVED",
    },
    include: {
      requester: { include: { faculty: true } },
      assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
    },
  });

  return toBookingDto(row);
}

export async function updateBookingStatus(bookingId: string, status: SystemBookingStatus, reason?: string) {
  await ensureSeedData();

  const dbStatus: BookingStatus = status === "COMPLETED" ? BookingStatus.APPROVED : (status as BookingStatus);

  const row = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: dbStatus,
      rejectReason: status === "REJECTED" ? reason || "ไม่ผ่านการอนุมัติ" : null,
    },
    include: {
      requester: { include: { faculty: true } },
      assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
    },
  });

  return toBookingDto(row);
}

export async function listCalendarEvents(year?: number, month?: number): Promise<CalendarRow[]> {
  await ensureSeedData();

  const rows = await prisma.booking.findMany({
    where: {
      status: {
        in: ["APPROVED", "WAITING_EXEC"],
      },
    },
    include: {
      requester: { include: { faculty: true } },
      assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
    },
    orderBy: { departureDate: "asc" },
  });

  return rows
    .filter((row) => {
      if (!year || !month) {
        return true;
      }
      const date = row.departureDate;
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    })
    .map((row) => ({
      id: row.id,
      title: `${row.requester.faculty.nameTh} - ${row.destination}`,
      startAt: row.departureDate.toISOString(),
      endAt: row.returnDate.toISOString(),
      status: row.status,
      assignedDriverName: row.assignedDriver?.user.name || "รอจัดสรร",
      assignedVanPlate: row.assignedDriver?.faculty.vans?.[0]?.plate || "รอจัดสรร",
    }));
}

export async function getDriverDashboard(driverCode: string) {
  await ensureSeedData();

  const driverId = parseDriverCode(driverCode);
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      user: true,
      faculty: { include: { vans: true } },
    },
  });

  if (!driver) {
    throw new Error("DRIVER_NOT_FOUND");
  }

  const [assignedBookings, logs] = await Promise.all([
    prisma.booking.findMany({
      where: {
        assignedDriverId: driver.id,
        status: { in: ["APPROVED", "WAITING_EXEC"] },
      },
      orderBy: { departureDate: "asc" },
      include: {
        requester: { include: { faculty: true } },
        assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
      },
    }),
    prisma.driverLog.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          include: {
            requester: true
          }
        }
      }
    }),
  ]);

  const now = new Date();
  const mapped = await Promise.all(assignedBookings.map((booking) => toBookingDto(booking)));
  const todayTrip = mapped.find((trip) => {
    const start = new Date(trip.startAt);
    const end = new Date(trip.endAt);
    return now >= start && now <= end;
  }) || mapped[0] || null;

  const upcoming = mapped.filter((trip) => new Date(trip.startAt) > now).slice(0, 5);

  return {
    driver: {
      id: makeDriverCode(driver.id),
      name: driver.user.name,
      phone: driver.phone,
      faculty: driver.faculty.nameTh,
      vanId: driver.faculty.vans?.[0] ? `van-${driver.faculty.vans[0].id.toString().padStart(3, "0")}` : "",
      vanPlate: driver.faculty.vans?.[0]?.plate || "ยังไม่ผูกทะเบียน",
      experienceYears: Math.max(1, driver.age - 30),
      score: 4.5,
      availability: "AVAILABLE",
    },
    todayTrip,
    upcoming,
    logs: logs.map((log) => ({
      id: `log-${log.id}`,
      bookingId: log.bookingId,
      driverId: makeDriverCode(log.driverId),
      mileageStart: log.mileageStart,
      mileageEnd: log.mileageEnd,
      totalDistance: log.totalDistance,
      fuelRemark: log.fuelRemark || undefined,
      createdAt: log.createdAt.toISOString(),
      // Add legs structure for frontend
      tripNo: log.id.toString(),
      date: new Date(log.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      legs: log.booking ? [{
        deptTime: new Date(log.booking.departureDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        passenger: log.booking.requester?.name || "ผู้ขอใช้รถ",
        destination: log.booking.destination,
        startMileage: log.mileageStart,
        returnDate: new Date(log.booking.returnDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        returnTime: new Date(log.booking.returnDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        endMileage: log.mileageEnd,
        distance: log.totalDistance,
        driver: "มีลายเซ็น",
        remark: log.fuelRemark || ""
      }] : []
    })),
  };
}

export async function createDriverLog(driverCode: string, bookingId: string, mileageStart: number, mileageEnd: number, fuelRemark?: string) {
  await ensureSeedData();

  const driverId = parseDriverCode(driverCode);
  const totalDistance = Math.max(0, mileageEnd - mileageStart);

  const log = await prisma.driverLog.create({
    data: {
      bookingId,
      driverId,
      mileageStart,
      mileageEnd,
      totalDistance,
      fuelRemark,
    },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "APPROVED" },
  });

  return {
    id: `log-${log.id}`,
    bookingId: log.bookingId,
    driverId: makeDriverCode(log.driverId),
    mileageStart: log.mileageStart,
    mileageEnd: log.mileageEnd,
    totalDistance: log.totalDistance,
    fuelRemark: log.fuelRemark || undefined,
    createdAt: log.createdAt.toISOString(),
  };
}

export function getRoleFromClaims(claims: unknown): string {
  if (!claims || typeof claims !== "object") {
    return "USER";
  }

  const claimsObj = claims as Record<string, unknown>;
  const appMeta = claimsObj.app_metadata && typeof claimsObj.app_metadata === "object"
    ? claimsObj.app_metadata as Record<string, unknown>
    : {};
  const userMeta = claimsObj.user_metadata && typeof claimsObj.user_metadata === "object"
    ? claimsObj.user_metadata as Record<string, unknown>
    : {};

  return normalizeRole(appMeta.role || userMeta.role || claimsObj.role);
}
