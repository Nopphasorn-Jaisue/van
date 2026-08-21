export type SystemBookingStatus =
  | "WAITING_ADMIN"
  | "WAITING_EXEC"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export type DriverAvailability = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY";

export type SystemDriver = {
  id: string;
  name: string;
  phone: string;
  faculty: string;
  vanId: string;
  vanPlate: string;
  experienceYears: number;
  score: number;
  availability: DriverAvailability;
  unavailableReason?: string;
};

export type SystemVan = {
  id: string;
  plate: string;
  seats: number;
  faculty: string;
};

export type SystemBooking = {
  id: string;
  requester: string;
  requesterFaculty: string;
  destination: string;
  purpose: string;
  passengers: number;
  startAt: string;
  endAt: string;
  submittedAt: string;
  status: SystemBookingStatus;
  rejectReason?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedVanId?: string;
  assignedVanPlate?: string;
  tripType?: "ในจังหวัดพะเยา" | "ต่างจังหวัด";
  budgetSource?: string;
};

export type SystemDriverLog = {
  id: string;
  bookingId: string;
  driverId: string;
  mileageStart: number;
  mileageEnd: number;
  totalDistance: number;
  fuelRemark?: string;
  createdAt: string;
};

export type CreateBookingPayload = {
  requesterId?: number;
  requester: string;
  requesterFaculty: string;
  phone?: string;
  passengerNames?: string;
  destination: string;
  purpose: string;
  passengers: number;
  startAt: string;
  endAt: string;
  tripType?: "ในจังหวัดพะเยา" | "ต่างจังหวัด";
  budgetSource?: string;
  status?: SystemBookingStatus;
};
