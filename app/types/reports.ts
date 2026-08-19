export interface FacultyTripStats {
  internal: number;
  external: number;
  inProvince: number;
  outProvince: number;
}
export interface DriverWorkload {
  id: string;
  name: string;
  hours_this_week: number;
  max_safe_hours: number;
  trips: number;
  status: string;
}
export interface FleetStatus {
  faculty: string;
  total_vans: number;
  active: number;
  maintenance: number;
  usage_rate: string;
}
export interface WeeklyDensity {
  day: string;
  trips: number;
  percent: number;
}
export interface CrossFacultyUsage {
  borrower: string;
  lender: string;
  count: number;
  percent: number;
}
export interface ReportsData {
  role: string;
  facultyTripStats: FacultyTripStats;
  driverWorkload: DriverWorkload[];
  fleetStatus: FleetStatus[];
  weeklyDensity: WeeklyDensity[];
  crossFacultyUsage: CrossFacultyUsage[];
}
