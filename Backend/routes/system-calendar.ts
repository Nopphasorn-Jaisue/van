import { NextResponse } from "next/server";
import { listCalendarEvents } from "@/Backend/services/booking-system-store";

export async function handleSystemCalendarEvents(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const year = yearParam ? Number(yearParam) : undefined;
  const month = monthParam ? Number(monthParam) : undefined;

  const events = await listCalendarEvents(year, month);

  const eventsByDate = events.reduce<Record<string, Array<{ time: string; title: string; color: string }>>>(
    (result, event) => {
      const dateKey = event.startAt.slice(0, 10);
      if (!result[dateKey]) {
        result[dateKey] = [];
      }

      const color = event.status === "APPROVED"
        ? "bg-green-200 text-green-800"
        : "bg-yellow-200 text-yellow-800";

      result[dateKey].push({
        time: new Date(event.startAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        title: `${event.title} (${event.assignedVanPlate})`,
        color,
      });

      return result;
    },
    {},
  );

  return NextResponse.json({ events: eventsByDate, rawEvents: events });
}
