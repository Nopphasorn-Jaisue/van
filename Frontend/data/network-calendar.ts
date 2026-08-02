export type NetworkCalendarEventStatus = 'approved' | 'pending' | 'shared' | 'on-trip' | 'maintenance';
export type NetworkCalendarScope = 'local' | 'outbound' | 'maintenance';

export type NetworkCalendarEvent = {
  id: string;
  facultyId: string;
  title: string;
  destination: string;
  vanCode: string;
  start: string;
  end: string;
  status: NetworkCalendarEventStatus;
  scope: NetworkCalendarScope;
  vansInUse: number;
};

export type TodayBooking = {
  id: string;
  facultyId: string;
  destination: string;
  vanCode: string;
  time: string;
};

type EventTemplate = {
  day: number;
  startHour: number;
  durationHours: number;
  facultyId: string;
  destination: string;
  vanCode: string;
  status: NetworkCalendarEventStatus;
  scope: NetworkCalendarScope;
  vansInUse: number;
};

const scheduleTemplates: EventTemplate[] = [
  // Multi-day event example
  { day: 2, startHour: 8, durationHours: 72, facultyId: 'ict', destination: 'ดูงานนอกสถานที่ (3 วัน)', vanCode: 'Van 12', status: 'approved', scope: 'outbound', vansInUse: 1 },
  { day: 3, startHour: 8, durationHours: 8, facultyId: 'agri', destination: 'แพร่', vanCode: 'Van 01', status: 'approved', scope: 'local', vansInUse: 1 },
  { day: 5, startHour: 9, durationHours: 6, facultyId: 'pharm', destination: 'รพ.พะเยา', vanCode: 'Van 05', status: 'shared', scope: 'outbound', vansInUse: 1 },
  { day: 8, startHour: 8, durationHours: 12, facultyId: 'sci', destination: 'ลำปาง', vanCode: 'Van 07', status: 'pending', scope: 'outbound', vansInUse: 1 },
  { day: 10, startHour: 13, durationHours: 4, facultyId: 'pharm', destination: 'โรงพยาบาลพะเยา', vanCode: 'Van 03', status: 'approved', scope: 'local', vansInUse: 1 },
  { day: 12, startHour: 8, durationHours: 8, facultyId: 'sci', destination: 'ศาลจังหวัดพะเยา', vanCode: 'Van 09', status: 'approved', scope: 'local', vansInUse: 1 },
  { day: 15, startHour: 6, durationHours: 14, facultyId: 'seen', destination: 'กรุงเทพฯ', vanCode: 'Van 08', status: 'shared', scope: 'outbound', vansInUse: 1 },
  { day: 17, startHour: 9, durationHours: 8, facultyId: 'ict', destination: 'เชียงใหม่', vanCode: 'Van 12', status: 'approved', scope: 'local', vansInUse: 1 },
  { day: 19, startHour: 8, durationHours: 8, facultyId: 'agri', destination: 'แพร่', vanCode: 'Van 01', status: 'pending', scope: 'local', vansInUse: 1 },
  
  // วันที่มีหลายคิว (Multiple events on the same day)
  { day: 21, startHour: 9, durationHours: 8, facultyId: 'sci', destination: 'ลำปาง', vanCode: 'Van 07', status: 'approved', scope: 'local', vansInUse: 1 },
  { day: 21, startHour: 10, durationHours: 6, facultyId: 'pharm', destination: 'รพ.พะเยา', vanCode: 'Van 05', status: 'shared', scope: 'outbound', vansInUse: 1 },
  { day: 21, startHour: 7, durationHours: 12, facultyId: 'ict', destination: 'ศาลเชียงราย', vanCode: 'Van 11', status: 'pending', scope: 'outbound', vansInUse: 1 },
  
  { day: 23, startHour: 8, durationHours: 5, facultyId: 'seen', destination: 'กรุงเทพฯ', vanCode: 'Van 08', status: 'approved', scope: 'local', vansInUse: 1 },
  
  // วันที่คิวล้น (Over 4 events to trigger "+ อีก X รายการ" in month view)
  { day: 25, startHour: 8, durationHours: 10, facultyId: 'sci', destination: 'ศูนย์ซ่อมมหาวิทยาลัย', vanCode: 'Van 14', status: 'maintenance', scope: 'maintenance', vansInUse: 1 },
  { day: 25, startHour: 9, durationHours: 5, facultyId: 'ict', destination: 'เชียงใหม่', vanCode: 'Van 12', status: 'approved', scope: 'local', vansInUse: 1 },
  { day: 25, startHour: 13, durationHours: 4, facultyId: 'agri', destination: 'เชียงคำ', vanCode: 'Van 01', status: 'approved', scope: 'local', vansInUse: 1 },
  { day: 25, startHour: 6, durationHours: 14, facultyId: 'sci', destination: 'กทม', vanCode: 'Van 07', status: 'shared', scope: 'outbound', vansInUse: 1 },
  { day: 25, startHour: 10, durationHours: 6, facultyId: 'pharm', destination: 'รพ.พะเยา', vanCode: 'Van 03', status: 'approved', scope: 'local', vansInUse: 1 },
  
  { day: 26, startHour: 7, durationHours: 11, facultyId: 'agri', destination: 'เชียงใหม่', vanCode: 'Van 15', status: 'shared', scope: 'outbound', vansInUse: 1 },
  { day: 28, startHour: 9, durationHours: 8, facultyId: 'ict', destination: 'เครือข่ายโรงเรียนจังหวัดพะเยา', vanCode: 'Van 16', status: 'approved', scope: 'local', vansInUse: 1 },
];

const todayTemplates: Array<{ startHour: number; facultyId: string; destination: string; vanCode: string }> = [
  { startHour: 8, facultyId: 'agri', destination: 'เดินทางไป แพร่', vanCode: 'Van 01' },
  { startHour: 8.5, facultyId: 'ict', destination: 'เดินทางไป เชียงใหม่', vanCode: 'Van 12' },
  { startHour: 9, facultyId: 'pharm', destination: 'เดินทางไป รพ.พะเยา', vanCode: 'Van 05' },
  { startHour: 9.5, facultyId: 'sci', destination: 'เดินทางไป ลำปาง', vanCode: 'Van 07' },
];

function toIsoString(date: Date) {
  return date.toISOString();
}

function formatHour(hourValue: number) {
  const hours = Math.floor(hourValue);
  const minutes = Math.round((hourValue - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function buildFallbackNetworkEvents(
  referenceDate: Date
): NetworkCalendarEvent[] {
  return scheduleTemplates.map((template, index) => {
    const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), template.day, template.startHour, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + template.durationHours);

    return {
      id: `${template.facultyId}-${template.day}-${index}`,
      facultyId: template.facultyId,
      title: template.destination,
      destination: template.destination,
      vanCode: template.vanCode,
      start: toIsoString(start),
      end: toIsoString(end),
      status: template.status,
      scope: template.scope,
      vansInUse: template.vansInUse,
    };
  });
}

export function buildTodayBookings(): TodayBooking[] {
  return todayTemplates
    .map((template) => ({
      id: `${template.facultyId}-today-${template.startHour}`,
      facultyId: template.facultyId,
      destination: template.destination,
      vanCode: template.vanCode,
      time: formatHour(template.startHour),
    }))
    .sort((left, right) => left.time.localeCompare(right.time));
}
