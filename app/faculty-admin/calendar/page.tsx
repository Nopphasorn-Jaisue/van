"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { 
  ChevronLeft, ChevronRight, 
  Search, RotateCcw, Plus,
  MapPin, Calendar, Clock, User, FileText, 
  CalendarDays, X, Edit, Trash2,
} from 'lucide-react';
import { facultiesList } from '@/Frontend/data/faculties';
import { facultyVansList, UnifiedVanInfo } from '@/Frontend/data/faculty-vans';

type RawCalendarEventItem = {
  id?: string | number;
  vanId?: string;
  facultyId?: string;
  date?: string | Date;
  time?: string;
  destination?: string;
  purpose?: string;
  passengers?: number;
  status?: string;
  bookingFaculty?: string;
  requester?: string;
  department?: string;
  purposeDetail?: string;
  routeDetail?: string;
  statusText?: string;
  statusTime?: string;
};

type CalendarBookingEvent = {
  id: string;
  vanId: string;
  facultyId?: string;
  date: Date | string;
  time: string;
  destination: string;
  purpose: string;
  passengers: number;
  status: string;
  bookingFaculty: string;
  requester: string;
  department: string;
  purposeDetail?: string;
  routeDetail?: string;
  statusText?: string;
  statusTime?: string;
};

function CalendarContent() {
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState("all");
  const [selectedVanFilter, setSelectedVanFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const [baseDate, setBaseDate] = useState(new Date(2026, 6, 19));
  const [todayDate, setTodayDate] = useState(new Date(2026, 6, 19));
  const [selectedEvent, setSelectedEvent] = useState<CalendarBookingEvent | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const d = new Date();
  const initDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [eventFormData, setEventFormData] = useState({
    destination: '',
    purpose: '',
    date: initDate,
    time: '08:30 - 16:30 น.',
    requester: 'ดร.สมเกียรติ เรียนดี',
    bookingFaculty: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
    passengers: 10,
    vanId: 'v-ict',
    vanType: 'OWN' as 'OWN' | 'BORROW',
  });

  const [bookingsData, setBookingsData] = useState<CalendarBookingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/calendar-events');
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          try {
            const data = JSON.parse(text);
            if (data && data.rawEvents && Array.isArray(data.rawEvents)) {
              const mapped: CalendarBookingEvent[] = data.rawEvents.map((e: RawCalendarEventItem) => {
                let eventDate = new Date();
                if (e.date) {
                  if (e.date instanceof Date) {
                    eventDate = e.date;
                  } else {
                    const dateStr = String(e.date);
                    eventDate = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
                  }
                }
                if (isNaN(eventDate.getTime())) eventDate = new Date();

                return {
                  id: String(e.id),
                  vanId: String(e.vanId || 'v-ict'),
                  facultyId: e.facultyId || 'ict',
                  date: eventDate,
                  time: e.time || '08:30 - 16:30 น.',
                  destination: e.destination || 'ไม่ระบุสถานที่',
                  purpose: e.purpose || 'ภารกิจคณะ',
                  passengers: Number(e.passengers || 10),
                  status: e.status || 'approved',
                  bookingFaculty: e.bookingFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
                  requester: e.requester || 'ผู้ขอใช้รถ',
                  department: e.department || 'สำนักงานคณบดี',
                  purposeDetail: e.purposeDetail || e.purpose,
                  routeDetail: e.routeDetail || `พะเยา -> ${e.destination}`,
                  statusText: e.statusText || 'อนุมัติแล้ว',
                  statusTime: e.statusTime || 'บันทึกในระบบ'
                };
              });
              setBookingsData(mapped);
            }
          } catch (err) {
            console.warn("JSON Parse Error:", err);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    setBaseDate(now);
    setTodayDate(now);
    fetchEvents();
  }, []);

  const handlePrevDateRange = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      if (viewMode === "week") d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextDateRange = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      if (viewMode === "week") d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleGoToday = () => {
    setBaseDate(new Date());
  };

  const getThaiMonthFull = (monthIndex: number) => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return months[monthIndex] || "มกราคม";
  };

  const getDayNameFull = (dayIndex: number) => {
    const days = ["วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"];
    return days[dayIndex] || "วันจันทร์";
  };

  const getWeekDays = (date: Date) => {
    const currentDay = date.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const mondayDate = new Date(date);
    mondayDate.setDate(date.getDate() + distanceToMonday);
    
    const days = [];
    const shortMonthsThai = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const dayNames = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      days.push({
        label: `${dayNames[i]} ${d.getDate()} ${shortMonthsThai[d.getMonth()]}`,
        dateObj: d
      });
    }
    return days;
  };

  const isSameDate = (d1: Date | string | number | null | undefined, d2: Date | string | number | null | undefined) => {
    if (!d1 || !d2) return false;
    const date1 = d1 instanceof Date ? d1 : new Date(d1);
    const date2 = d2 instanceof Date ? d2 : new Date(d2);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // 1 Faculty = 1 Van + 1 Driver
  const vansList: UnifiedVanInfo[] = facultyVansList;
  const vansMap: Record<string, UnifiedVanInfo> = {};
  vansList.forEach(v => vansMap[v.id] = v);

  const filteredVans = vansList.filter(v => {
    if (selectedFacultyFilter === "all") return true;
    return v.facultyName === selectedFacultyFilter;
  });

  const filteredBookings = bookingsData.filter(b => {
    const searchString = searchQuery.toLowerCase();
    const destination = (b.destination || '').toLowerCase();
    const purpose = (b.purpose || '').toLowerCase();
    const requester = (b.requester || '').toLowerCase();

    const matchesSearch = searchQuery === "" || 
      destination.includes(searchString) ||
      purpose.includes(searchString) ||
      requester.includes(searchString);

    const matchesVan = selectedVanFilter === "all" ? true : b.vanId === selectedVanFilter;
    const matchesStatus = selectedStatusFilter === "all" ? true : b.status === selectedStatusFilter;

    return matchesSearch && matchesVan && matchesStatus;
  });

  const handleOpenAddModal = (dateStr?: string) => {
    setEditingEventId(null);
    let defaultDate = dateStr;
    if (!defaultDate) {
      const d = new Date();
      defaultDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    setEventFormData({
      destination: '',
      purpose: '',
      date: defaultDate,
      time: '08:30 - 16:30 น.',
      requester: 'ดร.สมเกียรติ เรียนดี',
      bookingFaculty: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
      passengers: 10,
      vanId: 'v-ict',
      vanType: 'OWN',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: CalendarBookingEvent) => {
    setEditingEventId(event.id);
    const now = new Date();
    let eventDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (event.date) {
      const d = event.date instanceof Date ? event.date : new Date(event.date);
      if (!isNaN(d.getTime())) {
        eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    setEventFormData({
      destination: event.destination || '',
      purpose: event.purpose || '',
      date: eventDateStr,
      time: event.time || '08:30 - 16:30 น.',
      requester: event.requester || '',
      bookingFaculty: event.bookingFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
      passengers: event.passengers || 10,
      vanId: event.vanId || 'v-ict',
      vanType: event.status === 'pending_cross_faculty' ? 'BORROW' : 'OWN',
    });
    setIsModalOpen(true);
  };

  const handleSaveCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const targetVan = vansMap[eventFormData.vanId] || vansList[0];

    const isBorrowing = eventFormData.vanType === 'BORROW';
    const payload = {
      vanId: eventFormData.vanId,
      facultyId: targetVan.facultyId,
      bookingFaculty: eventFormData.bookingFaculty,
      destination: eventFormData.destination,
      purpose: eventFormData.purpose,
      purposeDetail: eventFormData.purpose,
      routeDetail: `พะเยา -> ${eventFormData.destination}`,
      date: eventFormData.date,
      time: eventFormData.time,
      passengers: Number(eventFormData.passengers),
      requester: eventFormData.requester,
      department: "สำนักงานคณบดี",
      status: isBorrowing ? "pending_cross_faculty" : "approved",
      statusText: isBorrowing ? "รอการยืนยันจากคณะเจ้าของรถ" : "อนุมัติแล้ว",
      statusTime: "บันทึกในระบบ"
    };

    try {
      if (editingEventId) {
        const res = await fetch('/api/calendar-events', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingEventId, ...payload })
        });
        if (res.ok) {
          fetchEvents();
          if (selectedEvent && selectedEvent.id === editingEventId) {
            setSelectedEvent({
              ...selectedEvent,
              ...payload,
              date: new Date(payload.date)
            });
          }
        }
      } else {
        const res = await fetch('/api/calendar-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          fetchEvents();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกตารางปฏิทิน");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมในปฏิทินนี้?")) return;
    try {
      await fetch(`/api/calendar-events?id=${id}`, { method: 'DELETE' });
      setBookingsData(prev => prev.filter(b => b.id !== id));
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cute Faculty Palette Styling (Soft aesthetic matching screenshot)
  const getFacultyStyle = (facultyName: string | undefined) => {
    switch (facultyName) {
      case "คณะเภสัชศาสตร์":
        return {
          shortName: "เภสัชฯ",
          colorClass: "text-[#51621F] bg-[#51621F]/10 border-[#51621F]/30",
          dotColor: "bg-[#51621F]",
          barColor: "bg-[#51621F]"
        };
      case "คณะวิทยาศาสตร์":
        return {
          shortName: "วิทยาศาสตร์",
          colorClass: "text-[#d97706] bg-[#fef3c7] border-[#fde68a]",
          dotColor: "bg-[#f59e0b]",
          barColor: "bg-[#f59e0b]"
        };
      case "คณะเทคโนโลยีสารสนเทศและการสื่อสาร":
        return {
          shortName: "ICT",
          colorClass: "text-[#b45309] bg-[#fef3c7]/60 border-[#fde68a]",
          dotColor: "bg-[#d97706]",
          barColor: "bg-[#d97706]"
        };
      case "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ":
        return {
          shortName: "เกษตรฯ",
          colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
          dotColor: "bg-emerald-600",
          barColor: "bg-emerald-600"
        };
      case "คณะพลังงานและสิ่งแวดล้อม":
        return {
          shortName: "พลังงานฯ",
          colorClass: "text-lime-800 bg-lime-50 border-lime-200",
          dotColor: "bg-lime-600",
          barColor: "bg-lime-600"
        };
      default:
        return {
          shortName: facultyName || "ทั่วไป",
          colorClass: "text-purple-800 bg-purple-50 border-purple-200",
          dotColor: "bg-[#311171]",
          barColor: "bg-[#311171]"
        };
    }
  };

  const getStatusBadgeColor = (status: string | undefined) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "ongoing": return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed": return "bg-[#efeaff] text-[#311171] border-[#311171]/20";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      cells.push({ day: prevMonthTotalDays - i, isCurrent: false, dateObj: d, key: `p-${i}` });
    }
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      cells.push({ day: i, isCurrent: true, dateObj: d, key: `c-${i}` });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ day: i, isCurrent: false, dateObj: d, key: `n-${i}` });
    }
    return cells;
  };

  const weekDays = getWeekDays(baseDate);

  const selectedEventDateObj = selectedEvent?.date 
    ? (selectedEvent.date instanceof Date ? selectedEvent.date : new Date(selectedEvent.date))
    : new Date();

  const safeDayIndex = !isNaN(selectedEventDateObj.getTime())
    ? (selectedEventDateObj.getDay() === 0 ? 6 : selectedEventDateObj.getDay() - 1)
    : 0;

  return (
    <div className="max-w-[1600px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0 space-y-2">
        
        {/* ----- Filter & Action Controls Bar ----- */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-2 bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input 
                type="text" 
                placeholder="ค้นหาปลายทาง, ผู้ขอ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold focus:outline-none focus:border-[#311171] focus:bg-white transition-all"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            </div>

            <select 
              value={selectedFacultyFilter}
              onChange={(e) => {
                setSelectedFacultyFilter(e.target.value);
                setSelectedVanFilter("all");
              }}
              className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none font-bold text-gray-700 cursor-pointer"
            >
              <option value="all">ทุกคณะรวมกัน</option>
              {facultiesList.map(faculty => (
                <option key={faculty.id} value={faculty.name}>
                  {faculty.name} {faculty.id === 'ict' ? '(คณะของคุณ)' : ''}
                </option>
              ))}
            </select>

            <select 
              value={selectedVanFilter}
              onChange={(e) => setSelectedVanFilter(e.target.value)}
              className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none font-bold text-gray-700 cursor-pointer"
            >
              <option value="all">รถตู้ทั้งหมด ({vansList.length} คัน)</option>
              {filteredVans.map(v => (
                <option key={v.id} value={v.id}>{v.vanName} ({v.shortFacultyName})</option>
              ))}
            </select>

            <button 
              onClick={() => { setSearchQuery(""); setSelectedVanFilter("all"); setSelectedFacultyFilter("all"); setSelectedStatusFilter("all"); }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="ล้างตัวกรอง"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-[#311171] hover:bg-[#230b54] text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={16} />
              <span>เพิ่มตารางปฏิทิน</span>
            </button>

            <Link
              href="/faculty-admin/google-calendar"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <CalendarDays size={14} />
              <span>ซิงค์ Google Calendar</span>
            </Link>
          </div>

        </div>

        {/* ----- Cute White Card Calendar Box ----- */}
        <div className={`grid grid-cols-1 ${selectedEvent ? 'lg:grid-cols-[1fr_340px]' : ''} gap-4 flex-1 min-h-0 transition-all duration-300`}>
          
          <div 
            onClick={() => setSelectedEvent(null)}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col min-h-0 flex-1 overflow-hidden"
          >
            
            {/* Cute Navigation Header */}
            <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-between gap-4 mb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePrevDateRange}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={handleNextDateRange}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <button
                  onClick={handleGoToday}
                  className="px-3.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-full transition-all"
                >
                  วันนี้
                </button>

                <h2 className="text-xl font-black text-[#311171] ml-2 tracking-tight">
                  {getThaiMonthFull(baseDate.getMonth())} {baseDate.getFullYear() + 543}
                </h2>
              </div>

              {/* View Mode Toggle Pill */}
              <div className="bg-gray-100 p-1 rounded-full flex items-center gap-1">
                <button 
                  onClick={() => setViewMode("month")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "month" ? "bg-[#311171] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  เดือน
                </button>
                <button 
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === "week" ? "bg-[#311171] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  สัปดาห์
                </button>
              </div>
            </div>

            {/* Calendar Grid View */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171]"></div>
              </div>
            ) : viewMode === "week" ? (
              /* Week View */
              <div className="flex-1 overflow-auto bg-gray-50/30 rounded-2xl border border-gray-100">
                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                  <thead className="sticky top-0 bg-white z-20 shadow-xs">
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-500">
                      <th className="p-3 w-[220px] font-bold bg-white">รถประจำคณะ / คนขับ</th>
                      {weekDays.map((day, i) => (
                        <th key={i} className="p-3 font-bold bg-white text-center border-l border-gray-50">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVans.map((van) => (
                      <tr key={van.id} className="hover:bg-gray-50/20">
                        <td className="p-3 align-middle bg-white sticky left-0 z-10 border-r border-gray-100">
                          <p className="text-xs font-black text-gray-900 mb-0.5">{van.vanName}</p>
                          <p className="text-[10px] text-[#311171] font-bold mb-2">{van.plate}</p>
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <img src={van.driverImage} className="w-6 h-6 rounded-full object-cover shrink-0" alt="driver" />
                            <div>
                              <p className="text-[10px] font-bold text-gray-800">{van.driverName}</p>
                              <p className="text-[9px] text-gray-500">{van.driverPhone}</p>
                            </div>
                          </div>
                        </td>
                        
                        {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                          const cellDate = weekDays[dayIndex].dateObj;
                          const event = filteredBookings.find(b => b.vanId === van.id && isSameDate(b.date, cellDate));
                          const isSelected = selectedEvent && selectedEvent.id === event?.id;
                          const style = event ? getFacultyStyle(event.bookingFaculty) : null;
                          
                          return (
                            <td key={dayIndex} className="p-1.5 border-r border-gray-100 align-top relative bg-white group/cell">
                              {event && style ? (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedEvent?.id === event.id) {
                                      setSelectedEvent(null);
                                    } else {
                                      setSelectedEvent({ ...event, vanId: van.id });
                                    }
                                  }}
                                  className={`p-1.5 rounded-lg shadow-2xs relative group cursor-pointer hover:scale-[1.01] transition-all h-full min-h-[65px] border ${style.colorClass} ${isSelected ? 'ring-2 ring-[#311171] font-bold shadow-xs' : ''}`}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold">{style.shortName}</span>
                                    <span className="text-[9px] font-medium truncate opacity-90">{event.destination}</span>
                                    <span className="text-[8.5px] opacity-75">{event.time}</span>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    const y = cellDate.getFullYear();
                                    const m = String(cellDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(cellDate.getDate()).padStart(2, '0');
                                    setEventFormData(prev => ({ ...prev, vanId: van.id, bookingFaculty: van.facultyName }));
                                    handleOpenAddModal(`${y}-${m}-${day}`);
                                  }}
                                  className="w-full h-full min-h-[75px] rounded-xl border border-dashed border-transparent group-hover/cell:border-[#311171]/30 group-hover/cell:bg-[#311171]/5 transition-all flex items-center justify-center opacity-0 group-hover/cell:opacity-100"
                                >
                                  <span className="text-[#311171] text-[10px] font-bold flex items-center gap-1">
                                    <Plus size={12} /> เพิ่มตาราง
                                  </span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Month View: Cute Rounded Day Cards */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-7 text-center mb-2">
                  {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((day, i) => (
                    <div key={i} className="py-2 text-xs font-bold text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-0 overflow-y-auto">
                  {getCalendarDays(baseDate).map((cell) => {
                    const dayBookings = filteredBookings.filter(b => isSameDate(b.date, cell.dateObj));
                    const isTodayCell = isSameDate(todayDate, cell.dateObj);
                    
                    return (
                      <div 
                        key={cell.key} 
                        onClick={() => {
                          if (selectedEvent) {
                            setSelectedEvent(null);
                          } else {
                            const y = cell.dateObj.getFullYear();
                            const m = String(cell.dateObj.getMonth() + 1).padStart(2, '0');
                            const day = String(cell.dateObj.getDate()).padStart(2, '0');
                            handleOpenAddModal(`${y}-${m}-${day}`);
                          }
                        }}
                        className={`p-1 rounded-xl flex flex-col justify-between transition-all min-h-[75px] cursor-pointer group/daycell ${
                          !cell.isCurrent 
                            ? 'bg-gray-50/60 text-gray-400' 
                            : 'bg-white text-gray-800'
                        } ${isTodayCell ? 'ring-2 ring-[#311171]' : 'border border-gray-100 hover:border-gray-200'}`}
                      >
                        {/* Day Number Header with Hover Plus Button */}
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isTodayCell 
                              ? 'bg-[#311171] text-white font-black shadow-xs' 
                              : cell.isCurrent ? 'text-gray-800' : 'text-gray-400 font-medium'
                          }`}>
                            {cell.day}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const y = cell.dateObj.getFullYear();
                              const m = String(cell.dateObj.getMonth() + 1).padStart(2, '0');
                              const day = String(cell.dateObj.getDate()).padStart(2, '0');
                              handleOpenAddModal(`${y}-${m}-${day}`);
                            }}
                            className="w-5 h-5 rounded-full bg-[#311171]/15 text-[#311171] hover:bg-[#311171] hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/daycell:opacity-100 shadow-xs"
                            title={`เพิ่มคำขอจองวันที่ ${cell.day}`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        
                        {/* Bookings Pills inside the Day Cell */}
                        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto p-[1px] [&::-webkit-scrollbar]:hidden">
                          {dayBookings.map(b => {
                            const isSelected = selectedEvent?.id === b.id;
                            const style = getFacultyStyle(b.bookingFaculty);
                            
                            return (
                              <button
                                key={b.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedEvent?.id === b.id) {
                                    setSelectedEvent(null);
                                  } else {
                                    setSelectedEvent({ ...b, vanId: b.vanId });
                                  }
                                }}
                                className={`text-[9.5px] text-left px-1.5 py-0.5 rounded-lg transition-all flex flex-col group/btn ${style.colorClass} ${
                                  isSelected ? 'ring-2 ring-[#311171] font-bold shadow-xs scale-[0.98]' : 'hover:scale-[1.01]'
                                }`}
                              >
                                <span className="font-bold leading-tight flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor} shrink-0`}></span>
                                  {style.shortName}
                                </span>
                                <span className="text-[8.5px] font-medium opacity-85 truncate leading-tight pl-2.5">
                                  {b.destination}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cute Legend Bar (อธิบายสี) */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs shrink-0 flex-wrap">
                  <span className="font-bold text-gray-500">อธิบายสี:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#51621F]"></span>
                    <span className="font-bold text-gray-700">เภสัชฯ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                    <span className="font-bold text-gray-700">วิทยาศาสตร์</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]"></span>
                    <span className="font-bold text-gray-700">ICT</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="font-bold text-gray-700">เกษตรฯ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-600"></span>
                    <span className="font-bold text-gray-700">พลังงานฯ</span>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Details Sidebar */}
          {selectedEvent && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col self-start max-h-full w-full overflow-hidden animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[15px] font-black text-gray-900">รายละเอียดการจอง</h2>
                  <span className="text-[11px] font-bold text-gray-500">ID: {selectedEvent.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusBadgeColor(selectedEvent.status)}`}>
                    {selectedEvent.statusText || 'อนุมัติแล้ว'}
                  </span>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                <div className="bg-[#f8f9fa] border border-gray-200 rounded-2xl p-3 mb-2 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#311171]"></div>
                  <div className="flex flex-col gap-2 pl-1">
                    <p className="text-sm font-black text-gray-900">
                      หน่วยงานที่จอง: <span className="text-[#311171]">{selectedEvent.bookingFaculty || selectedEvent.department}</span>
                    </p>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center gap-3">
                      <img src={vansMap[selectedEvent.vanId]?.driverImage || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80'} className="w-10 h-10 rounded-full object-cover" alt="driver" />
                      <div>
                        <p className="text-xs font-black text-gray-900 leading-tight">คนขับประจำรถ: {vansMap[selectedEvent.vanId]?.driverName || 'นายสมชาย ใจดี'}</p>
                        <p className="text-[10px] text-[#311171] font-bold mt-0.5">{vansMap[selectedEvent.vanId]?.vanName} ({vansMap[selectedEvent.vanId]?.plate})</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <User size={16} className="text-[#311171] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">ผู้ขอใช้บริการ</p>
                      <p className="text-[13px] font-bold text-gray-900">{selectedEvent.requester || 'ไม่ระบุ'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <FileText size={16} className="text-[#311171] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">วัตถุประสงค์การเดินทาง</p>
                      <p className="text-[13px] font-bold text-gray-900">{selectedEvent.purpose || 'ไม่ระบุ'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin size={16} className="text-[#311171] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">สถานที่ปลายทาง</p>
                      <p className="text-[13px] font-bold text-gray-900">{selectedEvent.destination || 'ไม่ระบุ'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <Calendar size={16} className="text-[#311171] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">วันที่เดินทาง</p>
                        <p className="text-[12px] font-bold text-gray-900 leading-tight">
                          {getDayNameFull(safeDayIndex)}ที่ {selectedEventDateObj.getDate()} {getThaiMonthFull(selectedEventDateObj.getMonth())} {selectedEventDateObj.getFullYear() + 543}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Clock size={16} className="text-[#311171] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">เวลาเดินทาง</p>
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">{selectedEvent.time || '08:30 น.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-2">
                <button 
                  onClick={() => handleOpenEditModal(selectedEvent)}
                  className="flex-1 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Edit size={14} /> แก้ไขตาราง
                </button>
                <button 
                  onClick={() => handleDeleteCalendarEvent(selectedEvent.id)}
                  className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all border border-red-200"
                  title="ลบรายการปฏิทิน"
                >
                  <Trash2 size={14} /> ลบ
                </button>
              </div>
            </div>
          )}

        </div>

      {/* Modal: เพิ่ม/แก้ไข ตารางปฏิทิน */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#311171] text-white">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} />
                <h3 className="font-bold text-base">{editingEventId ? 'แก้ไขตารางปฏิทิน' : 'เพิ่มตารางปฏิทินใหม่'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCalendarEvent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">สถานที่ปลายทาง</label>
                <input 
                  required
                  type="text"
                  value={eventFormData.destination}
                  onChange={e => setEventFormData({ ...eventFormData, destination: e.target.value })}
                  placeholder="เช่น มหาวิทยาลัยเชียงใหม่, โรงพยาบาลพะเยา"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">วัตถุประสงค์ / ภารกิจ</label>
                <input 
                  required
                  type="text"
                  value={eventFormData.purpose}
                  onChange={e => setEventFormData({ ...eventFormData, purpose: e.target.value })}
                  placeholder="เช่น เข้าร่วมสัมมนาวิชาการ, นำนิสิตลงพื้นที่"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">วันที่เดินทาง</label>
                  <input 
                    required
                    type="date"
                    value={eventFormData.date}
                    onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">เวลาเดินทาง</label>
                  <input 
                    type="text"
                    value={eventFormData.time}
                    onChange={e => setEventFormData({ ...eventFormData, time: e.target.value })}
                    placeholder="เช่น 08:30 - 16:30 น."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ผู้ขอใช้บริการ</label>
                  <input 
                    type="text"
                    value={eventFormData.requester}
                    onChange={e => setEventFormData({ ...eventFormData, requester: e.target.value })}
                    placeholder="เช่น ดร.สมเกียรติ"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">จำนวนผู้โดยสาร (คน)</label>
                  <input 
                    type="number"
                    value={eventFormData.passengers}
                    onChange={e => setEventFormData({ ...eventFormData, passengers: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ประเภทการใช้รถตู้</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setEventFormData({ ...eventFormData, vanType: 'OWN', vanId: 'v-ict', bookingFaculty: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      eventFormData.vanType === 'OWN'
                        ? 'bg-[#311171] text-white border-[#311171] shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>รถประจำคณะตนเอง</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventFormData({ ...eventFormData, vanType: 'BORROW' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      eventFormData.vanType === 'BORROW'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>ยืมรถต่างคณะ</span>
                  </button>
                </div>

                {eventFormData.vanType === 'BORROW' && (
                  <div className="p-3 bg-red-50/80 rounded-xl border border-red-200 text-[11px] text-red-600 mb-2 font-bold leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      <span className="text-sm mt-0.5">⚠️</span>
                      <span>
                        หน่วยงานอื่นไม่อนุญาตให้จองใช้รถตู้เกิน 3 วัน<br/>
                        เดินทาง จองล่วงหน้าได้ไม่เกิน 10 วันจากวัน<br/>
                        ปัจจุบัน และไม่อนุมัติจองรถข้ามเดือน
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">คณะผู้ขอจอง</label>
                <div className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-500 font-bold cursor-not-allowed">
                  คณะเทคโนโลยีสารสนเทศและการสื่อสาร
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {eventFormData.vanType === 'BORROW' ? 'เลือกยืมรถตู้ของคณะใด' : 'มอบหมายรถตู้ประจำคณะ & คนขับ'}
                </label>
                {eventFormData.vanType === 'OWN' ? (
                  <div className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-500 font-bold cursor-not-allowed">
                    รถตู้ ICT 01 (ทะเบียน นข 6789 พะเยา) - คณะเทคโนโลยีสารสนเทศและการสื่อสาร
                  </div>
                ) : (
                  <select 
                    value={eventFormData.vanId}
                    onChange={e => setEventFormData({ ...eventFormData, vanId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  >
                    <option value="" disabled>-- เลือกรถตู้ต่างคณะ --</option>
                    {vansList
                      .filter(v => {
                        if (v.facultyName === eventFormData.bookingFaculty) return false;
                        const isBooked = bookingsData.some(b => 
                          b.vanId === v.id && 
                          isSameDate(b.date, eventFormData.date) &&
                          b.status !== 'rejected' &&
                          b.status !== 'cancelled'
                        );
                        return !isBooked;
                      })
                      .map(v => (
                      <option key={v.id} value={v.id} className="text-green-600 font-bold">
                        {v.vanName} ({v.plate}) - {v.facultyName} (ว่าง)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#311171] text-[#ffffff] font-bold rounded-xl hover:bg-[#230b54] shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกตาราง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function FacultyCalendarPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171]"></div>
        </div>
      }>
        <CalendarContent />
      </Suspense>
    </AppShell>
  );
}
