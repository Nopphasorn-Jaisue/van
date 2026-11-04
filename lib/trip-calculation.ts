// Shared Model v5 trip calculation and safety constants (Client & Server safe)
export const DUTY_DAY_START_HOUR = 8; // 08:00 cutoff for duty day
export const MAX_DAILY_HOURS = 14.0; // Max working hours per duty day
export const MAX_WEEKLY_HOURS = 72.0; // Max working hours in 7 rolling duty days
export const MIN_REST_HOURS = 10.0; // Minimum rest between trips

export interface MultiDayTripInfo {
  isMultiDay: boolean;
  description: string;
  daysCount: number;
  countedWorkHours?: number;
}

/**
 * Check if trip is multi-day by 08:00 AM next day cutoff (Model v5 logic)
 */
export function checkMultiDayTrip(startDt: Date | string, endDt: Date | string): { isMultiDay: boolean; description: string; daysCount: number } {
  const start = new Date(startDt);
  const end = new Date(endDt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isMultiDay: false, description: "ข้อมูลวันเวลาไม่ถูกต้อง", daysCount: 1 };
  }
  const startNormalized = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const thresholdNextDay = new Date(startNormalized.getTime() + (24 + DUTY_DAY_START_HOUR) * 3600 * 1000);

  if (end.getTime() > thresholdNextDay.getTime()) {
    const daysDiff = Math.ceil((end.getTime() - startNormalized.getTime()) / (24 * 3600 * 1000));
    return {
      isMultiDay: true,
      description: `เดินทางหลายวัน (${daysDiff} วันปฏิบัติงาน) สิ้นสุดหลังเวลา 08:00 น. วันถัดไป`,
      daysCount: daysDiff
    };
  }

  return {
    isMultiDay: false,
    description: "เดินทางวันเดียว (สิ้นสุดก่อนจุดตัดเข้างานรอบถัดไป 08:00 น.)",
    daysCount: 1
  };
}

/**
 * Calculate multi-day 14/10 cycle work profile (Model v5 logic)
 */
export function calculateTripWorkProfile(startDt: Date | string, endDt: Date | string) {
  const start = new Date(startDt);
  const end = new Date(endDt);
  const multiInfo = checkMultiDayTrip(start, end);

  if (!multiInfo.isMultiDay) {
    const elapsedHrs = Math.max(0, (end.getTime() - start.getTime()) / (3600 * 1000));
    return {
      isMultiDay: false,
      totalWorkHours: elapsedHrs,
      blocks: [{ start, end, hours: elapsedHrs }]
    };
  }

  const cycleHrs = 24;
  const workHrsPerCycle = 14;
  const blocks: Array<{ start: Date; end: Date; hours: number }> = [];
  let totalWorkHours = 0;
  let cycle = 0;

  while (start.getTime() + cycle * cycleHrs * 3600 * 1000 < end.getTime()) {
    const cycleStart = new Date(start.getTime() + cycle * cycleHrs * 3600 * 1000);
    const workEnd = new Date(Math.min(end.getTime(), cycleStart.getTime() + workHrsPerCycle * 3600 * 1000));
    const blockHrs = Math.max(0, (workEnd.getTime() - cycleStart.getTime()) / (3600 * 1000));
    blocks.push({ start: cycleStart, end: workEnd, hours: blockHrs });
    totalWorkHours += blockHrs;
    cycle++;
  }

  return {
    isMultiDay: true,
    totalWorkHours,
    blocks
  };
}
