import { NextResponse } from "next/server";
import { 
  getStoredCalendarEvents, 
  addStoredCalendarEvent, 
  updateStoredCalendarEvent, 
  deleteStoredCalendarEvent,
  facultyVansList,
  CalendarEventRecord
} from "@/Backend/services/calendar-store";
import { listBookings } from "@/Backend/services/booking-system-store";
import { getGoogleCalendarClient } from "@/Backend/services/google-calendar";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { UnifiedVanInfo } from "@/Frontend/data/faculty-vans";
import { getAuthUser } from "@/app/actions/auth";

interface GoogleCalendarCache {
  events: CalendarEventRecord[];
  timestamp: number;
}
const globalForGcal = globalThis as unknown as { gcalCache?: Record<string, GoogleCalendarCache> };
const gcalCache: Record<string, GoogleCalendarCache> = globalForGcal.gcalCache ?? (globalForGcal.gcalCache = {});
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function formatBangkokDate(rawDate: string | Date | undefined): string {
  if (!rawDate) return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const d = typeof rawDate === 'string' && !rawDate.includes('T') ? new Date(`${rawDate}T00:00:00+07:00`) : new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate).slice(0, 10);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

export const FACULTY_CALENDARS = {
  ICT: 'e9735a3152fcec368b15ac7f64dd21046a923cc5c4d3f9aafac8f706285a40a8@group.calendar.google.com',
  PHARM: 'afa36bd97fd57a882373e89ff4c9c5d6a532296de29bdf15caced34a4e7e2b8c@group.calendar.google.com',
  SCI: '280eacd5718c2e5c941b02395a80926cdb097721dd2de39cc3c01f3c6183075c@group.calendar.google.com'
};

export async function resolveCalendarId(vanId?: string): Promise<string | undefined> {
  const defaultCalendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!vanId) return defaultCalendarId;
  
  const vanIdNum = parseInt(vanId);
  if (!isNaN(vanIdNum)) {
    const van = await prisma.van.findUnique({
      where: { id: vanIdNum },
      include: { faculty: true }
    });
    if (van && van.faculty) {
      if (van.faculty.googleCalendarId) return van.faculty.googleCalendarId;
      if (van.faculty.nameTh.includes('เภสัช')) return FACULTY_CALENDARS.PHARM;
      if (van.faculty.nameTh.includes('วิทยาศาสตร์')) return FACULTY_CALENDARS.SCI;
      if (van.faculty.nameTh.includes('สารสนเทศ') || van.faculty.nameTh.includes('ICT')) return FACULTY_CALENDARS.ICT;
    }
  } else {
    let facultyName = '';
    if (vanId === 'v-ict') facultyName = 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร';
    else if (vanId === 'v-eng') facultyName = 'คณะวิศวกรรมศาสตร์';
    else if (vanId === 'v-sci') facultyName = 'คณะวิทยาศาสตร์';
    else if (vanId === 'v-agr') facultyName = 'คณะเกษตรศาสตร์';
    else if (vanId === 'v-ener') facultyName = 'คณะพลังงานและสิ่งแวดล้อม';
    else if (vanId === 'v-pharm') facultyName = 'คณะเภสัชศาสตร์';
    
    if (vanId === 'v-pharm') return FACULTY_CALENDARS.PHARM;
    if (vanId === 'v-sci') return FACULTY_CALENDARS.SCI;
    if (vanId === 'v-ict') return FACULTY_CALENDARS.ICT;
    
    if (facultyName) {
      const fac = await prisma.faculty.findFirst({ where: { nameTh: facultyName } });
      if (fac && fac.googleCalendarId) return fac.googleCalendarId;
    }
  }
  
  return defaultCalendarId;
}

export async function pushBookingToGoogleCalendar(booking: {
  assignedVanId?: string;
  requesterFaculty?: string;
  destination: string;
  purpose?: string;
  tripType?: string;
  passengers?: number;
  requester?: string;
  assignedDriverName?: string;
  startAt: string;
  endAt: string;
}) {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return null;
  try {
    const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
    const targetCalendarId = await resolveCalendarId(booking.assignedVanId);
    if (!targetCalendarId) return null;

    const startDateRaw = booking.startAt ? booking.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
    const endDateRaw = booking.endAt ? booking.endAt.slice(0, 10) : startDateRaw;

    const startDateTime = booking.startAt && booking.startAt.includes('T') ? booking.startAt : `${startDateRaw}T08:30:00+07:00`;
    const endDateTime = booking.endAt && booking.endAt.includes('T') ? booking.endAt : `${endDateRaw}T16:30:00+07:00`;

    const gcalResponse = await calendar.events.insert({
      calendarId: targetCalendarId,
      requestBody: {
        summary: `[${booking.requesterFaculty || 'คณะ'}] ${booking.destination || 'ภารกิจใช้รถตู้'}`,
        description: `ผู้ขอใช้บริการ: ${booking.requester || '-'}\nหน่วยงาน: ${booking.requesterFaculty || '-'}\nวัตถุประสงค์: ${booking.purpose || '-'}\nขอบเขตการเดินทาง: ${booking.tripType || 'ในจังหวัดพะเยา'}\nผู้โดยสาร: ${booking.passengers || 1} คน\nคนขับ: ${booking.assignedDriverName || '-'}`,
        start: { dateTime: startDateTime, timeZone: 'Asia/Bangkok' },
        end: { dateTime: endDateTime, timeZone: 'Asia/Bangkok' },
      },
    });

    // Invalidate Google Calendar cache
    const globalCacheObj = globalThis as unknown as { gcalCache?: Record<string, unknown> };
    if (globalCacheObj.gcalCache) {
      globalCacheObj.gcalCache = {};
    }
    return gcalResponse.data.id;
  } catch (err) {
    console.warn("Failed to push approved booking to Google Calendar:", err);
    return null;
  }
}

export async function handleSystemCalendarEvents(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  let events = getStoredCalendarEvents();

  // Merge live bookings from Database/System Bookings
  try {
    await getAuthUser();
    let facultyId: number | undefined;
    // Global view for cross-faculty borrowing. The client-side handles filtering.

    const allDbBookings = await listBookings(undefined, facultyId);
    // Filter out REJECTED bookings so rejected ones are NEVER shown on the calendar!
    const activeDbBookings = allDbBookings.filter(b => b.status !== 'REJECTED');

    const dbEvents: CalendarEventRecord[] = activeDbBookings.map(b => {
      const startDate = new Date(b.startAt);
      const endDate = new Date(b.endAt);
      
      const startTime = isNaN(startDate.getTime()) ? "08:30" : startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const endTime = isNaN(endDate.getTime()) ? "16:30" : endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      
      const isApproved = b.status === "APPROVED" || b.status === "COMPLETED";

      const vanIdentifier = b.assignedVanId ? String(b.assignedVanId) : (b.requesterFacultyId ? String(b.requesterFacultyId) : "1");

      return {
        id: `bk-${b.id}`,
        vanId: vanIdentifier,
        facultyId: b.requesterFacultyId ? String(b.requesterFacultyId) : "1",
        bookingFaculty: b.requesterFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
        destination: b.destination,
        purpose: b.purpose,
        purposeDetail: b.purpose,
        routeDetail: b.destination,
        date: b.startAt ? b.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        returnDate: b.endAt ? b.endAt.slice(0, 10) : (b.startAt ? b.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        time: `${startTime} - ${endTime} น.`,
        passengers: b.passengers || 1,
        requester: b.requester || "ผู้ขอใช้รถ",
        department: "ระบบจองรถตู้",
        status: isApproved ? "approved" : "pending",
        statusText: isApproved ? (b.status === "COMPLETED" ? "เสร็จสิ้นภารกิจ" : "อนุมัติแล้ว") : "รอดำเนินการ (รอคณบดีอนุมัติ)",
        statusTime: "ระบบการจอง",
        tripType: (b.tripType as "ในจังหวัดพะเยา" | "ต่างจังหวัด") || "ในจังหวัดพะเยา",
        createdAt: b.submittedAt || new Date().toISOString()
      };
    });

    const existingIds = new Set(events.map(e => e.id));
    const newDbEvents = dbEvents.filter(e => !existingIds.has(e.id));
    events = [...newDbEvents, ...events];
  } catch (err) {
    console.warn("Notice: Failed to fetch DB bookings for calendar:", err);
  }

  // Sync live events from Google Calendar API
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
      const cacheKey = `year-${year}`;
      
      let googleEventsMapped: CalendarEventRecord[] = [];

      if (gcalCache[cacheKey] && (Date.now() - gcalCache[cacheKey].timestamp < CACHE_TTL_MS)) {
        googleEventsMapped = gcalCache[cacheKey].events;
      } else {
        // Fetch full year (Jan 1 - Dec 31) so navigating between any months is instant
        const timeMin = new Date(year, 0, 1, 0, 0, 0).toISOString();
        const timeMax = new Date(year, 11, 31, 23, 59, 59).toISOString();
        
        const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar.readonly']);
        
        // Determine which calendars to fetch (Static list + optional DB additions)
        const allGoogleCalendarIds: Array<{ id: string; facultyName: string; facultyId: string }> = [
          { id: FACULTY_CALENDARS.ICT, facultyName: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร', facultyId: 'ict' },
          { id: FACULTY_CALENDARS.PHARM, facultyName: 'คณะเภสัชศาสตร์', facultyId: 'pharm' },
          { id: FACULTY_CALENDARS.SCI, facultyName: 'คณะวิทยาศาสตร์', facultyId: 'sci' }
        ];

        const centralCalendarId = process.env.GOOGLE_CALENDAR_ID;
        if (centralCalendarId && !allGoogleCalendarIds.find(c => c.id === centralCalendarId)) {
          allGoogleCalendarIds.push({
            id: centralCalendarId,
            facultyName: 'คณะรวม (Central)',
            facultyId: 'central'
          });
        }

        const fetchPromises = allGoogleCalendarIds.map(async (cal) => {
          try {
            // Protect against slow Google API network lags with a 2.5s timeout
            const fetchWithTimeout = Promise.race([
              calendar.events.list({
                calendarId: cal.id,
                timeMin,
                timeMax,
                maxResults: 2500,
                singleEvents: true,
                orderBy: 'startTime',
              }),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2500))
            ]);

            const response = await fetchWithTimeout;
            return { items: response.data.items, meta: cal };
          } catch {
            console.warn(`Notice: Google Calendar fetch completed/bypassed for ${cal.id}`);
            return null;
          }
        });

        const responses = await Promise.all(fetchPromises);

        responses.forEach((res) => {
          if (!res || !res.items || res.items.length === 0) return;
          
          const mapped: CalendarEventRecord[] = res.items.map((item, index) => {
            const isAllDay = !!(item.start?.date && !item.start?.dateTime);
            const rawStart = item.start?.dateTime || item.start?.date || new Date().toISOString();
            const summary = item.summary || 'ภารกิจใช้รถตู้';
            const description = item.description || '';
            
            let facultyName = res.meta.facultyName;
            let facultyId = res.meta.facultyId;

            // Legacy parse if central
            if (facultyId === 'central') {
              if (summary.includes('วิศวะ')) { facultyName = 'คณะวิศวกรรมศาสตร์'; facultyId = 'eng'; }
              else if (summary.includes('วิทยาศาสตร์')) { facultyName = 'คณะวิทยาศาสตร์'; facultyId = 'sci'; }
              else if (summary.includes('เกษตร')) { facultyName = 'คณะเกษตรศาสตร์'; facultyId = 'agr'; }
              else if (summary.includes('พลังงาน')) { facultyName = 'คณะพลังงานและสิ่งแวดล้อม'; facultyId = 'ener'; }
              else { facultyName = 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร'; facultyId = 'ict'; }
            }

            let cleanSummary = summary;
            const match = summary.match(/^\[.*?\]\s*(.*)$/);
            if (match && match[1] && match[1].trim().length > 0) {
              cleanSummary = match[1].trim();
            }

            const vanMatch = facultyVansList.find(v => v.facultyName === facultyName || v.facultyId === facultyId);
            const correctVanId = vanMatch ? vanMatch.id : (facultyId === 'pharm' ? 'v-pharm' : 'v-ict');

            const startDateStr = formatBangkokDate(rawStart);
            let returnDateStr = startDateStr;

            if (isAllDay && item.end?.date) {
              // Google Calendar all-day event end.date is exclusive (e.g. 2026-09-02 for a 1-day event on 2026-09-01)
              const parsedEnd = new Date(`${item.end.date}T00:00:00+07:00`);
              parsedEnd.setDate(parsedEnd.getDate() - 1);
              const prevDayStr = formatBangkokDate(parsedEnd);
              if (prevDayStr >= startDateStr) {
                returnDateStr = prevDayStr;
              }
            } else if (item.end?.dateTime) {
              const endDateTime = new Date(item.end.dateTime);
              if (endDateTime.getHours() === 0 && endDateTime.getMinutes() === 0 && endDateTime.getSeconds() === 0) {
                endDateTime.setDate(endDateTime.getDate() - 1);
              }
              const parsedEndStr = formatBangkokDate(endDateTime);
              if (parsedEndStr >= startDateStr) {
                returnDateStr = parsedEndStr;
              }
            }

            return {
              id: `gcal-${item.id || index}`,
              gcalId: item.id || undefined,
              vanId: correctVanId,
              facultyId,
              date: startDateStr,
              returnDate: returnDateStr,
              time: isAllDay ? 'ตลอดวัน' : new Date(rawStart).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
              destination: cleanSummary,
              purpose: cleanSummary,
              passengers: 10,
              status: 'approved' as const,
              bookingFaculty: facultyName,
              requester: item.organizer?.displayName || item.organizer?.email || 'Google Calendar Sync',
              department: 'Google Calendar Live',
              purposeDetail: description,
              routeDetail: summary,
              statusText: 'ซิงค์จาก Google Calendar',
              statusTime: 'Live Data',
              createdAt: rawStart,
            };
          });
          googleEventsMapped = [...googleEventsMapped, ...mapped];
        });

        gcalCache[cacheKey] = {
          events: googleEventsMapped,
          timestamp: Date.now()
        };
      }

      if (googleEventsMapped.length > 0) {
        // Merge Google Calendar events with store, avoiding duplicates
        const existingGcalIds = new Set(events.map(e => e.gcalId).filter(Boolean));
        const existingSignatures = new Set(events.map(e => `${e.date.slice(0,10)}_${e.destination}`));
        
        const filteredGcal = googleEventsMapped.filter(e => 
          !existingGcalIds.has(e.gcalId) && !existingSignatures.has(`${e.date}_${e.destination}`)
        );

        events = [...filteredGcal, ...events];
      }
    } catch (gcalError) {
      console.warn("Google Calendar Live Sync notice:", gcalError instanceof Error ? gcalError.message : gcalError);
    }
  }

  if (yearParam) {
    let y = Number(yearParam);
    if (y > 2400) y -= 543;
    events = events.filter(e => {
      const startD = new Date(e.date);
      const endD = e.returnDate ? new Date(e.returnDate) : startD;
      return (startD.getFullYear() === y || endD.getFullYear() === y);
    });
  }

  if (monthParam) {
    const m = Number(monthParam);
    events = events.filter(e => {
      const startD = new Date(e.date);
      const endD = e.returnDate ? new Date(e.returnDate) : startD;
      const startMonth = startD.getMonth() + 1;
      const endMonth = endD.getMonth() + 1;
      return (startMonth === m || endMonth === m || (startMonth < m && endMonth > m));
    });
  }

  // Fetch real vans from database
  let realVansList: UnifiedVanInfo[] = [];
  try {
    const realVans = await prisma.van.findMany({
      include: {
        faculty: {
          include: {
            drivers: {
              include: { user: true }
            }
          }
        },
        assignedDrivers: {
          include: { user: true }
        }
      }
    });
    realVansList = realVans.map(v => {
      const driver = v.assignedDrivers[0] || (v.faculty?.drivers && v.faculty.drivers.length > 0 ? v.faculty.drivers[0] : null);
      return {
        id: v.id.toString(),
        facultyId: v.facultyId.toString(),
        facultyName: v.faculty?.nameTh || "คณะ",
        shortFacultyName: v.faculty?.nameTh?.replace('คณะ', '') || "คณะ",
        vanName: v.name || `รถตู้ ${v.faculty?.nameTh || ''} ${v.plate}`,
        plate: v.plate || "ไม่ระบุทะเบียน",
        driverName: driver?.user?.name || "ยังไม่มีคนขับ",
        driverPhone: driver?.phone || "-",
        driverImage: driver?.user?.avatar || driver?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
        vanImage: v.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80"
      };
    });
  } catch (err) {
    console.warn("Failed to fetch real vans:", err);
  }

  const allVans = [...realVansList];
  facultyVansList.forEach(fv => {
    if (!realVansList.some(rv => rv.facultyName === fv.facultyName || rv.shortFacultyName === fv.shortFacultyName)) {
      allVans.push(fv);
    }
  });
  const eventsByDate = events.reduce<Record<string, Array<{
    id: string;
    time: string;
    title: string;
    destination: string;
    purpose: string;
    requester: string;
    phone: string;
    bookingFaculty: string;
    vanPlate: string;
    date: string;
    returnDate: string;
    status: string;
    tripType?: string;
    color: string;
    ownerFacultyName?: string;
  }>>>(
    (result, event) => {
      const startDate = new Date(event.date.slice(0, 10));
      const endDate = event.returnDate ? new Date(event.returnDate.slice(0, 10)) : new Date(startDate);
      
      if (isNaN(startDate.getTime())) return result;
      const validEndDate = isNaN(endDate.getTime()) ? new Date(startDate) : endDate;

      const color = event.status === "approved" || event.status === "completed"
        ? "bg-green-200 text-green-800 border-green-300"
        : "bg-yellow-200 text-yellow-800 border-yellow-300";

      const vanInfo = allVans.find(v => v.id === event.vanId);
      const plate = vanInfo ? vanInfo.plate : event.vanId;
      const itemTitle = `${event.destination} (${plate}) - ${event.bookingFaculty}`;

      for (let d = new Date(startDate); d <= validEndDate; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${day}`;

        if (!result[dateKey]) {
          result[dateKey] = [];
        }
        result[dateKey].push({
          id: event.id,
          time: event.time,
          title: itemTitle,
          destination: event.destination,
          purpose: event.purpose || event.destination,
          requester: event.requester || '',
          phone: event.phone || '',
          bookingFaculty: event.bookingFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
          vanPlate: plate,
          date: event.date,
          returnDate: event.returnDate || event.date,
          status: event.status,
          tripType: event.tripType,
          color,
          ownerFacultyName: vanInfo ? vanInfo.facultyName : undefined
        });
      }

      return result;
    },
    {},
  );

  return NextResponse.json({ 
    success: true,
    events: eventsByDate, 
    rawEvents: events,
    vans: allVans
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
    }
  });
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    // Default new calendar bookings to pending (waiting for Dean approval)
    const initialStatus = body.status === 'approved' ? 'approved' : 'pending';

    // 1. Persist directly to Prisma Database
    let dbBookingId: string | null = null;
    try {
      const faculty = (await prisma.faculty.findFirst({
        where: { nameTh: body.bookingFaculty || authUser.faculty?.nameTh || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร" }
      })) || (await prisma.faculty.findFirstOrThrow({ orderBy: { id: "asc" } }));

      let requester = null;
      const requesterName = (body.requester || '').trim();

      if (requesterName && requesterName !== authUser.name) {
        requester = await prisma.user.findFirst({ where: { name: requesterName } });
        if (!requester) {
          const slug = requesterName.replace(/\s+/g, ".").toLowerCase().replace(/[^a-z0-9.]/g, "") || "user";
          requester = await prisma.user.create({
            data: {
              facultyId: faculty.id,
              name: requesterName,
              email: `${Date.now()}-${slug}@example.local`,
              role: "USER"
            }
          });
        }
      } else {
        requester = authUser.id 
          ? await prisma.user.findFirst({ where: { id: Number(authUser.id) } })
          : null;
        if (!requester) {
          requester = await prisma.user.create({
            data: {
              facultyId: faculty.id,
              name: authUser.name || "ผู้ขอใช้บริการ",
              email: `${Date.now()}-user@example.local`,
              role: authUser.role || "FACULTY_ADMIN"
            }
          });
        }
      }

      const latest = await prisma.booking.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
      const lastNumber = latest ? Number((latest.id.match(/(\d+)/)?.[1] || "0")) : 64;
      dbBookingId = `UPV-2569-${(lastNumber + 1).toString().padStart(4, "0")}`;

      const startDateRaw = body.date ? String(body.date).slice(0, 10) : new Date().toISOString().slice(0, 10);
      const endDateRaw = body.returnDate ? String(body.returnDate).slice(0, 10) : startDateRaw;
      
      let startTime = "08:30:00";
      let endTime = "16:30:00";
      if (body.time) {
        const parts = String(body.time).replace(/น\./g, '').split('-').map((s: string) => s.trim());
        if (parts[0] && parts[0].includes(':')) startTime = `${parts[0]}:00`;
        if (parts[1] && parts[1].includes(':')) endTime = `${parts[1]}:00`;
      }

      const startDateTime = new Date(`${startDateRaw}T${startTime}+07:00`);
      const endDateTime = new Date(`${endDateRaw}T${endTime}+07:00`);

      let targetFaculty = faculty;
      if (body.vanId) {
        const vanNum = parseInt(String(body.vanId).replace(/\D/g, ''));
        if (!isNaN(vanNum)) {
          const v = await prisma.van.findUnique({ where: { id: vanNum }, include: { faculty: true } });
          if (v?.faculty) targetFaculty = v.faculty;
        }
      }

      await prisma.booking.create({
        data: {
          id: dbBookingId,
          requesterId: requester.id,
          targetFacultyId: targetFaculty.id,
          destination: body.destination || "ไม่ระบุสถานที่",
          objective: body.purpose || "ภารกิจใช้รถตู้",
          departureDate: isNaN(startDateTime.getTime()) ? new Date() : startDateTime,
          returnDate: isNaN(endDateTime.getTime()) ? new Date() : endDateTime,
          passengersCount: Number(body.passengers || 1),
          phone: body.phone || null,
          budgetSource: "งบประมาณคณะ",
          tripType: body.tripType || "ในจังหวัดพะเยา",
          status: initialStatus === 'approved' ? 'APPROVED' : 'WAITING_EXEC',
        }
      });
    } catch (dbErr) {
      console.warn("Notice: Failed to persist calendar event to Prisma DB:", dbErr);
    }

    const created = addStoredCalendarEvent({
      ...body,
      id: dbBookingId ? `bk-${dbBookingId}` : undefined,
      status: initialStatus,
    });

    // ONLY push to Google Calendar if status is explicitly approved (e.g. Dean approval)
    if (created.status === 'approved' && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const targetCalendarId = await resolveCalendarId(created.vanId);

        if (targetCalendarId) {
          const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
          
          const startDateRaw = created.date ? created.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
          const endDateRaw = created.returnDate ? created.returnDate.slice(0, 10) : startDateRaw;

          const startDateTime = `${startDateRaw}T08:30:00+07:00`;
          const endDateTime = `${endDateRaw}T16:30:00+07:00`;

          const gcalResponse = await calendar.events.insert({
            calendarId: targetCalendarId,
            requestBody: {
              summary: `[${created.bookingFaculty || 'คณะ'}] ${created.destination || 'ภารกิจใช้รถตู้'}`,
              description: `ผู้ขอใช้บริการ: ${created.requester || '-'}\nหน่วยงาน: ${created.bookingFaculty || '-'}\nวัตถุประสงค์: ${created.purpose || '-'}\nขอบเขตการเดินทาง: ${created.tripType || 'ในจังหวัดพะเยา'}\nผู้โดยสาร: ${created.passengers || 1} คน`,
              start: { dateTime: startDateTime, timeZone: 'Asia/Bangkok' },
              end: { dateTime: endDateTime, timeZone: 'Asia/Bangkok' },
            },
          });

          if (gcalResponse.data.id) {
            created.gcalId = gcalResponse.data.id;
            updateStoredCalendarEvent(created.id, { gcalId: created.gcalId });
          }
        }
      } catch (gcalErr) {
        console.warn("Google Calendar Push Insert Warning:", gcalErr instanceof Error ? gcalErr.message : gcalErr);
      }
    }

    // Invalidate Google Calendar cache only if pushed to Google Calendar
    if (created.status === 'approved') {
      const globalCacheObj = globalThis as unknown as { gcalCache?: Record<string, unknown> };
      if (globalCacheObj.gcalCache) {
        globalCacheObj.gcalCache = {};
      }
      Object.keys(gcalCache).forEach(k => delete gcalCache[k]);
    }

    return NextResponse.json({ success: true, event: created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, gcalId, ...fields } = body;
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const updated = updateStoredCalendarEvent(id, fields);

    // Sync updates to Prisma DB
    if (String(id).startsWith("bk-")) {
      const bookingId = String(id).replace("bk-", "");
      try {
        const updateData: Prisma.BookingUpdateInput = {
          destination: fields.destination || undefined,
          objective: fields.purpose || undefined,
          status: fields.status === 'approved' ? 'APPROVED' : (fields.status === 'rejected' ? 'REJECTED' : 'WAITING_EXEC')
        };

        if (fields.passengers) {
          updateData.passengersCount = Number(fields.passengers);
        }
        if (fields.phone !== undefined) {
          updateData.phone = fields.phone || null;
        }
        if (fields.tripType) {
          updateData.tripType = fields.tripType;
        }

        if (fields.date) {
          const startDateRaw = String(fields.date).slice(0, 10);
          const startDateTime = new Date(`${startDateRaw}T08:30:00+07:00`);
          if (!isNaN(startDateTime.getTime())) {
            updateData.departureDate = startDateTime;
          }
        }
        if (fields.returnDate) {
          const endDateRaw = String(fields.returnDate).slice(0, 10);
          const endDateTime = new Date(`${endDateRaw}T16:30:00+07:00`);
          if (!isNaN(endDateTime.getTime())) {
            updateData.returnDate = endDateTime;
          }
        }

        if (fields.requester) {
          const requesterName = String(fields.requester).trim();
          let reqUser = await prisma.user.findFirst({ where: { name: requesterName } });
          if (!reqUser) {
            let targetFacultyId = authUser.facultyId || (authUser.faculty ? authUser.faculty.id : undefined);
            if (!targetFacultyId) {
              const defaultFac = await prisma.faculty.findFirst();
              targetFacultyId = defaultFac ? defaultFac.id : 1;
            }
            const slug = requesterName.replace(/\s+/g, ".").toLowerCase().replace(/[^a-z0-9.]/g, "") || "user";
            reqUser = await prisma.user.create({
              data: {
                facultyId: targetFacultyId,
                name: requesterName,
                email: `${Date.now()}-${slug}@example.local`,
                role: "USER"
              }
            });
          }
          updateData.requester = { connect: { id: reqUser.id } };
        }

        await prisma.booking.update({
          where: { id: bookingId },
          data: updateData
        });
      } catch (e) {
        console.warn("Notice updating DB booking:", e);
      }
    }

    // Sync update or insert to Google Calendar if approved
    const isNowApproved = (fields.status === 'approved' || updated?.status === 'approved');
    const targetGcalId = gcalId || (updated?.gcalId) || (String(id).startsWith('gcal-') ? String(id).replace('gcal-', '') : null);

    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const targetCalendarId = await resolveCalendarId(updated?.vanId || fields.vanId);

        if (targetCalendarId) {
          const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);

          if (targetGcalId) {
            await calendar.events.patch({
              calendarId: targetCalendarId,
              eventId: targetGcalId,
              requestBody: {
                summary: fields.destination ? `[${fields.bookingFaculty || updated?.bookingFaculty || 'คณะ'}] ${fields.destination}` : undefined,
                description: fields.purpose ? `วัตถุประสงค์: ${fields.purpose}` : undefined,
              },
            });
          } else if (isNowApproved && updated) {
            // Newly approved event: insert to Google Calendar
            const startDateRaw = updated.date ? updated.date.slice(0, 10) : new Date().toISOString().slice(0, 10);
            const endDateRaw = updated.returnDate ? updated.returnDate.slice(0, 10) : startDateRaw;

            const startDateTime = `${startDateRaw}T08:30:00+07:00`;
            const endDateTime = `${endDateRaw}T16:30:00+07:00`;

            const gcalResponse = await calendar.events.insert({
              calendarId: targetCalendarId,
              requestBody: {
                summary: `[${updated.bookingFaculty || 'คณะ'}] ${updated.destination || 'ภารกิจใช้รถตู้'}`,
                description: `ผู้ขอใช้บริการ: ${updated.requester || '-'}\nหน่วยงาน: ${updated.bookingFaculty || '-'}\nวัตถุประสงค์: ${updated.purpose || '-'}\nขอบเขตการเดินทาง: ${updated.tripType || 'ในจังหวัดพะเยา'}\nผู้โดยสาร: ${updated.passengers || 1} คน`,
                start: { dateTime: startDateTime, timeZone: 'Asia/Bangkok' },
                end: { dateTime: endDateTime, timeZone: 'Asia/Bangkok' },
              },
            });

            if (gcalResponse.data.id) {
              updateStoredCalendarEvent(updated.id, { gcalId: gcalResponse.data.id });
            }
          }
        }
      } catch (gcalErr) {
        console.warn("Google Calendar Push Update Warning:", gcalErr instanceof Error ? gcalErr.message : gcalErr);
      }
    }

    // Invalidate Google Calendar cache
    const globalCacheObj = globalThis as unknown as { gcalCache?: Record<string, unknown> };
    if (globalCacheObj.gcalCache) {
      globalCacheObj.gcalCache = {};
    }
    Object.keys(gcalCache).forEach(k => delete gcalCache[k]);

    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const gcalId = searchParams.get("gcalId");
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    // 1. Delete from local JSON stored events if applicable
    const allEvents = getStoredCalendarEvents();
    const storedEvent = allEvents.find(e => String(e.id) === String(id));
    
    if (storedEvent) {
      if (authUser.role === 'FACULTY_ADMIN') {
        const adminFacultyId = String(authUser.facultyId || '');
        const adminFacultyName = authUser.faculty?.nameTh || '';
        const matchesId = storedEvent.facultyId === adminFacultyId;
        const matchesName = storedEvent.bookingFaculty === adminFacultyName;
        
        if (!matchesId && !matchesName) {
          return NextResponse.json({ success: false, error: "Forbidden: ท่านสามารถลบได้เฉพาะตารางงานของคณะตนเองเท่านั้น" }, { status: 403 });
        }
      }
      deleteStoredCalendarEvent(id);
    }

    // 2. Delete from Prisma Database booking if id starts with bk-
    if (String(id).startsWith("bk-")) {
      const bookingId = String(id).replace("bk-", "");
      try {
        await prisma.booking.delete({ where: { id: bookingId } });
      } catch (dbErr) {
        console.warn("Notice: Booking already deleted or not found in DB:", dbErr);
      }
    }

    // 3. Sync delete to Google Calendar
    const targetGcalId = gcalId || (storedEvent?.gcalId) || (String(id).startsWith('gcal-') ? String(id).replace('gcal-', '') : null);

    if (targetGcalId && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);

        // Collect all potential calendar IDs to search and delete
        const candidateCalendars = new Set<string>();
        if (process.env.GOOGLE_CALENDAR_ID) candidateCalendars.add(process.env.GOOGLE_CALENDAR_ID);
        if (FACULTY_CALENDARS.ICT) candidateCalendars.add(FACULTY_CALENDARS.ICT);
        if (FACULTY_CALENDARS.PHARM) candidateCalendars.add(FACULTY_CALENDARS.PHARM);
        if (FACULTY_CALENDARS.SCI) candidateCalendars.add(FACULTY_CALENDARS.SCI);

        try {
          const dbFaculties = await prisma.faculty.findMany({ where: { googleCalendarId: { not: null } } });
          dbFaculties.forEach(f => {
            if (f.googleCalendarId) candidateCalendars.add(f.googleCalendarId);
          });
        } catch {
          // ignore DB error
        }

        // Delete from all candidate calendars in parallel
        await Promise.all(
          Array.from(candidateCalendars).map(async (calId) => {
            try {
              await calendar.events.delete({
                calendarId: calId,
                eventId: targetGcalId,
              });
            } catch {
              // Not in this particular calendar or already deleted
            }
          })
        );
      } catch (gcalErr) {
        console.warn("Google Calendar Push Delete Warning:", gcalErr instanceof Error ? gcalErr.message : gcalErr);
      }
    }

    // 4. Invalidate Google Calendar cache immediately
    const globalCacheObj = globalThis as unknown as { gcalCache?: Record<string, unknown> };
    if (globalCacheObj.gcalCache) {
      globalCacheObj.gcalCache = {};
    }
    Object.keys(gcalCache).forEach(k => delete gcalCache[k]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
  }
}
