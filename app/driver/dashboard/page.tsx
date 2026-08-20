"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Clock, Users, Phone, AlertTriangle, CheckCircle, Gauge, X, FileText, CalendarDays, Loader2, ChevronRight, CarFront } from 'lucide-react';
import Link from 'next/link';
import { getDriverDashboardData } from '@/app/actions/driver';
import { requestAvailabilityChange } from '@/app/actions/driver-availability';
import { AvailabilityStatus } from '@prisma/client';

type Trip = {
  id: string;
  destination: string;
  departureDate: string | Date;
  returnDate: string | Date;
  passengersCount?: number;
  requester?: { name: string; phone?: string };
  targetFaculty?: { nameTh: string };
};

type RawCalendarEvent = {
  id?: string | number;
  vanId?: string;
  phone?: string;
  date?: string;
  returnDate?: string;
  time?: string;
  destination?: string;
  purpose?: string;
  passengers?: number | string;
  requester?: string;
  bookingFaculty?: string;
  status?: string;
};

export default function DriverDashboard() {
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState('');

  useEffect(() => {
    setAvailabilityDate(new Date().toISOString().split('T')[0]);
  }, []);
  const [availabilityType, setAvailabilityType] = useState<AvailabilityStatus>('SICK_LEAVE');
  const [availabilityDetail, setAvailabilityDetail] = useState('');
  const [isSubmittingAvailability, setIsSubmittingAvailability] = useState(false);
  
  const [dashboardData, setDashboardData] = useState<{
    driver?: { name: string; faculty: string; vanPlate: string };
    todaysTrip?: Trip | null;
    upcomingTrips?: Trip[];
    stats?: { totalTrips: number; totalDistance: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const meRes = await fetch('/api/driver/me');
        const meData = await meRes.json();
        let driverId = 1; // Fallback, but it will be overridden if valid
        if (meData.success && meData.driverData && meData.driverData.id) {
          driverId = meData.driverData.id;
          localStorage.setItem('current_driver_id', driverId.toString());
        }

        const res = await getDriverDashboardData(driverId);

        // Fetch Calendar Events to check for today's trip and total trips
        let calTodaysTrip: Trip | null = null;
        let calTotalTrips = 0;

        try {
          const calRes = await fetch('/api/calendar-events');
          if (calRes.ok) {
            const calData = await calRes.json();
            if (calData && calData.rawEvents && Array.isArray(calData.rawEvents)) {
              const actualVanId = meData.driverData.assignedVanId || meData.driverData.facultyVanId;
              const driverVanIdStr = String(actualVanId);
              const driverLegacyVanId = meData.driverData.legacyVanId;
              
              const activeEvents = calData.rawEvents.filter((e: RawCalendarEvent) => {
                if (e.status === 'rejected' || e.status === 'cancelled') return false;
                if (e.id && String(e.id).startsWith('bk-')) return false;
                
                const eventVanId = String(e.vanId);
                const driverVanIdFormatted = `van-${driverVanIdStr.padStart(3, '0')}`;
                
                const eventFacultyId = String(e.facultyId);
                const driverFacultyId = String(meData.driverData.facultyId);
                
                const isVanMatch = eventVanId === driverVanIdStr || eventVanId === driverLegacyVanId || eventVanId === driverVanIdFormatted;
                
                const isFacultyMatch = eventFacultyId === driverFacultyId 
                                    || (eventFacultyId === 'ict' && driverLegacyVanId === 'v-ict')
                                    || (eventFacultyId === 'pharm' && driverLegacyVanId === 'v-pharm')
                                    || (eventFacultyId === 'sci' && driverLegacyVanId === 'v-sci')
                                    || (eventFacultyId === 'agr' && driverLegacyVanId === 'v-agri')
                                    || (eventFacultyId === 'ener' && driverLegacyVanId === 'v-seen')
                                    || (eventFacultyId === 'eng' && driverLegacyVanId === 'v-eng');

                return isVanMatch || isFacultyMatch;
              });
              
              const now = new Date();
              const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

              calTotalTrips = activeEvents.length;

              const foundToday = activeEvents.find((e: RawCalendarEvent) => {
                const sDate = e.date ? String(e.date).slice(0, 10) : '';
                const rDate = e.returnDate ? String(e.returnDate).slice(0, 10) : sDate;
                return todayStr >= sDate && todayStr <= rDate;
              });

              if (foundToday) {
                calTodaysTrip = {
                  id: String(foundToday.id || 'UP-TODAY'),
                  destination: foundToday.destination || 'ไม่ระบุสถานที่',
                  departureDate: foundToday.date ? (foundToday.date.includes('T') ? foundToday.date : `${foundToday.date}T08:30:00`) : new Date().toISOString(),
                  returnDate: foundToday.returnDate ? (foundToday.returnDate.includes('T') ? foundToday.returnDate : `${foundToday.returnDate}T16:30:00`) : new Date().toISOString(),
                  passengersCount: Number(foundToday.passengers || 1),
                  requester: { name: foundToday.requester || 'ผู้ขอใช้บริการ', phone: foundToday.phone || '-' },
                  targetFaculty: { nameTh: foundToday.bookingFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร' }
                };
              }
            }
          }
        } catch (calErr) {
          console.warn("Failed to load calendar events for driver dashboard:", calErr);
        }

        if (res && res.success && res.data) {
          const mergedData = {
            ...res.data,
            todaysTrip: res.data.todaysTrip || calTodaysTrip,
            stats: {
              ...res.data.stats,
              totalTrips: (res.data.stats?.totalTrips || 0) + calTotalTrips,
              totalDistance: res.data.stats?.totalDistance || 0
            }
          };
          setDashboardData(mergedData);
        } else {
          setDashboardData({
            todaysTrip: calTodaysTrip,
            stats: { totalTrips: calTotalTrips, totalDistance: 0 }
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availabilityType !== 'READY' && !availabilityDetail) {
      alert("กรุณาระบุรายละเอียดเพิ่มเติม/เหตุผล");
      return;
    }
    setIsSubmittingAvailability(true);
    
    try {
      const driverId = parseInt(localStorage.getItem('current_driver_id') || '0');
      if (!driverId) {
        alert("ไม่พบข้อมูลคนขับ โปรดลองรีเฟรชหน้าเว็บ");
        setIsSubmittingAvailability(false);
        return;
      }

      const res = await requestAvailabilityChange(
        driverId,
        new Date(availabilityDate),
        availabilityType,
        availabilityDetail
      );
      if (res.success) {
        alert("ส่งข้อมูลเปลี่ยนสถานะเรียบร้อยแล้ว");
        setShowAvailabilityModal(false);
        setAvailabilityDetail('');
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmittingAvailability(false);
    }
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayLabel = (dateString: string | Date) => {
    const d = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dZero = new Date(d);
    dZero.setHours(0,0,0,0);

    if (dZero.getTime() === tomorrow.getTime()) return "พรุ่งนี้";
    
    const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    return days[d.getDay()];
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="w-full h-[60vh] flex flex-col items-center justify-center text-purple-600 space-y-4">
          <Loader2 size={40} className="animate-spin" />
          <p className="font-bold text-sm">กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </AppShell>
    );
  }

  const { driver, todaysTrip, upcomingTrips, stats } = dashboardData || {};

  return (
    <AppShell>
      <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20 relative">
        
        {/* Sticky Fixed Top Header Section */}
        <div className="sticky -top-6 lg:-top-8 z-20 bg-[#f3f4f7]/95 backdrop-blur-md pt-8 lg:pt-10 pb-3 border-b border-gray-200/80 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 shadow-xs">
          <h1 className="text-2xl font-black text-gray-900">คุณ {driver?.name?.split(' ')[0] || "คนขับ"}</h1>
          <p className="text-gray-500 font-bold text-xs mt-0.5">คนขับ {driver?.faculty || ""} • ภารกิจของคุณในวันนี้</p>
        </div>


        {/* KPI Cards (4 กล่องสไตล์ Faculty Admin แบบ 3D มิติ) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {/* Card 1 - จำนวนทริปเดือนนี้ */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#311171]/20 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#311171] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#311171]/30">
                <CarFront size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">ทริปทั้งหมดเดือนนี้</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">{stats?.totalTrips || 0} ทริป</span>
                </div>
                <p className="text-xs font-bold text-purple-600 mt-0.5">สถิติสะสมในระบบ</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-[#311171] transition-colors" />
          </div>

          {/* Card 2 - ระยะทางรวม */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-green-200">
                <Gauge size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">ระยะทางขับขี่รวม</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">{stats?.totalDistance || 0} กม.</span>
                </div>
                <p className="text-xs font-bold text-green-600 mt-0.5">คำนวณจากสมุดบันทึก</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-green-500 transition-colors" />
          </div>

          {/* Card 3 - สมุดบันทึกรถ */}
          <Link 
            href="/driver/records"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#C39B22]/30 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#C39B22] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#C39B22]/30">
                <FileText size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">สมุดบันทึกรถ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-gray-900">บันทึกเดินทาง</span>
                </div>
                <p className="text-xs font-bold text-amber-600 mt-0.5">เปิดบันทึกเข้า-ออก</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-[#C39B22] transition-colors" />
          </Link>


        </div>

        {/* Today's Trip Card */}
        {todaysTrip ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#311171] p-5 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${todaysTrip.driverLog ? 'bg-green-500/20 text-green-100' : 'bg-white/20'}`}>
                    {todaysTrip.driverLog ? 'เสร็จสิ้นภารกิจ' : 'รอออกเดินทาง'}
                  </span>
                </div>
                <span className="text-xs font-bold opacity-80">{todaysTrip.id}</span>
              </div>
              
              <h2 className="text-xl font-black mb-1">{todaysTrip.destination}</h2>
              <div className="flex items-center gap-1.5 text-purple-100 text-sm">
                <Clock size={16} /> {formatTime(todaysTrip.departureDate)} - {formatTime(todaysTrip.returnDate)}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-[#311171]">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold">ผู้จอง ({todaysTrip.passengersCount} คน)</p>
                  <p className="text-sm font-black text-[#311171] mt-0.5">{todaysTrip.requester?.name}</p>
                  <p className="text-xs font-bold text-gray-700 mt-0.5">{todaysTrip.targetFaculty?.nameTh}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold">เบอร์ติดต่อ</p>
                  <p className="text-sm font-bold text-gray-900">{todaysTrip.requester?.phone || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Gauge size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold">รถตู้ที่ใช้</p>
                  <p className="text-sm font-bold text-gray-900">{driver?.vanPlate}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <Link 
                  href="/driver/records"
                  className="w-full py-3.5 bg-[#311171] hover:bg-[#250d55] text-white font-black rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <FileText size={20} /> เปิดสมุดบันทึกการเดินทาง
                </Link>

                <button 
                  onClick={() => setShowAvailabilityModal(true)}
                  className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <AlertTriangle size={18} /> แจ้งเปลี่ยนสถานะความพร้อม / ลางาน
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <CheckCircle size={32} />
            </div>
            <h3 className="font-black text-gray-900 text-lg mb-2">ไม่มีงานในวันนี้</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">คุณว่างในวันนี้ พักผ่อนให้เต็มที่ครับ</p>
            
            <button 
              onClick={() => setShowAvailabilityModal(true)}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <AlertTriangle size={18} /> แจ้งปัญหาฉุกเฉิน / ลาพัก
            </button>
          </div>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips && upcomingTrips.length > 0 && (
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-600" /> งานที่กำลังจะมาถึง
            </h3>
            <div className="space-y-3">
              {upcomingTrips.slice(0, 3).map((trip: Trip, idx: number) => (
                <div key={trip.id} className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-4 items-center ${idx > 0 ? 'opacity-75' : ''}`}>
                  <div className={`${idx === 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'} rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[3.5rem]`}>
                    <span className="text-xs font-bold">{getDayLabel(trip.departureDate)}</span>
                    <span className="text-lg font-black">{new Date(trip.departureDate).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 text-sm truncate">{trip.destination}</h4>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mt-1">
                      <Clock size={12} /> {formatTime(trip.departureDate)} - {formatTime(trip.returnDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability Modal */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">เปลี่ยนสถานะความพร้อม</h3>
                    <p className="text-sm font-bold text-gray-500">แจ้งลางาน หรือ แจ้งความพร้อม</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAvailabilityModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">วันที่ต้องการแจ้ง</label>
                  <input
                    type="date"
                    value={availabilityDate}
                    onChange={(e) => setAvailabilityDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-900 outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">ระบุสถานะ</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('READY')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        availabilityType === 'READY' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      พร้อมปฏิบัติงาน
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('SUBSTITUTE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        availabilityType === 'SUBSTITUTE' 
                          ? 'bg-amber-50 border-amber-200 text-amber-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ปฏิบัติงานแทน
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('SICK_LEAVE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        availabilityType === 'SICK_LEAVE' 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ลาป่วย
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('PERSONAL_LEAVE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        availabilityType === 'PERSONAL_LEAVE' 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ลากิจ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={availabilityDetail}
                    onChange={(e) => setAvailabilityDetail(e.target.value)}
                    placeholder="ระบุเหตุผล เช่น ไปหาหมอ, ธุระส่วนตัว..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium text-sm text-gray-900 resize-none h-24"
                    required={availabilityType !== 'READY'}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingAvailability}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingAvailability ? (
                      <span className="animate-pulse">กำลังส่งข้อมูล...</span>
                    ) : (
                      <>ยืนยันการแจ้งปัญหา</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
