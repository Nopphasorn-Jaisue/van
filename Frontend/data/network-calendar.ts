export type NetworkCalendarEventStatus = 'approved' | 'pending' | 'shared' | 'on-trip' | 'maintenance';
export type NetworkCalendarScope = 'local' | 'outbound' | 'maintenance';

export type NetworkCalendarEvent = {
  id: string;
  facultyId: string;
  title: string;
  destination: string;
  purpose?: string;
  requester?: string;
  phone?: string;
  timeStr?: string;
  bookingFacultyName?: string;
  vanCode: string;
  vanPlate?: string;
  start: string;
  end: string;
  status: NetworkCalendarEventStatus;
  scope: NetworkCalendarScope;
  vansInUse: number;
  ownerFacultyName?: string;
};

export type TodayBooking = {
  id: string;
  facultyId: string;
  destination: string;
  vanCode: string;
  time: string;
};


export function buildFallbackNetworkEvents(
  referenceDate?: Date
): NetworkCalendarEvent[] {
  void referenceDate;
  return [];
}

export function buildTodayBookings(): TodayBooking[] {
  return [];
}

