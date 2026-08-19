import fs from 'fs';
import path from 'path';
import { facultyVansList, UnifiedVanInfo } from '@/Frontend/data/faculty-vans';

export type { UnifiedVanInfo };
export { facultyVansList };

export type CalendarEventRecord = {
  id: string;
  gcalId?: string;
  vanId: string;
  facultyId: string;
  bookingFaculty: string;
  destination: string;
  purpose: string;
  purposeDetail?: string;
  routeDetail?: string;
  date: string; // ISO date string YYYY-MM-DD
  returnDate?: string; // ISO date string YYYY-MM-DD
  time: string; // e.g. "08:30 - 16:30 น."
  passengers: number;
  requester: string;
  phone?: string;
  department: string;
  status: "approved" | "pending" | "ongoing" | "completed";
  statusText: string;
  statusTime: string;
  tripType?: "ในจังหวัดพะเยา" | "ต่างจังหวัด";
  createdAt: string;
};

const STORE_PATH = path.join(process.cwd(), 'Backend', 'data', 'calendar-store.json');

function ensureDirectory() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const initialSeedEvents: CalendarEventRecord[] = [];

export function getStoredCalendarEvents(): CalendarEventRecord[] {
  try {
    ensureDirectory();
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(initialSeedEvents, null, 2), 'utf-8');
      return initialSeedEvents;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    if (!raw.trim()) return initialSeedEvents;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading calendar store:", err);
    return initialSeedEvents;
  }
}

export function saveStoredCalendarEvents(events: CalendarEventRecord[]): boolean {
  try {
    ensureDirectory();
    fs.writeFileSync(STORE_PATH, JSON.stringify(events, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing calendar store:", err);
    return false;
  }
}

export function addStoredCalendarEvent(newEvent: Omit<CalendarEventRecord, 'id' | 'createdAt'>): CalendarEventRecord {
  const events = getStoredCalendarEvents();
  const created: CalendarEventRecord = {
    ...newEvent,
    id: `UP-2569-${String(Date.now()).slice(-4)}`,
    createdAt: new Date().toISOString()
  };
  events.unshift(created);
  saveStoredCalendarEvents(events);
  return created;
}

export function updateStoredCalendarEvent(id: string, updatedFields: Partial<CalendarEventRecord>): CalendarEventRecord | null {
  const events = getStoredCalendarEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return null;
  
  events[idx] = { ...events[idx], ...updatedFields };
  saveStoredCalendarEvents(events);
  return events[idx];
}

export function deleteStoredCalendarEvent(id: string): boolean {
  const events = getStoredCalendarEvents();
  const filtered = events.filter(e => e.id !== id);
  saveStoredCalendarEvents(filtered);
  return true;
}
