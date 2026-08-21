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
import { UnifiedVanInfo } from "@/Frontend/data/faculty-vans";
import { getAuthUser } from "@/app/actions/auth";

interface GoogleCalendarCache {
  events: CalendarEventRecord[];
  timestamp: number;
}
const globalForGcal = globalThis as unknown as { gcalCache?: Record<string, GoogleCalendarCache> };
const gcalCache: Record<string, GoogleCalendarCache> = globalForGcal.gcalCache ?? (globalForGcal.gcalCache = {});
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export const FACULTY_CALENDARS = {
  ICT: 'e9735a3152fcec368b15ac7f64dd21046a923cc5c4d3f9aafac8f706285a40a8@group.calendar.google.com',
  PHARM: 'afa36bd97fd57a882373e89ff4c9c5d6a532296de29bdf15caced34a4e7e2b8c@group.calendar.google.com',
  SCI: '280eacd5718c2e5c941b02395a80926cdb097721dd2de39cc3c01f3c6183075c@group.calendar.google.com'
};

async function resolveCalendarId(vanId?: string): Promise<string | undefined> {
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

export async function handleSystemCalendarEvents(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  let events = getStoredCalendarEvents();

  // Merge live bookings from Database/System Bookings
  try {
    await getAuthUser();
    let facultyId: number | undefined;
    // We intentionally DO NOT filter by facultyId here. The system calendar 
    // is meant to be a global view so faculties can see each other's schedules 
    // for cross-faculty borrowing. The client-side handles filtering.

    const dbBookings = await listBookings(undefined, facultyId);
    const dbEvents: CalendarEventRecord[] = dbBookings.map(b => {
      const startDate = new Date(b.startAt);
      const endDate = new Date(b.endAt);
      
      const startTime = isNaN(startDate.getTime()) ? "08:30" : startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const endTime = isNaN(endDate.getTime()) ? "16:30" : endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      
      return {
        id: `bk-${b.id}`,
        vanId: b.assignedVanId || "v-ict",
        facultyId: b.requesterFacultyId ? String(b.requesterFacultyId) : "ict",
        bookingFaculty: b.requesterFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
        destination: b.destination,
        purpose: b.purpose,
        purposeDetail: b.purpose,
        routeDetail: b.destination,
        date: b.startAt ? b.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        time: `${startTime} - ${endTime} น.`,
        passengers: b.passengers || 1,
        requester: b.requester || "ผู้ขอใช้รถ",
        department: "ระบบจองรถตู้",
        status: (b.status === "APPROVED" || b.status === "COMPLETED") ? "approved" : "pending",
        statusText: b.status === "APPROVED" ? "อนุมัติแล้ว" : (b.status === "COMPLETED" ? "เสร็จสิ้นภารกิจ" : "รอการอนุมัติ"),
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
      const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
      const cacheKey = `${year}-${month}`;
      
      let googleEventsMapped: CalendarEventRecord[] = [];

      if (gcalCache[cacheKey] && (Date.now() - gcalCache[cacheKey].timestamp < CACHE_TTL_MS)) {
        googleEventsMapped = gcalCache[cacheKey].events;
      } else {
        const timeMin = new Date(year, month - 1, 1).toISOString();
        const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString();
        
        const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar.readonly']);
        
        // Determine which calendars to fetch
        const allGoogleCalendarIds: Array<{ id: string; facultyName: string; facultyId: string }> = [];
        try {
          const faculties = await prisma.faculty.findMany({
            where: { googleCalendarId: { not: null } }
          });
          faculties.forEach(f => {
            if (f.googleCalendarId) {
              allGoogleCalendarIds.push({
                id: f.googleCalendarId,
                facultyName: f.nameTh,
                facultyId: f.id.toString()
              });
            }
          });
        } catch (err) {
          console.warn("Failed to fetch faculties for calendar IDs", err);
        }

        // Fallback to central calendar if no specific ones are configured or as an addition
        const centralCalendarId = process.env.GOOGLE_CALENDAR_ID;
        if (centralCalendarId && !allGoogleCalendarIds.find(c => c.id === centralCalendarId)) {
          allGoogleCalendarIds.push({
            id: centralCalendarId,
            facultyName: 'คณะรวม (Central)',
            facultyId: 'central'
          });
        }

        // Add specific faculty calendars if not already in DB
        const extraCalendars = [
          { id: FACULTY_CALENDARS.PHARM, facultyName: 'คณะเภสัชศาสตร์', facultyId: 'pharm' },
          { id: FACULTY_CALENDARS.ICT, facultyName: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร', facultyId: 'ict' },
          { id: FACULTY_CALENDARS.SCI, facultyName: 'คณะวิทยาศาสตร์', facultyId: 'sci' }
        ];

        for (const extraCal of extraCalendars) {
          if (!allGoogleCalendarIds.find(c => c.id === extraCal.id)) {
            allGoogleCalendarIds.push(extraCal);
          }
        }

        const fetchPromises = allGoogleCalendarIds.map(async (cal) => {
          try {
            const response = await calendar.events.list({
              calendarId: cal.id,
              timeMin,
              timeMax,
              maxResults: 250,
              singleEvents: true,
              orderBy: 'startTime',
            });
            return { items: response.data.items, meta: cal };
          } catch (err) {
            console.warn(`Failed to fetch calendar ${cal.id}`, err);
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
            if (match && match[1]) {
              cleanSummary = match[1];
            }

            const vanMatch = facultyVansList.find(v => v.facultyName === facultyName || v.facultyId === facultyId);
            const correctVanId = vanMatch ? vanMatch.id : (facultyId === 'pharm' ? 'v-pharm' : 'v-ict');

            const startDateStr = rawStart.slice(0, 10);
            let returnDateStr = startDateStr;

            if (isAllDay && item.end?.date) {
              // Google Calendar all-day event end.date is exclusive (e.g. 2026-09-02 for a 1-day event on 2026-09-01)
              const parsedEnd = new Date(item.end.date);
              parsedEnd.setDate(parsedEnd.getDate() - 1);
              const prevDayStr = parsedEnd.toISOString().slice(0, 10);
              if (prevDayStr >= startDateStr) {
                returnDateStr = prevDayStr;
              }
            } else if (item.end?.dateTime) {
              const endDateTime = new Date(item.end.dateTime);
              if (endDateTime.getHours() === 0 && endDateTime.getMinutes() === 0 && endDateTime.getSeconds() === 0) {
                endDateTime.setDate(endDateTime.getDate() - 1);
              }
              const parsedEndStr = endDateTime.toISOString().slice(0, 10);
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

  if (yearParam && monthParam) {
    const y = Number(yearParam);
    const m = Number(monthParam);
    events = events.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === y && (d.getMonth() + 1) === m;
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
  });
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const created = addStoredCalendarEvent(body);

    // Push new event to Google Calendar API if configured
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
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

    // Invalidate Google Calendar cache
    Object.keys(gcalCache).forEach(k => delete gcalCache[k]);

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

    // Sync update to Google Calendar
    const targetGcalId = gcalId || (updated?.gcalId) || (String(id).startsWith('gcal-') ? String(id).replace('gcal-', '') : null);

    if (targetGcalId && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const targetCalendarId = await resolveCalendarId(updated?.vanId || fields.vanId);

        if (targetCalendarId) {
          const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
          await calendar.events.patch({
            calendarId: targetCalendarId,
            eventId: targetGcalId,
            requestBody: {
              summary: fields.destination ? `[${fields.bookingFaculty || 'คณะ'}] ${fields.destination}` : undefined,
              description: fields.purpose ? `วัตถุประสงค์: ${fields.purpose}` : undefined,
            },
          });
        }
      } catch (gcalErr) {
        console.warn("Google Calendar Push Update Warning:", gcalErr instanceof Error ? gcalErr.message : gcalErr);
      }
    }

    // Invalidate Google Calendar cache
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
