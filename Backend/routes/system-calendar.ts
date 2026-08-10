import { NextResponse } from "next/server";
import { 
  getStoredCalendarEvents, 
  addStoredCalendarEvent, 
  updateStoredCalendarEvent, 
  deleteStoredCalendarEvent,
  facultyVansList,
  CalendarEventRecord
} from "@/Backend/services/calendar-store";
import { getGoogleCalendarClient } from "@/Backend/services/google-calendar";

export async function handleSystemCalendarEvents(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  let events = getStoredCalendarEvents();

  // Sync live events from Google Calendar API if environment variables are configured
  const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
  if (googleCalendarId && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
      const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
      
      const timeMin = new Date(year, month - 1, 1).toISOString();
      const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString();
      
      const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar.readonly']);
      const response = await calendar.events.list({
        calendarId: googleCalendarId,
        timeMin,
        timeMax,
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const googleItems = response.data.items || [];
      if (googleItems.length > 0) {
        const googleEventsMapped: CalendarEventRecord[] = googleItems.map((item, index) => {
          const startDate = item.start?.dateTime || item.start?.date || new Date().toISOString();
          const summary = item.summary || 'ภารกิจใช้รถตู้';
          const description = item.description || '';
          
          let facultyName = 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร';
          let facultyId = 'ict';
          if (summary.includes('วิศวะ')) { facultyName = 'คณะวิศวกรรมศาสตร์'; facultyId = 'eng'; }
          else if (summary.includes('วิทยาศาสตร์')) { facultyName = 'คณะวิทยาศาสตร์'; facultyId = 'sci'; }
          else if (summary.includes('เกษตร')) { facultyName = 'คณะเกษตรศาสตร์'; facultyId = 'agr'; }
          else if (summary.includes('พลังงาน')) { facultyName = 'คณะพลังงานและสิ่งแวดล้อม'; facultyId = 'ener'; }

          return {
            id: `gcal-${item.id || index}`,
            gcalId: item.id || undefined,
            vanId: 'v-ict',
            facultyId,
            date: startDate.slice(0, 10),
            time: new Date(startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
            destination: summary,
            purpose: summary,
            passengers: 10,
            status: 'approved' as const,
            bookingFaculty: facultyName,
            requester: item.organizer?.displayName || item.organizer?.email || 'Google Calendar Sync',
            department: 'Google Calendar Live',
            purposeDetail: description,
            routeDetail: summary,
            statusText: 'ซิงค์จาก Google Calendar',
            statusTime: 'Live Data',
            createdAt: startDate,
          };
        });

        // Merge Google Calendar events with store
        events = [...googleEventsMapped, ...events];
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

  const eventsByDate = events.reduce<Record<string, Array<{ time: string; title: string; color: string }>>>(
    (result, event) => {
      const dateKey = event.date.slice(0, 10);
      if (!result[dateKey]) {
        result[dateKey] = [];
      }

      const color = event.status === "approved" || event.status === "completed"
        ? "bg-green-200 text-green-800 border-green-300"
        : "bg-yellow-200 text-yellow-800 border-yellow-300";

      const vanInfo = facultyVansList.find(v => v.id === event.vanId);
      const plate = vanInfo ? vanInfo.plate : event.vanId;

      result[dateKey].push({
        time: event.time,
        title: `${event.destination} (${plate}) - ${event.bookingFaculty}`,
        color,
      });

      return result;
    },
    {},
  );

  return NextResponse.json({ 
    success: true,
    events: eventsByDate, 
    rawEvents: events,
    vans: facultyVansList
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = addStoredCalendarEvent(body);

    // Push new event to Google Calendar API if configured
    const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
    if (googleCalendarId && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
        const startDate = created.date ? new Date(created.date).toISOString() : new Date().toISOString();
        
        const gcalResponse = await calendar.events.insert({
          calendarId: googleCalendarId,
          requestBody: {
            summary: `[${created.bookingFaculty || 'คณะ'}] ${created.destination || 'ภารกิจใช้รถตู้'}`,
            description: `ผู้ขอใช้บริการ: ${created.requester || '-'}\nหน่วยงาน: ${created.bookingFaculty || '-'}\nวัตถุประสงค์: ${created.purpose || '-'}\nผู้โดยสาร: ${created.passengers || 1} คน`,
            start: { dateTime: startDate, timeZone: 'Asia/Bangkok' },
            end: { dateTime: startDate, timeZone: 'Asia/Bangkok' },
          },
        });

        if (gcalResponse.data.id) {
          created.gcalId = gcalResponse.data.id;
        }
      } catch (gcalErr) {
        console.warn("Google Calendar Push Insert Warning:", gcalErr instanceof Error ? gcalErr.message : gcalErr);
      }
    }

    return NextResponse.json({ success: true, event: created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, gcalId, ...fields } = body;
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const updated = updateStoredCalendarEvent(id, fields);

    // Sync update to Google Calendar
    const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
    const targetGcalId = gcalId || (String(id).startsWith('gcal-') ? String(id).replace('gcal-', '') : null);

    if (googleCalendarId && targetGcalId && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
        await calendar.events.patch({
          calendarId: googleCalendarId,
          eventId: targetGcalId,
          requestBody: {
            summary: fields.destination ? `[${fields.bookingFaculty || 'คณะ'}] ${fields.destination}` : undefined,
            description: fields.purpose ? `วัตถุประสงค์: ${fields.purpose}` : undefined,
          },
        });
      } catch (gcalErr) {
        console.warn("Google Calendar Push Patch Warning:", gcalErr instanceof Error ? gcalErr.message : gcalErr);
      }
    }

    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const gcalId = searchParams.get("gcalId");
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    deleteStoredCalendarEvent(id);

    // Sync delete to Google Calendar
    const googleCalendarId = process.env.GOOGLE_CALENDAR_ID;
    const targetGcalId = gcalId || (String(id).startsWith('gcal-') ? String(id).replace('gcal-', '') : null);

    if (googleCalendarId && targetGcalId && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
        await calendar.events.delete({
          calendarId: googleCalendarId,
          eventId: targetGcalId,
        });
      } catch (gcalErr) {
        console.warn("Google Calendar Push Delete Warning:", gcalErr instanceof Error ? gcalErr.message : gcalErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
  }
}
