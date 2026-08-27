"use client";
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  CalendarDays, MapPin, Clock, ArrowUpRight,
  Users, FileText, CheckCircle, XCircle, Ban, ArrowLeftRight, Building2,
  Navigation
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
  const [popularDays, setPopularDays] = useState<{ date: string, count: number }[]>([]);

  const [kpis, setKpis] = useState([
    { title: "การจองทั้งหมด", value: "0", unit: "ครั้ง", trend: "+100%", trendUp: true, icon: CalendarDays, color: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-slate-900" },
    { title: "ระยะทางรวมจริง", value: "0", unit: "กม.", trend: "+100%", trendUp: true, icon: MapPin, color: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-slate-900" },
    { title: "ชั่วโมงใช้งานรถ", value: "0", unit: "ชม.", trend: "+100%", trendUp: true, icon: Clock, color: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-slate-900" },
  ]);

  const [topDestinations, setTopDestinations] = useState<{name: string, count: number, percentage: number}[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [driverSummary, setDriverSummary] = useState<DriverSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/reports', { cache: 'no-store' });
        const data = await res.json();
        
        if (data.success) {
          if (data.kpis && data.kpis.length >= 3) {
            setKpis([
              { title: data.kpis[0].title, value: data.kpis[0].value, unit: data.kpis[0].unit, trend: data.kpis[0].trend, trendUp: true, icon: CalendarDays, color: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-slate-900" },
              { title: data.kpis[1].title, value: data.kpis[1].value, unit: data.kpis[1].unit, trend: data.kpis[1].trend, trendUp: true, icon: MapPin, color: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-slate-900" },
              { title: data.kpis[2].title, value: data.kpis[2].value, unit: data.kpis[2].unit, trend: data.kpis[2].trend, trendUp: true, icon: Clock, color: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-slate-900" },
            ]);
          }

          if (data.bookingStatusSummary) setBookingStatusSummary(data.bookingStatusSummary);
          if (data.topBorrowingFaculties) setTopBorrowingFaculties(data.topBorrowingFaculties);
          if (data.topLentFaculties) setTopLentFaculties(data.topLentFaculties);
          if (data.topProvinces) setTopProvinces(data.topProvinces);
          if (data.popularDays) setPopularDays(data.popularDays);
          if (data.topDestinations) setTopDestinations(data.topDestinations);
          if (data.driverSummary) setDriverSummary(data.driverSummary);
          if (data.recentTrips) setRecentTrips(data.recentTrips);
        }
      } catch (err) {
        console.error("Error loading real reports data:", err);
      } finally {
        setIsLoading(false);
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">รายงานและสถิติการใช้งานรถตู้ (ข้อมูลจริง)</h1>
            <p className="text-xs text-slate-500 mt-0.5">ภาพรวมการใช้งานรถตู้ประจำคณะ สถิติสำคัญ และประวัติการเดินทางจริงจากฐานข้อมูล</p>
          </div>
          {isLoading && (
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 self-start md:self-auto animate-pulse">
              <span>กำลังดึงข้อมูลล่าสุดจากระบบ...</span>
            </div>
          )}
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
              <span className="text-xs font-bold">รอดำเนินการ</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Ban size={16} /></div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-600">{bookingStatusSummary.pending}</span>
              <span className="text-xs text-amber-600/70 font-bold">รายการ</span>
            </div>
          </div>
        </div>

        {/* 2. Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={'p-3 rounded-xl ' + kpi.color}>
                  <kpi.icon className={'w-6 h-6 ' + kpi.iconColor} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">{kpi.title}</p>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className={'text-xl font-black ' + kpi.valueColor + ' leading-none'}>{kpi.value}</h3>
                    <span className="text-xs font-bold text-slate-400">{kpi.unit}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                {kpi.trend}
              </div>
            </div>
          ))}
        </div>

        {/* 3. สถิติข้ามคณะและจังหวัดยอดนิยม (Real Data) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* คณะที่มายืมรถเราบ่อยสุด */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">คณะที่มายืมรถเราบ่อยสุด</h3>
            </div>
            <div className="space-y-2.5 my-auto">
              {topBorrowingFaculties.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  ยังไม่มีคำขอยืมรถจากคณะอื่น
                </div>
              ) : (
                topBorrowingFaculties.map((item, idx) => (
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
                ))
              )}
            </div>
          </div>

          {/* จังหวัดปลายทางยอดนิยม */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">เดินทางไปจังหวัดไหนบ่อยสุด</h3>
            </div>
            <div className="space-y-2.5 my-auto">
              {topProvinces.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  ยังไม่มีข้อมูลการเดินทาง
                </div>
              ) : (
                topProvinces.map((prov, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-700 text-xs truncate">{prov.name}</span>
                    </div>
                    <span className="text-emerald-600 font-black text-xs bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                      {prov.count} ครั้ง
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* เรายืมรถคณะไหนบ่อยสุด */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-800">เรายืมรถคณะไหนบ่อยสุด</h3>
            </div>
            <div className="space-y-2.5 my-auto">
              {topLentFaculties.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  ยังไม่มีประวัติการยืมรถจากคณะอื่น
                </div>
              ) : (
                topLentFaculties.map((item, idx) => (
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
                ))
              )}
            </div>
          </div>

        </div>

        {/* 4. วันที่คนนิยมเดินทาง & ปลายทางยอดนิยม (Real Data from DB) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">วันที่คนนิยมเดินทาง (สถิติจริง)</h3>
            </div>
            <div className="space-y-3 my-auto">
              {popularDays.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  ยังไม่มีข้อมูลวันเดินทาง
                </div>
              ) : (
                popularDays.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span className="font-bold text-slate-700 text-xs">{item.date}</span>
                    <span className="text-indigo-600 font-black text-xs bg-indigo-50 px-2.5 py-1 rounded-md">{item.count} เที่ยว</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Navigation className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">สถานที่ปลายทางยอดนิยม (สถิติจริง)</h3>
            </div>
            <div className="space-y-3.5 my-auto">
              {topDestinations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  ยังไม่มีข้อมูลสถานที่ปลายทาง
                </div>
              ) : (
                topDestinations.map((dest, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-xs font-bold text-slate-700 truncate mr-2">{i + 1}. {dest.name}</span>
                      <span className="text-[11px] font-bold text-indigo-600 shrink-0">{dest.count} ครั้ง</span>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: dest.percentage + '%' }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* 5. Driver Summary & Fleet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">สรุปการปฏิบัติงานพนักงานขับรถจริง</h3>
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
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">{d.status}</span>
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
