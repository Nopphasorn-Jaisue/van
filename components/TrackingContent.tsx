"use client";
import React, { useState } from 'react';

import { 
  FileText, CheckCircle, Clock, Search, Navigation, 
  ChevronRight, Calendar, User, Phone, XCircle, Archive, MapPin
} from 'lucide-react';
import Link from 'next/link';

type BookingResponse = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  destination: string;
  assignedVanPlate?: string | null;
  assignedDriverName?: string | null;
  passengers: number;
};

type MappedBooking = {
  id: string;
  destination: string;
  date: string;
  time: string;
  status: string;
  statusText: string;
  van: string | null;
  driver: string | null;
  driverPhone: string | null;
  passengers: number;
};

export function TrackingContent() {
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอจอง #${bookingId}?`)) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', reason: 'ผู้ใช้งานขอยกเลิกการจอง' })
      });
      if (res.ok) {
        alert('ยกเลิกคำขอจองสำเร็จ');
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled', statusText: 'ยกเลิก' } : b));
      } else {
        const d = await res.json();
        alert(d.error || 'เกิดข้อผิดพลาดในการยกเลิก');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "history" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [bookings, setBookings] = useState<MappedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchBookings() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/bookings');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        const mapped = data.bookings.map((b: BookingResponse) => {
          const startDate = new Date(b.startAt);
          const endDate = new Date(b.endAt);
          const now = new Date();
          
          let statusStr = "pending";
          let statusText = "รออนุมัติ";
          
          if (b.status === "APPROVED") {
            if (endDate < now) {
              statusStr = "history";
              statusText = "เสร็จสิ้น";
            } else {
              statusStr = "approved";
              statusText = "อนุมัติแล้ว";
            }
          } else if (b.status === "REJECTED") {
            statusStr = "cancelled";
            statusText = "ยกเลิก";
          }
          
          return {
            id: b.id,
            destination: b.destination,
            date: startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')} - ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
            status: statusStr,
            statusText: statusText,
            van: b.assignedVanPlate || null,
            driver: b.assignedDriverName || null,
            driverPhone: null,
            passengers: b.passengers
          };
        });
        
        setBookings(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(b => 
    (activeTab === "all" || b.status === activeTab) &&
    (b.destination.includes(searchQuery) || b.id.includes(searchQuery))
  );

  return (
      <div className="max-w-6xl mx-auto pb-20 relative">
        
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md pt-6 pb-4 border-b border-gray-200/60 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efeaff] text-[#311171] text-xs font-bold mb-3">
                <Search size={14} /> ระบบติดตาม
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">ติดตามสถานะคำขอ</h1>
              <p className="text-gray-500">ตรวจสอบสถานะการจองรถตู้ของคุณแบบเรียลไทม์</p>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder="ค้นหาด้วยรหัสคำขอ หรือสถานที่..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {[
              { id: "all", label: "ทั้งหมด", icon: FileText },
              { id: "pending", label: "รออนุมัติ", icon: Clock },
              { id: "approved", label: "อนุมัติแล้ว", icon: CheckCircle },
              { id: "history", label: "ประวัติ", icon: Archive },
              { id: "cancelled", label: "ยกเลิก", icon: XCircle },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "all" | "pending" | "approved" | "history" | "cancelled")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-[#311171] text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table List (PC Style) */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                <tr>
                  <th className="py-4 pl-6 pr-4 font-bold w-[140px]">สถานะ</th>
                  <th className="py-4 px-4 font-bold w-[160px]">รหัสคำขอ</th>
                  <th className="py-4 px-4 font-bold min-w-[200px]">ปลายทาง / วันเวลา</th>
                  <th className="py-4 px-4 font-bold w-[140px]">ผู้โดยสาร</th>
                  <th className="py-4 px-4 font-bold min-w-[220px]">พนักงาน / รถที่จัดสรร</th>
                  <th className="py-4 pr-6 pl-4 font-bold text-right min-w-[150px]">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="w-8 h-8 border-4 border-[#311171]/20 border-t-[#311171] rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                    </td>
                  </tr>
                ) : filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                    {/* Status */}
                    <td className="py-4 pl-6 pr-4 align-top">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                        booking.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status === 'approved' && <CheckCircle size={14} />}
                        {booking.status === 'pending' && <Clock size={14} />}
                        {booking.status === 'cancelled' && <XCircle size={14} />}
                        {booking.status === 'history' && <Archive size={14} />}
                        {booking.statusText}
                      </div>
                    </td>
                    
                    {/* ID */}
                    <td className="py-4 px-4 align-top">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-[#311171] transition-colors">{booking.id}</span>
                    </td>
                    
                    {/* Destination & Time */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f0eaff] text-[#311171] flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight mb-1">{booking.destination}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1"><Calendar size={12} className="text-gray-400" /> {booking.date}</span>
                            <span className="flex items-center gap-1"><Clock size={12} className="text-gray-400" /> {booking.time}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Passengers */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <User size={14} className="text-gray-400" /> {booking.passengers} คน
                      </div>
                    </td>
                    
                    {/* Driver & Van Info */}
                    <td className="py-4 px-4 align-top">
                      {booking.van ? (
                        <div className="bg-[#f8f6fc] rounded-xl p-2.5 border border-[#311171]/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Navigation size={14} className="text-[#311171]" />
                            <span className="text-xs font-black text-gray-900">{booking.van}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-medium">{booking.driver}</span>
                            {booking.driverPhone && (
                              <a href={`tel:${booking.driverPhone}`} className="text-green-600 hover:text-green-700" title="โทรหาคนขับ">
                                <Phone size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 font-medium italic py-2">
                          ยังไม่มีการจัดสรร
                        </div>
                      )}
                    </td>
                    
                    {/* View Action */}
                    <td className="py-4 pr-6 pl-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {booking.status === 'pending' ? (
                          <>
                            <Link 
                              href={`/bookings/new?edit=${booking.id}`}
                              className="px-2.5 py-1.5 bg-purple-50 text-[#311171] hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors"
                            >
                              แก้ไข
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleCancelBooking(booking.id)}
                              className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                            >
                              ยกเลิก
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {!isLoading && filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={28} className="text-gray-300" />
                      </div>
                      <h3 className="text-base font-black text-gray-900 mb-1">ไม่พบข้อมูลคำขอ</h3>
                      <p className="text-gray-500 text-sm">ไม่พบคำขอในสถานะหรือเงื่อนไขที่คุณเลือก</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
  );
}

