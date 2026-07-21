import type {
  BookingRequest,
  CalendarEvent,
  Driver,
  Faculty,
  Van,
} from "./types";

export const faculties: Faculty[] = [
  {
    faculty_id: "fac-001",
    faculty_name: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ",
    calendar_type: "GOOGLE",
    dms_unit_code: "DMS-AGRI",
  },
  {
    faculty_id: "fac-002",
    faculty_name: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    calendar_type: "GOOGLE",
    dms_unit_code: "DMS-ICT",
  },
  {
    faculty_id: "fac-003",
    faculty_name: "คณะพลังงานและสิ่งแวดล้อม",
    calendar_type: "MICROSOFT",
    dms_unit_code: "DMS-SEEN",
  },
  {
    faculty_id: "fac-004",
    faculty_name: "คณะวิทยาศาสตร์",
    calendar_type: "CUSTOM_API",
    dms_unit_code: "DMS-SCI",
  },
    {
    faculty_id: "fac-005",
    faculty_name: "คณะวิศวกรรมศาสตร์",
    calendar_type: "CUSTOM_API",
    dms_unit_code: "DMS-ENG",
  },
];

export const drivers: Driver[] = [
  {
    driver_id: "drv-001",
    faculty_id: "fac-001",
    full_name: "นายสมชาย ใจดี",
    phone: "081-234-5678",
  },
  {
    driver_id: "drv-002",
    faculty_id: "fac-002",
    full_name: "นายวิชัย ศรีสุข",
    phone: "089-547-8975",
  },
    {
    driver_id: "drv-003",
    faculty_id: "fac-003",
    full_name: "นายประเสริฐ มากมี",
    phone: "089-907-3525",
  },
    {
    driver_id: "drv-004",
    faculty_id: "fac-004",
    full_name: "นายสุชาติ แก้วดี",
    phone: "089-876-5432",
  },
  {
    driver_id: "drv-005",
    faculty_id: "fac-005",
    full_name: "นายดำรง ขยันงาน",
    phone: "082-345-6789",
  },
];

export const vans: Van[] = [
  {
    van_id: "van-001",
    faculty_id: "fac-001",
    plate_number: "นข 1234 พะเยา",
    capacity: 12,
    driver_id: "drv-001",
    status: "ACTIVE",
  },
  {
    van_id: "van-002",
    faculty_id: "fac-002",
    plate_number: "นข 5678 พะเยา",
    capacity: 12,
    driver_id: "drv-002",
    status: "ACTIVE",
  },
    {
    van_id: "van-003",
    faculty_id: "fac-003",
    plate_number: "นข 2468 พะเยา",
    capacity: 12,
    driver_id: "drv-003",
    status: "ACTIVE",
  },
    {
    van_id: "van-004",
    faculty_id: "fac-004",
    plate_number: "นข 9876 พะเยา",
    capacity: 12,
    driver_id: "drv-004",
    status: "ACTIVE",
  },
  {
    van_id: "van-005",
    faculty_id: "fac-005",
    plate_number: "นข 6543 พะเยา",
    capacity: 12,
    driver_id: "drv-005",
    status: "MAINTENANCE",
  },
];

export const bookingRequests: BookingRequest[] = [
  {
    booking_id: "UP-2567-0128",
    requesting_faculty_id: "fac-001",
    provider_faculty_id: "fac-002",
    van_id: "van-002",
    driver_id: "drv-002",
    requester_name: "นางสาวนฤมล จันทร์สว่าง",
    requester_position: "เจ้าหน้าที่บริหารงานทั่วไป",
    origin_location: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    destination_location: "ศูนย์ประชุมจังหวัดเชียงใหม่",
    destination_province: "เชียงใหม่",
    purpose: "เข้าร่วมประชุม/อบรม/สัมมนา",
    passenger_count: 8,
    start_datetime: "2026-06-10T08:00:00",
    end_datetime: "2026-06-10T17:00:00",
    budget_source: "งบประมาณคณะ",

    coordinator_name: "นางสาวนฤมล จันทร์สว่าง",
    coordinator_phone: "081-234-5678",
    status: "WAITING_DMS_APPROVAL",
  },
  {
    booking_id: "UP-2567-0129",
    requesting_faculty_id: "fac-003",
    provider_faculty_id: "fac-001",
    van_id: "van-001",
    driver_id: "drv-001",
    requester_name: "นายอนันต์ ทองดี",
    requester_position: "นักวิชาการคอมพิวเตอร์",
    origin_location: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    destination_location: "อำเภอเมืองเชียงราย",
    destination_province: "เชียงราย",
    purpose: "ติดต่อราชการ",
    passenger_count: 5,
    start_datetime: "2026-06-12T09:00:00",
    end_datetime: "2026-06-12T16:00:00",
    budget_source: "งบโครงการ",

    coordinator_name: "นายอนันต์ ทองดี",
    coordinator_phone: "082-345-6789",
    status: "APPROVED",
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    event_id: "evt-001",
    faculty_id: "fac-001",
    van_id: "van-001",
    source_system: "GOOGLE",
    external_event_id: "google-event-001",
    title: "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ ขอใช้รถไปเชียงราย",
    start_datetime: "2026-06-12T09:00:00",
    end_datetime: "2026-06-12T16:00:00",
    sync_status: "SYNCED",
    status: "APPROVED",
  },
  {
    event_id: "evt-002",
    faculty_id: "fac-002",
    van_id: "van-002",
    source_system: "SYSTEM",
    external_event_id: "system-event-001",
    title: "คณะวิทยาศาสตร์ ขอใช้รถไปเชียงใหม่",
    start_datetime: "2026-06-10T08:00:00",
    end_datetime: "2026-06-10T17:00:00",
    sync_status: "PENDING",
    status: "WAITING_DMS_APPROVAL",
  },
];