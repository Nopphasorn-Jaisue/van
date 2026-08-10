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
  time: string; // e.g. "08:30 - 16:30 น."
  passengers: number;
  requester: string;
  department: string;
  status: "approved" | "pending" | "ongoing" | "completed";
  statusText: string;
  statusTime: string;
  createdAt: string;
};

const STORE_PATH = path.join(process.cwd(), 'Backend', 'data', 'calendar-store.json');

function ensureDirectory() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const initialSeedEvents: CalendarEventRecord[] = [
  {
    id: "UP-2569-001",
    vanId: "v-pharm",
    facultyId: "pharm",
    bookingFaculty: "คณะเภสัชศาสตร์",
    destination: "โรงพยาบาลพะเยา",
    purpose: "ลงพื้นที่ตรวจเยี่ยมชุมชนร่วมกับนิสิต",
    purposeDetail: "ลงพื้นที่บริการสุขภาพชุมชนประจำปี",
    routeDetail: "มพ. -> รพ.พะเยา",
    date: "2026-08-05",
    time: "08:30 - 16:30 น.",
    passengers: 8,
    requester: "ดร.นพพร ใจดี",
    department: "ภาควิชาเภสัชกรรม",
    status: "approved",
    statusText: "อนุมัติแล้ว",
    statusTime: "วันนี้ 09:00 น.",
    createdAt: new Date().toISOString()
  },
  {
    id: "UP-2569-002",
    vanId: "v-sci",
    facultyId: "sci",
    bookingFaculty: "คณะวิทยาศาสตร์",
    destination: "ศาลากลางจังหวัดพะเยา",
    purpose: "เข้าร่วมพิธีเปิดโครงการจังหวัด",
    purposeDetail: "เข้าร่วมประชุมสภาวิจัยจังหวัดพะเยา",
    routeDetail: "มพ. -> ศาลากลาง",
    date: "2026-08-12",
    time: "07:00 - 18:00 น.",
    passengers: 12,
    requester: "ผศ.ดร.สมชาย",
    department: "สำนักงานคณบดี",
    status: "approved",
    statusText: "อนุมัติแล้ว",
    statusTime: "เมื่อวานนี้",
    createdAt: new Date().toISOString()
  },
  {
    id: "UP-2569-003",
    vanId: "v-ict",
    facultyId: "ict",
    bookingFaculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    destination: "สัมมนาดูงานภาคใต้ (4 วัน)",
    purpose: "โครงการพัฒนาอาจารย์และบุคลากร",
    purposeDetail: "นำคณะบุคลากรสัมมนาต่างจังหวัด",
    routeDetail: "มพ. -> สนามบิน",
    date: "2026-08-13",
    time: "06:00 - 20:00 น.",
    passengers: 10,
    requester: "ดร.วิชัย ICT",
    department: "สาขาวิทยาการคอมพิวเตอร์",
    status: "approved",
    statusText: "อนุมัติแล้ว",
    statusTime: "3 วันที่แล้ว",
    createdAt: new Date().toISOString()
  }
];

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
