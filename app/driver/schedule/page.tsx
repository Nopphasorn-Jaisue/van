"use client";
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { Calendar as CalendarIcon, MapPin, Clock, Users, ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react';
import Link from 'next/link';

export default function DriverSchedule() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<number>(20);

  const upcomingTrips = [
    {
      id: "UPVAN-2569-0123",
      date: "พรุ่งนี้, 20 ก.ค. 2569",
      destination: "ศูนย์การเรียนรู้ จ.เชียงราย",
      time: "08:00 - 17:00",
      passengers: 10,
    },
    {
      id: "UPVAN-2569-0128",
      date: "พุธ, 22 ก.ค. 2569",
      destination: "กทม. (กระทรวงศึกษาธิการ)",
      time: "05:00 - 22:00",
      passengers: 4,
    }
  ];

  const pastTrips = [
    {
      id: "UPVAN-2569-0110",
      date: "ศุกร์, 17 ก.ค. 2569",
      destination: "อ.เมือง จ.น่าน",
      time: "07:00 - 18:00",
      passengers: 8,
    }
  ];

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
      <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-gray-900">ตารางงานของฉัน</h1>
            <p className="text-gray-500 text-sm mt-1">ตรวจสอบภารกิจการเดินทางล่วงหน้า</p>
          </div>
          <button 
            onClick={() => setCalendarMode(calendarMode === "week" ? "month" : "week")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-[#311171] rounded-full text-xs font-bold hover:bg-purple-100 transition-colors"
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
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab("upcoming")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "upcoming" ? "bg-white text-[#311171] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            งานที่กำลังจะมาถึง
          </button>
          <button 
            onClick={() => setActiveTab("past")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "past" ? "bg-white text-[#311171] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ประวัติการทำงาน
          </button>
        </div>

        {/* Trips List */}
        <div className="space-y-4">
          {displayTrips.map(trip => (
            <div key={trip.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1">
              <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2 text-purple-700">
                  <CalendarIcon size={18} />
                  <span className="font-bold text-sm">{trip.date}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">{trip.id}</span>
              </div>
              
              <h3 className="text-lg font-black text-gray-900 mb-2">{trip.destination}</h3>
              
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-gray-400" /> {trip.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" /> จำนวนผู้โดยสาร: {trip.passengers} คน
                </div>
              </div>

              <button className="w-full py-2.5 bg-gray-50 hover:bg-[#311171]/5 text-[#311171] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                ดูรายละเอียดใบจองรถ <ChevronRight size={16} />
              </button>
            </div>
          ))}
          
          {displayTrips.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">ไม่มีข้อมูลภารกิจในวันดังกล่าว</p>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
