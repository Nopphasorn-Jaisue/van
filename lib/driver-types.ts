export interface DailyInspectionItemStatus {
  tires: boolean;       // ลมยางและสภาพยาง
  fuel: boolean;        // ระดับน้ำมันเชื้อเพลิง
  lights: boolean;      // ไฟหน้า ไฟท้าย ไฟเลี้ยว
  brakes: boolean;      // ระบบเบรกและน้ำมันเบรก
  cleanliness: boolean; // ความสะอาดและอุปกรณ์ฉุกเฉิน
}

export interface DailyInspectionRecord {
  id: string;
  driverId: number;
  date: string; // YYYY-MM-DD
  vanPlate: string;
  items: DailyInspectionItemStatus;
  passed: boolean;
  notes?: string;
  createdAt: string;
}

export interface DriverEmergencyRecord {
  id: string;
  driverId: number;
  bookingId?: string;
  issueType: string;
  detail: string;
  location?: string;
  status: 'REPORTED' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
}

export interface DriverSafetyDutyInfo {
  safetyStatus: 'SAFE' | 'WARNING' | 'REST_CONFLICT' | 'OVER_LIMIT';
  safetyBadgeText: string;
  todayDutyHours: number;
  weeklyDutyHours: number;
  restHours: number;
  dailyHoursRemaining: number;
  weeklyHoursRemaining: number;
  isRestSufficient: boolean;
  maxDailyLimit: number;
  maxWeeklyLimit: number;
  minRestLimit: number;
}
