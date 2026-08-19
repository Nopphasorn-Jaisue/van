import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/Backend/services/google-calendar';
import { FACULTY_CALENDARS } from '@/Backend/routes/system-calendar';

export async function handleCreateBooking(request: Request) {
    try {
        const { faculty, destination, startDate, endDate, requester } = await request.json();

        let calendarId = process.env.GOOGLE_CALENDAR_ID;
        
        if (faculty) {
            if (faculty.includes('เภสัช')) calendarId = FACULTY_CALENDARS.PHARM;
            else if (faculty.includes('วิทยาศาสตร์')) calendarId = FACULTY_CALENDARS.SCI;
            else if (faculty.includes('สารสนเทศ') || faculty.includes('ICT')) calendarId = FACULTY_CALENDARS.ICT;
        }

        if (!calendarId) {
            throw new Error('Google Calendar ID is not configured in environment variables.');
        }

        if (!faculty || !destination || !startDate || !endDate || !requester) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const event = {
            summary: `[รออนุมัติ] เดินทางไป ${destination} (${faculty})`,
            description: `ผู้ขอใช้บริการ: ${requester}\nหน่วยงาน: ${faculty}`,
            start: {
                dateTime: startDate,
                timeZone: 'Asia/Bangkok',
            },
            end: {
                dateTime: endDate,
                timeZone: 'Asia/Bangkok',
            },
            colorId: '5',
        };

        const calendar = getGoogleCalendarClient(['https://www.googleapis.com/auth/calendar']);
        const response = await calendar.events.insert({
            calendarId,
            requestBody: event,
        });

        return NextResponse.json(
            { success: true, message: 'ส่งคำขอจองสำเร็จ!', eventLink: response.data.htmlLink },
            { status: 201 },
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error creating event:', errorMessage);
        return NextResponse.json(
            { success: false, error: 'เกิดข้อผิดพลาดในการสร้างรายการจอง', details: errorMessage },
            { status: 500 },
        );
    }
}