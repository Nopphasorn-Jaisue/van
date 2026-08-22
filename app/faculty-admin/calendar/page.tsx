"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { 
  ChevronLeft, ChevronRight, 
  Search, RotateCcw, Plus,
  MapPin, Calendar, Clock, User, Phone, FileText, 
  CalendarDays, X, Edit, Trash2, Compass, Globe, Sparkles,
  Download, Check, AlertTriangle
} from 'lucide-react';
import { facultiesList } from '@/Frontend/data/faculties';
import { facultyVansList, UnifiedVanInfo } from '@/Frontend/data/faculty-vans';
import { getAuthUser } from '@/app/actions/auth';

type RawCalendarEventItem = {
  id?: string | number;
  vanId?: string;
  facultyId?: string;
  date?: string | Date;
  returnDate?: string | Date;
  time?: string;
  destination?: string;
  purpose?: string;
  passengers?: number;
  status?: string;
  bookingFaculty?: string;
  requester?: string;
  phone?: string;
  department?: string;
  purposeDetail?: string;
  routeDetail?: string;
  statusText?: string;
  statusTime?: string;
  tripType?: string;
};

type CalendarBookingEvent = {
  id: string;
  vanId: string;
  facultyId?: string;
  date: Date | string;
  returnDate?: Date | string;
  time: string;
  destination: string;
  purpose: string;
  passengers: number;
  status: string;
  bookingFaculty: string;
  requester: string;
  phone?: string;
  department: string;
  purposeDetail?: string;
  routeDetail?: string;
  statusText?: string;
  statusTime?: string;
  tripType?: "ในจังหวัดพะเยา" | "ต่างจังหวัด";
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
  const [showMoreEventsDate, setShowMoreEventsDate] = useState<Date | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const returnDatePickerRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    const pickerEl = datePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (pickerEl) {
      if (typeof pickerEl.showPicker === 'function') {
        pickerEl.showPicker();
      } else {
        pickerEl.focus();
      }
    }
  };

  const openReturnDatePicker = () => {
    const pickerEl = returnDatePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (pickerEl) {
      if (typeof pickerEl.showPicker === 'function') {
        pickerEl.showPicker();
      } else {
        pickerEl.focus();
      }
    }
  };

  const d = new Date();
  const initDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [currentUser, setCurrentUser] = useState<{ name: string; faculty: string } | null>(null);

  const [eventFormData, setEventFormData] = useState({
    destination: '',
    purpose: '',
    date: initDate,
    returnDate: initDate,
    departTime: '08:30',
    returnTime: '16:30',
    requester: '',
    phone: '',
    bookingFaculty: 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
    passengers: 1,
    vanId: 'v-ict',
    vanType: 'OWN' as 'OWN' | 'BORROW',
    tripType: 'ในจังหวัดพะเยา' as 'ในจังหวัดพะเยา' | 'ต่างจังหวัด',
  });

  const [bookingsData, setBookingsData] = useState<CalendarBookingEvent[]>([]);
  const [vansList, setVansList] = useState<UnifiedVanInfo[]>(facultyVansList);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
                  returnDate: e.returnDate ? String(e.returnDate) : undefined,
                  time: e.time || '08:30 - 16:30 น.',
                  destination: e.destination || 'ไม่ระบุสถานที่',
                  purpose: e.purpose || 'ภารกิจคณะ',
                  passengers: Number(e.passengers || 10),
                  status: e.status || 'approved',
                  bookingFaculty: e.bookingFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
                  requester: e.requester || '',
                  phone: e.phone || '',
                  department: e.department || 'สำนักงานคณบดี',
                  purposeDetail: e.purposeDetail || e.purpose,
                  routeDetail: e.routeDetail || `พะเยา -> ${e.destination}`,
                  statusText: e.statusText || 'อนุมัติแล้ว',
                  statusTime: e.statusTime || 'บันทึกในระบบ',
                  tripType: (e.tripType as "ในจังหวัดพะเยา" | "ต่างจังหวัด") || 'ในจังหวัดพะเยา'
                };
              });
              setBookingsData(mapped);
            }
            if (data && data.vans && Array.isArray(data.vans)) {
              setVansList(data.vans);
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

    const fetchUser = async () => {
      try {
        const u = await getAuthUser();
        if (u && u.name) {
          const userFaculty = u.faculty?.nameTh || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร';
          setCurrentUser({
            name: u.name,
            faculty: userFaculty
          });
          // Removed setSelectedFacultyFilter(userFaculty) to fix the initial load bug
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
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

  const isBookingActiveOnDate = (b: CalendarBookingEvent, targetDate: Date) => {
    const startDate = b.date instanceof Date ? b.date : new Date(b.date);
    if (isNaN(startDate.getTime())) return false;

    const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();

    if (!b.returnDate) {
      return targetTime === startTime;
    }

    const endDate = b.returnDate instanceof Date ? b.returnDate : new Date(b.returnDate);
    if (isNaN(endDate.getTime())) {
      return targetTime === startTime;
    }

    const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
    return targetTime >= startTime && targetTime <= endTime;
  };

  // 1 Faculty = 1 Van + 1 Driver
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
    const matchesFaculty = selectedFacultyFilter === "all" ? true : b.bookingFaculty === selectedFacultyFilter;

    return matchesSearch && matchesVan && matchesStatus && matchesFaculty;
  });

  const handleOpenAddModal = (dateStr?: string) => {
    setEditingEventId(null);
    let defaultDate = dateStr;
    if (!defaultDate) {
      const d = new Date();
      defaultDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const userFac = currentUser?.faculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร';
    const defaultVan = vansList.find(v => v.facultyName === userFac) || vansList[0];
    setEventFormData({
      destination: '',
      purpose: '',
      date: defaultDate,
      returnDate: defaultDate,
      departTime: '08:30',
      returnTime: '16:30',
      requester: '',
      phone: '',
      bookingFaculty: userFac,
      passengers: 1,
      vanId: defaultVan ? defaultVan.id : '1',
      vanType: 'OWN',
      tripType: 'ในจังหวัดพะเยา',
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

    let depart = '08:30';
    let ret = '16:30';
    if (event.time) {
      const cleaned = event.time.replace(/น\./g, '').trim();
      const parts = cleaned.split('-').map(s => s.trim());
      if (parts[0]) depart = parts[0];
      if (parts[1]) ret = parts[1];
    }

    setEventFormData({
      destination: event.destination || '',
      purpose: event.purpose || '',
      date: eventDateStr,
      returnDate: event.returnDate ? String(event.returnDate) : eventDateStr,
      departTime: depart,
      returnTime: ret,
      requester: event.requester || '',
      phone: event.phone || '',
      bookingFaculty: event.bookingFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร',
      passengers: event.passengers || 10,
      vanId: event.vanId || 'v-ict',
      vanType: event.status === 'pending_cross_faculty' ? 'BORROW' : 'OWN',
      tripType: (event.tripType as 'ในจังหวัดพะเยา' | 'ต่างจังหวัด') || 'ในจังหวัดพะเยา',
    });
    setIsModalOpen(true);
  };

  const handleSaveCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (eventFormData.vanType === 'BORROW' && !eventFormData.vanId) {
      alert("กรุณาเลือกรถตู้ต่างคณะที่ต้องการยืม");
      setIsSubmitting(false);
      return;
    }

    const targetVan = vansMap[eventFormData.vanId] || vansList[0];

    const isBorrowing = eventFormData.vanType === 'BORROW';
    const combinedTime = `${eventFormData.departTime} - ${eventFormData.returnTime} น.`;
    
    const destinationText = eventFormData.destination.trim() || "ไม่ระบุสถานที่ปลายทาง";
    const purposeText = eventFormData.purpose.trim() || "ภารกิจใช้รถตู้";
    const requesterText = eventFormData.requester.trim() || "ผู้ขอใช้บริการ";

    const payload = {
      vanId: eventFormData.vanId,
      facultyId: targetVan ? targetVan.facultyId : "ict",
      bookingFaculty: eventFormData.bookingFaculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
      destination: destinationText,
      purpose: purposeText,
      purposeDetail: purposeText,
      routeDetail: `พะเยา -> ${destinationText}`,
      date: eventFormData.date,
      returnDate: eventFormData.returnDate,
      time: combinedTime,
      passengers: Number(eventFormData.passengers || 1),
      requester: requesterText,
      phone: eventFormData.phone ? eventFormData.phone.replace(/\D/g, '').slice(0, 10) : '',
      department: "สำนักงานคณบดี",
      tripType: eventFormData.tripType,
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
        } else {
          const errData = await res.json();
          alert(`ไม่สามารถบันทึกได้: ${errData.error || "เกิดข้อผิดพลาด"}`);
        }
      } else {
        const res = await fetch('/api/calendar-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          fetchEvents();
        } else {
          const errData = await res.json();
          alert(`ไม่สามารถบันทึกได้: ${errData.error || "เกิดข้อผิดพลาด"}`);
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

  const confirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/calendar-events?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "เกิดข้อผิดพลาดในการลบข้อมูล");
        setDeleteConfirmId(null);
        return;
      }
      setBookingsData(prev => prev.filter(b => b.id !== id));
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCalendarEvent = (id: string) => {
    setDeleteConfirmId(id);
  };

  // Smart Faculty Palette Styling for all UP Faculties
  const getFacultyStyle = (name: string | undefined) => {
    if (!name) return { shortName: "ทั่วไป", colorClass: "text-purple-800 bg-purple-50 border-purple-200", dotColor: "bg-[#311171]", barColor: "bg-[#311171]", borderHex: "#311171", textColor: "text-purple-800" };
    
    if (name.includes("เภสัช")) {
      return {
        shortName: "เภสัชฯ",
        colorClass: "text-[#51621F] bg-[#51621F]/10 border-[#51621F]/30",
        dotColor: "bg-[#51621F]",
        barColor: "bg-[#51621F]",
        borderHex: "#51621F",
        textColor: "text-[#51621F]"
      };
    }
    if (name.includes("วิทยาศาสตร์") && !name.includes("สารสนเทศ")) {
      return {
        shortName: "วิทยาศาสตร์",
        colorClass: "text-[#FBBC39] bg-[#FBBC39]/10 border-[#FBBC39]/30",
        dotColor: "bg-[#FBBC39]",
        barColor: "bg-[#FBBC39]",
        borderHex: "#FBBC39",
        textColor: "text-[#FBBC39]"
      };
    }
    if (name.includes("สารสนเทศ") || name.includes("ICT") || name.includes("ไอซีที")) {
      return {
        shortName: "ICT",
        colorClass: "text-[#C5AB75] bg-[#C5AB75]/10 border-[#CBB380]",
        dotColor: "bg-[#C5AB75]",
        barColor: "bg-[#C5AB75]",
        borderHex: "#C5AB75",
        textColor: "text-[#C5AB75]"
      };
    }
    if (name.includes("เกษตร")) {
      return {
        shortName: "เกษตรฯ",
        colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
        dotColor: "bg-emerald-600",
        barColor: "bg-emerald-600",
        borderHex: "#059669",
        textColor: "text-emerald-700"
      };
    }
    if (name.includes("พลังงาน")) {
      return {
        shortName: "พลังงานฯ",
        colorClass: "text-lime-800 bg-lime-50 border-lime-200",
        dotColor: "bg-lime-600",
        barColor: "bg-lime-600",
        borderHex: "#65A30D",
        textColor: "text-lime-800"
      };
    }
    if (name.includes("วิศวกรรม") || name.includes("วิศวะ")) {
      return {
        shortName: "วิศวะฯ",
        colorClass: "text-orange-800 bg-orange-50 border-orange-200",
        dotColor: "bg-orange-600",
        barColor: "bg-orange-600"
      };
    }
    if (name.includes("พยาบาล")) {
      return {
        shortName: "พยาบาลฯ",
        colorClass: "text-pink-800 bg-pink-50 border-pink-200",
        dotColor: "bg-pink-600",
        barColor: "bg-pink-600"
      };
    }
    if (name.includes("นิติ")) {
      return {
        shortName: "นิติฯ",
        colorClass: "text-red-800 bg-red-50 border-red-200",
        dotColor: "bg-red-600",
        barColor: "bg-red-600"
      };
    }
    if (name.includes("แพทย์") && !name.includes("เภสัช")) {
      return {
        shortName: "แพทย์ฯ",
        colorClass: "text-teal-800 bg-teal-50 border-teal-200",
        dotColor: "bg-teal-600",
        barColor: "bg-teal-600"
      };
    }
    if (name.includes("บริหาร") || name.includes("นิเทศ")) {
      return {
        shortName: "บริหารฯ",
        colorClass: "text-sky-800 bg-sky-50 border-sky-200",
        dotColor: "bg-sky-600",
        barColor: "bg-sky-600"
      };
    }
    if (name.includes("ศิลปศาสตร์")) {
      return {
        shortName: "ศิลปศาสตร์",
        colorClass: "text-indigo-800 bg-indigo-50 border-indigo-200",
        dotColor: "bg-indigo-600",
        barColor: "bg-indigo-600"
      };
    }

    return {
      shortName: name ? (name.length > 10 ? `${name.slice(0, 8)}...` : name) : "ทั่วไป",
      colorClass: "text-purple-800 bg-purple-50 border-purple-200",
      dotColor: "bg-[#311171]",
      barColor: "bg-[#311171]"
    };
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

  // คำนวณแนะนำรถตู้ของคณะที่ว่างตรงกับวันที่จอง (เมื่อผู้โดยสาร > 10 คน)
  const getRecommendedAvailableVans = (
    departDateStr: string,
    returnDateStr: string,
    currentFaculty: string,
    allVans: UnifiedVanInfo[],
    allBookings: CalendarBookingEvent[]
  ) => {
    if (!departDateStr) return [];
    
    const reqStart = new Date(`${departDateStr}T00:00:00`).getTime();
    const reqEnd = new Date(`${returnDateStr || departDateStr}T23:59:59`).getTime();

    // กรองรถตู้ของคณะอื่น (ต่างคณะ)
    const otherVans = allVans.filter(v => v.facultyName !== currentFaculty);

    // หารถที่ไม่มีคิวจองทับซ้อนในช่วงวันดังกล่าว
    const availableVans = otherVans.filter(van => {
      const hasConflict = allBookings.some(b => {
        if (b.status === 'REJECTED' || b.status === 'rejected') return false;
        if (b.vanId !== van.id) return false;

        const bStart = b.date instanceof Date ? b.date.getTime() : new Date(`${b.date}T00:00:00`).getTime();
        const bEnd = b.returnDate 
          ? new Date(`${b.returnDate}T23:59:59`).getTime() 
          : (b.date instanceof Date ? new Date(b.date.getFullYear(), b.date.getMonth(), b.date.getDate(), 23, 59, 59).getTime() : new Date(`${b.date}T23:59:59`).getTime());

        return bStart <= reqEnd && bEnd >= reqStart;
      });

      return !hasConflict;
    });

    return availableVans.slice(0, 2); // แนะนำ 2 คณะที่ว่างตรงกับวันที่จอง
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



            <button 
              onClick={() => { setSearchQuery(""); setSelectedVanFilter("all"); setSelectedFacultyFilter("all"); setSelectedStatusFilter("all"); }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="ล้างตัวกรอง"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/api/calendar-events/export"
              download="up-van-calendar.ics"
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
              title="ส่งออกปฏิทินไฟล์ .ics (สำหรับ Google Calendar, Outlook, Apple Calendar)"
            >
              <Download size={14} className="text-[#311171]" />
              <span>ส่งออกปฏิทิน (.ics)</span>
            </a>

            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 bg-[#311171] hover:bg-[#230b54] text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={16} />
              <span>เพิ่มตารางปฏิทิน</span>
            </button>
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
            </div>

            {/* Calendar Grid View */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center h-96">
                <div className="text-lg font-black text-[#311171] tracking-wider animate-pulse">กำลังโหลดปฏิทิน...</div>
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
                          const event = filteredBookings.find(b => b.vanId === van.id && isBookingActiveOnDate(b, cellDate));
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
                
                <div className="grid grid-cols-7 gap-1 flex-1 min-h-0 overflow-y-auto p-1 auto-rows-fr">
                  {getCalendarDays(baseDate).map((cell) => {
                    const dayBookings = filteredBookings
                      .filter(b => isBookingActiveOnDate(b, cell.dateObj))
                      .sort((a, b) => {
                        const isMultiDayA = !!a.returnDate && !isSameDate(a.date, a.returnDate);
                        const isMultiDayB = !!b.returnDate && !isSameDate(b.date, b.returnDate);
                        if (isMultiDayA && !isMultiDayB) return -1;
                        if (!isMultiDayA && isMultiDayB) return 1;
                        return (a.time || '').localeCompare(b.time || '');
                      });
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
                        className={`p-1.5 rounded-xl transition-all min-h-[80px] cursor-pointer group/daycell h-full ${
                          !cell.isCurrent 
                            ? 'bg-slate-50/50 text-slate-400 opacity-60 border border-slate-100/60' 
                            : 'bg-white/90 text-slate-800 border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        {/* Day Number Header with Hover Plus Button */}
                        <div className="flex justify-between items-start">
                          {isTodayCell ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-700 text-[10px] font-black text-white shadow-sm scale-105">
                              {cell.day}
                            </span>
                          ) : (
                            <span className={`text-[10px] font-black ml-0.5 mt-0.5 ${cell.isCurrent ? 'text-slate-700' : 'text-slate-400'}`}>
                              {cell.day}
                            </span>
                          )}
                          
                          <div className="flex items-center gap-1">
                            {dayBookings.length > 2 && (
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMoreEventsDate(cell.dateObj);
                                }}
                                className="inline-flex items-center justify-center gap-1 rounded-full bg-violet-100/80 px-1.5 py-[2px] text-[8px] font-bold text-violet-800 shadow-sm transition-all hover:scale-[1.05] hover:bg-violet-200 mt-0.5"
                              >
                                +{dayBookings.length - 2} คิวรถ
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const y = cell.dateObj.getFullYear();
                                const m = String(cell.dateObj.getMonth() + 1).padStart(2, '0');
                                const day = String(cell.dateObj.getDate()).padStart(2, '0');
                                handleOpenAddModal(`${y}-${m}-${day}`);
                              }}
                              className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-700 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/daycell:opacity-100 shadow-2xs mt-0.5"
                              title={`เพิ่มคำขอจองวันที่ ${cell.day}`}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Bookings Pills inside the Day Cell */}
                        <div className="mt-1 flex flex-col gap-0.5 relative h-[calc(100%-28px)] justify-start">
                          {dayBookings.slice(0, 2).map(b => {
                            const isSelected = selectedEvent?.id === b.id;
                            const vanOwner = vansMap[b.vanId];
                            const ownerFaculty = vanOwner ? vanOwner.facultyName : b.bookingFaculty;
                            const isBorrowed = b.status === 'pending_cross_faculty' || (ownerFaculty && ownerFaculty !== b.bookingFaculty);

                            const ownerStyle = getFacultyStyle(ownerFaculty);
                            const borrowerStyle = getFacultyStyle(b.bookingFaculty);
                            const displayStyle = borrowerStyle;
                            const subText = b.destination || b.purpose || (b.vanId ? b.vanId.replace('v-', '').toUpperCase() : '555');
                            const borderLeftColor = displayStyle.borderHex || '#D97706';

                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedEvent?.id === b.id) {
                                    setSelectedEvent(null);
                                  } else {
                                    setSelectedEvent({ ...b, vanId: b.vanId });
                                  }
                                }}
                                className={`w-full text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md rounded-lg border-l-4 px-1.5 py-[3px] bg-white/90 backdrop-blur-sm border-white shrink-0 shadow-2xs ${
                                  isSelected ? 'ring-2 ring-violet-700 font-bold shadow-md' : ''
                                }`}
                                style={{ borderLeftColor }}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${(b.status === 'APPROVED' || b.status === 'approved' || b.status === 'COMPLETED' || b.status === 'completed') ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                      <span className={`font-bold truncate text-[9px] 2xl:text-[10px] leading-[10px] ${displayStyle.textColor || 'text-amber-700'}`}>
                                        {displayStyle.shortName}
                                      </span>
                                    </div>
                                    {isBorrowed && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className={`h-1.5 w-1.5 rounded-full ${ownerStyle.dotColor || 'bg-sky-500'}`} />
                                        <span className={`text-[8px] font-bold ${ownerStyle.textColor || 'text-slate-500'}`}>
                                          {ownerStyle.shortName}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[8px] text-slate-500 font-medium truncate mt-[1px] leading-[9px]">{subText}</span>
                                </div>
                              </button>
                            );
                          })}

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend Bar (อธิบายสี 5 คณะ) */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs shrink-0 flex-wrap">
                  <span className="font-bold text-gray-500">อธิบายสี:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#51621F]"></span>
                    <span className="font-bold text-gray-700">เภสัชฯ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span>
                    <span className="font-bold text-gray-700">วิทยาศาสตร์</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C5AB75]"></span>
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
                    {(() => {
                      const currentVan = vansMap[selectedEvent.vanId] || vansList.find(v => v.facultyName === selectedEvent.bookingFaculty) || vansList[0];
                      const dAvatar = currentVan?.driverImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150';
                      const dName = currentVan?.driverName || 'ยังไม่ระบุคนขับ';
                      const vInfo = currentVan ? `${currentVan.vanName} (${currentVan.plate})` : 'ยังไม่ระบุรถตู้';

                      return (
                        <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center gap-3">
                          <img src={dAvatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="driver" />
                          <div>
                            <p className="text-xs font-black text-gray-900 leading-tight">คนขับประจำรถ: {dName}</p>
                            <p className="text-[10px] text-[#311171] font-bold mt-0.5">{vInfo}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <User size={16} className="text-[#311171] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">ผู้ขอใช้บริการ</p>
                      <p className="text-[13px] font-bold text-gray-900">{selectedEvent.requester || 'ไม่ระบุ'}</p>
                      {selectedEvent.phone && (
                        <p className="text-[11px] font-bold text-purple-700 mt-0.5 flex items-center gap-1">
                          <Phone size={12} /> {selectedEvent.phone}
                        </p>
                      )}
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

                  <div className="flex gap-3">
                    <Compass size={16} className="text-[#311171] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">ขอบเขตการเดินทาง</p>
                      <p className="text-[13px] font-bold text-gray-900">{selectedEvent.tripType || 'ในจังหวัดพะเยา'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex gap-3">
                      <Calendar size={16} className="text-[#311171] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">ช่วงเวลาเดินทาง (ไป - กลับ)</p>
                        <p className="text-[12px] font-bold text-gray-900 leading-tight">
                          {(() => {
                            const dStart = selectedEvent.date instanceof Date ? selectedEvent.date : new Date(selectedEvent.date);
                            if (isNaN(dStart.getTime())) return 'ไม่ระบุวันที่';

                            const startDayName = getDayNameFull(dStart.getDay() === 0 ? 6 : dStart.getDay() - 1);
                            const startStr = `${startDayName}ที่ ${dStart.getDate()} ${getThaiMonthFull(dStart.getMonth())} ${dStart.getFullYear() + 543}`;

                            if (!selectedEvent.returnDate) return startStr;

                            const dEnd = selectedEvent.returnDate instanceof Date ? selectedEvent.returnDate : new Date(selectedEvent.returnDate);
                            if (isNaN(dEnd.getTime()) || isSameDate(dStart, dEnd)) return startStr;

                            const endDayName = getDayNameFull(dEnd.getDay() === 0 ? 6 : dEnd.getDay() - 1);
                            const endStr = `${endDayName}ที่ ${dEnd.getDate()} ${getThaiMonthFull(dEnd.getMonth())} ${dEnd.getFullYear() + 543}`;

                            return `${startStr} ถึง ${endStr}`;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Clock size={16} className="text-[#311171] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">เวลาเดินทางประจำวัน</p>
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-[#311171] text-white shrink-0">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} />
                <h3 className="font-bold text-sm sm:text-base">{editingEventId ? 'แก้ไขตารางปฏิทิน' : 'เพิ่มตารางปฏิทินใหม่'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCalendarEvent} className="p-6 text-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {/* ฝั่งซ้าย: ขอบเขต, ปลายทาง, วัตถุประสงค์, ประเภทรถ, คณะ, คนขับ */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">ขอบเขตการเดินทาง</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEventFormData({ ...eventFormData, tripType: 'ในจังหวัดพะเยา' })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          eventFormData.tripType === 'ในจังหวัดพะเยา'
                            ? 'bg-[#311171] text-white border-[#311171] shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <MapPin size={14} className={eventFormData.tripType === 'ในจังหวัดพะเยา' ? 'text-white' : 'text-[#311171]'} />
                        <span>ในจังหวัดพะเยา</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventFormData({ ...eventFormData, tripType: 'ต่างจังหวัด' })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          eventFormData.tripType === 'ต่างจังหวัด'
                            ? 'bg-[#311171] text-white border-[#311171] shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Globe size={14} className={eventFormData.tripType === 'ต่างจังหวัด' ? 'text-white' : 'text-[#311171]'} />
                        <span>ต่างจังหวัด</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">สถานที่ปลายทาง</label>
                    <input 
                      required
                      type="text"
                      value={eventFormData.destination}
                      onChange={e => setEventFormData({ ...eventFormData, destination: e.target.value })}
                      placeholder="เช่น มหาวิทยาลัยเชียงใหม่, โรงพยาบาลพะเยา"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">ประเภทการใช้รถตู้</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const userFac = currentUser?.faculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร';
                          const defaultVan = vansList.find(v => v.facultyName === userFac) || vansList[0];
                          setEventFormData({ ...eventFormData, vanType: 'OWN', vanId: defaultVan ? defaultVan.id : '1', bookingFaculty: userFac });
                        }}
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
                        onClick={() => setEventFormData({ ...eventFormData, vanType: 'BORROW', vanId: '' })}
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
                      <div className="p-2.5 mt-2 bg-red-50/80 rounded-xl border border-red-200 text-[10px] text-red-600 font-bold leading-relaxed">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                          <span>
                            หน่วยงานอื่นไม่อนุญาตให้จองใช้รถตู้เกิน 3 วันเดินทาง จองล่วงหน้าได้ไม่เกิน 10 วัน และไม่อนุมัติข้ามเดือน
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">คณะผู้ขอจอง</label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-500 font-bold cursor-not-allowed">
                      {eventFormData.bookingFaculty}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      {eventFormData.vanType === 'BORROW' ? 'เลือกยืมรถตู้ของคณะใด' : 'มอบหมายรถตู้ประจำคณะ & คนขับ'}
                    </label>
                    {eventFormData.vanType === 'OWN' ? (
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-700 font-bold cursor-not-allowed">
                        {(() => {
                          const ownVan = vansList.find(v => v.facultyName === (currentUser?.faculty || eventFormData.bookingFaculty)) || vansList[0];
                          return ownVan ? `${ownVan.vanName} (${ownVan.plate})` : 'รถตู้ประจำคณะ';
                        })()}
                      </div>
                    ) : (
                      <select 
                        value={eventFormData.vanId}
                        onChange={e => setEventFormData({ ...eventFormData, vanId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
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
                </div>

                {/* ฝั่งขวา: วันเดินทางออก/กลับ, เวลาออก/กลับ, ผู้ขอใช้บริการ, เบอร์โทร, จำนวนผู้โดยสาร */}
                <div className="space-y-3">
                  {/* วันที่เดินทาง (ออก) & วันเดินทางกลับ */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">วันที่เดินทาง (ออก)</label>
                      <div className="relative flex items-center">
                        <input 
                          type="text"
                          readOnly
                          onClick={openDatePicker}
                          value={(() => {
                            if (!eventFormData.date) return '';
                            const parts = eventFormData.date.split('-');
                            if (parts.length !== 3) return eventFormData.date;
                            const y = parseInt(parts[0], 10);
                            const m = parseInt(parts[1], 10);
                            const d = parseInt(parts[2], 10);
                            if (!y || !m || !d) return eventFormData.date;
                            const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                            return `${d} ${thaiMonths[m - 1]} ${y + 543}`;
                          })()}
                          placeholder="เลือกวันที่เดินทาง"
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171] bg-white cursor-pointer font-bold text-gray-800"
                        />
                        <input 
                          ref={datePickerRef}
                          type="date"
                          value={eventFormData.date}
                          onChange={e => {
                            if (e.target.value) {
                              const newDepart = e.target.value;
                              setEventFormData(prev => ({
                                ...prev,
                                date: newDepart,
                                returnDate: prev.returnDate < newDepart ? newDepart : prev.returnDate
                              }));
                            }
                          }}
                          className="sr-only opacity-0 pointer-events-none absolute w-0 h-0"
                        />
                        <button 
                          type="button"
                          onClick={openDatePicker}
                          className="absolute right-1.5 p-1 text-[#311171] hover:bg-purple-100 transition-colors rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center"
                          title="คลิกเพื่อเลือกวันที่จากปฏิทิน"
                        >
                          <Calendar size={13} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">วันเดินทางกลับ</label>
                      <div className="relative flex items-center">
                        <input 
                          type="text"
                          readOnly
                          onClick={openReturnDatePicker}
                          value={(() => {
                            if (!eventFormData.returnDate) return '';
                            const parts = eventFormData.returnDate.split('-');
                            if (parts.length !== 3) return eventFormData.returnDate;
                            const y = parseInt(parts[0], 10);
                            const m = parseInt(parts[1], 10);
                            const d = parseInt(parts[2], 10);
                            if (!y || !m || !d) return eventFormData.returnDate;
                            const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
                            return `${d} ${thaiMonths[m - 1]} ${y + 543}`;
                          })()}
                          placeholder="เลือกวันเดินทางกลับ"
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171] bg-white cursor-pointer font-bold text-gray-800"
                        />
                        <input 
                          ref={returnDatePickerRef}
                          type="date"
                          min={eventFormData.date}
                          value={eventFormData.returnDate}
                          onChange={e => {
                            if (e.target.value) {
                              setEventFormData(prev => ({ ...prev, returnDate: e.target.value }));
                            }
                          }}
                          className="sr-only opacity-0 pointer-events-none absolute w-0 h-0"
                        />
                        <button 
                          type="button"
                          onClick={openReturnDatePicker}
                          className="absolute right-1.5 p-1 text-[#311171] hover:bg-purple-100 transition-colors rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center"
                          title="คลิกเพื่อเลือกวันกลับจากปฏิทิน"
                        >
                          <Calendar size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* เวลาเดินทาง & เวลากลับ */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">เวลาเดินทาง (ออก)</label>
                      <input 
                        required
                        type="time"
                        value={eventFormData.departTime}
                        onChange={e => setEventFormData({ ...eventFormData, departTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">เวลากลับ</label>
                      <input 
                        required
                        type="time"
                        value={eventFormData.returnTime}
                        onChange={e => setEventFormData({ ...eventFormData, returnTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                      />
                    </div>
                  </div>

                  {/* ผู้ขอใช้บริการ & เบอร์โทรศัพท์ */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">ผู้ขอใช้บริการ</label>
                      <input 
                        type="text"
                        value={eventFormData.requester}
                        onChange={e => setEventFormData({ ...eventFormData, requester: e.target.value })}
                        placeholder="ชื่อ-นามสกุล"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">เบอร์โทรศัพท์ (10 หลัก)</label>
                      <input 
                        type="text"
                        maxLength={10}
                        value={eventFormData.phone}
                        onChange={e => setEventFormData({ ...eventFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="เช่น 0812345678"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">จำนวนผู้โดยสาร (คน)</label>
                    <input 
                      type="number"
                      min={1}
                      max={30}
                      value={eventFormData.passengers || ''}
                      onChange={e => setEventFormData({ ...eventFormData, passengers: Number(e.target.value) })}
                      placeholder="ระบุจำนวนคน"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                    />

                    {/* กล่องแนะนำรถตู้ของคณะที่ว่าง เมื่อผู้โดยสารเกิน 10 คน */}
                    {Number(eventFormData.passengers) > 10 && (() => {
                      const recommendedVans = getRecommendedAvailableVans(
                        eventFormData.date,
                        eventFormData.returnDate,
                        currentUser?.faculty || eventFormData.bookingFaculty,
                        vansList,
                        bookingsData
                      );

                      return (
                        <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-purple-50/40 border border-amber-200/90 text-xs shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              <Sparkles size={12} className="text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5 flex-wrap">
                                <span>แนะนำรถตู้ของคณะที่ว่างตรงกับวันที่จอง</span>
                                <span className="px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded-md text-[10px] font-bold">
                                  ผู้โดยสารเกิน 10 คน
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                                ความจุมาตรฐานรถตู้ 1 คัน (10-12 ที่นั่ง) แนะนำให้ยืมรถตู้จากคณะที่ว่างเพิ่มเติม ({recommendedVans.length} คณะ):
                              </p>
                            </div>
                          </div>

                          {recommendedVans.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {recommendedVans.map(rv => {
                                const style = getFacultyStyle(rv.facultyName);
                                const isSelected = eventFormData.vanType === 'BORROW' && eventFormData.vanId === rv.id;
                                return (
                                  <div 
                                    key={rv.id}
                                    onClick={() => {
                                      setEventFormData(prev => ({
                                        ...prev,
                                        vanId: rv.id,
                                        vanType: 'BORROW'
                                      }));
                                    }}
                                    className={`p-2.5 rounded-xl border bg-white transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs hover:border-amber-400 ${
                                      isSelected 
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50' 
                                        : 'border-amber-200/80'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className={`font-black text-[11px] truncate ${style.textColor || 'text-slate-800'}`}>
                                          {rv.facultyName}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[9px] shrink-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          ว่างตรงวัน
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-600 font-medium">
                                        {rv.plate} {rv.driverName ? `• ${rv.driverName}` : ''}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEventFormData(prev => ({
                                          ...prev,
                                          vanId: rv.id,
                                          vanType: 'BORROW'
                                        }));
                                      }}
                                      className={`w-full py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 ${
                                        isSelected 
                                          ? 'bg-emerald-600 text-white shadow-xs' 
                                          : 'bg-[#311171] text-white hover:bg-[#250b57]'
                                      }`}
                                    >
                                      {isSelected ? (
                                        <>
                                          <Check size={12} strokeWidth={3} className="text-white shrink-0" />
                                          <span>เลือกยืมรถคณะนี้แล้ว</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={12} strokeWidth={2.5} className="shrink-0" />
                                          <span>เลือกยืมรถคณะนี้</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/80 text-[11px] text-amber-800 font-medium text-center">
                              ไม่พบรถตู้ของคณะอื่นที่ว่างตรงกับช่วงวันที่เลือก กรุณาติดต่อส่วนกลาง
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* ปุ่มบันทึก/ยกเลิก */}
              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-[#311171] text-white font-bold rounded-xl hover:bg-[#230b54] shadow-md disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกตาราง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: ยืนยันการลบ */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">ลบรายการจอง?</h3>
            <p className="text-sm text-gray-500 mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมในปฏิทินนี้?<br/>การกระทำนี้ไม่สามารถกู้คืนได้</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => confirmDelete(deleteConfirmId)} 
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-red-200"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Show More Events */}
      {showMoreEventsDate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowMoreEventsDate(null)}>
          <div className="bg-white rounded-[24px] shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">วันที่ {showMoreEventsDate.getDate()}</h3>
              <button onClick={() => setShowMoreEventsDate(null)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {filteredBookings
                .filter(b => isBookingActiveOnDate(b, showMoreEventsDate))
                .sort((a, b) => {
                  const isMultiDayA = !!a.returnDate && !isSameDate(a.date, a.returnDate);
                  const isMultiDayB = !!b.returnDate && !isSameDate(b.date, b.returnDate);
                  if (isMultiDayA && !isMultiDayB) return -1;
                  if (!isMultiDayA && isMultiDayB) return 1;
                  return (a.time || '').localeCompare(b.time || '');
                })
                .map(b => {
                const vanOwner = vansMap[b.vanId];
                const ownerFaculty = vanOwner ? vanOwner.facultyName : b.bookingFaculty;
                const isBorrowed = b.status === 'pending_cross_faculty' || (ownerFaculty && ownerFaculty !== b.bookingFaculty);
                
                const ownerStyle = getFacultyStyle(ownerFaculty);
                const borrowerStyle = getFacultyStyle(b.bookingFaculty);
                const displayStyle = borrowerStyle;
                const borderLeftColor = displayStyle.borderHex || '#D97706';
                const subText = b.destination || b.purpose || (b.vanId ? b.vanId.replace('v-', '').toUpperCase() : '555');

                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setShowMoreEventsDate(null);
                      setSelectedEvent({ ...b, vanId: b.vanId });
                    }}
                    className="flex justify-between items-center bg-white border border-slate-100 rounded-xl py-2.5 px-3 border-l-4 hover:shadow-md transition-all text-left w-full shadow-2xs"
                    style={{ borderLeftColor }}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${(b.status === 'APPROVED' || b.status === 'approved' || b.status === 'COMPLETED' || b.status === 'completed') ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <span className={`font-bold text-xs truncate ${displayStyle.textColor || 'text-amber-700'}`}>
                          {displayStyle.shortName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{subText}</span>
                    </div>
                    {isBorrowed && (
                      <div className="flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        <span className={`h-1.5 w-1.5 rounded-full ${ownerStyle.dotColor || 'bg-sky-500'}`} />
                        <span className="text-[9px] font-bold text-slate-500">{ownerStyle.shortName}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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
