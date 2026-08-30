"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CarFront, User, FileText, CalendarDays, 
  ChevronLeft, ChevronRight, ExternalLink} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';

type RequestItem = {
  id: string | number;
  time: string;
  requester: string;
  date: string;
  destination: string;
  passengers: string;
};

type CalendarEvent = {
  id?: string | number;
  startAt?: string;
  status?: string;
};

type Booking = {
  id: string | number;
  submittedAt: string;
  requester: string;
  requesterFaculty: string;
  startAt: string;
  endAt: string;
  destination: string;
  passengers: string | number;
};

type Van = {
  status: string;
};

type Driver = {
  isLocked: boolean;
};

export default function FacultyAdminDashboard() {

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [vansCount, setVansCount] = useState(0);
  const [readyVansCount, setReadyVansCount] = useState(0);
  const [driversCount, setDriversCount] = useState(0);
  const [activeDriversCount, setActiveDriversCount] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Instant hydration from sessionStorage
    try {
      const cached = sessionStorage.getItem('cached_faculty_dashboard');
      if (cached) {
        const d = JSON.parse(cached);
        if (d) {
          if (Array.isArray(d.requests)) setRequests(d.requests);
          if (typeof d.vansCount === 'number') setVansCount(d.vansCount);
          if (typeof d.readyVansCount === 'number') setReadyVansCount(d.readyVansCount);
          if (typeof d.driversCount === 'number') setDriversCount(d.driversCount);
          if (typeof d.activeDriversCount === 'number') setActiveDriversCount(d.activeDriversCount);
          if (Array.isArray(d.calendarEvents)) setCalendarEvents(d.calendarEvents);
          setIsLoading(false);
        }
      }
    } catch {}

    const safetyTimer = setTimeout(() => setIsLoading(false), 1200);

    async function loadData() {
      try {
        const [reqRes, vanRes, drvRes, calRes] = await Promise.allSettled([
          fetch('/api/bookings'),
          fetch('/api/vans'),
          fetch('/api/drivers'),
          fetch('/api/calendar-events')
        ]);
        
        const reqData = reqRes.status === 'fulfilled' && reqRes.value.ok ? await reqRes.value.json() : { bookings: [] };
        const vanData = vanRes.status === 'fulfilled' && vanRes.value.ok ? await vanRes.value.json() : { vans: [] };
        const drvData = drvRes.status === 'fulfilled' && drvRes.value.ok ? await drvRes.value.json() : { drivers: [] };
        const calData = calRes.status === 'fulfilled' && calRes.value.ok ? await calRes.value.json() : { events: {} };
        
        const formatThaiDateTime = (dateStr: string) => {
          if (!dateStr) return "-";
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return "-";
          return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                 ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        };
        
        const rawBookings = Array.isArray(reqData.bookings) ? reqData.bookings : [];
        const pendingBookings = rawBookings.filter((b: { status?: string }) => b.status === 'WAITING_ADMIN' || b.status === 'WAITING_EXEC');
        
        const mapped = pendingBookings.map((b: Booking) => ({
          id: b.id,
          time: formatThaiDateTime(b.submittedAt),
          requester: `${b.requester}\n${b.requesterFaculty}`,
          date: `${new Date(b.startAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}\n${new Date(b.startAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.endAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
          destination: b.destination,
          passengers: `${b.passengers} คน`,
        }));
        
        setRequests(mapped);

        const vans = Array.isArray(vanData.vans) ? vanData.vans : [];
        const vCount = vans.length;
        const vReady = vans.filter((v: Van & { isActive?: boolean }) => v.status === 'ready' || Boolean(v.isActive)).length;
        setVansCount(vCount);
        setReadyVansCount(vReady);

        const drivers = Array.isArray(drvData.drivers) ? drvData.drivers : [];
        const dCount = drivers.length;
        const dActive = drivers.filter((d: Driver & { isActive?: boolean }) => !d.isLocked && d.isActive !== false).length;
        setDriversCount(dCount);
        setActiveDriversCount(dActive);

        const flattenedCalEvents: CalendarEvent[] = [];
        if (calData && calData.events) {
          Object.entries(calData.events).forEach(([dateKey, eventList]) => {
            if (Array.isArray(eventList)) {
              eventList.forEach((ev: { id?: string; date?: string; status?: string }) => {
                flattenedCalEvents.push({
                  id: ev.id,
                  startAt: `${ev.date || dateKey}T08:30:00`,
                  status: ev.status === 'approved' ? 'APPROVED' : 'WAITING_ADMIN'
                });
              });
            }
          });
        }
        setCalendarEvents(flattenedCalEvents);

        try {
          sessionStorage.setItem('cached_faculty_dashboard', JSON.stringify({
            requests: mapped,
            vansCount: vCount,
            readyVansCount: vReady,
            driversCount: dCount,
            activeDriversCount: dActive,
            calendarEvents: flattenedCalEvents
          }));
        } catch {}

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    return () => clearTimeout(safetyTimer);
  }, []);

  const router = useRouter();

  // Dynamic Calendar State starting from actual today (initialized with static to prevent prerender error)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 19)); 
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
    setSelectedDay(new Date().getDate());
  }, []);

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const cells = [];
    
    // Add prev month days (grayed out)
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthTotalDays - i, isCurrent: false, key: `p-${i}` });
    }
    
    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
      cells.push({ day: i, isCurrent: true, key: `c-${i}` });
    }
    
    // Add next month days (grayed out) to complete 6 rows (42 cells)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, isCurrent: false, key: `n-${i}` });
    }
    
    return cells;
  };

  const getEventsForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const events = Array.isArray(calendarEvents) ? calendarEvents : [];
    return events.filter(e => e && e.startAt && e.startAt.startsWith(dateStr));
  };

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const displayMonthName = `${thaiMonths[currentDate.getMonth()]} ${currentDate.getFullYear() + 543}`;

  const todayEventsCount = getEventsForDay(selectedDay || 19).length;

  return (
    <AppShell>
      <div className="max-w-[1400px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0">
        
        {/* ----- Header ----- */}
        <div className="mb-6 shrink-0">
          <h1 className="text-[26px] font-black text-gray-900 leading-tight">แดชบอร์ดคณะ</h1>
          <p className="text-sm text-gray-500 mt-1">ภาพรวมการดำเนินงานระบบขอใช้รถตู้ของคณะ ทั้งคน รถ และภารกิจในภาพรวม</p>
        </div>

        {/* ----- KPI Cards (4 กล่อง) ----- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
          {/* KPI 1 - รถประจำคณะ */}
          <Link 
            href="/faculty-admin/vans"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#311171]/20 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#311171] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#311171]/30">
                <CarFront size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">รถประจำคณะ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">{isLoading ? '-' : vansCount} คัน</span>
                </div>
                <p className="text-xs font-bold text-green-600 mt-0.5">พร้อมใช้งาน {isLoading ? '-' : readyVansCount} คัน</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-[#311171] transition-colors" />
          </Link>
          
          {/* KPI 2 - คนขับประจำ */}
          <Link 
            href="/faculty-admin/drivers"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-green-200">
                <User size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">คนขับประจำ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">{isLoading ? '-' : driversCount} คน</span>
                </div>
                <p className="text-xs font-bold text-green-600 mt-0.5">พร้อมปฏิบัติหน้าที่ {isLoading ? '-' : activeDriversCount} คน</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-green-500 transition-colors" />
          </Link>

          {/* KPI 3 - คำขอรออนุมัติ */}
          <Link 
            href="/faculty-admin/approvals"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#C39B22]/30 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#C39B22] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#C39B22]/30">
                <FileText size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">คำขอรออนุมัติ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">{isLoading ? '-' : requests.length} รายการ</span>
                </div>
                {requests.length > 0 ? (
                  <p className="text-xs font-bold text-[#A07A15] mt-0.5">ต้องดำเนินการ</p>
                ) : (
                  <p className="text-xs font-bold text-gray-400 mt-0.5">ไม่มีคำขอค้าง</p>
                )}
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-[#C39B22] transition-colors" />
          </Link>

          {/* KPI 4 - วันนี้มีภารกิจ */}
          <Link 
            href="/faculty-admin/calendar"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-blue-200">
                <CalendarDays size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">วันนี้มีภารกิจ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">{isLoading ? '-' : todayEventsCount} รายการ</span>
                </div>
                {todayEventsCount > 0 ? (
                  <p className="text-xs font-bold text-blue-600 mt-0.5">เดินทางตามแผน</p>
                ) : (
                  <p className="text-xs font-bold text-gray-400 mt-0.5">ไม่มีภารกิจวันนี้</p>
                )}
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>

        {/* ----- Main Content Layout (2 Columns) ----- */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 flex-1 min-h-0">
          
          {/* ----- Left Column ----- */}
          <div className="flex flex-col gap-8 h-full min-h-0">

            {/* คำขอรออนุมัติ */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-[18px] font-black text-gray-900">คำขอรออนุมัติ</h2>
                <Link href="/faculty-admin/approvals" className="text-sm font-bold text-[#311171] hover:underline flex items-center gap-1">
                  ดูทั้งหมด <ChevronRight size={16} />
                </Link>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-0">
                <div className="overflow-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                      <tr className="border-b border-gray-100 text-xs font-bold text-gray-500">
                        <th className="p-4 font-bold whitespace-nowrap">เลขคำขอ</th>
                        <th className="p-4 font-bold min-w-[140px]">ผู้ขอใช้รถ</th>
                        <th className="p-4 font-bold min-w-[120px]">วันที่เดินทาง</th>
                        <th className="p-4 font-bold min-w-[120px]">ปลายทาง</th>
                        <th className="p-4 font-bold text-center">จำนวนผู้โดยสาร</th>
                        <th className="p-4 font-bold text-center w-[60px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-400 text-sm font-bold">
                            กำลังโหลดข้อมูล...
                          </td>
                        </tr>
                      ) : requests.length > 0 ? requests.map((req) => (
                        <tr 
                          key={req.id} 
                          onClick={() => router.push('/faculty-admin/approvals')}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="p-4 align-top">
                            <div className="text-sm font-bold text-[#311171] group-hover:text-[#250d55] mb-0.5">{req.id}</div>
                            <div className="text-[11px] text-gray-400">{req.time}</div>
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-800 align-top whitespace-pre-line leading-relaxed">
                            {req.requester}
                          </td>
                          <td className="p-4 text-sm text-gray-700 font-medium align-top whitespace-pre-line leading-relaxed">
                            {req.date}
                          </td>
                          <td className="p-4 text-sm text-gray-700 align-top whitespace-pre-line leading-relaxed">
                            {req.destination}
                          </td>
                          <td className="p-4 text-sm font-bold text-gray-900 align-top text-center">
                            {req.passengers}
                          </td>
                          <td className="p-4 align-middle text-right">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-[#f0eaff] group-hover:text-[#311171] transition-colors ml-auto">
                              <ChevronRight size={20} />
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-400 text-sm font-bold">
                            ไม่มีคำขอรออนุมัติในขณะนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                  <p>แสดง {isLoading ? 0 : (requests.length > 0 ? 1 : 0)} - {isLoading ? 0 : requests.length} จาก {isLoading ? 0 : requests.length} รายการ</p>
                  <Link href="/faculty-admin/approvals" className="font-bold text-[#311171] border border-gray-200 rounded-lg px-4 py-1.5 hover:bg-gray-50 transition-colors">
                    ดูทั้งหมด
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* ----- Right Column ----- */}
          <div className="flex flex-col gap-8 h-full min-h-0">
            
            {/* ปฏิทินคณะ */}
            <div className="shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[18px] font-black text-gray-900">ปฏิทินคณะ</h2>
                <button 
                  onClick={() => window.open('https://calendar.google.com', '_blank')}
                  className="text-xs font-bold text-white bg-[#311171] hover:bg-[#250d55] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  เปิด Google Calendar <ExternalLink size={12} />
                </button>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 transition-all">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <button 
                      onClick={prevMonth}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={nextMonth}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-gray-900">{displayMonthName}</h3>
                  <div className="w-[68px]"></div> {/* Spacer for balance */}
                </div>

                <div className="grid grid-cols-7 text-center mb-2">
                  {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((day) => (
                    <div key={day} className="text-xs font-bold text-gray-500 py-1">{day}</div>
                  ))}
                </div>
                
                {/* Dynamic Calendar Grid */}
                <div className="grid grid-cols-7 text-center gap-y-2 mb-6">
                  {getCalendarDays(currentDate).map(cell => {
                    if (!cell.isCurrent) {
                      return (
                        <div key={cell.key} className="text-sm font-medium text-gray-300 py-1.5">
                          {cell.day}
                        </div>
                      );
                    }
                    
                    const isSelected = selectedDay === cell.day;
                    const events = getEventsForDay(cell.day);
                    const hasDot = events.length > 0;
                    const dotColor = events.some(e => e.status === 'WAITING_EXEC') ? 'bg-[#C39B22]' : 'bg-[#311171]';
                    
                    return (
                      <button
                        key={cell.key}
                        onClick={() => setSelectedDay(cell.day)}
                        className={`text-sm font-bold py-1.5 rounded-full hover:bg-gray-100 relative ${
                          isSelected ? 'bg-[#311171] text-white hover:bg-[#311171]' : 'text-gray-700'
                        }`}
                      >
                        {cell.day}
                        {hasDot && (
                          <div 
                            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : dotColor
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-gray-500 font-bold border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> เดินทางภายในจังหวัด</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#C39B22]"></div> เดินทางต่างจังหวัด</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#311171]"></div> กิจกรรม/อบรม</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"></div> อื่น ๆ</div>
                </div>
              </div>
            </div>
        
          </div>
        </div>
      </div>
      
    </AppShell>
  );
}
