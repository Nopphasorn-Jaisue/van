"use client";
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { 
  CarFront, Users, ChevronLeft, ChevronRight, 
  Search, RotateCcw, Plus,
  MapPin, Calendar, Clock, User, FileText, Info,
  CalendarDays, FileSignature, X
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';


function CalendarContent() {
  // State for view mode: "week" or "month"
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  // States for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState("คณะวิทยาศาสตร์");
  const [selectedVanFilter, setSelectedVanFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Base Date starts at July 19, 2026
  const [baseDate, setBaseDate] = useState(new Date(2026, 6, 19)); 

  // Functions to navigate dates
  const handlePrevDateRange = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      if (viewMode === "week") {
        d.setDate(d.getDate() - 7);
      } else {
        d.setMonth(d.getMonth() - 1);
      }
      return d;
    });
  };

  const handleNextDateRange = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      if (viewMode === "week") {
        d.setDate(d.getDate() + 7);
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      return d;
    });
  };

  // Helper to format date label
  const getThaiMonthFull = (monthIndex: number) => {
    const months = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return months[monthIndex];
  };

  const getDayNameFull = (dayIndex: number) => {
    const days = [
      "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์"
    ];
    return days[dayIndex];
  };

  // Helper to generate dynamic days for Week View (starting Monday of the week containing baseDate)
  const getWeekDays = (date: Date) => {
    const currentDay = date.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; // calculate how far Monday is
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

  const weekDays = getWeekDays(baseDate);
  const weekRangeText = (() => {
    const start = weekDays[0].dateObj;
    const end = weekDays[6].dateObj;
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${getThaiMonthFull(start.getMonth())} ${start.getFullYear() + 543}`;
    } else {
      return `${start.getDate()} ${getThaiMonthFull(start.getMonth()).substring(0, 4)} - ${end.getDate()} ${getThaiMonthFull(end.getMonth())} ${end.getFullYear() + 543}`;
    }
  })();

  const monthRangeText = `${getThaiMonthFull(baseDate.getMonth())} ${baseDate.getFullYear() + 543}`;

  // Mock data for bookings (1 คณะ = 1 คัน, ใช้รถคันเดียว v1)
  const bookingsData = [
    {
      id: "UPVAN-2569-00123",
      vanId: "v5",
      date: new Date(2026, 6, 19), // Sun 19 July
      time: "08:00 - 17:00",
      destination: "เชียงราย",
      purpose: "ศึกษาดูงาน",
      passengers: 10,
      status: "cross_faculty",
      bookingFaculty: "คณะวิศวกรรมศาสตร์",
      requester: "ดร.สมเกียรติ เรียนดี",
      department: "ภาควิชาวิศวกรรมคอมพิวเตอร์",
      purposeDetail: "อบรมเกษตรกรในโครงการสวนพฤกษศาสตร์",
      routeDetail: "ม.พะเยา → ตัวเมืองเชียงราย → อ.แม่สาย",
      statusText: "อนุมัติแล้ว",
      statusTime: "อนุมัติเมื่อ 15 ก.ค. 2569"
    },
    {
      id: "UPVAN-2569-00124",
      vanId: "v1",
      date: new Date(2026, 6, 21), // Tue 21 July
      time: "09:00 - 18:00",
      destination: "เชียงใหม่",
      purpose: "กิจกรรมภาคสนาม",
      passengers: 12,
      status: "approved",
      requester: "อ.วิจิตรา ใจดี",
      department: "ภาควิชาพืชศาสตร์",
      purposeDetail: "เก็บตัวอย่างโรคพืชและวัชพืช",
      routeDetail: "ม.พะเยา → แปลงทดลอง อ.สะเมิง จ.เชียงใหม่",
      statusText: "อนุมัติแล้ว",
      statusTime: "อนุมัติเมื่อ 17 ก.ค. 2569"
    },
    {
      id: "UPVAN-2569-00125",
      vanId: "v1",
      date: new Date(2026, 6, 15), // Wed 15 July
      time: "06:30 - 16:30",
      destination: "พะเยา",
      purpose: "กิจกรรมคณะ",
      passengers: 8,
      status: "ongoing",
      requester: "สำนักงานคณะเกษตรฯ",
      department: "ส่วนกลาง",
      purposeDetail: "อบรมเกษตรกร",
      routeDetail: "มหาวิทยาลัยพะเยา → อำเภอเชียงคำ",
      statusText: "อยู่ระหว่างเดินทาง",
      statusTime: "เริ่มเดินทาง 06:30 น."
    },
    {
      id: "UPVAN-2569-00126",
      vanId: "v1",
      date: new Date(2026, 6, 17), // Fri 17 July
      time: "09:00 - 16:00",
      destination: "เชียงราย",
      purpose: "ประชุมสัมมนา",
      passengers: 9,
      status: "completed",
      requester: "รศ.สมหญิง เก่งมาก",
      department: "ภาควิชาสัตวศาสตร์",
      purposeDetail: "ประชุมเครือข่ายวิจัย",
      routeDetail: "มหาวิทยาลัยพะเยา → ศูนย์วิจัยเชียงราย",
      statusText: "เสร็จสิ้น",
      statusTime: "กลับถึง 16:05 น."
    },
    {
      id: "UPVAN-2569-00127",
      vanId: "v1",
      date: new Date(2026, 6, 13), // Mon 13 July
      time: "07:30 - 16:00",
      destination: "พะเยา",
      purpose: "รับ-ส่งนิสิต",
      passengers: 12,
      status: "completed",
      requester: "กองกิจการนิสิต",
      department: "ส่วนกลาง",
      purposeDetail: "รับ-ส่งนิสิตทำกิจกรรม",
      routeDetail: "หอพัก → แปลงเกษตร",
      statusText: "เสร็จสิ้น",
      statusTime: "กลับถึง 16:00 น."
    },
    {
      id: "UPVAN-2569-00128",
      vanId: "v1",
      date: new Date(2026, 6, 14), // Tue 14 July
      time: "08:00 - 17:00",
      destination: "ลำพูน",
      purpose: "อบรม",
      passengers: 11,
      status: "approved",
      requester: "ดร.สมชาย ใจเพชร",
      department: "ศูนย์วิจัยดิน",
      purposeDetail: "โครงการอบรมดิน",
      routeDetail: "ม.พะเยา → ศูนย์วิจัยลำพูน",
      statusText: "อนุมัติแล้ว",
      statusTime: "อนุมัติเมื่อ 11 ก.ค. 2569"
    },
    {
      id: "UPVAN-2569-00129",
      vanId: "v1",
      date: new Date(2026, 6, 16), // Thu 16 July
      time: "09:00 - 15:30",
      destination: "เชียงราย",
      purpose: "กิจกรรมภาคสนาม",
      passengers: 12,
      status: "pending",
      requester: "อ.วิชัย แก้วใจดี",
      department: "ภาควิชาสัตวศาสตร์",
      purposeDetail: "พานิสิตดูงานฟาร์ม",
      routeDetail: "ม.พะเยา → ฟาร์มเชียงราย",
      statusText: "รออนุมัติ",
      statusTime: "ยื่นเมื่อ 12 ก.ค. 2569"
    },
    {
      id: "UPVAN-2569-00130",
      vanId: "v1",
      date: new Date(2026, 6, 18), // Sat 18 July
      time: "08:00 - 12:00",
      destination: "พะเยา",
      purpose: "กิจกรรมคณะ",
      passengers: 6,
      status: "approved",
      requester: "คณบดี",
      department: "สำนักงานคณะ",
      purposeDetail: "ต้อนรับแขกวีไอพี",
      routeDetail: "ม.พะเยา → ตัวเมืองพะเยา",
      statusText: "อนุมัติแล้ว",
      statusTime: "อนุมัติอัตโนมัติ"
    },
  ];

  // Helper styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-50 border-green-200 text-green-700";
      case "pending": return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "ongoing": return "bg-blue-50 border-blue-200 text-blue-700";
      case "completed": return "bg-[#f5eeff] border-[#e0caff] text-[#311171]";
      case "cross_faculty": return "bg-purple-50 border-purple-200 text-purple-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "ongoing": return "bg-blue-500";
      case "completed": return "bg-[#311171]";
      case "cross_faculty": return "bg-purple-500";
      default: return "bg-gray-400";
    }
  };

  // Filter logic
  const filteredBookings = bookingsData.filter(b => {
    const matchesSearch = 
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.requester.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVan = selectedVanFilter === "all" ? true : b.vanId === selectedVanFilter;
    const matchesStatus = selectedStatusFilter === "all" ? true : b.status === selectedStatusFilter;

    return matchesSearch && matchesVan && matchesStatus;
  });

  // Vans list (1 คณะ = 1 คัน)
  const vansList = [
    {
      id: "v1",
      faculty: "คณะเกษตรศาสตร์",
      vanName: "รถตู้คณะเกษตร 01",
      plate: "ทะเบียน นข 1234 พะเยา",
      driverName: "นายสมชาย ใจดี",
      driverPhone: "081-234-5678",
      vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80",
      driverImage: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80"
    },
    {
      id: "v4",
      faculty: "คณะวิศวกรรมศาสตร์",
      vanName: "รถตู้คณะวิศวะ 01",
      plate: "ทะเบียน กท 4455 พะเยา",
      driverName: "นายช่าง ใหญ่",
      driverPhone: "088-111-2222",
      vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80",
      driverImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
    },
    {
      id: "v5",
      faculty: "คณะวิทยาศาสตร์",
      vanName: "รถตู้คณะวิทย์ 01",
      plate: "ทะเบียน ขข 9988 พะเยา",
      driverName: "นายทดลอง วิทย์",
      driverPhone: "087-999-8888",
      vanImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80",
      driverImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80"
    }
  ];

  const filteredVans = vansList.filter(v => {
    return selectedFacultyFilter === "all" ? true : v.faculty === selectedFacultyFilter;
  });

  const vansMap = vansList.reduce((acc: Record<string, typeof vansList[0]>, van: typeof vansList[0]) => {
    acc[van.id] = van;
    return acc;
  }, {});

  const [selectedEvent, setSelectedEvent] = useState<typeof bookingsData[0] | null>(null);

  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Helper to generate dynamic days for Month View
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const cells = [];
    
    // Add prev month days (grayed out)
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      cells.push({ day: prevMonthTotalDays - i, isCurrent: false, dateObj: d, key: `p-${i}` });
    }
    
    // Add current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      cells.push({ day: i, isCurrent: true, dateObj: d, key: `c-${i}` });
    }
    
    // Add next month days (grayed out) to complete 6 rows (42 cells)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ day: i, isCurrent: false, dateObj: d, key: `n-${i}` });
    }
    
    return cells;
  };

  return (
    <div className="max-w-[1600px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0">
        
        {/* ----- Filter Bar ----- */}
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 mb-6 shrink-0 bg-transparent py-2">
          
          <div className="flex items-center gap-4">
            {/* Prev/Next buttons */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200/80 shadow-sm">
              <button 
                onClick={handlePrevDateRange}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={handleNextDateRange}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Date Display */}
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">
                {viewMode === "week" ? weekRangeText : monthRangeText}
              </h1>
              <p className="text-xs text-gray-500 font-bold mt-0.5">ตารางเดินรถตู้คณะ</p>
            </div>
          </div>

          {/* Filters Inputs */}
          <div className="flex flex-wrap items-center gap-3 bg-white/40 p-1.5 rounded-2xl backdrop-blur-sm border border-white/20">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="ค้นหาปลายทาง, ผู้ขอ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#311171]/15"
              />
            </div>

            {/* Faculty Filter */}
            <select 
              value={selectedFacultyFilter}
              onChange={(e) => {
                setSelectedFacultyFilter(e.target.value);
                setSelectedVanFilter("all"); // Reset van filter when faculty changes
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none font-bold text-gray-700"
            >
              <option value="all">ทุกคณะรวมกัน</option>
              <option value="คณะเกษตรศาสตร์">คณะเกษตรศาสตร์ (คณะของคุณ)</option>
              <option value="คณะวิศวกรรมศาสตร์">คณะวิศวกรรมศาสตร์</option>
              <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
            </select>

            {/* Van Filter */}
            <select 
              value={selectedVanFilter}
              onChange={(e) => setSelectedVanFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none font-bold text-gray-700"
            >
              <option value="all">รถตู้ทั้งหมด (ในคณะที่เลือก)</option>
              {filteredVans.map(v => (
                <option key={v.id} value={v.id}>{v.vanName}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select 
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none font-bold text-gray-700"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="ongoing">อยู่ระหว่างเดินทาง</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="pending">รออนุมัติ</option>
            </select>

            <button 
              onClick={() => { setSearchQuery(""); setSelectedVanFilter("all"); setSelectedStatusFilter("all"); }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="ล้างตัวกรอง"
            >
              <RotateCcw size={16} />
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl ml-2">
              <button 
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                สัปดาห์
              </button>
              <button 
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                เดือน
              </button>
            </div>
          </div>

        </div>

        {/* ----- Main Layout (Grid and Sidebar) ----- */}
        <div className={`grid grid-cols-1 ${selectedEvent ? 'lg:grid-cols-[1fr_360px]' : ''} gap-6 flex-1 min-h-0 transition-all duration-300`}>
          
          {/* ----- Left Content: Calendar Grid ----- */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-0 flex-1 overflow-hidden">
            
            {viewMode === "week" ? (
              /* ----- Week View: Row-based schedule ----- */
              <div className="flex-1 overflow-auto bg-gray-50/30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                  <thead className="sticky top-0 bg-white z-20 shadow-sm">
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-500">
                      <th className="p-3 w-[200px] font-bold bg-white">รถ / พนักงานขับรถ</th>
                      {weekDays.map((day, i) => (
                        <th key={i} className="p-3 font-bold bg-white text-center border-l border-gray-50">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVans.map((van) => (
                      <tr key={van.id} className="hover:bg-gray-50/10">
                        {/* Van Header Column */}
                        <td className="p-3 align-middle bg-white sticky left-0 z-10 shadow-sm border-r border-gray-100">
                          <p className="text-xs font-black text-gray-900 mb-0.5">{van.vanName}</p>
                          <p className="text-[10px] text-[#311171] font-bold mb-2">{van.plate}</p>
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <img src={van.driverImage} className="w-6 h-6 rounded-full object-cover" alt="driver" />
                            <div>
                              <p className="text-[10px] font-bold text-gray-800">{van.driverName}</p>
                              <p className="text-[9px] text-gray-500">{van.driverPhone}</p>
                            </div>
                          </div>
                        </td>
                        
                        {/* Days Columns */}
                        {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                          const cellDate = weekDays[dayIndex].dateObj;
                          const event = filteredBookings.find(b => b.vanId === van.id && isSameDate(b.date, cellDate));
                          const isSelected = selectedEvent && selectedEvent.id === event?.id;
                          
                          return (
                            <td key={dayIndex} className="p-1.5 border-r border-gray-100 align-top relative bg-white group/cell">
                              {event ? (
                                <div 
                                  onClick={() => {
                                    if (selectedEvent?.id === event.id) {
                                      setSelectedEvent(null);
                                    } else {
                                      setSelectedEvent({ ...event, vanId: van.id });
                                    }
                                  }}
                                  className={`p-2 rounded-xl border ${getStatusColor(event.status)} shadow-sm relative group cursor-pointer hover:brightness-95 transition-all h-full min-h-[75px] ${isSelected ? 'scale-[1.02] z-10 shadow-md border-[#311171]/30' : ''}`}
                                >
                                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${getStatusDot(event.status)}`} />
                                  <div className="pl-1.5">
                                    <p className="text-[10px] font-black mb-1">{event.time}</p>
                                    <p className="text-[11px] font-bold mb-0.5 truncate leading-tight">{event.destination}</p>
                                    <p className="text-[9px] opacity-90 truncate leading-tight">{event.purpose}</p>
                                    <div className="flex items-center gap-1 mt-1.5 text-[9px] font-bold opacity-80">
                                      <User size={10} /> {event.passengers} คน
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Link 
                                  href={`/bookings/new?vanId=${van.id}&date=${cellDate.toISOString().split('T')[0]}`}
                                  className="block w-full h-full min-h-[75px] rounded-xl border border-dashed border-transparent group-hover/cell:border-[#311171]/30 group-hover/cell:bg-[#311171]/5 transition-all flex items-center justify-center opacity-0 group-hover/cell:opacity-100"
                                >
                                  <span className="text-[#311171] text-[10px] font-bold flex items-center gap-1">
                                    <Plus size={12} /> จองคันนี้
                                  </span>
                                </Link>
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
              /* ----- Month View: Standard Calendar Grid ----- */
              <div className="flex-1 overflow-auto bg-gray-50/30 p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="grid grid-cols-7 border-t border-l border-gray-200 rounded-xl overflow-hidden shadow-sm min-w-[700px]">
                  {/* Month View Weekday Headers */}
                  {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((day, i) => (
                    <div key={i} className="p-2.5 border-r border-b border-gray-200 bg-gray-50 font-bold text-xs text-gray-600 text-center">
                      {day}
                    </div>
                  ))}
                  
                  {/* Month View Day Cells */}
                  {getCalendarDays(baseDate).map((cell) => {
                    const dayBookings = filteredBookings.filter(b => isSameDate(b.date, cell.dateObj));
                    const isTodayCell = isSameDate(new Date(2026, 6, 19), cell.dateObj);
                    
                    return (
                      <div 
                        key={cell.key} 
                        className={`p-2 border-r border-b border-gray-200 bg-white min-h-[110px] flex flex-col justify-between transition-colors relative group/daycell ${
                          !cell.isCurrent ? 'bg-gray-50/40 text-gray-300' : 'text-gray-700 hover:bg-gray-50/50'
                        } ${isTodayCell ? 'bg-[#311171]/5' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isTodayCell 
                              ? 'bg-[#311171] text-white font-black shadow-sm' 
                              : cell.isCurrent ? 'text-gray-900' : 'text-gray-300'
                          }`}>
                            {cell.day}
                          </span>
                          <div className="flex items-center gap-1">
                            {isTodayCell && <span className="text-[9px] font-black text-[#311171] bg-[#efeaff] px-1.5 py-0.5 rounded-full">วันนี้</span>}
                            {cell.isCurrent && (
                              <Link 
                                href={`/bookings/new?date=${cell.dateObj.toISOString().split('T')[0]}`}
                                className="w-5 h-5 rounded-full hover:bg-[#311171]/10 text-[#311171] flex items-center justify-center opacity-0 group-hover/daycell:opacity-100 transition-opacity"
                                title="จองรถวันนี้"
                              >
                                <Plus size={12} />
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        {/* Bookings inside the day cell */}
                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto [&::-webkit-scrollbar]:hidden relative z-10">
                          {dayBookings.map(b => {
                            const isSelected = selectedEvent?.id === b.id;
                            return (
                              <button
                                key={b.id}
                                onClick={() => {
                                  if (selectedEvent?.id === b.id) {
                                    setSelectedEvent(null);
                                  } else {
                                    setSelectedEvent({ ...b, vanId: b.vanId });
                                  }
                                }}
                                className={`text-[9px] font-bold py-0.5 px-1.5 rounded-md border text-left w-fit max-w-full mx-auto truncate leading-tight shadow-sm transition-all hover:brightness-95 ${
                                  isSelected ? 'scale-[1.02] shadow-md border-[#311171]/30' : ''
                                } ${getStatusColor(b.status)}`}
                              >
                                {b.time.split(' ')[0]} - {b.destination} ({vansMap[b.vanId]?.vanName.replace('รถตู้คณะเกษตร ', 'ค.')})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[11px] text-gray-500 shrink-0">
              <div className="flex items-center gap-1.5"><Info size={14} className="text-[#311171]"/> คลิกที่รายการเพื่อดูรายละเอียด หรือแก้ไขการจอง</div>
            </div>
          </div>

          {/* ----- Right Content: Booking Details Sidebar (Aligned to the Top) ----- */}
          {selectedEvent && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col self-start max-h-full w-full overflow-hidden animate-in slide-in-from-right duration-300">
              {/* Sticky Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
                <h2 className="text-[15px] font-black text-gray-900">รายละเอียดการจอง</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${getStatusColor(selectedEvent.status).replace('border-', 'ring-1 ring-').replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                    {selectedEvent.statusText}
                  </span>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="ปิดรายละเอียด"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* Cross-Faculty Booking Alert (Placed at the very top as requested) */}
                <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-4 mb-2 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#311171]"></div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-black text-gray-900">
                      หน่วยงานที่จอง: <span className="text-[#311171]">{selectedEvent.bookingFaculty || selectedEvent.department}</span>
                    </p>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-100 flex items-center gap-3">
                      <img src={vansMap[selectedEvent.vanId]?.driverImage} className="w-10 h-10 rounded-full object-cover" alt="driver" />
                      <div>
                        <p className="text-xs font-black text-gray-900 leading-tight">คนขับ: {vansMap[selectedEvent.vanId]?.driverName}</p>
                        <p className="text-[10px] text-gray-500 font-bold mt-0.5">ID: DRV-{vansMap[selectedEvent.vanId]?.id.toUpperCase()} • {vansMap[selectedEvent.vanId]?.faculty}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detail List */}
                <div className="space-y-4">
                  
                  <div className="flex gap-3">
                    <User size={16} className="text-[#311171] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">ผู้ขอใช้บริการ</p>
                      <p className="text-[13px] font-bold text-gray-900">{selectedEvent.requester}</p>
                      <p className="text-[11px] text-gray-500">{selectedEvent.department}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <FileText size={16} className="text-[#311171] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">วัตถุประสงค์การเดินทาง</p>
                      <p className="text-[13px] font-bold text-gray-900">{selectedEvent.purpose}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{selectedEvent.purposeDetail}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin size={16} className="text-[#311171] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-0.5">เส้นทาง</p>
                      <p className="text-[13px] font-bold text-gray-900">พะเยา &rarr; {selectedEvent.destination}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{selectedEvent.routeDetail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <Calendar size={16} className="text-[#311171] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">วันที่เดินทาง</p>
                        <p className="text-[12px] font-bold text-gray-900 leading-tight">
                          {getDayNameFull(selectedEvent.date.getDay() === 0 ? 6 : selectedEvent.date.getDay() - 1)}ที่ {selectedEvent.date.getDate()} {getThaiMonthFull(selectedEvent.date.getMonth())} {selectedEvent.date.getFullYear() + 543}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Clock size={16} className="text-[#311171] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">เวลาเดินทาง</p>
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">{selectedEvent.time}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <Users size={16} className="text-[#311171] shrink-0" />
                    <p className="text-[10px] font-bold text-gray-500 w-[75px]">จำนวนผู้โดยสาร</p>
                    <p className="text-[13px] font-bold text-gray-900">{selectedEvent.passengers} คน</p>
                  </div>
                </div>

                {/* Van & Driver Info */}
                <div className="bg-[#f0eaff] rounded-xl p-4 border border-[#311171]/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <CarFront size={16} className="text-[#311171] shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-500">รถที่ใช้</p>
                      <div className="flex gap-3 mt-1.5">
                        <img src={vansMap[selectedEvent.vanId]?.vanImage} className="w-12 h-8 rounded object-cover" alt="van"/>
                        <div>
                          <p className="text-[13px] font-bold text-[#311171]">{vansMap[selectedEvent.vanId]?.vanName}</p>
                          <p className="text-[10px] text-gray-500">{vansMap[selectedEvent.vanId]?.plate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-px bg-[#311171]/10 w-full"></div>

                  <div className="flex items-center gap-3">
                    <User size={16} className="text-[#311171] shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-500">คนขับ</p>
                      <div className="flex gap-3 mt-1.5">
                        <img src={vansMap[selectedEvent.vanId]?.driverImage} className="w-8 h-8 rounded-full object-cover" alt="driver"/>
                        <div>
                          <p className="text-[13px] font-bold text-[#311171]">{vansMap[selectedEvent.vanId]?.driverName}</p>
                          <p className="text-[10px] text-gray-500">{vansMap[selectedEvent.vanId]?.driverPhone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Status */}
                <div>
                  <p className="text-[11px] font-bold text-gray-500 mb-2 flex items-center gap-2">
                    <RotateCcw size={12} /> สถานะการจอง
                  </p>
                  <div className="flex gap-3 relative">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(selectedEvent.status)} mt-1 relative z-10 ring-4 ring-white`}></div>
                    <div className="absolute left-[4.5px] top-3.5 bottom-0 w-[1.5px] bg-gray-200 -z-0"></div>
                    <div>
                      <p className={`text-[13px] font-bold ${getStatusColor(selectedEvent.status).match(/text-[^\s]+/) ? getStatusColor(selectedEvent.status).match(/text-[^\s]+/)?.[0] : ''}`}>{selectedEvent.statusText}</p>
                      <p className="text-[11px] text-gray-500">{selectedEvent.statusTime}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky Actions */}
              <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)] shrink-0 flex gap-3">
                <button 
                  onClick={() => alert(`เปิดหน้ารายละเอียดของ ${selectedEvent.id}`)}
                  className="flex-1 px-4 py-2.5 bg-[#311171] hover:bg-[#250d57] text-white text-[13px] font-bold rounded-xl transition-all text-center shadow-md shadow-[#311171]/20 hover:shadow-lg hover:-translate-y-0.5"
                >
                  ดูรายละเอียดทั้งหมด
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
  );
}

function AdminCalendarTabsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') as "calendar" | "booking" | "tracking" || "calendar";
  const [activeTab, setActiveTab] = useState<"calendar" | "booking" | "tracking">(initialTab);

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-6 h-full flex flex-col">
      {/* Top Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden border-b border-gray-200 shrink-0">
        {[
          { id: "calendar", label: "ตารางการใช้รถตู้", icon: CalendarDays },
          { id: "tracking", label: "ติดตามสถานะคำขอ", icon: FileSignature },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "calendar" | "booking" | "tracking")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 -mb-[1px] ${
              activeTab === tab.id 
                ? 'border-[#311171] text-[#311171]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon size={18} className={activeTab === tab.id ? "text-[#311171]" : "text-gray-400"} /> 
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-full flex-1 flex flex-col min-h-0">
        {activeTab === 'calendar' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col min-h-0">
            <CalendarContent />
          </div>
        )}
        
        {activeTab === 'booking' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-16 h-16 rounded-2xl bg-[#efeaff] flex items-center justify-center">
              <FileSignature size={32} className="text-[#311171]" />
            </div>
            <h3 className="text-lg font-black text-gray-900">ยื่นคำขอจองรถตู้</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">กรอกแบบฟอร์มเพื่อส่งคำขอจองรถตู้ประจำคณะ</p>
            <Link
              href="/bookings/new"
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-[#311171] hover:bg-[#250d55] text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              <Plus size={18} /> เปิดแบบฟอร์มจอง
            </Link>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-16 h-16 rounded-2xl bg-[#efeaff] flex items-center justify-center">
              <Search size={32} className="text-[#311171]" />
            </div>
            <h3 className="text-lg font-black text-gray-900">ติดตามสถานะคำขอ</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">ตรวจสอบสถานะการอนุมัติคำขอจองรถตู้ทั้งหมด</p>
            <Link
              href="/bookings/tracking"
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-[#311171] hover:bg-[#250d55] text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              <Search size={18} /> เปิดหน้าติดตาม
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171]"></div></div>}>
        <AdminCalendarTabsContent />
      </Suspense>
    </AppShell>
  );
}
