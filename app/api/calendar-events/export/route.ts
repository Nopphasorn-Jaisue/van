import { NextResponse } from 'next/server';
import { getStoredCalendarEvents, CalendarEventRecord } from '@/Backend/services/calendar-store';
import { listBookings } from '@/Backend/services/booking-system-store';

export async function GET() {
  try {
    let events = getStoredCalendarEvents();

    try {
      const dbBookings = await listBookings();
      const dbEvents: CalendarEventRecord[] = dbBookings.map(b => ({
        id: `bk-${b.id}`,
        vanId: b.assignedVanId || "v-ict",
        facultyId: "ict",
        bookingFaculty: b.requesterFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
        destination: b.destination || "ไม่ระบุสถานที่",
        purpose: b.purpose || "ภารกิจใช้รถ",
        purposeDetail: b.purpose || "ภารกิจใช้รถ",
        routeDetail: b.destination || "ไม่ระบุสถานที่",
        date: b.startAt ? b.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        returnDate: b.endAt ? b.endAt.slice(0, 10) : (b.startAt ? b.startAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        time: "08:30 - 16:30 น.",
        passengers: b.passengers || 1,
        requester: b.requester || "ผู้ขอใช้รถ",
        department: "ระบบจองรถตู้",
        status: b.status === "APPROVED" ? "approved" : "pending",
        statusText: b.status === "APPROVED" ? "อนุมัติแล้ว" : "รอการอนุมัติ",
        statusTime: "ระบบการจอง",
        createdAt: b.submittedAt || new Date().toISOString()
      }));

      const existingIds = new Set(events.map(e => e.id));
      const newDbEvents = dbEvents.filter(e => !existingIds.has(e.id));
      events = [...newDbEvents, ...events];
    } catch (err) {
      console.warn("Notice: DB fetch error for iCal export:", err);
    }

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UP Van Booking System//TH',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:ปฏิทินการใช้รถตู้ มหาวิทยาลัยพะเยา',
      'X-WR-TIMEZONE:Asia/Bangkok'
    ];

    events.forEach(e => {
      const dateRaw = String(e.date || '').replace(/-/g, '');
      const returnRaw = String(e.returnDate || e.date || '').replace(/-/g, '');
      if (!dateRaw || dateRaw.length < 8) return;

      const uid = `${e.id || Math.random()}@up.ac.th`;
      const dtStart = `${dateRaw}T083000`;
      const dtEnd = `${returnRaw}T163000`;
      const summary = `[${e.bookingFaculty || 'จองรถตู้'}] ${e.destination || e.purpose}`;
      const description = `ผู้ขอใช้บริการ: ${e.requester || 'ไม่ระบุ'}\\nวัตถุประสงค์: ${e.purpose || '-'}\\nคณะ: ${e.bookingFaculty || '-'}\\nสถานะ: ${e.statusText || 'อนุมัติแล้ว'}`;
      const location = e.destination || 'มหาวิทยาลัยพะเยา';

      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${uid}`);
      icsLines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`);
      icsLines.push(`DTSTART;TZID=Asia/Bangkok:${dtStart}`);
      icsLines.push(`DTEND;TZID=Asia/Bangkok:${dtEnd}`);
      icsLines.push(`SUMMARY:${summary}`);
      icsLines.push(`DESCRIPTION:${description}`);
      icsLines.push(`LOCATION:${location}`);
      icsLines.push('STATUS:CONFIRMED');
      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="up-van-calendar.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return NextResponse.json({ error: 'Failed to generate iCal' }, { status: 500 });
  }
}
