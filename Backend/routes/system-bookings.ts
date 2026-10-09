import { addStoredCalendarEvent, updateStoredCalendarEvent, deleteStoredCalendarEvent } from "@/Backend/services/calendar-store";
import type { Prisma } from '@prisma/client';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SystemBookingStatus } from "@/lib/booking-system-types";
import { getAuthUser } from "@/lib/auth-util";
import { invalidateDbBookingsCache, pushBookingToGoogleCalendar } from "@/Backend/routes/system-calendar";
import { BookingStatus } from "@prisma/client";

type BookingsCacheStore = { [key: string]: { data: unknown[]; timestamp: number } };

function getBookingsCache(): BookingsCacheStore {
  const g = globalThis as unknown as { __bookingsCache?: BookingsCacheStore };
  if (!g.__bookingsCache) {
    g.__bookingsCache = {};
  }
  return g.__bookingsCache;
}

export function invalidateBookingsCache() {
  const g = globalThis as unknown as { __bookingsCache?: BookingsCacheStore };
  g.__bookingsCache = {};
}

export async function handleListBookings(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") as SystemBookingStatus | null;
  const status = statusParam || undefined;
  
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized: กรุณาเข้าสู่ระบบก่อนดูรายการจอง" }, { status: 401 });
  }

  let facultyId: number | undefined;
  if ((user.role === 'FACULTY_ADMIN' || user.role === 'EXECUTIVE') && user.facultyId) {
    facultyId = user.facultyId;
  } else if (user.role === 'USER' || user.role === 'DRIVER') {
    facultyId = user.facultyId || undefined;
  }

  const cacheKey = `${status || 'all'}_${facultyId || 'all'}_${user.id}_${user.role}`;
  const bookingsCache = getBookingsCache();
  const existing = bookingsCache[cacheKey];

  if (existing && (Date.now() - existing.timestamp < 60 * 1000)) {
    return NextResponse.json({ bookings: existing.data }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
    });
  }

  try {
        interface RawDbBookingRow {
      id: string;
      destination: string;
      purpose: string;
      passengers: number;
      startAt: Date;
      endAt: Date;
      submittedAt: Date;
      budgetSource: string;
      tripType: string;
      status: string;
      rejectReason: string | null;
      phone: string | null;
      requesterId: number;
      targetFacultyId: number;
      requester: string | null;
      requesterEmail: string | null;
      requesterFaculty: string | null;
      requesterFacultyId: number | null;
      targetFaculty: string | null;
      assignedDriverName: string | null;
      vanPlate: string | null;
      vanName: string | null;
    }
    const rawRows = await prisma.$queryRaw<RawDbBookingRow[]>`
      SELECT 
        b.id,
        b.destination,
        b.objective AS purpose,
        b.passengers_count AS "passengers",
        b.departure_date AS "startAt",
        b.return_date AS "endAt",
        b.created_at AS "submittedAt",
        b.budget_source AS "budgetSource",
        b.trip_type AS "tripType",
        b.status,
        b.reject_reason AS "rejectReason",
        b.phone,
        b.requester_id AS "requesterId",
        b.target_faculty_id AS "targetFacultyId",
        u.name AS "requester",
        u.email AS "requesterEmail",
        f.name_th AS "requesterFaculty",
        f.id AS "requesterFacultyId",
        tf.name_th AS "targetFaculty",
        du.name AS "assignedDriverName",
        v.plate AS "vanPlate",
        v.name AS "vanName"
      FROM bookings b
      LEFT JOIN users u ON u.id = b.requester_id
      LEFT JOIN faculties f ON f.id = u.faculty_id
      LEFT JOIN faculties tf ON tf.id = b.target_faculty_id
      LEFT JOIN drivers d ON d.id = b.assigned_driver_id
      LEFT JOIN users du ON du.id = d.user_id
      LEFT JOIN vans v ON v.id = d.assigned_van_id
      ORDER BY b.created_at DESC;
    `;

    let filtered = rawRows;
    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }
    if (user.role === 'SUPER_ADMIN') {
      // Super admin can inspect all bookings across all faculties
    } else if (user.role === 'FACULTY_ADMIN' || user.role === 'EXECUTIVE') {
      if (facultyId) {
        filtered = filtered.filter(b => b.requesterFacultyId === facultyId || b.targetFacultyId === facultyId);
      }
    } else if (user.role === 'DRIVER') {
      filtered = filtered.filter(b => b.assignedDriverName === user.name || (facultyId && b.targetFacultyId === facultyId));
    } else {
      // General USER only sees bookings they requested or within their faculty
      filtered = filtered.filter(b => b.requesterId === user.id || (facultyId && b.requesterFacultyId === facultyId));
    }

        const mapped = filtered.map((b) => ({
      id: b.id,
      requester: b.requester || "ผู้ขอใช้บริการ",
      requesterEmail: b.requesterEmail || "-",
      phone: b.phone || "-",
      requesterFaculty: b.requesterFaculty || (b.requesterFacultyId === 6 ? "คณะเภสัชฯ" : "คณะเทคโนโลยีสารสนเทศและการสื่อสาร"),
      requesterFacultyId: Number(b.requesterFacultyId || 1),
      targetFaculty: b.targetFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
      targetFacultyId: Number(b.targetFacultyId || 1),
      destination: b.destination || "ไม่ระบุสถานที่",
      purpose: b.purpose || "ภารกิจใช้รถ",
      passengers: Number(b.passengers || 1),
      passengersCount: Number(b.passengers || 1),
      startAt: b.startAt ? new Date(b.startAt).toISOString() : new Date().toISOString(),
      endAt: b.endAt ? new Date(b.endAt).toISOString() : new Date().toISOString(),
      submittedAt: b.submittedAt ? new Date(b.submittedAt).toISOString() : new Date().toISOString(),
      budgetSource: b.budgetSource || "งบประมาณคณะ",
      tripType: (b.tripType as "ในจังหวัดพะเยา" | "ต่างจังหวัด") || "ในจังหวัดพะเยา",
      status: b.status as SystemBookingStatus,
      rejectReason: b.rejectReason || null,
      assignedDriverName: b.assignedDriverName || (b.targetFacultyId === 1 ? "นาย" : "พนักงานขับรถประจำคณะ"),
      assignedVanPlate: b.vanPlate || (b.targetFacultyId === 1 ? "1นช3009 กรุงเทพมหานคร" : "รถตู้ประจำคณะ"),
    }));

    bookingsCache[cacheKey] = { data: mapped, timestamp: Date.now() };
    return NextResponse.json({ bookings: mapped }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
    });
  } catch (error) {
    console.error("Error fetching live bookings with single SQL:", error);
    if (existing) {
      return NextResponse.json({ bookings: existing.data });
    }
    return NextResponse.json({ bookings: [], error: (error as Error)?.message || String(error) }, { status: 500 });
  }
}

export async function handleCreateSystemBooking(request: Request) {
  try {
    const body = await request.json();
    const user = await getAuthUser();
    let validUser = null;
    if (user?.id) {
      validUser = await prisma.user.findUnique({ where: { id: Number(user.id) } });
    }
    if (!validUser && user?.email) {
      validUser = await prisma.user.findUnique({ where: { email: user.email } });
    }
    if (!validUser) {
      validUser = await prisma.user.findFirst({ orderBy: { id: "asc" } });
    }
    const requesterId = validUser?.id || 16;

    const startAtDate = body.startAt ? new Date(body.startAt) : new Date();
    const endAtDate = body.endAt ? new Date(body.endAt) : new Date();
    
    const userFacultyName = body.requesterFaculty || user?.faculty?.nameTh || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร";
    const userFaculty = (await prisma.faculty.findFirst({
      where: { nameTh: userFacultyName }
    })) || (await prisma.faculty.findFirstOrThrow({ orderBy: { id: "asc" } }));

    const targetFacultyNames: string[] = Array.isArray(body.targetFaculties) && body.targetFaculties.length > 0
      ? body.targetFaculties
      : [];

    const requestedVehicleCount = Math.max(1, Number(body.vehiclesCount || body.vanCount || (targetFacultyNames.length > 0 ? targetFacultyNames.length + 1 : 1)));
    const baseObjective = body.purpose || body.objective || "ปฏิบัติภารกิจ";

    const facultiesToBook: { faculty: typeof userFaculty; isBorrow: boolean; vanId?: string }[] = [];

    // Check if explicitly assignedVans is provided (from user/faculty calendar modal)
    if (Array.isArray(body.assignedVans) && body.assignedVans.length > 0) {
      for (const av of body.assignedVans) {
        let fac = userFaculty;
        if (av.facultyName) {
          const found = await prisma.faculty.findFirst({
            where: { nameTh: { contains: av.facultyName.replace('คณะ', '') } }
          });
          if (found) fac = found;
        }
        facultiesToBook.push({
          faculty: fac,
          isBorrow: av.isBorrow === true || (av.facultyName && av.facultyName !== userFacultyName),
          vanId: av.vanId
        });
      }
    } else if (Array.isArray(body.selectedVanIds) && body.selectedVanIds.length > 0) {
      for (const vId of body.selectedVanIds) {
        let fac = userFaculty;
        let isBorrow = false;
        const numericId = parseInt(String(vId).replace(/^[^\d]*/, ''), 10);
        if (!isNaN(numericId)) {
          const dbVan = await prisma.van.findUnique({
            where: { id: numericId },
            include: { faculty: true }
          });
          if (dbVan && dbVan.faculty) {
            fac = dbVan.faculty;
            isBorrow = dbVan.faculty.nameTh !== userFacultyName;
          }
        }
        facultiesToBook.push({
          faculty: fac,
          isBorrow: isBorrow,
          vanId: vId
        });
      }
    } else if (targetFacultyNames.length > 0) {
      if (body.vanId !== "borrow" || requestedVehicleCount > targetFacultyNames.length) {
        facultiesToBook.push({ faculty: userFaculty, isBorrow: false });
      }
      for (const tName of targetFacultyNames) {
        const found = await prisma.faculty.findFirst({
          where: { nameTh: { contains: tName.replace('คณะ', '') } }
        });
        if (found) {
          facultiesToBook.push({ faculty: found, isBorrow: true });
        }
      }
    } else if (body.targetFacultyId) {
      const found = await prisma.faculty.findUnique({ where: { id: Number(body.targetFacultyId) } });
      if (found) {
        facultiesToBook.push({ faculty: found, isBorrow: found.id !== userFaculty.id });
      } else {
        facultiesToBook.push({ faculty: userFaculty, isBorrow: false });
      }
    } else {
      facultiesToBook.push({ faculty: userFaculty, isBorrow: false });
    }

    const transactionResults = await prisma.$transaction(async (tx) => {
      const existingBookings = await tx.booking.findMany({
        select: { id: true }
      });
      let maxNumber = 0;
      for (const b of existingBookings) {
        const match = b.id.match(/(\d+)$/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNumber && n < 1000000) {
            maxNumber = n;
          }
        }
      }
      let lastNumber = maxNumber > 0 ? maxNumber : 9053;

      const itemsCreated = [];

      for (let i = 0; i < facultiesToBook.length; i++) {
        const item = facultiesToBook[i];
        lastNumber += 1;
        let bookingId = `UPV-2569-${lastNumber.toString().padStart(4, "0")}`;
        while (await tx.booking.findUnique({ where: { id: bookingId } })) {
          lastNumber += 1;
          bookingId = `UPV-2569-${lastNumber.toString().padStart(4, "0")}`;
        }

        const vanSuffix = facultiesToBook.length > 1
          ? ` (คันที่ ${i + 1}/${facultiesToBook.length} - ${item.isBorrow ? `ยืมรถ${item.faculty.nameTh}` : 'รถประจำคณะ'})`
          : '';

        const destinationsList = Array.isArray(body.destinations) && body.destinations.length > 0
          ? body.destinations
          : [{ place: body.destination || "ไม่ระบุจุดหมาย", province: body.province || "พะเยา" }];
        
        const destinationText = destinationsList.map((d: { place: string; province?: string }) => d.place + (d.province ? ` (${d.province})` : '')).join(' -> ');
        const rawPurpose = body.purposeRaw || body.purpose || body.objective || baseObjective;

        const isFacultyAdminBooking = user?.role === 'FACULTY_ADMIN';
        const initialBookingStatus = (isFacultyAdminBooking && !item.isBorrow)
          ? BookingStatus.WAITING_EXEC
          : BookingStatus.WAITING_ADMIN;

        let autoDriverId: number | null = null;
        if (isFacultyAdminBooking && !item.isBorrow) {
          const facDriver = await tx.driver.findFirst({
            where: { facultyId: item.faculty.id }
          });
          if (facDriver) autoDriverId = facDriver.id;
        }

        const created = await tx.booking.create({
          data: {
            id: bookingId,
            requesterId: typeof requesterId === 'number' ? requesterId : 1,
            destination: destinationText,
            objective: `${rawPurpose}${vanSuffix}`,
            passengersCount: Number(body.passengerCount || body.passengers || 1),
            departureDate: startAtDate,
            returnDate: endAtDate,
            tripType: body.tripScope || body.tripType || "ในจังหวัดพะเยา",
            budgetSource: body.budgetSource || "งบประมาณคณะ",
            phone: body.phone || "-",
            passengerNames: body.passengerNames || "-",
            targetFacultyId: item.faculty.id,
            status: initialBookingStatus,
            assignedDriverId: autoDriverId,
          }
        });

        itemsCreated.push({
          created,
          item,
          bookingId,
          vanSuffix,
          destinationsList,
          destinationText,
          rawPurpose,
          isFacultyAdminBooking
        });
      }

      return itemsCreated;
    });

    const requestTimestamp = new Date().toISOString();
    const createdBookings = [];

    for (const record of transactionResults) {
      const isExecWaiting = record.created.status === BookingStatus.WAITING_EXEC;
      addStoredCalendarEvent({
        id: `bk-${record.bookingId}`,
        vanId: record.item.vanId || String(record.item.faculty.id),
        facultyId: String(record.item.faculty.id),
        bookingFaculty: userFacultyName,
        destination: record.destinationText,
        purpose: `${record.rawPurpose}${record.vanSuffix}`,
        purposeRaw: record.rawPurpose,
        date: startAtDate.toISOString().slice(0, 10),
        returnDate: endAtDate.toISOString().slice(0, 10),
        time: `${body.startTime || '08:30'} - ${body.endTime || '16:30'} น.`,
        passengers: Number(body.passengerCount || body.passengers || 1),
        requester: body.requester || user?.name || "ผู้ขอใช้บริการ",
        phone: body.phone || "-",
        department: "สำนักงานคณบดี",
        status: "pending",
        statusText: record.item.isBorrow 
          ? "รอการยืนยันจากคณะเจ้าของรถ (ยืมรถ)" 
          : (isExecWaiting ? "รอดำเนินการ (รอคณบดีอนุมัติ)" : "รอดำเนินการ (รอแอดมินคณะอนุมัติ)"),
        statusTime: "บันทึกในระบบ",
        tripType: body.tripScope || body.tripType || "ในจังหวัดพะเยา",
        pickupLocation: body.pickupLocation || body.pickup_location || "มหาวิทยาลัยพะเยา",
        dropoffLocation: body.dropoffLocation || body.dropoff_location || record.destinationText,
        coordinatorName: body.coordinatorName || body.coordinator_name || "",
        coordinatorPhone: body.coordinatorPhone || body.coordinator_phone || "",
        passengerNames: body.passengerNames || "",
        requestedVehicleCount: Number(body.requestedVehicleCount || body.vehiclesCount || facultiesToBook.length),
        requestTimestamp: requestTimestamp,
        destinations: record.destinationsList
      });

      createdBookings.push(record.created);
    }

    invalidateBookingsCache();
    invalidateDbBookingsCache();

    return NextResponse.json({ 
      success: true, 
      booking: createdBookings[0],
      bookings: createdBookings,
      count: createdBookings.length
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ success: false, error: (error as Error)?.message || String(error) }, { status: 500 });
  }
}

export async function handleGetBookingDetail(request: Request, id: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        requester: { include: { faculty: true } },
        assignedDriver: { include: { user: true } },
        targetFaculty: true
      }
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleUpdateSystemBooking(request: Request, id: string) {
  try {
    const user = await getAuthUser();
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "ไม่พบข้อมูลคำขอใช้รถ" }, { status: 404 });
    }

    const isAdmin = user?.role === 'SUPER_ADMIN';
    const isFacultyAdmin = user?.role === 'FACULTY_ADMIN' && user.facultyId && (existing.targetFacultyId === user.facultyId || existing.requesterId === user.id);
    const isOwner = user && existing.requesterId === user.id;

    if (!isAdmin && !isFacultyAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "คุณไม่มีสิทธิ์แก้ไขคำขอนี้ (คำขอเป็นของหน่วยงานอื่น)" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Prisma.BookingUpdateInput = {
      destination: body.destination,
      objective: body.purpose || body.objective || body.reason,
      passengersCount: body.passengers ? Number(body.passengers) : (body.passengersCount ? Number(body.passengersCount) : (body.passengerCount ? Number(body.passengerCount) : undefined)),
      phone: body.phone,
      tripType: body.tripScope || body.tripType,
      budgetSource: body.budgetSource || body.budget,
    };
    if (body.status === 'CANCELLED' || body.status === 'REJECTED') {
      updateData.status = BookingStatus.REJECTED;
      updateData.rejectReason = body.cancellationReason || body.rejectReason || 'ยกเลิกคำขอ';
    }
    if (body.startAt || body.startDate) {
      updateData.departureDate = new Date(body.startAt || body.startDate);
    }
    if (body.endAt || body.returnDate) {
      updateData.returnDate = new Date(body.endAt || body.returnDate);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData
    });
    invalidateBookingsCache();
    invalidateDbBookingsCache();
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleDeleteSystemBooking(_request: Request, id: string) {
  void _request;
  try {
    const user = await getAuthUser();
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "ไม่พบข้อมูลคำขอใช้รถ" }, { status: 404 });
    }

    const isAdmin = user?.role === 'SUPER_ADMIN';
    const isFacultyAdmin = user?.role === 'FACULTY_ADMIN' && user.facultyId && (existing.targetFacultyId === user.facultyId || existing.requesterId === user.id);
    const isOwner = user && existing.requesterId === user.id;

    if (!isAdmin && !isFacultyAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "คุณไม่มีสิทธิ์ลบคำขอนี้ (คำขอเป็นของหน่วยงานอื่น)" }, { status: 403 });
    }

    const cleanObj = existing.objective.replace(/\s*\(คันที่\s*\d+\/\d+[^)]*\)/g, '').trim();
    const siblingBookings = await prisma.booking.findMany({
      where: {
        requesterId: existing.requesterId,
        departureDate: existing.departureDate,
        destination: existing.destination,
        objective: { contains: cleanObj }
      },
      select: { id: true }
    });

    const idsToDelete = siblingBookings.length > 0 ? siblingBookings.map(b => b.id) : [id];

    for (const bId of idsToDelete) {
      await prisma.attachment.deleteMany({ where: { bookingId: bId } }).catch(() => {});
      await prisma.booking.delete({ where: { id: bId } }).catch(() => {});
      deleteStoredCalendarEvent(`bk-${bId}`);
    }

    invalidateBookingsCache();
    invalidateDbBookingsCache();
    return NextResponse.json({ 
      success: true, 
      message: `ลบคำขอ ${id} และรายการในขบวนที่เกี่ยวข้องทั้งหมด (${idsToDelete.length} รายการ) เรียบร้อยแล้ว` 
    });
  } catch (err) {
    console.error("Failed to delete booking:", err);
    return NextResponse.json({ success: false, error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleBookingStatusUpdate(request: Request, id: string) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FACULTY_ADMIN' && user.role !== 'EXECUTIVE')) {
      return NextResponse.json({ success: false, error: "Unauthorized: คุณไม่มีสิทธิ์อนุมัติหรือปฏิเสธคำขอ" }, { status: 403 });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอที่ต้องการเปลี่ยนสถานะ" }, { status: 404 });
    }

    // Faculty admin can only approve requests for their own faculty's vans
    if (user.role === 'FACULTY_ADMIN' && booking.targetFacultyId !== user.facultyId) {
      return NextResponse.json({ success: false, error: "คุณสามารถอนุมัติได้เฉพาะคำขอใช้รถของคณะตนเองเท่านั้น" }, { status: 403 });
    }

    const body = await request.json();
    const { status, rejectReason } = body;
    const updateData: Prisma.BookingUpdateInput = { status: status as BookingStatus };
    if (rejectReason) updateData.rejectReason = rejectReason;

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        requester: { include: { faculty: true } },
        assignedDriver: { include: { user: true } }
      }
    });

    if (status === 'APPROVED') {
      // Double Booking Check: Prevent overlapping approved bookings for the same van or driver
      const conflicting = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          status: BookingStatus.APPROVED,
          departureDate: { lt: booking.returnDate },
          returnDate: { gt: booking.departureDate },
          OR: [
            ...(booking.targetFacultyId ? [{ targetFacultyId: booking.targetFacultyId }] : []),
            ...(booking.assignedDriverId ? [{ assignedDriverId: booking.assignedDriverId }] : []),
          ]
        },
        include: { targetFaculty: true }
      });

      if (conflicting) {
        return NextResponse.json({ 
          success: false, 
          error: `ไม่สามารถอนุมัติได้: รถตู้หรือพนักงานขับรถมีภารกิจที่ได้รับการอนุมัติในช่วงวันเวลาดังกล่าวแล้ว (คำขอเลขที่ ${conflicting.id})` 
        }, { status: 409 });
      }

      try {
        await pushBookingToGoogleCalendar({
          assignedVanId: updated.targetFacultyId ? String(updated.targetFacultyId) : '1',
          requesterFaculty: updated.requester?.faculty?.nameTh,
          destination: updated.destination,
          purpose: updated.objective,
          tripType: updated.tripType || undefined,
          passengers: updated.passengersCount,
          requester: updated.requester?.name,
          assignedDriverName: updated.assignedDriver?.user?.name,
          startAt: updated.departureDate.toISOString(),
          endAt: updated.returnDate.toISOString(),
        });
      } catch (gcalErr) {
        console.warn("Failed to push booking to Google Calendar:", gcalErr);
      }
      try {
        updateStoredCalendarEvent(`bk-${id}`, {
          status: 'approved',
          statusText: 'อนุมัติแล้ว',
          statusTime: 'ระบบการจอง'
        });
      } catch {}
    } else if (status === 'REJECTED') {
      try {
        deleteStoredCalendarEvent(`bk-${id}`);
      } catch {}
    }

    invalidateBookingsCache();
    invalidateDbBookingsCache();
    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}

export async function handleAssignDriverToBooking(request: Request, id: string) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FACULTY_ADMIN')) {
      return NextResponse.json({ success: false, error: "Unauthorized: คุณไม่มีสิทธิ์จัดสรรคนขับ" }, { status: 403 });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ success: false, error: "ไม่พบคำขอใช้รถ" }, { status: 404 });
    }

    // Faculty admin can only assign drivers to bookings of their own faculty's vans
    if (user.role === 'FACULTY_ADMIN' && booking.targetFacultyId !== user.facultyId) {
      return NextResponse.json({ success: false, error: "คุณสามารถจัดสรรคนขับได้เฉพาะคำขอใช้รถของคณะตนเองเท่านั้น" }, { status: 403 });
    }

    const body = await request.json();
    const { driverId } = body;
    
    let parsedDriverId: number | null = null;
    if (driverId !== null && driverId !== undefined && driverId !== "") {
      const digits = String(driverId).replace(/\D/g, '');
      const num = parseInt(digits, 10);
      if (!isNaN(num)) {
        parsedDriverId = num;
      }
    }

    if (parsedDriverId !== null && user.role === 'FACULTY_ADMIN') {
      const driver = await prisma.driver.findUnique({ where: { id: parsedDriverId } });
      if (!driver || driver.facultyId !== user.facultyId) {
        return NextResponse.json({ success: false, error: "ไม่สามารถมอบหมายคนขับของคณะอื่นได้" }, { status: 403 });
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        assignedDriverId: parsedDriverId
      },
      include: {
        assignedDriver: {
          include: { user: true, assignedVan: true }
        }
      }
    });

    invalidateBookingsCache();
    invalidateDbBookingsCache();

    try {
      if (updated.assignedDriver?.user?.name) {
        updateStoredCalendarEvent(`bk-${id}`, {
          coordinatorName: updated.assignedDriver.user.name,
          coordinatorPhone: updated.assignedDriver.phone || "0812345678"
        });
      }
    } catch {}

    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || String(err) }, { status: 500 });
  }
}
