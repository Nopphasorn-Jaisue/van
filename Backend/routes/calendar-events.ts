import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/Backend/services/google-calendar';

const mapColorToClassName = (colorId: string | null | undefined): string => {
    switch (colorId) {
        case '1': return 'bg-blue-200 text-blue-800';
        case '2': return 'bg-green-200 text-green-800';
        case '3': return 'bg-purple-200 text-purple-800';
        case '4': return 'bg-red-200 text-red-800';
        case '5': return 'bg-yellow-200 text-yellow-800';
        case '6': return 'bg-orange-200 text-orange-800';
        case '7': return 'bg-sky-200 text-sky-800';
        case '8': return 'bg-gray-200 text-gray-800';
        case '9': return 'bg-indigo-200 text-indigo-800';
        case '10': return 'bg-teal-200 text-teal-800';
        case '11': return 'bg-rose-200 text-rose-800';
        default: return 'bg-gray-200 text-gray-800';
    }
};

export async function handleGetCalendarEvents(request: Request) {
    try {
        const calendarId = process.env.GOOGLE_CALENDAR_ID;
        if (!calendarId) {
            throw new Error('Google Calendar ID is not configured in environment variables.');
        }

        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get('year');
        const monthParam = searchParams.get('month');

        const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
        const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;

        if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
            return NextResponse.json(
                { message: 'Invalid year or month parameter. Please provide valid numbers.' },
                { status: 400 },
            );
        }

        const timeMin = new Date(year, month - 1, 1).toISOString();
        const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString();
        const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar.readonly']);

        const response = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            maxResults: 250,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const items = response.data.items || [];
        const eventsByDate: Record<string, Array<{ time: string; title: string | null | undefined; color: string }>> = {};

        items.forEach((event) => {
            const eventDate = event.start?.dateTime || event.start?.date;
            if (!eventDate) {
                return;
            }

            const isoDate = new Date(eventDate).toISOString().split('T')[0];
            if (!eventsByDate[isoDate]) {
                eventsByDate[isoDate] = [];
            }

            eventsByDate[isoDate].push({
                time: new Date(eventDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                title: event.summary,
                color: mapColorToClassName(event.colorId),
            });
        });

        return NextResponse.json({ events: eventsByDate });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching calendar events:', errorMessage);
        return NextResponse.json(
            { message: 'An error occurred while fetching calendar events.', error: errorMessage },
            { status: 500 },
        );
    }
}