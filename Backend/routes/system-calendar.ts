import { NextResponse } from "next/server";
import { 
  getStoredCalendarEvents, 
  addStoredCalendarEvent, 
  updateStoredCalendarEvent, 
  deleteStoredCalendarEvent,
  facultyVansList 
} from "@/Backend/services/calendar-store";

export async function handleSystemCalendarEvents(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  let events = getStoredCalendarEvents();

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
    return NextResponse.json({ success: true, event: created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to create event" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const updated = updateStoredCalendarEvent(id, fields);
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
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    deleteStoredCalendarEvent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
  }
}
