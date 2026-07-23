"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Calendar as CalendarIcon, Clock, Users, ChevronRight, ChevronLeft, CalendarDays, MapPin, Phone, User, Car, X, Hourglass, History } from 'lucide-react';
import { getAssignedBookings } from '@/app/actions/driver';

export default function DriverSchedule() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<number>(20); // Fallback date, update in useEffect
  const [selectedTripDetails, setSelectedTripDetails] = useState<any>(null);

  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSelectedDate(new Date().getDate());
    async function loadData() {
      setIsLoading(true);
      // สมมติว่าคนขับที่เข้าสู่ระบบคือ driverId = 1 (สมชาย)
      const res = await getAssignedBookings(1); 
      if (res.success && res.bookings) {
        const mapped = res.bookings.map((b: any) => ({
          id: b.id,
          date: new Date(b.departureDate).toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
          destination: b.destination,
          time: `${new Date(b.departureDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.returnDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
          passengers: b.passengersCount,
          requester: b.requester?.name || "-",
          phone: "089-123-4567", 
          pickup: "ตามที่นัดหมาย",
          van: "รถตู้พะเยา",
          project: b.objective,
          status: b.driverLog ? "COMPLETED" : "ASSIGNED"
        }));

        setUpcomingTrips(mapped.filter((b: any) => b.status === "ASSIGNED"));
        setPastTrips(mapped.filter((b: any) => b.status === "COMPLETED"));
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const displayTrips = activeTab === "upcoming" ? upcomingTrips : pastTrips;

  // Mock week data for UI demo
  const weekDays = [
    { day: "อา", date: 18, hasJob: false },
    { day: "จ", date: 19, hasJob: false },
    { day: "อ", date: 20, hasJob: true },
    { day: "พ", date: 21, hasJob: false },
    { day: "พฤ", date: 22, hasJob: true },
    { day: "ศ", date: 23, hasJob: false },
    { day: "ส", date: 24, hasJob: false },
  ];

  return (
    <AppShell>
      <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
        
        {/* Sticky Fixed Top Header Section */}
        <div className="sticky -top-6 lg:-top-8 z-20 bg-[#f3f4f7]/95 backdrop-blur-md pt-8 lg:pt-10 pb-4 border-b border-gray-200/80 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 shadow-xs flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-gray-900">ตารางงานของฉัน</h1>
            <p className="text-gray-500 text-sm mt-0.5">ตรวจสอบภารกิจการเดินทางล่วงหน้า</p>
          </div>
          <button 
            onClick={() => setCalendarMode(calendarMode === "week" ? "month" : "week")}
            className="flex items-center gap-1.5 px-3 py-2 bg-white shadow-sm border border-gray-200 text-[#311171] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            <CalendarDays size={14} />
            {calendarMode === "week" ? "ดูรายสัปดาห์" : "ดูรายเดือน"}
          </button>
        </div>

        {/* Calendar Widget */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-gray-800">กรกฎาคม 2569</h2>
            <div className="flex gap-1 text-gray-400">
              <button className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"><ChevronLeft size={18} /></button>
              <button className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"><ChevronRight size={18} /></button>
            </div>
          </div>
          
          {calendarMode === "week" ? (
            <div className="flex justify-between items-center">
              {weekDays.map((d, i) => {
                const isSelected = selectedDate === d.date;
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedDate(d.date)}
                    className={`flex flex-col items-center justify-center w-11 h-16 rounded-2xl transition-all ${
                      isSelected ? "bg-[#311171] text-white shadow-md scale-105" : "bg-transparent text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${isSelected ? "text-purple-200" : "text-gray-400"}`}>{d.day}</span>
                    <span className="text-base font-black mt-0.5">{d.date}</span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${d.hasJob ? (isSelected ? "bg-white" : "bg-orange-500") : "bg-transparent"}`} />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              {/* Mock month view placeholder */}
              <div className="grid grid-cols-7 gap-y-3 gap-x-2 text-sm">
                {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, i) => (
                  <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className={`flex justify-center items-center h-8 rounded-full ${i + 1 === 20 ? 'bg-[#311171] text-white font-bold' : 'text-gray-600'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200/80 p-1 rounded-xl shadow-inner max-w-sm">
          <button 
            onClick={() => setActiveTab("upcoming")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "upcoming" ? "bg-white text-[#311171] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Hourglass size={16} /> งานที่กำลังจะมาถึง
          </button>
          <button 
            onClick={() => setActiveTab("past")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "past" ? "bg-white text-[#311171] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History size={16} /> ประวัติการทำงาน
          </button>
        </div>

        {/* Trips List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171] mb-4"></span>
              <p className="font-bold">กำลังโหลดข้อมูลจากฐานข้อมูล...</p>
            </div>
          ) : (
            <>
              {displayTrips.map(trip => (
                <div key={trip.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-purple-200 group">
                  <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-2 text-[#311171]">
                      <CalendarIcon size={18} />
                      <span className="font-bold text-sm">{trip.date}</span>
                    </div>
                    <span className="text-[10px] text-[#311171] font-mono font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">{trip.id}</span>
                  </div>
                  
                  <h3 className="text-lg font-black text-gray-900 mb-2">{trip.destination}</h3>
                  
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-gray-400" /> <span className="font-bold">{trip.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} className="text-gray-400" /> จำนวนผู้โดยสาร: {trip.passengers} คน
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedTripDetails(trip)}
                    className="w-full py-2.5 bg-gray-50 group-hover:bg-[#311171] text-gray-600 group-hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm border border-gray-200 group-hover:border-[#311171] shadow-sm"
                  >
                    ดูรายละเอียดใบจองรถ <ChevronRight size={16} />
                  </button>
                </div>
              ))}
              
              {displayTrips.length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
                  <CalendarIcon size={48} className="mx-auto mb-4 text-gray-200" />
                  <p className="font-bold">ไม่มีข้อมูลภารกิจในหมวดหมู่นี้</p>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Trip Details Modal */}
      {selectedTripDetails && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white sm:rounded-3xl shadow-2xl max-w-lg w-full rounded-t-3xl overflow-hidden relative flex flex-col max-h-[90vh]">
            
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2a0c63] to-[#311171] text-white relative shrink-0">
              <button 
                onClick={() => setSelectedTripDetails(null)}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/30 backdrop-blur-md">
                  {selectedTripDetails.id}
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ● อนุมัติแล้ว
                </span>
              </div>
              <h2 className="text-xl font-black">{selectedTripDetails.destination}</h2>
              <p className="text-purple-200 text-xs mt-1">{selectedTripDetails.date} • {selectedTripDetails.time}</p>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                <p className="text-xs text-purple-600 font-bold mb-1">โครงการ / เหตุผลการขอใช้รถ</p>
                <p className="text-sm text-gray-800 font-semibold">{selectedTripDetails.project}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold mb-1">
                    <User size={14} /> ผู้ขอจองรถ
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedTripDetails.requester}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold mb-1">
                    <Phone size={14} /> เบอร์ติดต่อ
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedTripDetails.phone}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold mb-1">
                    <Users size={14} /> จำนวนผู้โดยสาร
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedTripDetails.passengers} ท่าน</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold mb-1">
                    <Car size={14} /> รถที่ได้รับมอบหมาย
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedTripDetails.van}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 mt-1">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold">สถานที่รับผู้โดยสาร (จุดเริ่มต้น)</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedTripDetails.pickup}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button 
                onClick={() => setSelectedTripDetails(null)}
                className="w-full py-3 bg-white hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-colors border border-gray-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
            
          </div>
        </div>
      )}
    </AppShell>
  );
}

