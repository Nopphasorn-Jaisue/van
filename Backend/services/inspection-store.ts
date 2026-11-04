import fs from 'fs';
import path from 'path';

import type {
  DailyInspectionItemStatus,
  DailyInspectionRecord,
  DriverEmergencyRecord
} from '@/lib/driver-types';

export type { DailyInspectionItemStatus, DailyInspectionRecord, DriverEmergencyRecord };

const STORE_DIR = path.join(process.cwd(), 'Backend', 'data');
const INSPECTION_FILE = path.join(STORE_DIR, 'inspections-store.json');
const EMERGENCY_FILE = path.join(STORE_DIR, 'emergency-reports.json');

function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T[]): T[] {
  try {
    ensureDir();
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) return fallback;
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T[]): boolean {
  try {
    ensureDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

export function getDailyInspections(): DailyInspectionRecord[] {
  return readJsonFile<DailyInspectionRecord>(INSPECTION_FILE, []);
}

export function saveDailyInspectionRecord(record: Omit<DailyInspectionRecord, 'id' | 'createdAt'>): DailyInspectionRecord {
  const records = getDailyInspections();
  const id = `INSP-${record.driverId}-${record.date}`;
  const existingIdx = records.findIndex(r => r.driverId === record.driverId && r.date === record.date);

  const newRecord: DailyInspectionRecord = {
    ...record,
    id,
    createdAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    records[existingIdx] = newRecord;
  } else {
    records.unshift(newRecord);
  }

  writeJsonFile(INSPECTION_FILE, records);
  return newRecord;
}

export function getTodayInspectionByDriver(driverId: number, dateStr?: string): DailyInspectionRecord | null {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);
  const records = getDailyInspections();
  return records.find(r => r.driverId === driverId && r.date === targetDate) || null;
}

export function getEmergencyReports(): DriverEmergencyRecord[] {
  return readJsonFile<DriverEmergencyRecord>(EMERGENCY_FILE, []);
}

export function saveEmergencyReport(report: Omit<DriverEmergencyRecord, 'id' | 'status' | 'createdAt'>): DriverEmergencyRecord {
  const reports = getEmergencyReports();
  const id = `EMG-${Date.now()}`;
  const newReport: DriverEmergencyRecord = {
    ...report,
    id,
    status: 'REPORTED',
    createdAt: new Date().toISOString()
  };

  reports.unshift(newReport);
  writeJsonFile(EMERGENCY_FILE, reports);
  return newReport;
}
