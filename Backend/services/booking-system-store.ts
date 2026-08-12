import {
  CreateBookingPayload,
  DriverAvailability,
  SystemBookingStatus,
} from "@/lib/booking-system-types";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

const seedDrivers: SeedDriver[] = [
  { name: "นายสมชาย ใจดี", phone: "081-234-5678", facultyName: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", vanPlate: "นข 6789 พะเยา", age: 45 },
  { name: "นายอนุชา คำมี", phone: "086-345-6789", facultyName: "คณะ ICT", vanPlate: "นข 1122 พะเยา", age: 41 },
  { name: "นายวิชัย แสนดี", phone: "089-456-7890", facultyName: "คณะพลังงาน", vanPlate: "นข 2233 พะเยา", age: 47 },
  { name: "นายประเสริฐ จันทรดี", phone: "090-567-8901", facultyName: "คณะวิทยาศาสตร์", vanPlate: "นข 3344 พะเยา", age: 39 },
  { name: "นายชูชาติ สุขใจ", phone: "093-678-9012", facultyName: "คณะเภสัชฯ", vanPlate: "นข 4455 พะเยา", age: 42 },
  { name: "นายธนวัฒน์ วันดี", phone: "094-789-0123", facultyName: "คณะนิติศาสตร์", vanPlate: "นข 5566 พะเยา", age: 37 },
];

const seedBookings: SeedBooking[] = [
  {
    id: "UPV-2569-0065",
    requester: "ดร.สมเกียรติ เรียนดี",
    requesterFaculty: "คณะวิทยาศาสตร์",
    destination: "มหาวิทยาลัยเชียงใหม่",
    purpose: "นำนิสิตศึกษาดูงาน",
    passengers: 9,
    startAt: "2026-07-20T06:00:00+07:00",
    endAt: "2026-07-20T18:00:00+07:00",
    status: "WAITING_ADMIN",
  },
  {
    id: "UPV-2569-0066",
    requester: "นายภานุวัฒน์ ศรีดี",
    requesterFaculty: "คณะเภสัชฯ",
    destination: "อำเภอเมืองเชียงราย",
    purpose: "ลงพื้นที่วิจัย",
    passengers: 15,
    startAt: "2026-07-21T08:30:00+07:00",
    endAt: "2026-07-21T18:30:00+07:00",
    status: "WAITING_EXEC",
    assignedDriverName: "นายอนุชา คำมี",
  },
  {
    id: "UPV-2569-0067",
    requester: "อ.นันทนา จันทร์ใส",
    requesterFaculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    destination: "จังหวัดลำปาง",
    purpose: "ประชุมโครงการ",
    passengers: 8,
    startAt: "2026-07-18T13:00:00+07:00",
    endAt: "2026-07-18T17:00:00+07:00",
    status: "APPROVED",
    assignedDriverName: "นายสมชาย ใจดี",
  },
];

let seeded = false;

function normalizeRole(rawRole: unknown): string {
  const role = String(rawRole || "USER").toUpperCase();
  if (["USER", "FACULTY_ADMIN", "EXECUTIVE", "SUPER_ADMIN", "DRIVER"].includes(role)) {
    return role;
  }
  return "USER";
}

function mapStatus(status: string): SystemBookingStatus {
  return status as unknown as SystemBookingStatus;
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

async function ensureSeedData() {
  if (seeded) {
    return;
  }

  const hasRows = await prisma.faculty.count();
  if (hasRows > 0) {
    seeded = true;
    return;
  }

  const facultyNames = Array.from(new Set(seedDrivers.map((driver) => driver.facultyName).concat(seedBookings.map((booking) => booking.requesterFaculty))));

  for (const facultyName of facultyNames) {
    await prisma.faculty.create({
      data: {
        nameTh: facultyName,
        nameEn: facultyName,
      },
    });
  }

  for (const driver of seedDrivers) {
    const faculty = await prisma.faculty.findFirstOrThrow({ where: { nameTh: driver.facultyName } });

    const user = await prisma.user.create({
      data: {
        facultyId: faculty.id,
        name: driver.name,
        email: `${driver.name.replace(/\s+/g, ".").toLowerCase().replace(/[^a-z0-9.]/g, "") || "driver"}.${faculty.id}@example.local`,
        role: "DRIVER",
      },
    });

    await prisma.van.create({
      data: {
        facultyId: faculty.id,
        plate: driver.vanPlate,
        engine: "ดีเซล",
        capacity: 12,
        isActive: true,
      },
    });

    await prisma.driver.create({
      data: {
        userId: user.id,
        facultyId: faculty.id,
        phone: driver.phone,
        age: driver.age,
        type: "PRIMARY",
        isActive: true,
      },
    });
  }

  for (const booking of seedBookings) {
    const faculty = await prisma.faculty.findFirstOrThrow({ where: { nameTh: booking.requesterFaculty } });

    let requester = await prisma.user.findFirst({ where: { name: booking.requester } });
    if (!requester) {
      requester = await prisma.user.create({
        data: {
          facultyId: faculty.id,
          name: booking.requester,
          email: `${booking.id.toLowerCase()}@example.local`,
          role: "USER",
        },
      });
    }

    let assignedDriverId: number | null = null;
    if (booking.assignedDriverName) {
      const driver = await prisma.driver.findFirst({ where: { user: { name: booking.assignedDriverName } } });
      assignedDriverId = driver?.id ?? null;
    }

    await prisma.booking.create({
      data: {
        id: booking.id,
        requesterId: requester.id,
        targetFacultyId: faculty.id,
        destination: booking.destination,
        objective: booking.purpose,
        departureDate: new Date(booking.startAt),
        returnDate: new Date(booking.endAt),
        passengersCount: booking.passengers,
        budgetSource: "งบประมาณคณะ",
        tripType: "ในจังหวัดพะเยา",
        status: booking.status,
        assignedDriverId,
      },
    });
  }

  seeded = true;
}

function toThaiDate(value: Date) {
  return value.toISOString();
}

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    requester: { include: { faculty: true } };
    assignedDriver: { include: { user: true; faculty: { include: { vans: true } } } };
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
  await ensureSeedData();

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (facultyId) {
    where.requester = { facultyId };
  }

  const rows = await prisma.booking.findMany({
    where,
    include: {
      requester: { include: { faculty: true } },
      assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(rows.map((row) => toBookingDto(row)));
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

  const faculty =
    (await prisma.faculty.findFirst({ where: { nameTh: payload.requesterFaculty } })) ||
    (await prisma.faculty.findFirstOrThrow({ orderBy: { id: "asc" } }));

  let requester = await prisma.user.findFirst({ where: { name: payload.requester } });
  if (!requester) {
    requester = await prisma.user.create({
      data: {
        facultyId: faculty.id,
        name: payload.requester,
        email: `${Date.now()}-${payload.requester.replace(/\s+/g, ".").toLowerCase().replace(/[^a-z0-9.]/g, "") || "user"}@example.local`,
        role: "USER",
      },
    });
  }

  const latest = await prisma.booking.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
  const lastNumber = latest ? Number((latest.id.match(/(\d+)$/) || ["0"])[0]) : 64;
  const bookingId = `UPV-2569-${(lastNumber + 1).toString().padStart(4, "0")}`;

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
      budgetSource: payload.budgetSource || "งบส่วนกลางของคณะ",
      tripType: payload.tripType || "ในจังหวัดพะเยา",
      status: "WAITING_ADMIN",
    },
    include: {
      requester: { include: { faculty: true } },
      assignedDriver: { include: { user: true, faculty: { include: { vans: true } } } },
    },
  });

  return toBookingDto(row);
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

export async function listDrivers(date?: string, facultyId?: number) {
  await ensureSeedData();

  const where: any = {};
  if (facultyId) {
    where.facultyId = facultyId;
  }

  const [drivers, bookings] = await Promise.all([
    prisma.driver.findMany({
      where,
      include: {
        user: true,
        faculty: { include: { vans: true } },
        assignedVan: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.booking.findMany({
      select: {
        id: true,
        assignedDriverId: true,
        status: true,
        destination: true,
        departureDate: true,
        returnDate: true,
      },
    }),
  ]);

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

  const dbStatus = status === "COMPLETED" ? "APPROVED" : status;

  const row = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: dbStatus as never,
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
    logs: logs.map((log: any) => ({
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
