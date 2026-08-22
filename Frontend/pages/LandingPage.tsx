'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Facebook,
  FileText,
  Headset,
  Mail,
  MapPin,
  MessageCircle,
  Paperclip,
  Phone,
  X,
} from 'lucide-react';
import UpLogo from '@/components/UpLogo';
import { FacultyGlyph } from '@/Frontend/components/FacultyGlyph';
import { facultiesList } from '@/Frontend/data/faculties';
import {
  buildFallbackNetworkEvents,
  type NetworkCalendarEvent,
  type NetworkCalendarEventStatus,
} from '@/Frontend/data/network-calendar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

type DayCell = {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isoDate: string;
};

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const weekDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

const statusMeta: Record<NetworkCalendarEventStatus, { label: string; chip: string }> = {
  approved: { label: 'จองแล้ว (อนุมัติแล้ว)', chip: 'bg-emerald-500' },
  pending: { label: 'รออนุมัติ', chip: 'bg-amber-500' },
  shared: { label: 'ยืมร่วมเครือข่าย', chip: 'bg-sky-500' },
  'on-trip': { label: 'กำลังเดินทาง', chip: 'bg-orange-500' },
  maintenance: { label: 'ปิดซ่อมบำรุง', chip: 'bg-rose-500' },
};

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function toIsoDay(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function inferFacultyId(title: string) {
  const normalizedTitle = title.toLowerCase();
  const match = facultiesList.find((faculty) => (
    normalizedTitle.includes(faculty.shortName.toLowerCase()) ||
    normalizedTitle.includes(faculty.name.toLowerCase())
  ));

  return match?.id ?? 'network';
}

function inferStatusFromColor(color?: string): NetworkCalendarEventStatus {
  if (!color) {
    return 'approved';
  }

  if (color.includes('yellow')) {
    return 'pending';
  }

  if (color.includes('red')) {
    return 'maintenance';
  }

  if (color.includes('blue') || color.includes('sky')) {
    return 'shared';
  }

  return 'approved';
}

type RawApiEvent = {
  id?: string;
  time?: string;
  date?: string;
  returnDate?: string;
  bookingFaculty?: string;
  title?: string;
  purpose?: string;
  destination?: string;
  requester?: string;
  phone?: string;
  vanPlate?: string;
  status?: string;
  color?: string;
  ownerFacultyName?: string;
};

function mapApiEventsToNetwork(eventsByDate: Record<string, RawApiEvent[]>): NetworkCalendarEvent[] {
  const seenIds = new Set<string>();
  const results: NetworkCalendarEvent[] = [];

  for (const [isoDate, events] of Object.entries(eventsByDate)) {
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      const eventId = event.id || `${isoDate}-${index}`;
      
      if (seenIds.has(eventId)) continue;
      seenIds.add(eventId);

      const [hourText = '08', minuteText = '00'] = (event.time || '08:30').split(':');
      const hour = Number.parseInt(hourText, 10);
      const minute = Number.parseInt(minuteText, 10);
      
      const startDateStr = event.date || isoDate;
      const endDateStr = event.returnDate || startDateStr;

      const start = new Date(`${startDateStr}T00:00:00`);
      start.setHours(Number.isNaN(hour) ? 8 : hour, Number.isNaN(minute) ? 0 : minute, 0, 0);

      const end = new Date(`${endDateStr}T23:59:59`);

      results.push({
        id: eventId,
        facultyId: inferFacultyId(event.bookingFaculty || event.title || ''),
        title: event.purpose || event.destination || event.title || 'กิจกรรม/การเดินทาง',
        destination: event.destination || event.title || 'ไม่ระบุสถานที่',
        purpose: event.purpose || event.destination || event.title || '',
        requester: event.requester || '',
        phone: event.phone || '',
        timeStr: event.time || '08:30 น.',
        bookingFacultyName: event.bookingFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
        vanCode: event.vanPlate ? `v-${event.vanPlate}` : 'Van --',
        start: start.toISOString(),
        end: end.toISOString(),
        status: event.status === 'pending_cross_faculty' ? 'shared' : inferStatusFromColor(event.color || ''),
        scope: 'outbound' as const,
        vansInUse: 1,
        ownerFacultyName: event.ownerFacultyName,
      });
    }
  }

  return results;
}

function getFacultyById(facultyId: string) {
  return facultiesList.find((faculty) => faculty.id === facultyId);
}

function getFleetStatus(availableVans: number, totalVans: number) {
  if (availableVans <= 0) {
    return { label: 'เต็ม', badge: 'bg-red-100 text-red-700' };
  }

  if (availableVans / totalVans <= 0.4) {
    return { label: 'ไม่ว่าง', badge: 'bg-orange-100 text-orange-700' };
  }

  return { label: 'พร้อมใช้งาน', badge: 'bg-emerald-100 text-emerald-700' };
}

function buildCalendarDays(currentDate: Date | null): DayCell[] {
  if (!currentDate) {
    return [];
  }

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1 - startOffset);

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      dayLabel: date.getDate().toString(),
      isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      isoDate: toIsoDay(date),
    };
  });
}

function buildWeekDays(anchor: Date): DayCell[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      dayLabel: date.getDate().toString(),
      isCurrentMonth: true,
      isoDate: toIsoDay(date),
    };
  });
}

type CalendarViewMode = 'month' | 'week' | 'day';

function getCalendarTitle(viewMode: CalendarViewMode, date: Date | null): string {
  if (!date) {
    return 'กำลังโหลด...';
  }

  if (viewMode === 'day') {
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear() + 543}`;
  }

  if (viewMode === 'week') {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear() + 543}`;
    }

    return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear() + 543}`;
  }

  return `${monthNames[date.getMonth()]} ${date.getFullYear() + 543}`;
}

const previewFacultyIds = ['agri', 'ict', 'seen', 'pharm', 'med', 'law', 'bca', 'sci'];

export default function LandingPage() {
  const [showManualModal, setShowManualModal] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [networkEvents, setNetworkEvents] = useState<NetworkCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllFaculties, setShowAllFaculties] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<NetworkCalendarEvent | null>(null);
  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: DayCell, events: NetworkCalendarEvent[] } | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setToday(now);

    // Instant load from client cache if available
    try {
      const cached = sessionStorage.getItem('cached_landing_calendar_events');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNetworkEvents(parsed);
          setIsLoading(false);
        }
      }
    } catch {
      // ignore storage error
    }
  }, []);

  useEffect(() => {
    if (!currentDate) {
      return;
    }

    const fallbackEvents = buildFallbackNetworkEvents(currentDate);

    const fetchEvents = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      try {
        const response = await fetch(`/api/calendar-events?year=${year}&month=${month}`);
        if (!response.ok) {
          throw new Error('calendar unavailable');
        }

        const data = await response.json();
        const mappedEvents = mapApiEventsToNetwork(data.events || {});
        const finalEvents = mappedEvents;
        setNetworkEvents(finalEvents);

        try {
          sessionStorage.setItem('cached_landing_calendar_events', JSON.stringify(finalEvents));
        } catch {
          // ignore storage quota error
        }
      } catch {
        setNetworkEvents((prev) => (prev.length > 0 ? prev : fallbackEvents));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate]);


  const calendarDays = buildCalendarDays(currentDate);
  const displayedDays = viewMode === 'week' ? buildWeekDays(currentDate ?? new Date()) : calendarDays;

  const validFacultyIds = facultiesList.map(f => f.id);
  const filteredEvents = networkEvents.filter((event) => {
    if (!validFacultyIds.includes(event.facultyId)) return false;
    return selectedFaculty === 'all' || event.facultyId === selectedFaculty;
  });

  const eventMap = filteredEvents.reduce<Record<string, NetworkCalendarEvent[]>>((result, event) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Add event to every day it spans
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = toIsoDay(d);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(event);
    }

    return result;
  }, {});

  // Sort events inside each day: multi-day events first, then by start time
  Object.values(eventMap).forEach(dayEvents => {
    dayEvents.sort((a, b) => {
      const aStart = new Date(a.start);
      const aEnd = new Date(a.end);
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      aStart.setHours(0,0,0,0);
      aEnd.setHours(0,0,0,0);
      bStart.setHours(0,0,0,0);
      bEnd.setHours(0,0,0,0);
      
      const isMultiDayA = aStart.getTime() !== aEnd.getTime();
      const isMultiDayB = bStart.getTime() !== bEnd.getTime();
      
      if (isMultiDayA && !isMultiDayB) return -1;
      if (!isMultiDayA && isMultiDayB) return 1;
      return a.start.localeCompare(b.start);
    });
  });


  const visibleFaculties = showAllFaculties
    ? facultiesList
    : facultiesList.filter((faculty) => previewFacultyIds.includes(faculty.id));

  const dayAgendaEvents = viewMode === 'day' && currentDate
    ? (eventMap[toIsoDay(currentDate)] || []).slice().sort((left, right) => left.start.localeCompare(right.start))
    : [];

  const handleEventClick = (event: NetworkCalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetailModal(true);
  };

  const goToPrevious = () => {
    setCurrentDate((prev) => {
      const base = prev ?? new Date();

      if (viewMode === 'month') {
        return new Date(base.getFullYear(), base.getMonth() - 1, 1);
      }

      const next = new Date(base);
      next.setDate(base.getDate() - (viewMode === 'week' ? 7 : 1));
      return next;
    });
  };

  const goToNext = () => {
    setCurrentDate((prev) => {
      const base = prev ?? new Date();

      if (viewMode === 'month') {
        return new Date(base.getFullYear(), base.getMonth() + 1, 1);
      }

      const next = new Date(base);
      next.setDate(base.getDate() + (viewMode === 'week' ? 7 : 1));
      return next;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const scrollToSection = (event: React.MouseEvent<HTMLElement>, sectionId: string) => {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-8 px-4 py-4 md:px-6">
          <div className="flex flex-1 items-center gap-8">
            <div className="flex shrink-0 items-center gap-3">
              <button type="button" className="cursor-pointer" onClick={(event) => scrollToSection(event, 'top')} aria-label="กลับไปด้านบน">
                <UpLogo compact className="h-11 w-11" />
              </button>
              <div className="cursor-pointer" onClick={(event) => scrollToSection(event, 'top')}>
                <p className="text-xl font-black tracking-tight text-violet-800">Smart Van Booking</p>
                <p className="text-xs font-medium text-slate-500">ระบบจองรถตู้ประจำคณะ มหาวิทยาลัยพะเยา</p>
              </div>
            </div>

            <div className="hidden flex-1 items-center justify-center gap-7 text-sm font-bold text-slate-600 md:flex">
              <a href="#calendar" onClick={(event) => scrollToSection(event, 'calendar')} className="transition-colors hover:text-slate-950">ปฏิทินรวม</a>
              <a href="#faculties" onClick={(event) => scrollToSection(event, 'faculties')} className="transition-colors hover:text-slate-950">เครือข่ายคณะ</a>
              <button type="button" onClick={() => setShowManualModal(true)} className="transition-colors hover:text-slate-950">คู่มือการใช้งาน</button>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-violet-800"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </nav>

      {/* Interactive Dangling Calendar Decoration (Global) */}
      <motion.div
        className="fixed right-4 md:right-8 lg:right-16 xl:right-32 top-0 z-40 flex flex-col items-center origin-top cursor-grab active:cursor-grabbing hidden sm:flex"
        drag
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        dragElastic={0.4}
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        title="ลากปฏิทินเล่นได้นะ!"
      >
        {/* Golden Wire */}
        <div className="w-1 h-32 md:h-44 bg-yellow-600/80 relative shadow-sm rounded-b-full">
          {/* Infinite wire extending above to not break when pulled down */}
          <div className="absolute bottom-full left-0 w-full h-[1500px] bg-yellow-600/80" />
        </div>
        
        {/* Calendar SVG */}
        <div className="relative -mt-[6px]">
          <svg width="140" height="150" viewBox="0 0 140 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_15px_25px_rgba(49,17,113,0.4)] pointer-events-none">
            {/* Hook Ring */}
            <path d="M70 20V8" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
            <circle cx="70" cy="5" r="5" stroke="#D97706" strokeWidth="3" fill="none" />

            {/* Rings (Binders) */}
            <rect x="35" y="10" width="12" height="30" rx="6" fill="#94A3B8" />
            <rect x="37" y="12" width="4" height="26" rx="2" fill="#E2E8F0" />

            <rect x="93" y="10" width="12" height="30" rx="6" fill="#94A3B8" />
            <rect x="95" y="12" width="4" height="26" rx="2" fill="#E2E8F0" />

            {/* Calendar Body Background (Shadow/Depth) */}
            <rect x="10" y="30" width="120" height="105" rx="16" fill="#CBD5E1" />
            
            {/* Calendar White Body */}
            <rect x="10" y="27" width="120" height="105" rx="16" fill="#FFFFFF" />

            {/* Calendar Purple Top */}
            <path d="M10 43C10 34.1634 17.1634 27 26 27H114C122.837 27 130 34.1634 130 43V60H10V43Z" fill="#A78BFA" />
            <path d="M10 55H130V60H10V55Z" fill="#8B5CF6" />

            {/* Grid of squares */}
            <rect x="25" y="70" width="18" height="18" rx="4" fill="#F1F5F9" />
            <rect x="50" y="70" width="18" height="18" rx="4" fill="#F1F5F9" />
            <rect x="75" y="70" width="18" height="18" rx="4" fill="#F1F5F9" />
            <rect x="100" y="70" width="18" height="18" rx="4" fill="#F1F5F9" />

            <rect x="25" y="98" width="18" height="18" rx="4" fill="#F1F5F9" />
            <rect x="50" y="98" width="18" height="18" rx="4" fill="#F1F5F9" />
            <rect x="75" y="98" width="18" height="18" rx="4" fill="#F1F5F9" />
            
            {/* Checked Square (Floating slightly above) */}
            <rect x="98" y="94" width="22" height="22" rx="5" fill="#8B5CF6" />
            {/* Checkmark */}
            <path d="M103 105L108 110L116 100" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </motion.div>

      <header id="top" className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img src="/login-background.png" alt="Background of vans" className="h-full w-full object-cover object-[center_75%]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-900/80 via-violet-800/60 to-transparent" />
        <motion.div
          className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-white md:px-5 md:pt-28"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
                จองรถตู้ประจำคณะได้ง่ายในที่เดียว
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 md:text-lg">
                ตรวจสอบการเดินรถ ตรวจสอบรถว่าง และส่งคำขอจองรถตู้ประจำคณะ
                ผ่านระบบออนไลน์ได้สะดวก รวดเร็ว และปลอดภัย
              </p>
            </div>
          </div>
        </motion.div>
      </header>

      <main className="bg-slate-50/70 pb-16">
        
        {/* Calendar Section with Background */}
        <section id="calendar" className="relative scroll-mt-[76px] pt-10 pb-20 overflow-hidden">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 z-0">
            <img src="/Foto01.png" alt="Calendar Background" className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/90 via-white/40 to-slate-50/90 backdrop-blur-[2px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-[1600px] px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5">
              <h2 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl drop-shadow-sm">
                ปฏิทินรวมการใช้รถตู้รายคณะ
              </h2>

              <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedFaculty('all')}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition shadow-sm ${selectedFaculty === 'all' ? 'bg-violet-700 text-white shadow-violet-700/20' : 'bg-white/80 backdrop-blur-md text-slate-700 ring-1 ring-white/50 hover:bg-white'}`}
            >
              ทุกคณะ
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFacultyDropdownOpen(!isFacultyDropdownOpen)}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/50 bg-white/80 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-w-[200px]"
              >
                <span className="truncate">
                  {selectedFaculty === 'all' ? 'เลือกดูรายคณะ...' : facultiesList.find(f => f.id === selectedFaculty)?.name}
                </span>
                <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${isFacultyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFacultyDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsFacultyDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-[280px] md:w-80 max-h-72 overflow-y-auto rounded-2xl border border-white/60 bg-white/95 backdrop-blur-xl p-2 shadow-[0_20px_40px_rgba(49,17,113,0.15)] z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFaculty('all');
                        setIsFacultyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${selectedFaculty === 'all' ? 'bg-violet-100 text-violet-800' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      เลือกดูรายคณะ...
                    </button>
                    {facultiesList.map((faculty) => (
                      <button
                        key={faculty.id}
                        type="button"
                        onClick={() => {
                          setSelectedFaculty(faculty.id);
                          setIsFacultyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors mt-1 ${selectedFaculty === faculty.id ? 'bg-violet-100 text-violet-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                      >
                        {faculty.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

          <div className="mt-5">
            <div className="overflow-hidden rounded-[32px] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(49,17,113,0.15)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/50 bg-white/40 px-6 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" aria-label="ช่วงก่อนหน้า" title="ช่วงก่อนหน้า" onClick={goToPrevious} className="rounded-full p-2.5 text-slate-700 transition hover:bg-white/80"><ChevronLeft size={20} /></button>
                  <button type="button" aria-label="ช่วงถัดไป" title="ช่วงถัดไป" onClick={goToNext} className="rounded-full p-2.5 text-slate-700 transition hover:bg-white/80"><ChevronRight size={20} /></button>
                  <button type="button" onClick={goToToday} className="ml-1 rounded-xl bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white">วันนี้</button>

                  <h3 className="ml-3 text-lg md:text-xl font-black text-slate-950 drop-shadow-sm">{getCalendarTitle(viewMode, currentDate)}</h3>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 bg-amber-400/20"></span>
                      <span>รอดำเนินการ</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 bg-emerald-400/20"></span>
                      <span>อนุมัติแล้ว</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-full bg-black/5 p-1.5 text-sm font-bold text-slate-600 backdrop-blur-md">
                    <button type="button" onClick={() => setViewMode('month')} className={`rounded-full px-4 py-2 transition shadow-sm ${viewMode === 'month' ? 'bg-violet-700 text-white shadow-violet-700/20' : 'hover:bg-white/80 hover:text-slate-900'}`}>เดือน</button>
                    <button type="button" onClick={() => setViewMode('week')} className={`rounded-full px-4 py-2 transition shadow-sm ${viewMode === 'week' ? 'bg-violet-700 text-white shadow-violet-700/20' : 'hover:bg-white/80 hover:text-slate-900'}`}>สัปดาห์</button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto p-5">
                {viewMode === 'day' ? (
                  <DayAgenda events={dayAgendaEvents} isLoading={isLoading} />
                ) : (
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-7 border-b border-white/40 pb-2">
                      {weekDays.map((day) => (
                        <div key={day} className="px-2 py-2 text-center text-sm font-black text-slate-500">{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7">
                      {displayedDays.map((day) => {
                        const dayEvents = eventMap[day.isoDate] || [];
                        const isToday = Boolean(today) && day.isoDate === toIsoDay(today as Date);

                        return (
                          <CalendarMonthCell
                            key={day.isoDate}
                            day={day}
                            events={dayEvents}
                            isToday={isToday}
                            isLoading={isLoading}
                            maxVisible={viewMode === 'week' ? 8 : 2}
                            minHeightClass={viewMode === 'week' ? 'min-h-[160px]' : 'min-h-[88px]'}
                            onEventClick={handleEventClick}
                            onShowMore={(day, events) => setSelectedDayEvents({ day, events })}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>


            </div>
          </div>
          </div>
        </section>

        <section id="faculties" className="mx-auto max-w-7xl px-4 md:px-6 mt-16 scroll-mt-[76px]">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h3 className="text-2xl font-black tracking-tight text-slate-800 md:text-3xl">เครือข่ายคณะและสถานะรถตู้</h3>
            <button type="button" onClick={() => setShowAllFaculties((prev) => !prev)} className="inline-flex items-center gap-1 text-sm font-black text-violet-700 hover:underline">
              {showAllFaculties ? 'ย่อรายการ' : `ดูทั้งหมด ${facultiesList.length} คณะ`} <ArrowUpRight size={14} />
            </button>
          </div>

          <motion.div
            className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {visibleFaculties.map((faculty) => {
              const status = getFleetStatus(faculty.availableVans, faculty.totalVans);

              return (
                <motion.a
                  key={faculty.id}
                  href={faculty.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]"
                  variants={itemVariants}
                >
                  <div className="flex-grow">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`inline-flex rounded-xl p-2.5 ${faculty.palette.surface}`}>
                        <FacultyGlyph iconKey={faculty.iconKey} className={`h-6 w-6 ${faculty.palette.accent}`} />
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${status.badge}`}>{status.label}</span>
                    </div>
                    <h4 className="mt-4 text-base font-black leading-snug text-slate-950">{faculty.name}</h4>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-black text-violet-700 group-hover:underline">
                    ดูตารางของคณะ <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-amber-400"><Headset size={22} /></div>
              <div>
                <p className="text-lg font-black">ติดต่อผู้ดูแลระบบ</p>
                <p className="text-sm text-slate-400">งานยานพาหนะ มหาวิทยาลัยพะเยา</p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 text-sm text-slate-300">
              <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <p>ที่อยู่: มหาวิทยาลัยพะเยา ตำบลแม่กา อำเภอเมืองพะเยา จังหวัดพะเยา 56000</p>
            </div>
          </div>

          <FooterContactBlock rows={[
            { icon: <Phone size={16} />, label: '0xx-xxx-xxxx' },
            { icon: <Mail size={16} />, label: 'vanbooking@up.ac.th' },
            { icon: <CalendarRange size={16} />, label: 'จันทร์-ศุกร์ 08:30-16:30 น.' },
          ]} />

          <div>
            <p className="text-sm font-black text-slate-200">ติดตามข่าวสาร</p>
            <div className="mt-4 flex items-center gap-3">
              <a href="https://www.facebook.com/UPayao" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"><Facebook size={18} /></a>
              <a href="https://line.me/ti/p/~@upthailand" target="_blank" rel="noopener noreferrer" aria-label="LINE" className="rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"><MessageCircle size={18} /></a>
            </div>
          </div>

          <div className="flex items-start justify-start lg:justify-end">
            <UpLogo className="h-16 w-16" />
          </div>
        </div>

        <div className="border-t border-white/10 py-5">
          <p className="mx-auto max-w-4xl px-4 text-center text-xs text-slate-400 md:px-6">
            ระบบรวมตารางการเดินรถจาก {facultiesList.length} คณะ เพื่อให้ทราบสถานะการใช้งานรถตู้ได้แม่นยำยิ่งขึ้น
          </p>
        </div>
      </footer>

      {selectedDayEvents && (
        <DayEventsModal
          day={selectedDayEvents.day}
          events={selectedDayEvents.events}
          onClose={() => setSelectedDayEvents(null)}
          onEventClick={(e) => {
            setSelectedDayEvents(null);
            handleEventClick(e);
          }}
        />
      )}

      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-[32px] bg-white p-8 shadow-2xl">
            <button type="button" onClick={() => setShowManualModal(false)} aria-label="ปิด" className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"><X size={20} /></button>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white"><FileText size={24} /></div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">คู่มือดูตารางรถตู้รวม</h2>
                <p className="text-sm text-slate-500">แนวทางใช้งานหน้า landing แบบเครือข่ายกลาง</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <GuideCard step="1" title="เลือกมุมมองคณะหรือทั้งเครือข่าย" description="ใช้ตัวกรองเพื่อดูเฉพาะรถของหน่วยงานเดียว หรือสลับกลับมาที่ 'ทุกคณะ' เพื่อดูภาพรวมทั้งมหาวิทยาลัย" />
              <GuideCard step="2" title="อ่านคิวจาก month view" description="แต่ละช่องวันจะแสดงรายการวิ่ง และสีประจำคณะที่เดินทางในวันนั้นแบบเดียวกับปฏิทินรายเดือน" />
              <GuideCard step="3" title="ตรวจสอบรายการจองวันนี้" description="แถบด้านขวาของปฏิทินสรุปคิวเดินรถของวันนี้ทั้งหมด พร้อมเวลาและหมายเลขรถที่ใช้งาน" />
              <GuideCard step="4" title="เปิดตารางรายคณะต่อได้ทันที" description="การ์ดของแต่ละคณะลิงก์ไปยังหน้าปฏิทินต้นทาง ทำให้ตรวจสอบรายละเอียดเชิงลึกต่อได้โดยไม่ต้องค้นหาเอง" />
            </div>
          </div>
        </div>
      )}

      {showEventDetailModal && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setShowEventDetailModal(false)}
        />)}
    </div>
  );
}

function CalendarMonthCell({
  day,
  events,
  isToday,
  isLoading,
  maxVisible = 2,
  minHeightClass = 'min-h-[112px]',
  onEventClick,
  onShowMore,
}: {
  day: DayCell;
  events: NetworkCalendarEvent[];
  isToday: boolean;
  isLoading: boolean;
  maxVisible?: number;
  minHeightClass?: string;
  onEventClick: (event: NetworkCalendarEvent) => void;
  onShowMore?: (day: DayCell, events: NetworkCalendarEvent[]) => void;
}) {  

  const renderEvent = (event: NetworkCalendarEvent) => {
    const eventDate = new Date(event.start);
    const todayDate = new Date();
    
    const isTodayEvent = eventDate.toDateString() === todayDate.toDateString();
    const dynamicStatus = isTodayEvent ? 'on-trip' : 'approved';

    const faculty = getFacultyById(event.facultyId);
    const meta = statusMeta[dynamicStatus];
    if (!meta) {
      return null;
    }

    const facultyColor = faculty?.palette.accentRgb ?? 'rgba(148, 163, 184, 0.5)';
    const ownerId = event.ownerFacultyName ? inferFacultyId(event.ownerFacultyName) : null;
    const ownerFaculty = ownerId && ownerId !== 'network' ? getFacultyById(ownerId) : null;

    return (
      <button
        key={event.id}
        type="button"
        onClick={() => {
          onEventClick(event);
        }}
        className={`w-[95%] text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md rounded-lg border-l-4 px-1.5 py-1 bg-white/80 backdrop-blur-sm border-white shrink-0 mx-auto`}
        style={{ borderLeftColor: facultyColor }}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${(event.status === 'approved' || event.status === 'on-trip') ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className={`font-bold truncate text-[9px] 2xl:text-[10px] ${faculty?.palette.accent ?? 'text-slate-800'}`}>
                {faculty?.shortName ?? 'อื่นๆ'}
              </span>
            </div>
            {ownerFaculty && ownerFaculty.id !== faculty?.id && (
              <div className="flex items-center gap-0.5 shrink-0">
                <span className={`h-1 w-1 rounded-full`} style={{ backgroundColor: ownerFaculty.palette.accentRgb || '#94a3b8' }} />
                <span className="text-[8px] font-semibold text-slate-500">
                  {ownerFaculty.shortName}
                </span>
              </div>
            )}
          </div>
          <span className="text-[8px] text-slate-500 truncate mt-0.5">{event.destination}</span>
        </div>
      </button>
    );
  };

  return (
    <div className={`${minHeightClass} border-r border-t border-white/30 p-2 align-top transition-colors ${day.isCurrentMonth ? 'bg-white/50 hover:bg-white/70' : 'bg-black/5 text-slate-400'}`}>
      <div className="flex justify-between items-start mb-1">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-sm ${isToday ? 'bg-violet-700 text-white shadow-violet-700/30 scale-110' : 'bg-white/80 text-slate-700'}`}>
          {day.dayLabel}
        </span>
        {!isLoading && events.length > maxVisible && (
          <button 
            type="button" 
            onClick={() => onShowMore && onShowMore(day, events)}
            className="flex items-center justify-center rounded-full bg-violet-100/80 px-1.5 py-0.5 text-[9px] font-bold text-violet-800 shadow-sm transition-all hover:scale-[1.02] hover:bg-violet-200"
          >
            +{events.length - maxVisible} คิวรถ
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 relative items-center w-full">
        {isLoading && day.isCurrentMonth && <div className="h-6 w-[95%] animate-pulse rounded-lg bg-slate-100" />}
        
        {!isLoading && (
          <>
            {events.slice(0, maxVisible).map(renderEvent)}
          </>
        )}
      </div>
    </div>
  );
}

function DayAgenda({ events, isLoading }: { events: NetworkCalendarEvent[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 w-full animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm font-semibold text-slate-400">
        ไม่มีคิวเดินรถในวันนี้
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {events.map((event) => {
        const faculty = getFacultyById(event.facultyId);
        const eventStart = new Date(event.start);

        return (
          <div key={event.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="w-14 shrink-0 text-sm font-black text-slate-700">
              {pad(eventStart.getHours())}:{pad(eventStart.getMinutes())}
            </span>
            <div className={`rounded-xl p-2 ${faculty?.palette.surface ?? 'bg-slate-100'}`}>
              <FacultyGlyph iconKey={faculty?.iconKey ?? 'briefcase'} className={`h-4 w-4 ${faculty?.palette.accent ?? 'text-slate-500'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-900">{faculty?.name ?? 'เครือข่ายกลาง'}</p>
              <p className="text-xs text-slate-500">{event.destination}</p>
            </div>
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{event.vanCode}</span>
          </div>
        );
      })}
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: NetworkCalendarEvent | null; onClose: () => void }) {
  if (!event) return null;

  const faculty = getFacultyById(event.facultyId);
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  const startStr = eventStart.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const endStr = eventEnd.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isMultiDay = toIsoDay(eventStart) !== toIsoDay(eventEnd);
  const dateRangeDisplay = isMultiDay ? `${startStr} ถึง ${endStr}` : startStr;

  const ownerId = event.ownerFacultyName ? inferFacultyId(event.ownerFacultyName) : null;
  const ownerFaculty = ownerId && ownerId !== 'network' ? getFacultyById(ownerId) : null;
  const isCrossFaculty = ownerFaculty && ownerFaculty.id !== faculty?.id;

  const detailItems = [
    { label: 'ผู้ขอใช้บริการ', value: event.requester ? `${event.requester} ${event.phone ? `(${event.phone})` : ''}` : 'ไม่ระบุ' },
    { label: 'วัตถุประสงค์', value: event.purpose || event.title },
    { label: 'เดินทางไป', value: event.destination },
    { label: 'ช่วงเวลาเดินทาง', value: dateRangeDisplay },
    { label: 'เวลาประจำวัน', value: event.timeStr || `${pad(eventStart.getHours())}:${pad(eventStart.getMinutes())} น.` },
  ];

  if (isCrossFaculty && ownerFaculty) {
    detailItems.push({ label: 'ยืมรถจาก', value: ownerFaculty.name });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className={`rounded-t-2xl p-5 ${faculty?.palette.surface ?? 'bg-slate-100'}`}>
          <div className="flex items-start justify-between">
            <div className={`rounded-xl p-3 ring-1 ring-black/5 ${faculty?.palette.surface ?? 'bg-white'}`}>
              <FacultyGlyph iconKey={faculty?.iconKey ?? 'briefcase'} className={`h-7 w-7 ${faculty?.palette.accent ?? 'text-slate-500'}`} />
            </div>
            <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-full bg-black/10 p-1.5 text-black/50 transition hover:bg-black/20 hover:text-black/80"><X size={16} /></button>
          </div>
          <h3 className="mt-3 text-xl font-black text-slate-950">{event.bookingFacultyName || faculty?.name || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร'}</h3>
          <p className="text-sm font-semibold text-slate-500">
            {startStr}
          </p>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {detailItems.map(item => (
              <div key={item.label} className="grid grid-cols-[120px_1fr] items-start gap-2 text-sm">
                <span className="font-bold text-slate-500">{item.label}:</span>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
          <button type="button" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
            <Paperclip size={14} /> ดูเอกสารแนบ (ถ้ามี)
          </button>
        </div>
      </div>
    </div>
  );
}

function DayEventsModal({ 
  day, 
  events, 
  onClose, 
  onEventClick 
}: { 
  day: DayCell; 
  events: NetworkCalendarEvent[]; 
  onClose: () => void; 
  onEventClick: (event: NetworkCalendarEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-[32px] border border-white/60 bg-white/95 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(49,17,113,0.2)] animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200/50 pb-3 px-2">
          <span className="text-base font-black text-slate-800">
            วันที่ {day.dayLabel} {day.isCurrentMonth ? '' : '(เดือนอื่น)'}
          </span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-black/5 hover:bg-black/10 rounded-full p-2 transition">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto px-1 pb-1">
          {events.map((event) => {
            const faculty = getFacultyById(event.facultyId);
            const eventDate = new Date(event.start);
            const todayDate = new Date();
            const isTodayEvent = eventDate.toDateString() === todayDate.toDateString();
            const dynamicStatus = isTodayEvent ? 'on-trip' : 'approved';
            const meta = statusMeta[dynamicStatus];
            if (!meta) return null;
            const facultyColor = faculty?.palette.accentRgb ?? 'rgba(148, 163, 184, 0.5)';

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                className="w-full text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md rounded-xl border-l-4 px-4 py-3 bg-white/80 backdrop-blur-sm border-white shrink-0"
                style={{ borderLeftColor: facultyColor }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-black truncate text-sm ${faculty?.palette.accent ?? 'text-slate-800'}`}>
                    {faculty?.name ?? 'อื่นๆ'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.chip}`} />
                    <span className="text-[11px] font-bold text-slate-500">{meta.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FooterContactBlock({ rows }: { rows: Array<{ icon: React.ReactNode; label: string }> }) {
  return (
    <div>
      <p className="text-sm font-black text-slate-200">ข้อมูลติดต่อ</p>
      <div className="mt-4 space-y-3 text-sm text-slate-300">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="text-slate-400">{row.icon}</span>
            <span>{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-700 text-sm font-black text-white">{step}</div>
      <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}
