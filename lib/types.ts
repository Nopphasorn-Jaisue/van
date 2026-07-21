export type UserRole =
  | "REQUESTER"
  | "FACULTY_VAN_ADMIN"
  | "EXECUTIVE"
  | "DRIVER"
  | "SUPER_ADMIN";

export type BookingStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "WAITING_PROVIDER_REVIEW"
  | "WAITING_DMS_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type CalendarSource =
  | "GOOGLE"
  | "MICROSOFT"
  | "CUSTOM_API"
  | "SYSTEM";

export type Faculty = {
  faculty_id: string;
  faculty_name: string;
  calendar_type: CalendarSource;
  dms_unit_code: string;
};

export type Van = {
  van_id: string;
  faculty_id: string;
  plate_number: string;
  capacity: number;
  driver_id: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
};

export type Driver = {
  driver_id: string;
  faculty_id: string;
  full_name: string;
  phone: string;
};

export type BookingRequest = {
  booking_id: string;
  requesting_faculty_id: string;
  provider_faculty_id: string;
  van_id: string;
  driver_id: string;
  requester_name: string;
  requester_position: string;
  origin_location: string;
  destination_location: string;
  destination_province: string;
  purpose: string;
  passenger_count: number;
  start_datetime: string;
  end_datetime: string;
  budget_source: string;

  coordinator_name: string;
  coordinator_phone: string;
  status: BookingStatus;
};

export type CalendarEvent = {
  event_id: string;
  faculty_id: string;
  van_id: string;
  source_system: CalendarSource;
  external_event_id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  sync_status: "PENDING" | "SYNCED" | "FAILED";
  status: BookingStatus | "MAINTENANCE";
};