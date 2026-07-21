"use client";
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { 
  FileText, CheckCircle, Clock, Search, Navigation, 
  ChevronRight, Calendar, User, Phone
} from 'lucide-react';
import Link from 'next/link';

function TrackingContent() {
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const bookings = [
    {
      id: "UPVAN-2569-0128",
      destination: "ศูนย์การเรียนรู้ จ.เชียงราย",
      date: "20 ก.ค. 2569",
      time: "08:00 - 17:00",
      status: "approved",
      statusText: "อนุมัติแล้ว",
      van: "นข 1234 พะเยา",
      driver: "นายสมชาย ใจดี",
      driverPhone: "081-234-5678",
      passengers: 10
    },
    {
      id: "UPVAN-2569-0130",
      destination: "กทม. (กระทรวงศึกษาธิการ)",
      date: "25 ก.ค. 2569",
      time: "05:00 - 22:00",
      status: "pending",
      statusText: "รออนุมัติ",
      van: null,
      driver: null,
      driverPhone: null,
      passengers: 4
    }
  ];

  const filteredBookings = bookings.filter(b => 
    (activeTab === "all" || b.status === activeTab) &&
    (b.destination.includes(searchQuery) || b.id.includes(searchQuery))
  );

  return (
      <div className="max-w-5xl mx-auto pb-20 pt-6">
        
        {/* Header Section */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efeaff] text-[#311171] text-xs font-bold mb-4">
            <Search size={14} /> ระบบติดตาม
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">ติดตามสถานะคำขอ</h1>
              <p className="text-gray-500">ตรวจสอบสถานะการจองรถตู้ของคุณแบบเรียลไทม์</p>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <input 
                type="text" 
                placeholder="ค้นหาด้วยรหัสคำขอ หรือสถานที่..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
          {[
            { id: "all", label: "ทั้งหมด", icon: FileText },
            { id: "pending", label: "รออนุมัติ", icon: Clock },
            { id: "approved", label: "อนุมัติแล้ว", icon: CheckCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "all" | "pending" | "approved")}
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

        {/* Bookings List */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              
              {/* Card Header (Status & ID) */}
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    booking.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status === 'approved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {booking.statusText}
                  </div>
                  <span className="text-xs font-bold text-gray-400">{booking.id}</span>
                </div>
                <Link href="#" className="text-[#311171] text-sm font-bold flex items-center gap-1 hover:underline">
                  ดูเอกสาร <ChevronRight size={16} />
                </Link>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left: Trip Details */}
                  <div className="lg:col-span-7 space-y-5">
                    <h2 className="text-2xl font-black text-gray-900">{booking.destination}</h2>
                    
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#311171] shrink-0">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-0.5">วันเดินทาง</p>
                          <p className="text-sm font-bold text-gray-900">{booking.date}</p>
                          <p className="text-xs text-gray-500">{booking.time}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#311171] shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-0.5">ผู้โดยสาร</p>
                          <p className="text-sm font-bold text-gray-900">{booking.passengers} คน</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Driver/Van Info (If Approved) */}
                  <div className="lg:col-span-5 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100 hidden lg:block"></div>
                    <div className="lg:pl-8 h-full flex flex-col justify-center">
                      {booking.status === 'approved' ? (
                        <div className="bg-[#f8f6fc] rounded-2xl p-5 border border-[#311171]/10">
                          <p className="text-xs font-bold text-[#311171] mb-3 uppercase tracking-wider">ข้อมูลรถที่จัดสรร</p>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#311171]">
                              <Navigation size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900">{booking.van}</p>
                              <p className="text-xs text-gray-500">พร้อมใช้งาน</p>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-[#311171]/10">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-gray-500 mb-0.5">พนักงานขับรถ</p>
                                <p className="text-sm font-bold text-gray-900">{booking.driver}</p>
                              </div>
                              <a href={`tel:${booking.driverPhone}`} className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors" title="โทรหาคนขับ">
                                <Phone size={16} />
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                          <Clock size={32} className="text-gray-300 mb-3" />
                          <p className="text-sm font-bold text-gray-500">กำลังรอการจัดสรรรถตู้</p>
                          <p className="text-xs text-gray-400 mt-1">เจ้าหน้าที่จะดำเนินการในเร็วๆ นี้</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
              
              {/* Progress Bar (Visual only) */}
              <div className="h-1.5 w-full bg-gray-100">
                <div 
                  className={`h-full transition-all duration-1000 ${booking.status === 'approved' ? 'bg-green-500 w-full' : 'bg-[#311171] w-1/3'}`}
                ></div>
              </div>
            </div>
          ))}

          {filteredBookings.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">ไม่พบข้อมูลคำขอ</h3>
              <p className="text-gray-500 text-sm">ไม่พบคำขอในสถานะหรือเงื่อนไขที่คุณเลือก</p>
            </div>
          )}
        </div>

      </div>
  );
}

export default function TrackingPage() {
  return (
    <AppShell>
      <TrackingContent />
    </AppShell>
  );
}
