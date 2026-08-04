"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Clock, Users, Phone, AlertTriangle, CheckCircle, Gauge, X, FileText, ClipboardList, TrendingUp, CalendarDays, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getDriverDashboardData } from '@/app/actions/driver';

type Trip = {
  id: string;
  destination: string;
  departureDate: string | Date;
  returnDate: string | Date;
  passengersCount?: number;
  requester?: { name: string };
  targetFaculty?: { nameTh: string };
};

export default function DriverDashboard() {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyType, setEmergencyType] = useState('sick');
  const [emergencyDetail, setEmergencyDetail] = useState('');
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);
  
  const [dashboardData, setDashboardData] = useState<{
    driver?: { name: string; faculty: string; vanPlate: string };
    todaysTrip?: Trip | null;
    upcomingTrips?: Trip[];
    stats?: { totalTrips: number; totalDistance: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Mock driverId = 1 for demo purposes
      try {
        const res = await getDriverDashboardData(1);
        if (res && res.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyDetail) {
      alert("กรุณาระบุรายละเอียดเพิ่มเติม");
      return;
    }
    setIsSubmittingEmergency(true);
    // Mock API call
    setTimeout(() => {
      setIsSubmittingEmergency(false);
      setShowEmergencyModal(false);
      setEmergencyDetail('');
      alert("ส่งข้อมูลการแจ้งปัญหาเรียบร้อยแล้ว แอดมินจะติดต่อกลับโดยเร็วที่สุด");
    }, 1000);
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


        {/* Quick Menu */}
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#311171] font-black text-sm">
            <Gauge size={18} />
            เมนูด่วน
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/driver/records" className="bg-white px-3 py-3 rounded-xl border border-purple-100 flex flex-col items-center justify-center gap-2 hover:bg-purple-50/50 transition-colors shadow-sm">
              <FileText size={20} className="text-[#311171]" />
              <span className="text-xs font-bold text-gray-700">สมุดรถ</span>
            </Link>
            <Link href="/driver/report" className="bg-white px-3 py-3 rounded-xl border border-purple-100 flex flex-col items-center justify-center gap-2 hover:bg-purple-50/50 transition-colors shadow-sm">
              <ClipboardList size={20} className="text-[#311171]" />
              <span className="text-xs font-bold text-gray-700">รายงาน (แบบ 4)</span>
            </Link>
          </div>
        </div>

        {/* Today's Trip Card */}
        {todaysTrip ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#311171] p-5 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold">
                    รอออกเดินทาง
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
                  <p className="text-sm font-bold text-gray-900">-</p>
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
                  onClick={() => setShowEmergencyModal(true)}
                  className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <AlertTriangle size={18} /> แจ้งปัญหาฉุกเฉิน / ลาพัก
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
              onClick={() => setShowEmergencyModal(true)}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <AlertTriangle size={18} /> แจ้งปัญหาฉุกเฉิน / ลาพัก
            </button>
          </div>
        )}

        {/* Monthly Quick Stats */}
        <div>
          <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-purple-600" /> สถิติเดือนนี้
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-gray-500 mb-1">จำนวนทริป</p>
              <p className="text-lg font-black text-[#311171]">{stats?.totalTrips || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-gray-500 mb-1">ระยะทางรวม</p>
              <p className="text-lg font-black text-[#311171]">{stats?.totalDistance || 0}</p>
              <p className="text-[10px] text-gray-400">กม.</p>
            </div>
          </div>
        </div>

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

        {/* Emergency Modal */}
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="bg-red-500 p-4 text-white flex justify-between items-center">
                <h3 className="font-black flex items-center gap-2">
                  <AlertTriangle size={18} /> แจ้งปัญหาฉุกเฉิน / ลาพัก
                </h3>
                <button 
                  onClick={() => setShowEmergencyModal(false)} 
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEmergencySubmit} className="p-5 space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">ประเภทการแจ้ง</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEmergencyType('sick')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        emergencyType === 'sick' 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ป่วยฉุกเฉิน
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmergencyType('leave')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        emergencyType === 'leave' 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ลากิจเร่งด่วน
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmergencyType('accident')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        emergencyType === 'accident' 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      อุบัติเหตุ
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmergencyType('broken')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        emergencyType === 'broken' 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      รถเสีย/ซ่อม
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={emergencyDetail}
                    onChange={(e) => setEmergencyDetail(e.target.value)}
                    placeholder="ระบุรายละเอียดอาการป่วย, สาเหตุที่ลา, หรือรายละเอียดรถเสีย..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium text-sm text-gray-900 resize-none h-24"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingEmergency}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingEmergency ? (
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
