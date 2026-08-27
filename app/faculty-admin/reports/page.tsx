"use client";
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  CalendarDays, MapPin, Clock, ArrowUpRight, ArrowDownRight, 
  Users, Car, ShieldCheck, CheckCircle2, ArrowRight, 
  FileText, CheckCircle, XCircle, Ban, ArrowLeftRight, Building2
} from 'lucide-react';

type RecentTrip = {
  id: string;
  date: string;
  requester: string;
  destination: string;
  driver: string;
  distance: string;
  cost: string;
  status: string;
};

type DriverSummary = {
  name: string;
  role: string;
  tripsCount: number;
  status: string;
  initials: string;
};

type FacultyVan = {
  id: string;
  vanName: string;
  plate: string;
  driverName?: string;
  status: string;
};

export default function Page() {
  const [bookingStatusSummary, setBookingStatusSummary] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    pending: 0
  });

  const [topBorrowingFaculties, setTopBorrowingFaculties] = useState<{ facultyName: string, count: number }[]>([]);
  const [topLentFaculties, setTopLentFaculties] = useState<{ facultyName: string, count: number }[]>([]);
  const [topProvinces, setTopProvinces] = useState<{ name: string, count: number }[]>([]);

  const [kpis, setKpis] = useState([
    { title: "การจองทั้งหมด", value: "-", unit: "ครั้ง", trend: "0%", trendUp: true, icon: CalendarDays, color: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-slate-900" },
    { title: "ระยะทางรวม", value: "-", unit: "กม.", trend: "0%", trendUp: true, icon: MapPin, color: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-slate-900" },
    { title: "ชั่วโมงใช้งานรถ", value: "-", unit: "ชม.", trend: "0%", trendUp: true, icon: Clock, color: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-slate-900" },
  ]);

  const [topDestinations, setTopDestinations] = useState<{name: string, count: number, percentage: number}[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [driverSummary, setDriverSummary] = useState<DriverSummary[]>([]);
  const [facultyVans, setFacultyVans] = useState<FacultyVan[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [res, vanRes] = await Promise.all([
          fetch('/api/reports'),
          fetch('/api/vans')
        ]);
        const data = await res.json();
        const vanData = await vanRes.json();
        if (data.success) {
          setKpis([
            { title: data.kpis[0].title, value: data.kpis[0].value, unit: data.kpis[0].unit, trend: data.kpis[0].trend, trendUp: data.kpis[0].status === 'positive', icon: CalendarDays, color: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-slate-900" },
            { title: data.kpis[1].title, value: data.kpis[1].value, unit: data.kpis[1].unit, trend: data.kpis[1].trend, trendUp: data.kpis[1].status === 'positive', icon: MapPin, color: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-slate-900" },
            { title: data.kpis[2].title, value: data.kpis[2].value, unit: data.kpis[2].unit, trend: data.kpis[2].trend, trendUp: data.kpis[2].status === 'positive', icon: Clock, color: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-slate-900" },
          ]);

          if (data.bookingStatusSummary) setBookingStatusSummary(data.bookingStatusSummary);
          if (data.topBorrowingFaculties) setTopBorrowingFaculties(data.topBorrowingFaculties);
          if (data.topLentFaculties) setTopLentFaculties(data.topLentFaculties);
          if (data.topProvinces) setTopProvinces(data.topProvinces);
          if (data.topDestinations) setTopDestinations(data.topDestinations);
          if (data.driverSummary) setDriverSummary(data.driverSummary);
          if (data.recentTrips) setRecentTrips(data.recentTrips);
        }
        if (vanData.vans) {
          setFacultyVans(vanData.vans);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  return (
    <AppShell>
      <div className="h-full flex flex-col space-y-4 pb-12 animate-in fade-in">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">รายงานและสถิติการใช้งานรถตู้</h1>
            <p className="text-xs text-slate-500 mt-0.5">ภาพรวมการใช้งานรถตู้ประจำคณะ สถิติสำคัญ และประวัติการเดินทาง</p>
          </div>
        </div>

        {/* 1. สรุปคำสั่งจองทั้งหมด 4 สถานะ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">ยื่นคำขอทั้งหมด</span>
              <div className="p-1.5 bg-purple-50 text-[#311171] rounded-lg"><FileText size={16} /></div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{bookingStatusSummary.total}</span>
              <span className="text-xs text-slate-400 font-bold">รายการ</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold">อนุมัติแล้ว</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={16} /></div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">{bookingStatusSummary.approved}</span>
              <span className="text-xs text-emerald-600/70 font-bold">รายการ</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-red-500 mb-2">
              <span className="text-xs font-bold">ปฏิเสธคำขอ</span>
              <div className="p-1.5 bg-red-50 text-red-500 rounded-lg"><XCircle size={16} /></div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-red-600">{bookingStatusSummary.rejected}</span>
              <span className="text-xs text-red-500/70 font-bold">รายการ</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-xs font-bold">ยกเลิก / รอดำเนินการ</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Ban size={16} /></div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-600">{bookingStatusSummary.cancelled + bookingStatusSummary.pending}</span>
              <span className="text-xs text-amber-600/70 font-bold">รายการ</span>
            </div>
          </div>
        </div>

        {/* 2. สถิติข้ามคณะและจังหวัดยอดนิยม */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* คณะที่มายืมรถเราบ่อยสุด */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">คณะที่มายืมรถเราบ่อยสุด</h3>
            </div>
            <div className="space-y-2.5 my-auto">
              {topBorrowingFaculties.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-700 text-xs truncate">{item.facultyName}</span>
                  </div>
                  <span className="text-indigo-600 font-black text-xs bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                    {item.count} เที่ยว
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* จังหวัดปลายทางยอดนิยม */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">เดินทางไปจังหวัดไหนบ่อยสุด</h3>
            </div>
            <div className="space-y-2.5 my-auto">
              {topProvinces.map((prov, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-700 text-xs truncate">จ.{prov.name}</span>
                  </div>
                  <span className="text-emerald-600 font-black text-xs bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                    {prov.count} ครั้ง
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* เรายืมรถคณะไหนบ่อยสุด */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-800">เรายืมรถคณะไหนบ่อยสุด</h3>
            </div>
            <div className="space-y-2.5 my-auto">
              {topLentFaculties.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-700 text-xs truncate">{item.facultyName}</span>
                  </div>
                  <span className="text-purple-600 font-black text-xs bg-purple-50 px-2 py-0.5 rounded-md shrink-0">
                    {item.count} เที่ยว
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 3. Driver Summary & Fleet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">สรุปการปฏิบัติงานพนักงานขับรถ</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold rounded-tl-lg">ชื่อคนขับ</th>
                  <th className="py-2.5 px-3 font-semibold">บทบาท</th>
                  <th className="py-2.5 px-3 font-semibold text-center">จำนวนเที่ยว</th>
                  <th className="py-2.5 px-3 font-semibold text-center rounded-tr-lg">สถานะปัจจุบัน</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50">
                {driverSummary.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                      {d.initials ? (
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold shrink-0">{d.initials}</div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold shrink-0"><Users className="w-4 h-4"/></div>
                      )}
                      {d.name}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">{d.role}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{d.tripsCount} เที่ยว</td>
                    <td className="py-3 px-3 text-center">
                      {d.status === 'กำลังปฏิบัติงาน' ? (
                         <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">{d.status}</span>
                      ) : (
                         <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px]">{d.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
