import fs from 'fs';
import path from 'path';
import { NextResponse } from "next/server";
import { 
  getStoredCalendarEvents, 
  addStoredCalendarEvent, 
  updateStoredCalendarEvent, 
  deleteStoredCalendarEvent,
  CalendarEventRecord
} from "@/Backend/services/calendar-store";
import { getGoogleCalendarClient } from "@/Backend/services/google-calendar";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@prisma/client";

export interface MappedDbBooking {
  id: string;
  requester: string;
  phone: string;
  requesterFaculty: string;
  requesterFacultyId: number;
  targetFaculty: string;
  targetFacultyId: number;
  destination: string;
  purpose: string;
  passengers: number;
  startAt: string;
  endAt: string;
  submittedAt: string;
  budgetSource: string;
  tripType: string;
  status: string;
  assignedDriverName: string;
  assignedVanPlate: string;
}
import { UnifiedVanInfo } from "@/Frontend/data/faculty-vans";
import { getAuthUser } from "@/lib/auth-util";

interface GoogleCalendarCache {
  events: CalendarEventRecord[];
  timestamp: number;
}

const GCAL_CACHE_FILE = path.join(process.cwd(), 'Backend', 'data', 'gcal-cache.json');
const CACHE_FRESH_MS = 60 * 1000; // 60 seconds fresh

function loadGcalCacheFromFile(): Record<string, GoogleCalendarCache> {
  try {
    if (fs.existsSync(GCAL_CACHE_FILE)) {
      const raw = fs.readFileSync(GCAL_CACHE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read gcal cache file:", e);
  }
  return {};
}

function saveGcalCacheToFile(cacheData: Record<string, GoogleCalendarCache>) {
  console.log('[GCAL CACHE] Saving cache to:', GCAL_CACHE_FILE, 'keys:', Object.keys(cacheData));
  try {
    const dir = path.dirname(GCAL_CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(GCAL_CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
  } catch (e) {
    console.warn("Failed to write gcal cache file:", e);
  }
}

const globalForGcal = globalThis as unknown as { 
  gcalCache?: Record<string, GoogleCalendarCache>;
  isFetching?: Record<string, boolean>;
  cachedVans?: { data: UnifiedVanInfo[]; timestamp: number } | null;
  cachedDbBookings?: { data: MappedDbBooking[]; timestamp: number } | null;
};

if (!globalForGcal.gcalCache) {
  globalForGcal.gcalCache = loadGcalCacheFromFile();
}
if (!globalForGcal.isFetching) {
  globalForGcal.isFetching = {};
}
const gcalCache = globalForGcal.gcalCache;

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
    // 1. Check if vanIdNum matches a Van
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

    // 2. Check if vanIdNum matches a Faculty directly
    const fac = await prisma.faculty.findUnique({
      where: { id: vanIdNum }
    });
    if (fac) {
      if (fac.googleCalendarId) return fac.googleCalendarId;
      if (fac.nameTh.includes('เภสัช')) return FACULTY_CALENDARS.PHARM;
      if (fac.nameTh.includes('วิทยาศาสตร์')) return FACULTY_CALENDARS.SCI;
      if (fac.nameTh.includes('สารสนเทศ') || fac.nameTh.includes('ICT')) return FACULTY_CALENDARS.ICT;
    }
  }

  // 3. String keywords & mapping
  const cleanId = String(vanId).trim().toLowerCase();
  if (cleanId.includes('pharm') || cleanId.includes('เภสัช') || cleanId === '6') return FACULTY_CALENDARS.PHARM;
  if (cleanId.includes('sci') || (cleanId.includes('วิทย์') && !cleanId.includes('สารสนเทศ')) || cleanId === '2') return FACULTY_CALENDARS.SCI;
  if (cleanId.includes('ict') || cleanId.includes('สารสนเทศ') || cleanId === '1') return FACULTY_CALENDARS.ICT;

  try {
    const facByName = await prisma.faculty.findFirst({
      where: {
        OR: [
          { nameTh: { contains: String(vanId).replace('คณะ', '').trim() } },
          { nameEn: { contains: String(vanId).trim() } }
        ]
      }
    });
    if (facByName?.googleCalendarId) return facByName.googleCalendarId;
  } catch {}

  return defaultCalendarId;
}


export function removeEventFromCache(id: string, gcalId?: string) {
  invalidateDbBookingsCache();
  if (globalForGcal.gcalCache) {
    let modified = false;
    Object.keys(globalForGcal.gcalCache).forEach(yearKey => {
      const entry = globalForGcal.gcalCache![yearKey];
      if (entry && Array.isArray(entry.events)) {
        const initialLen = entry.events.length;
        entry.events = entry.events.filter(e => 
          String(e.id) !== String(id) && 
          String(e.id) !== `bk-${id}` && 
          String(e.id) !== `gcal-${id}` && 
          (!gcalId || String(e.gcalId) !== String(gcalId))
        );
        if (entry.events.length !== initialLen) {
          modified = true;
          entry.timestamp = Date.now();
        }
      }
    });
    if (modified) {
      saveGcalCacheToFile(globalForGcal.gcalCache);
    }
  }
}

export function addOrUpdateEventInCache(event: CalendarEventRecord) {
  invalidateDbBookingsCache();
  const year = new Date(event.date).getFullYear();
  const yearKey = `year-${year}`;
  if (globalForGcal.gcalCache) {
    if (!globalForGcal.gcalCache[yearKey]) {
      globalForGcal.gcalCache[yearKey] = { events: [], timestamp: Date.now() };
    }
    const entry = globalForGcal.gcalCache[yearKey];
    entry.events = [event, ...entry.events.filter(e => String(e.id) !== String(event.id))];
    entry.timestamp = Date.now();
    saveGcalCacheToFile(globalForGcal.gcalCache);
  }
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

    invalidateDbBookingsCache();
    const gcalId = gcalResponse.data.id;
    if (gcalId) {
      addOrUpdateEventInCache({
        id: `gcal-${gcalId}`,
        gcalId: gcalId,
        vanId: booking.assignedVanId || '1',
        facultyId: booking.assignedVanId || '1',
        date: startDateRaw,
        returnDate: endDateRaw,
        time: booking.startAt && booking.startAt.includes('T') ? new Date(booking.startAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.' : '08:30 น.',
        destination: booking.destination,
        purpose: booking.purpose || booking.destination,
        passengers: booking.passengers || 1,
        status: 'approved',
        bookingFaculty: booking.requesterFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
        requester: booking.requester || 'Google Calendar Sync',
        department: 'Google Calendar Live',
        purposeDetail: booking.purpose,
        routeDetail: booking.destination,
        statusText: 'ซิงค์จาก Google Calendar',
        statusTime: 'Live Data',
        createdAt: new Date().toISOString()
      });
    }
    return gcalResponse.data.id;
  } catch (err) {
    console.warn("Failed to push approved booking to Google Calendar:", err);
    return null;
  }
}

async function fetchGoogleCalendarEvents(year: number): Promise<CalendarEventRecord[]> {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return [];
  try {
    const timeMin = new Date(year, 0, 1, 0, 0, 0).toISOString();
    const timeMax = new Date(year, 11, 31, 23, 59, 59).toISOString();
    const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar.readonly']);

    const allGoogleCalendarIds: Array<{ id: string; facultyName: string; facultyId: string; vanId: string }> = [
      { id: FACULTY_CALENDARS.ICT, facultyName: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร', facultyId: '1', vanId: '1' },
      { id: FACULTY_CALENDARS.PHARM, facultyName: 'คณะเภสัชฯ', facultyId: '6', vanId: '6' },
      { id: FACULTY_CALENDARS.SCI, facultyName: 'คณะวิทยาศาสตร์', facultyId: '2', vanId: '2' }
    ];

    // Filter out duplicates
    const uniqueCalendars = allGoogleCalendarIds.filter((c, idx, arr) => arr.findIndex(x => x.id === c.id) === idx);

    const fetchPromises = uniqueCalendars.map(async (cal) => {
      try {
        const fetchWithTimeout = Promise.race([
          calendar.events.list({
            calendarId: cal.id,
            timeMin,
            timeMax,
            maxResults: 250,
            singleEvents: true,
            orderBy: 'startTime',
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4500))
        ]);

        const response = await fetchWithTimeout;
        return { items: response.data.items || [], meta: cal };
      } catch {
        return null;
      }
    });

    const responses = await Promise.allSettled(fetchPromises);
    let googleEventsMapped: CalendarEventRecord[] = [];

    responses.forEach((result) => {
      if (result.status !== 'fulfilled' || !result.value || !result.value.items || result.value.items.length === 0) return;
      const res = result.value;
      const mapped: CalendarEventRecord[] = res.items.map((item, index) => {
        const isAllDay = !!(item.start?.date && !item.start?.dateTime);
        const rawStart = item.start?.dateTime || item.start?.date || new Date().toISOString();
        const summary = item.summary || 'ภารกิจใช้รถตู้';
        const description = item.description || '';
        
        let facultyName = res.meta.facultyName;
        let facultyId = res.meta.facultyId;

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

        const correctVanId = res.meta.vanId || (facultyId === '6' ? '6' : facultyId === '2' ? '2' : '1');

        const startDateStr = formatBangkokDate(rawStart);
        let returnDateStr = startDateStr;

        if (isAllDay && item.end?.date) {
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
          bookingFaculty: facultyName === 'คณะเภสัชศาสตร์' ? 'คณะเภสัชฯ' : facultyName,
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

    const cacheKey = `year-${year}`;
    gcalCache[cacheKey] = {
      events: googleEventsMapped,
      timestamp: Date.now()
    };
    saveGcalCacheToFile(gcalCache);

    return googleEventsMapped;
  } catch (err) {
    console.warn("Google Calendar fetch error:", err);
    return [];
  }
}


export function invalidateDbBookingsCache() {
  if (globalForGcal) {
    globalForGcal.cachedDbBookings = null;
    if (globalForGcal.cachedVans) globalForGcal.cachedVans = null;
  }
}

async function getCachedDbBookings(): Promise<MappedDbBooking[]> {
  const cached = globalForGcal.cachedDbBookings;
  if (cached && (Date.now() - cached.timestamp < 60 * 1000)) {
    return cached.data;
  }

  try {
    const rawRows = await prisma.$queryRaw<Array<{
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
      phone: string | null;
      requester: string | null;
      requesterFaculty: string | null;
      requesterFacultyId: number | null;
      targetFaculty: string | null;
      targetFacultyId: number | null;
      assignedDriverName: string | null;
      vanPlate: string | null;
    }>>`
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
        b.phone,
        u.name AS requester,
        f.name_th AS "requesterFaculty",
        f.id AS "requesterFacultyId",
        tf.name_th AS "targetFaculty",
        b.target_faculty_id AS "targetFacultyId",
        du.name AS "assignedDriverName",
        v.plate AS "vanPlate"
      FROM bookings b
      LEFT JOIN users u ON u.id = b.requester_id
      LEFT JOIN faculties f ON f.id = u.faculty_id
      LEFT JOIN faculties tf ON tf.id = b.target_faculty_id
      LEFT JOIN drivers d ON d.id = b.assigned_driver_id
      LEFT JOIN users du ON du.id = d.user_id
      LEFT JOIN vans v ON v.id = d.assigned_van_id
      WHERE b.status != 'REJECTED'
      ORDER BY b.created_at DESC;
    `;

    const mapped: MappedDbBooking[] = rawRows.map(b => ({
      id: b.id,
      requester: b.requester || "ผู้ขอใช้บริการ",
      phone: b.phone || "-",
      requesterFaculty: b.requesterFaculty || (b.requesterFacultyId === 6 ? "คณะเภสัชฯ" : "คณะเทคโนโลยีสารสนเทศและการสื่อสาร"),
      requesterFacultyId: b.requesterFacultyId || 1,
      targetFaculty: b.targetFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
      targetFacultyId: b.targetFacultyId || 1,
      destination: b.destination,
      purpose: b.purpose,
      passengers: b.passengers || 1,
      startAt: b.startAt ? new Date(b.startAt).toISOString() : new Date().toISOString(),
      endAt: b.endAt ? new Date(b.endAt).toISOString() : new Date().toISOString(),
      submittedAt: b.submittedAt ? new Date(b.submittedAt).toISOString() : new Date().toISOString(),
      budgetSource: b.budgetSource || "งบประมาณคณะ",
      tripType: b.tripType || "ในจังหวัดพะเยา",
      status: b.status,
      assignedDriverName: b.assignedDriverName || "ยังไม่ระบุคนขับ",
      assignedVanPlate: b.vanPlate || "ยังไม่ผูกทะเบียน",
    }));

    globalForGcal.cachedDbBookings = { data: mapped, timestamp: Date.now() };
    return mapped;
  } catch (err) {
    console.error("Error fetching live bookings from DB for calendar:", err);
    return globalForGcal.cachedDbBookings?.data || [];
  }
}

async function getCachedRealVans(): Promise<UnifiedVanInfo[]> {
  if (globalForGcal.cachedVans && (Date.now() - globalForGcal.cachedVans.timestamp < 120 * 1000)) {
    return globalForGcal.cachedVans.data;
  }
  try {
    const rawVans = await prisma.$queryRaw<Array<{
      id: number;
      facultyId: number;
      facultyName: string | null;
      name: string | null;
      plate: string | null;
      image: string | null;
      driverName: string | null;
      driverPhone: string | null;
      driverAvatar: string | null;
    }>>`
      SELECT 
        v.id,
        v.faculty_id AS "facultyId",
        f.name_th AS "facultyName",
        v.name,
        v.plate,
        v.image AS image,
        u.name AS "driverName",
        d.phone AS "driverPhone",
        COALESCE(d.avatar, u.avatar) AS "driverAvatar"
      FROM vans v
      LEFT JOIN faculties f ON f.id = v.faculty_id
      LEFT JOIN drivers d ON d.assigned_van_id = v.id
      LEFT JOIN users u ON u.id = d.user_id
      ORDER BY v.id ASC;
    `;

    if (rawVans && rawVans.length > 0) {
      const mapped: UnifiedVanInfo[] = rawVans.map(v => {
        return {
          id: v.id.toString(),
          facultyId: v.facultyId.toString(),
          facultyName: v.facultyName || "มหาวิทยาลัยพะเยา",
          shortFacultyName: v.facultyName?.replace('คณะ', '').trim() || "พะเยา",
          vanName: v.name || `รถตู้ ${v.facultyName || ''} (${v.plate})`,
          plate: v.plate || "ไม่ระบุทะเบียน",
          driverName: v.driverName || "ยังไม่ระบุคนขับ",
          driverPhone: v.driverPhone || "-",
          driverImage: (v.driverAvatar && !v.driverAvatar.includes('unsplash.com')) ? v.driverAvatar : "",
          vanImage: (v.image && !v.image.includes('unsplash.com') && (v.image.startsWith('http') || v.image.startsWith('data:image') || v.image.startsWith('/'))) ? v.image : ""
        };
      });
      globalForGcal.cachedVans = { data: mapped, timestamp: Date.now() };
      return mapped;
    }
  } catch (err) {
    console.error("Notice: Error fetching real vans from DB:", err);
  }
  return globalForGcal.cachedVans?.data || [];
}

export async function handleSystemCalendarEvents(request: Request) {
    const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  let events = getStoredCalendarEvents();

  // Merge live bookings from Database/System Bookings
  try {
        const allDbBookings = await getCachedDbBookings();
        const activeDbBookings = allDbBookings.filter(b => b.status !== 'REJECTED');

    const dbEvents: CalendarEventRecord[] = activeDbBookings.map(b => {
      const startDate = new Date(b.startAt);
      const endDate = new Date(b.endAt);
      
      const startTime = isNaN(startDate.getTime()) ? "08:30" : startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const endTime = isNaN(endDate.getTime()) ? "16:30" : endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      
      const isApproved = b.status === "APPROVED" || b.status === "COMPLETED";
      const facultyIdStr = b.targetFacultyId ? String(b.targetFacultyId) : String(b.requesterFacultyId || "1");

      return {
        id: `bk-${b.id}`,
        vanId: facultyIdStr,
        facultyId: facultyIdStr,
        bookingFaculty: b.requesterFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
        targetFaculty: b.targetFaculty || undefined,
        destination: b.destination,
        purpose: b.purpose,
        purposeDetail: b.purpose,
        routeDetail: b.destination,
        date: b.startAt ? b.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        returnDate: b.endAt ? b.endAt.slice(0, 10) : (b.startAt ? b.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        time: `${startTime} - ${endTime} น.`,
        passengers: b.passengers || 1,
        requester: b.requester || "ผู้ขอใช้รถ",
        phone: b.phone || "",
        department: b.requesterFaculty || "ระบบจองรถตู้",
        status: isApproved ? "approved" : "pending",
        statusText: isApproved 
          ? "อนุมัติแล้ว" 
          : (b.targetFacultyId && b.requesterFacultyId && b.targetFacultyId !== b.requesterFacultyId 
              ? "รอการยืนยันจากคณะเจ้าของรถ (ยืมรถ)" 
              : (b.status === "WAITING_EXEC" ? "รอดำเนินการ (รอคณบดีอนุมัติ)" : "รอดำเนินการ (รอแอดมินคณะอนุมัติ)")),
        statusTime: "ระบบการจอง",
        tripType: (b.tripType as "ในจังหวัดพะเยา" | "ต่างจังหวัด") || "ในจังหวัดพะเยา",
        createdAt: b.submittedAt || new Date().toISOString()
      };
    });

    // Map DB events by id so live database data updates store without wiping rich metadata
    const dbEventMap = new Map(dbEvents.map(e => [e.id, e]));
    events = events.map(e => {
      if (e.id && dbEventMap.has(e.id)) {
        const live = dbEventMap.get(e.id)!;
        return {
          ...e,
          ...live,
          attachments: e.attachments || live.attachments || [],
          assignedVans: e.assignedVans || live.assignedVans,
          vanId: e.vanId || live.vanId,
          targetFaculty: live.targetFaculty || e.targetFaculty,
          bookingFaculty: live.bookingFaculty || e.bookingFaculty
        };
      }
      return e;
    });

    const existingIds = new Set(events.map(e => e.id));
    const newDbEvents = dbEvents.filter(e => !existingIds.has(e.id));
    events = [...newDbEvents, ...events];

    // Filter out any bk- events that are marked REJECTED in the DB
    const rejectedBookingIds = new Set(allDbBookings.filter(b => b.status === 'REJECTED').map(b => `bk-${b.id}`));
    events = events.filter(e => !rejectedBookingIds.has(e.id));
  } catch (err) {
    console.warn("Notice: Failed to fetch DB bookings for calendar:", err);
  }

  // Sync live events from Google Calendar API (with SWR caching)
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
      const cacheKey = `year-${year}`;
      
      // Check in-memory and disk cache
      let cached = gcalCache[cacheKey];
      if (!cached || !cached.events || cached.events.length === 0) {
        const diskCache = loadGcalCacheFromFile();
        if (diskCache && diskCache[cacheKey] && diskCache[cacheKey].events && diskCache[cacheKey].events.length > 0) {
          cached = diskCache[cacheKey];
          gcalCache[cacheKey] = cached;
        }
      }

      let googleEventsMapped: CalendarEventRecord[] = [];

      if (!cached || !cached.events || cached.events.length === 0) {
        const diskCache = loadGcalCacheFromFile();
        if (diskCache && diskCache[cacheKey] && diskCache[cacheKey].events && diskCache[cacheKey].events.length > 0) {
          cached = diskCache[cacheKey];
          gcalCache[cacheKey] = cached;
          googleEventsMapped = cached.events;
        } else {
          try {
            googleEventsMapped = await fetchGoogleCalendarEvents(year);
          } catch {
            googleEventsMapped = [];
          }
        }
      } else {
        googleEventsMapped = cached.events;
        // Non-blocking background revalidation if stale (> 60 seconds)
        const isStale = (Date.now() - cached.timestamp) > CACHE_FRESH_MS;
        if (isStale && !globalForGcal.isFetching?.[cacheKey]) {
          if (globalForGcal.isFetching) globalForGcal.isFetching[cacheKey] = true;
          fetchGoogleCalendarEvents(year).finally(() => {
            if (globalForGcal.isFetching) globalForGcal.isFetching[cacheKey] = false;
          });
        }
      }

      if (googleEventsMapped.length > 0) {
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

  // Fetch real vans strictly from Supabase DB
  const realVansList = await getCachedRealVans();
  const allVans = [...realVansList];

  // Deduplicate events to guarantee unique IDs
  const seenEventIds = new Set<string>();
  const uniqueEvents: CalendarEventRecord[] = [];
  for (const ev of events) {
    if (ev.id && !seenEventIds.has(ev.id)) {
      seenEventIds.add(ev.id);
      uniqueEvents.push(ev);
    }
  }
  events = uniqueEvents;

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

      const vanInfo = allVans.find(v => v.id === event.vanId || v.facultyId === event.facultyId || (event.vanId && v.facultyId === event.vanId));
      const plate = vanInfo ? vanInfo.plate : (event.assignedVans?.[0]?.plate || event.vanId);
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
          ownerFacultyName: event.targetFaculty || (vanInfo ? vanInfo.facultyName : undefined)
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
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
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
    const initialStatus = body.status === 'approved' ? 'approved' : 'pending';

    // Extract selected vans (supports multi-van bookings e.g. 1 own van + 2 borrowed vans)
    const rawSelectedVans: Array<{
      id: string;
      vanId: string;
      facultyName: string;
      plate?: string;
      driverName?: string;
      phone?: string;
      isBorrow?: boolean;
    }> = Array.isArray(body.selectedVans) && body.selectedVans.length > 0
      ? body.selectedVans
      : [{
          id: `van-${Date.now()}-1`,
          vanId: body.vanId || 'v-ict',
          facultyName: body.targetFaculty || body.bookingFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
          plate: body.plate || '',
          driverName: body.driverName || '',
          phone: body.phone || '',
          isBorrow: body.status === 'pending_cross_faculty' || body.vanType === 'BORROW' || false
        }];

    const userFacultyName = body.bookingFaculty || authUser.faculty?.nameTh || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร";
    const userFaculty = (await prisma.faculty.findFirst({
      where: { nameTh: userFacultyName }
    })) || (await prisma.faculty.findFirstOrThrow({ orderBy: { id: "asc" } }));

    let requester = null;
    const requesterName = (body.requester || '').trim();

    if (requesterName && requesterName !== authUser.name) {
      requester = await prisma.user.findFirst({ where: { name: requesterName } });
      if (!requester) {
        const slug = requesterName.replace(/\s+/g, ".").toLowerCase().replace(/[^a-z0-9.]/g, "") || "user";
        requester = await prisma.user.create({
          data: {
            facultyId: userFaculty.id,
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
            facultyId: userFaculty.id,
            name: authUser.name || "ผู้ขอใช้บริการ",
            email: `${Date.now()}-user@example.local`,
            role: authUser.role || "FACULTY_ADMIN"
          }
        });
      }
    }

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

    const latest = await prisma.booking.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
    let lastNumber = latest ? Number((latest.id.match(/(\d+)/)?.[1] || "0")) : 64;

    const createdEvents: CalendarEventRecord[] = [];
    const createdDbBookings: string[] = [];

    // Loop through ALL selected vans to create distinct bookings and calendar events
    for (let i = 0; i < rawSelectedVans.length; i++) {
      const sv = rawSelectedVans[i];
      lastNumber += 1;
      const dbBookingId = `UPV-2569-${lastNumber.toString().padStart(4, "0")}`;

      // Resolve target faculty for this specific van
      let targetFaculty = userFaculty;
      if (sv.facultyName) {
        const found = await prisma.faculty.findFirst({
          where: { nameTh: { contains: sv.facultyName.replace('คณะ', '') } }
        });
        if (found) targetFaculty = found;
      }
      if (sv.vanId) {
        const vanNum = parseInt(String(sv.vanId).replace(/\D/g, ''));
        if (!isNaN(vanNum)) {
          const v = await prisma.van.findUnique({ where: { id: vanNum }, include: { faculty: true } });
          if (v?.faculty) targetFaculty = v.faculty;
        }
      }

      const isBorrow = sv.isBorrow === true || (sv.facultyName && sv.facultyName !== userFacultyName);
      const isApproved = initialStatus === 'approved';
      const isFacultyAdminRequester = requester.role === 'FACULTY_ADMIN' || authUser.role === 'FACULTY_ADMIN';
      const dbStatus: BookingStatus = isApproved 
        ? BookingStatus.APPROVED 
        : (isBorrow ? BookingStatus.WAITING_ADMIN : (isFacultyAdminRequester ? BookingStatus.WAITING_EXEC : BookingStatus.WAITING_ADMIN));
      const calendarStatus = isApproved ? 'approved' : 'pending';
      const statusText = isApproved 
        ? "อนุมัติแล้ว" 
        : (isBorrow ? "รอการยืนยันจากคณะเจ้าของรถ (ยืมรถ)" : (isFacultyAdminRequester ? "รอดำเนินการ (รอคณบดีอนุมัติ)" : "รอดำเนินการ (รอแอดมินคณะอนุมัติ)"));

      const vanSuffix = rawSelectedVans.length > 1
        ? ` (คันที่ ${i + 1}/${rawSelectedVans.length} - ${isBorrow ? `ยืมรถ${targetFaculty.nameTh}` : 'รถประจำคณะ'})`
        : '';

      let autoAssignedDriverId: number | null = null;
      if (sv.driverName) {
        const cleanName = sv.driverName.trim();
        const dUser = await prisma.user.findFirst({
          where: { name: { contains: cleanName } },
          include: { driverProfile: true }
        });
        if (dUser?.driverProfile) {
          autoAssignedDriverId = dUser.driverProfile.id;
        } else {
          const directDriver = await prisma.driver.findFirst({
            where: { user: { name: { contains: cleanName } } }
          });
          if (directDriver) autoAssignedDriverId = directDriver.id;
        }
      }
      if (!autoAssignedDriverId && targetFaculty?.id) {
        const facDriver = await prisma.driver.findFirst({ where: { facultyId: targetFaculty.id } });
        if (facDriver) autoAssignedDriverId = facDriver.id;
      }
      // Double Booking Check: Prevent booking if van already has an approved conflicting booking
      const conflictingApproved = await prisma.booking.findFirst({
        where: {
          targetFacultyId: targetFaculty.id,
          status: BookingStatus.APPROVED,
          departureDate: { lt: isNaN(endDateTime.getTime()) ? new Date() : endDateTime },
          returnDate: { gt: isNaN(startDateTime.getTime()) ? new Date() : startDateTime }
        }
      });
      if (conflictingApproved) {
        return NextResponse.json({
          success: false,
          error: `รถตู้ของ${targetFaculty.nameTh} มีภารกิจที่ได้รับการอนุมัติแล้วในช่วงวันเวลาดังกล่าว (คำขอเลขที่ ${conflictingApproved.id}) กรุณาเลือกวันเวลาอื่นหรือยืมรถจากคณะอื่น`
        }, { status: 409 });
      }

      try {
        await prisma.booking.create({
          data: {
            id: dbBookingId,
            requesterId: requester.id,
            targetFacultyId: targetFaculty.id,
            destination: body.destination || "ไม่ระบุสถานที่",
            objective: `${body.purpose || "ภารกิจใช้รถตู้"}${vanSuffix}`,
            departureDate: isNaN(startDateTime.getTime()) ? new Date() : startDateTime,
            returnDate: isNaN(endDateTime.getTime()) ? new Date() : endDateTime,
            passengersCount: Number(body.passengers || 1),
            phone: body.phone || null,
            budgetSource: body.budgetSource || "งบประมาณคณะ",
            tripType: body.tripType || "ในจังหวัดพะเยา",
            status: dbStatus,
            assignedDriverId: autoAssignedDriverId,
          }
        });
        createdDbBookings.push(dbBookingId);

        if (Array.isArray(body.attachments) && body.attachments.length > 0) {
          for (const att of body.attachments) {
            if (att.url && att.name) {
              const fSize = typeof att.size === 'number' ? Number((att.size / (1024 * 1024)).toFixed(2)) : 0;
              await prisma.attachment.create({
                data: {
                  bookingId: dbBookingId,
                  fileName: att.name,
                  fileUrl: att.url,
                  fileSize: fSize
                }
              }).catch(e => console.warn("Prisma attachment creation note:", e));
            }
          }
        }
      } catch (dbErr) {
        console.warn("Notice: Failed to persist calendar event to Prisma DB:", dbErr);
      }

      const calEvent = addStoredCalendarEvent({
        ...body,
        id: `bk-${dbBookingId}`,
        vanId: sv.vanId,
        facultyId: String(targetFaculty.id),
        bookingFaculty: userFacultyName,
        status: calendarStatus,
        statusText: statusText,
        statusTime: "บันทึกในระบบ",
        assignedVans: rawSelectedVans,
        attachments: Array.isArray(body.attachments) ? body.attachments : []
      });

      createdEvents.push(calEvent);

      // Push to Google Calendar if approved
      if (calEvent.status === 'approved' && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        try {
          const targetCalendarId = await resolveCalendarId(calEvent.vanId);
          if (targetCalendarId) {
            const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
            const startDT = `${startDateRaw}T08:30:00+07:00`;
            const endDT = `${endDateRaw}T16:30:00+07:00`;
            const gcalRes = await calendar.events.insert({
              calendarId: targetCalendarId,
              requestBody: {
                summary: `[${userFacultyName}] ${calEvent.destination || 'ภารกิจใช้รถตู้'}`,
                description: `ผู้ขอใช้บริการ: ${calEvent.requester || '-'}\nหน่วยงาน: ${userFacultyName}\nวัตถุประสงค์: ${calEvent.purpose || '-'}\nผู้โดยสาร: ${calEvent.passengers || 1} คน`,
                start: { dateTime: startDT, timeZone: 'Asia/Bangkok' },
                end: { dateTime: endDT, timeZone: 'Asia/Bangkok' },
              },
            });
            if (gcalRes.data.id) {
              calEvent.gcalId = gcalRes.data.id;
              updateStoredCalendarEvent(calEvent.id, { gcalId: calEvent.gcalId });
            }
          }
        } catch (gcalErr) {
          console.warn("Google Calendar Push Insert Warning:", gcalErr instanceof Error ? gcalErr.message : gcalErr);
        }
      }
    }

    invalidateDbBookingsCache();
    
    return NextResponse.json({ 
      success: true, 
      events: createdEvents, 
      event: createdEvents[0] || null,
      count: createdEvents.length 
    });
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

        if (fields.attachments !== undefined) {
          try {
            await prisma.attachment.deleteMany({ where: { bookingId } });
            if (Array.isArray(fields.attachments) && fields.attachments.length > 0) {
              for (const att of fields.attachments) {
                if (att.url && att.name) {
                  const fSize = typeof att.size === 'number' ? Number((att.size / (1024 * 1024)).toFixed(2)) : 0;
                  await prisma.attachment.create({
                    data: {
                      bookingId,
                      fileName: att.name,
                      fileUrl: att.url,
                      fileSize: fSize
                    }
                  }).catch(e => console.warn("Prisma attachment update note:", e));
                }
              }
            }
          } catch (attErr) {
            console.warn("Attachment sync error on patch:", attErr);
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

    // Invalidate Google Calendar cache for this specific event
    if (targetGcalId) {
      removeEventFromCache(String(id), targetGcalId);
    } else {
      invalidateDbBookingsCache();
    }

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

    // 1. Load stored calendar events and find the target event
    const allEvents = getStoredCalendarEvents();
    const storedEvent = allEvents.find(e => String(e.id) === String(id));
    
    if (storedEvent && authUser.role === 'FACULTY_ADMIN') {
      const adminFacultyId = String(authUser.facultyId || '');
      const adminFacultyName = authUser.faculty?.nameTh || '';
      const matchesId = storedEvent.facultyId === adminFacultyId;
      const matchesName = storedEvent.bookingFaculty === adminFacultyName;
      
      if (!matchesId && !matchesName) {
        return NextResponse.json({ success: false, error: "Forbidden: ท่านสามารถลบได้เฉพาะตารางงานของคณะตนเองเท่านั้น" }, { status: 403 });
      }
    }

    // 2. Identify if this booking is part of a fleet / multi-van or borrowed van request
    const targetSubIds = new Set<string>(
      (storedEvent?.assignedVans || [])
        .map((v: { id: string }) => v.id)
        .filter(Boolean)
    );

    const hasBorrow = Boolean(
      (storedEvent?.assignedVans && storedEvent.assignedVans.some((v: { isBorrow?: boolean }) => v.isBorrow)) ||
      storedEvent?.statusText?.includes('ยืม') ||
      storedEvent?.purpose?.includes('ยืมรถ') ||
      storedEvent?.purpose?.includes('คันที่ ')
    );

    const isFleet = Boolean(
      (storedEvent?.assignedVans && storedEvent.assignedVans.length > 1) ||
      hasBorrow
    );

    const eventsToDelete: CalendarEventRecord[] = storedEvent ? [storedEvent] : [];
    const calendarIdsToDelete = new Set<string>();
    calendarIdsToDelete.add(String(id));

    if (storedEvent && isFleet) {
      const cleanTargetPurpose = (storedEvent.purpose || '').replace(/\s*\(คันที่\s*\d+\/\d+[^)]*\)/g, '').trim();

      for (const ev of allEvents) {
        if (ev.id === storedEvent.id) continue;

        let isSibling = false;
        // A. Match sub-IDs in assignedVans
        if (targetSubIds.size > 0) {
          const evSubIds = (ev.assignedVans || []).map((v: { id: string }) => v.id).filter(Boolean);
          if (evSubIds.some((subId: string) => targetSubIds.has(subId))) {
            isSibling = true;
          }
        }

        // B. Match requestTimestamp
        if (!isSibling && storedEvent.requestTimestamp && ev.requestTimestamp === storedEvent.requestTimestamp && ev.requester === storedEvent.requester) {
          isSibling = true;
        }

        // C. Match trip details
        if (!isSibling && ev.requester === storedEvent.requester && ev.date === storedEvent.date && ev.destination === storedEvent.destination) {
          const cleanEvPurpose = (ev.purpose || '').replace(/\s*\(คันที่\s*\d+\/\d+[^)]*\)/g, '').trim();
          if (cleanEvPurpose === cleanTargetPurpose) {
            isSibling = true;
          }
        }

        if (isSibling) {
          eventsToDelete.push(ev);
          if (ev.id) calendarIdsToDelete.add(String(ev.id));
        }
      }
    }

    // 3. Find and link DB bookings
    const dbBookingIdsToDelete = new Set<string>();
    if (String(id).startsWith("bk-")) {
      dbBookingIdsToDelete.add(String(id).replace("bk-", ""));
    }
    for (const evId of Array.from(calendarIdsToDelete)) {
      if (evId.startsWith("bk-")) {
        dbBookingIdsToDelete.add(evId.replace("bk-", ""));
      }
    }

    // Look up sibling DB bookings
    for (const primaryDbId of Array.from(dbBookingIdsToDelete)) {
      try {
        const currentDbBooking = await prisma.booking.findUnique({ where: { id: primaryDbId } });
        if (currentDbBooking) {
          const cleanObj = currentDbBooking.objective.replace(/\s*\(คันที่\s*\d+\/\d+[^)]*\)/g, '').trim();
          const siblingDbBookings = await prisma.booking.findMany({
            where: {
              requesterId: currentDbBooking.requesterId,
              departureDate: currentDbBooking.departureDate,
              destination: currentDbBooking.destination,
              objective: { contains: cleanObj }
            },
            select: { id: true }
          });
          for (const s of siblingDbBookings) {
            dbBookingIdsToDelete.add(s.id);
            calendarIdsToDelete.add(`bk-${s.id}`);
          }
        }
      } catch (dbFindErr) {
        console.warn("Notice: Error finding sibling DB bookings:", dbFindErr);
      }
    }

    // 4. Delete all collected calendar store events
    for (const cId of Array.from(calendarIdsToDelete)) {
      deleteStoredCalendarEvent(cId);
      removeEventFromCache(cId);
    }

    // 5. Delete all collected DB bookings and their attachments
    for (const bId of Array.from(dbBookingIdsToDelete)) {
      try {
        await prisma.attachment.deleteMany({ where: { bookingId: bId } });
        await prisma.booking.delete({ where: { id: bId } });
      } catch (dbErr) {
        console.warn("Notice: Booking already deleted or not found in DB:", bId, dbErr);
      }
    }

    // 6. Sync delete to Google Calendar for all events
    const allGcalIds = new Set<string>();
    if (gcalId) allGcalIds.add(gcalId);
    for (const ev of eventsToDelete) {
      if (ev.gcalId) allGcalIds.add(ev.gcalId);
      if (String(ev.id).startsWith('gcal-')) allGcalIds.add(String(ev.id).replace('gcal-', ''));
    }

    if (allGcalIds.size > 0 && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      (async () => {
        try {
          const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
          const candidateCalendars = new Set<string>();
          if (process.env.GOOGLE_CALENDAR_ID) candidateCalendars.add(process.env.GOOGLE_CALENDAR_ID);
          if (FACULTY_CALENDARS.ICT) candidateCalendars.add(FACULTY_CALENDARS.ICT);
          if (FACULTY_CALENDARS.PHARM) candidateCalendars.add(FACULTY_CALENDARS.PHARM);
          if (FACULTY_CALENDARS.SCI) candidateCalendars.add(FACULTY_CALENDARS.SCI);

          for (const targetGcalId of Array.from(allGcalIds)) {
            await Promise.all(
              Array.from(candidateCalendars).map(async (calId) => {
                try {
                  await calendar.events.delete({
                    calendarId: calId,
                    eventId: targetGcalId,
                  });
                } catch {
                  // Ignore if not present in this calendar
                }
              })
            );
          }
        } catch (gcalErr) {
          console.warn("Google Calendar Push Delete Warning:", gcalErr);
        }
      })();
    }

    // 7. Invalidate cache
    invalidateDbBookingsCache();

    return NextResponse.json({ 
      success: true,
      deletedCount: calendarIdsToDelete.size,
      deletedIds: Array.from(calendarIdsToDelete),
      isFleet
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
  }
}

