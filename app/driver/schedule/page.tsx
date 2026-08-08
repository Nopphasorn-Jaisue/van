"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Calendar as CalendarIcon, Clock, Users, ChevronRight, ChevronLeft, CalendarDays, MapPin, Phone, User, Car, X, Hourglass, History, Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { getAssignedBookings, createAdhocBooking, updateAdhocBooking, deleteAdhocBooking } from '@/app/actions/driver';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import ThaiTimePicker from '@/components/ThaiTimePicker';

interface TripLegData {
  destination: string;
  deptTime: string;
  returnTime: string;
  endMileage: string;
  startMileage: string;
}

interface Trip {
  id: string | number;
  date: string;
  destination: string;
  time: string;
  passengers: number;
  requester: string;
  phone: string;
  pickup: string;
  van: string;
  project: string;
  status: string;
  isAdhoc?: boolean;
  rawDate?: string;
  rawStartTime?: string;
  rawEndTime?: string;
  actualData?: {
    totalDistance: number;
    legs: TripLegData[];
    endLocation: string;
    endTime: string;
    lastMileage?: string | null;
    startMileage?: string | null;
  };
}

interface BookingData {
  id: string | number;
  departureDate: string | Date;
  returnDate: string | Date;
  destination: string;
  passengersCount: number;
  requester?: { name: string, faculty?: { nameTh: string } | null } | null;
  objective: string;
  driverLog?: {
    totalDistance: number;
    tripLegs: TripLegData[];
  } | null;
}

export default function DriverSchedule() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<number>(20); // Fallback date, update in useEffect
  const [selectedTripDetails, setSelectedTripDetails] = useState<Trip | null>(null);

  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [pastTrips, setPastTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Adhoc form state
  const [isAdhocModalOpen, setIsAdhocModalOpen] = useState(false);
  const [adhocForm, setAdhocForm] = useState({
    id: '',
    destination: '',
    date: '',
    startTime: '',
    endTime: '',
    pickup: '',
  });

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, id: string | number | null}>({isOpen: false, id: null});

  const handleOpenAdhoc = () => {
    setAdhocForm({
      id: '',
      destination: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      pickup: '',
    });
    setIsAdhocModalOpen(true);
  };

  const handleEditAdhoc = (trip: Trip) => {
    setAdhocForm({
      id: trip.id.toString(),
      destination: trip.destination,
      date: trip.rawDate || new Date().toISOString().split('T')[0],
      startTime: trip.rawStartTime || '',
      endTime: trip.rawEndTime || '',
      pickup: trip.pickup,
    });
    setIsAdhocModalOpen(true);
    setSelectedTripDetails(null);
  };

  const handleDeleteAdhoc = (id: string | number) => {
    setDeleteConfirmation({isOpen: true, id});
  };

  const confirmDeleteAdhoc = async () => {
    if (deleteConfirmation.id) {
      await deleteAdhocBooking(deleteConfirmation.id.toString());
      setUpcomingTrips(prev => prev.filter(t => t.id !== deleteConfirmation.id));
      setPastTrips(prev => prev.filter(t => t.id !== deleteConfirmation.id));
      setSelectedTripDetails(null);
      setDeleteConfirmation({isOpen: false, id: null});
    }
  };

  const handleSaveAdhoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!adhocForm.id;
    
    // Call server action to actually save to DB
    const res = isEditing 
      ? await updateAdhocBooking(adhocForm.id, adhocForm)
      : await createAdhocBooking(1, adhocForm); // Mock driverId 1
      
    if (res.success && res.booking) {
      const d = new Date(res.booking.departureDate);
      const displayDate = d.toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      const displayTime = `${adhocForm.startTime} - ${adhocForm.endTime}`;

      const newTrip: Trip = {
        id: res.booking.id,
        date: displayDate,
        destination: adhocForm.destination,
        time: displayTime,
        passengers: 0,
        requester: "คนขับ (บันทึกเอง)",
        phone: "-",
        pickup: adhocForm.pickup,
        van: "รถที่กำลังขับ",
        project: "การใช้รถนอกแผน",
        status: "ASSIGNED",
        isAdhoc: true,
        rawDate: adhocForm.date,
        rawStartTime: adhocForm.startTime,
        rawEndTime: adhocForm.endTime,
      };

      if (isEditing) {
        setUpcomingTrips(prev => prev.map(t => t.id === adhocForm.id ? newTrip : t));
        setPastTrips(prev => prev.map(t => t.id === adhocForm.id ? newTrip : t));
      } else {
        setUpcomingTrips(prev => [newTrip, ...prev]);
      }
      setIsAdhocModalOpen(false);
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  useEffect(() => {
    setSelectedDate(new Date().getDate());
    async function loadData() {
      setIsLoading(true);
      try {
        const calRes = await fetch('/api/calendar-events');
        let calTrips: Trip[] = [];
        if (calRes.ok) {
          const text = await calRes.text();
          if (text && text.trim().length > 0) {
            const calData = JSON.parse(text);
            if (calData && calData.rawEvents && Array.isArray(calData.rawEvents)) {
              type RawCalendarEventItem = {
                id?: string | number;
                date?: string | Date;
                destination?: string;
                purpose?: string;
                time?: string;
                passengers?: number;
                requester?: string;
                bookingFaculty?: string;
                vanId?: string;
                status?: string;
              };
              calTrips = calData.rawEvents.map((e: RawCalendarEventItem) => {
                const eventDate = e.date ? new Date(e.date) : new Date();
                const displayDate = !isNaN(eventDate.getTime())
                  ? eventDate.toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                  : 'ไม่ระบุวันที่';
                
                return {
                  id: e.id,
                  date: displayDate,
                  destination: e.destination || e.purpose || 'ไม่ระบุสถานที่',
                  time: e.time || '08:30 - 16:30 น.',
                  passengers: e.passengers || 8,
                  requester: e.requester || 'ผู้ขอใช้บริการ',
                  phone: '054-466666',
                  pickup: e.bookingFaculty || 'มหาวิทยาลัยพะเยา',
                  van: e.vanId ? (e.vanId.toUpperCase()) : 'รถตู้ประจำคณะ',
                  project: e.purpose || 'ภารกิจเดินรถตู้',
                  status: e.status === 'completed' ? 'COMPLETED' : 'ASSIGNED'
                };
              });
            }
          }
        }

        const res = await getAssignedBookings(1); 
        let mapped: Trip[] = [];
        if (res.success && res.bookings) {
          mapped = res.bookings.map((b: BookingData) => {
            let actualData = undefined;
            if (b.driverLog) {
              const legs = b.driverLog.tripLegs || [];
              const lastLeg = legs.length > 0 ? legs[legs.length - 1] : null;
              actualData = {
                totalDistance: b.driverLog.totalDistance,
                legs: legs,
                endLocation: lastLeg ? lastLeg.destination : b.destination,
                endTime: lastLeg ? lastLeg.returnTime : "",
                lastMileage: lastLeg ? lastLeg.endMileage : null,
                startMileage: legs.length > 0 ? legs[0].startMileage : null,
              };
            }

            return {
              id: b.id,
              date: new Date(b.departureDate).toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
              destination: b.destination,
              time: `${new Date(b.departureDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.returnDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
              passengers: b.passengersCount,
              requester: b.requester?.name || "-",
              phone: "-", 
              pickup: b.requester?.faculty?.nameTh || "มหาวิทยาลัยพะเยา",
              van: "รถตู้ที่รับผิดชอบ",
              project: b.objective,
              status: b.driverLog ? "COMPLETED" : "ASSIGNED",
              actualData
            };
          });
        }

        const combined = [...calTrips, ...mapped];
        setUpcomingTrips(combined.filter((b: Trip) => b.status === "ASSIGNED"));
        setPastTrips(combined.filter((b: Trip) => b.status === "COMPLETED"));
      } catch (err) {
        console.warn("Failed to load driver schedule:", err);
      } finally {
        setIsLoading(false);
      }
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
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button 
              onClick={() => window.open('https://calendar.google.com', '_blank')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <CalendarIcon size={14} />
              Google Calendar
            </button>
            <button 
              onClick={handleOpenAdhoc}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#311171] shadow-sm border border-[#311171] text-white rounded-xl text-xs font-bold hover:bg-[#270e59] transition-colors"
            >
              <Plus size={14} />
              บันทึกงานด่วน
            </button>
            <button 
              onClick={() => setCalendarMode(calendarMode === "week" ? "month" : "week")}
              className="flex items-center gap-1.5 px-3 py-2 bg-white shadow-sm border border-gray-200 text-[#311171] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              <CalendarDays size={14} />
              {calendarMode === "week" ? "ดูรายเดือน" : "ดูรายสัปดาห์"}
            </button>
          </div>
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
                    {activeTab === "past" && trip.actualData && (
                      <div className="mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                        <div className="text-xs font-bold text-[#311171] mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} /> ข้อมูลการเดินทางจริง
                          </div>
                          {trip.actualData.lastMileage && (
                            <div className="bg-[#311171] text-white px-2 py-1 rounded-md text-[10px] flex items-center gap-1 shadow-sm">
                              <Car size={12} />
                              เลขไมล์ล่าสุด: {Number(trip.actualData.lastMileage).toLocaleString()}
                            </div>
                          )}
                        </div>
                        {trip.actualData.startMileage && (
                          <div className="text-xs text-gray-600 flex justify-between">
                            <span className="font-bold text-gray-500">เลขไมล์เริ่มต้น:</span>
                            <span className="font-bold text-gray-900">{Number(trip.actualData.startMileage).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-600 flex justify-between">
                          <span className="font-bold text-gray-500">เลขไมล์รวม:</span>
                          <span className="font-bold text-gray-900">{trip.actualData.totalDistance.toLocaleString()} กม.</span>
                        </div>
                        {trip.actualData.legs.length > 1 && (
                          <div className="text-xs text-gray-600">
                            <span className="font-bold text-gray-500 mb-1 block">จุดแวะพัก:</span> 
                            <ul className="list-disc pl-4 space-y-1">
                              {trip.actualData.legs.slice(0, -1).map((leg, i) => (
                                <li key={i}>{leg.destination} <span className="text-gray-400">(ออก {leg.deptTime} น. - ถึง {leg.returnTime} น.)</span></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="text-xs text-gray-600 flex justify-between">
                          <span className="font-bold text-gray-500">จุดสิ้นสุด:</span>
                          <span className="font-bold text-gray-900 text-right">{trip.actualData.endLocation}</span>
                        </div>
                        <div className="text-xs text-gray-600 flex justify-between">
                          <span className="font-bold text-gray-500">เวลาสิ้นสุดจริง:</span>
                          <span className="font-bold text-gray-900">{trip.actualData.endTime} น.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {(trip.isAdhoc || String(trip.id).includes('UP-ADHOC') || trip.project === 'การใช้รถนอกแผน') && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditAdhoc(trip); }}
                          className="px-4 py-2.5 bg-white text-[#311171] font-bold rounded-xl flex items-center justify-center transition-all text-sm border border-gray-200 hover:bg-gray-50 shadow-sm"
                          title="แก้ไข"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteAdhoc(trip.id); }}
                          className="px-4 py-2.5 bg-white text-red-500 font-bold rounded-xl flex items-center justify-center transition-all text-sm border border-gray-200 hover:bg-red-50 shadow-sm"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => setSelectedTripDetails(trip)}
                      className="flex-1 py-2.5 bg-gray-50 group-hover:bg-[#311171] text-gray-600 group-hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm border border-gray-200 group-hover:border-[#311171] shadow-sm"
                    >
                      ดูรายละเอียดใบจองรถ <ChevronRight size={16} />
                    </button>
                  </div>
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

            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-2">
              {selectedTripDetails.isAdhoc && (
                <>
                  <button 
                    onClick={() => handleEditAdhoc(selectedTripDetails)}
                    className="flex-1 py-3 bg-white hover:bg-gray-100 text-[#311171] text-sm font-bold rounded-xl transition-colors border border-gray-200 flex items-center justify-center gap-2"
                  >
                    <Edit size={16} /> แก้ไข
                  </button>
                  <button 
                    onClick={() => handleDeleteAdhoc(selectedTripDetails.id)}
                    className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-colors border border-red-100 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> ลบ
                  </button>
                </>
              )}
              <button 
                onClick={() => setSelectedTripDetails(null)}
                className={`${selectedTripDetails.isAdhoc ? 'flex-1' : 'w-full'} py-3 bg-white hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-colors border border-gray-200`}
              >
                ปิดหน้าต่าง
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Adhoc Form Modal */}
      {isAdhocModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-gray-900">
                {adhocForm.id ? 'แก้ไขการใช้รถนอกแผน' : 'เพิ่มการใช้รถนอกแผน'}
              </h2>
              <button onClick={() => setIsAdhocModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAdhoc} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">สถานที่ไป (ปลายทาง)</label>
                <input 
                  required
                  type="text" 
                  value={adhocForm.destination}
                  onChange={e => setAdhocForm({...adhocForm, destination: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#311171] focus:ring-1 focus:ring-[#311171]"
                  placeholder="เช่น เติมน้ำมัน, ล้างรถ, อื่นๆ"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">สถานที่รับ (จุดเริ่มต้น)</label>
                <input 
                  required
                  type="text" 
                  value={adhocForm.pickup}
                  onChange={e => setAdhocForm({...adhocForm, pickup: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#311171] focus:ring-1 focus:ring-[#311171]"
                  placeholder="เช่น มหาวิทยาลัยพะเยา"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">วันที่</label>
                <ThaiDatePicker 
                  value={adhocForm.date}
                  onChange={val => setAdhocForm({...adhocForm, date: val})}
                  disabled={true}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">เวลาเริ่ม</label>
                  <ThaiTimePicker 
                    value={adhocForm.startTime}
                    onChange={val => setAdhocForm({...adhocForm, startTime: val})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">เวลาสิ้นสุด</label>
                  <ThaiTimePicker 
                    value={adhocForm.endTime}
                    onChange={val => setAdhocForm({...adhocForm, endTime: val})}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAdhocModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-[#311171] hover:bg-[#2a0c63] text-white text-sm font-bold rounded-xl transition-colors shadow-md"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden text-center">
            <div className="p-6 pt-8">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">ยืนยันการลบ</h2>
              <p className="text-gray-500 text-sm">คุณแน่ใจหรือไม่ว่าต้องการลบรายการใช้รถนอกแผนนี้? การกระทำนี้ไม่สามารถเรียกคืนได้</p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setDeleteConfirmation({isOpen: false, id: null})}
                className="flex-1 py-3 bg-white hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-colors border border-gray-200"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmDeleteAdhoc}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md"
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

