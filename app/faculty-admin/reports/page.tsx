"use client";
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { CalendarDays, MapPin, Clock, ArrowUpRight, ArrowDownRight, Users, Car, Fuel, AlertCircle, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

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


type ExpenseBreakdown = {
  category: string;
  amount: number;
  percentage: number;
  icon: string;
  colorClass: string;
  textClass: string;
  bgClass: string;
};

type DriverSummary = {
  name: string;
  role: string;
  tripsCount: number;
  status: string;
  initials: string;
};

type VehicleCompliance = {
  plate: string;
  taxExp: string;
  taxStatus: string;
  insExp: string;
  insStatus: string;
  nextCheck: string;
};

type FacultyVan = {
  id: string;
  vanName: string;
  plate: string;
  driverName?: string;
  status: string;
};

export default function Page() {
  const [timeRange, setTimeRange] = useState('month');

  const [kpis, setKpis] = useState([
    { title: "การจองทั้งหมด", value: "-", unit: "ครั้ง", trend: "0%", trendUp: true, icon: CalendarDays, color: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-slate-900" },
    { title: "ระยะทางรวม", value: "-", unit: "กม.", trend: "0%", trendUp: true, icon: MapPin, color: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-slate-900" },
    { title: "ค่าเชื้อเพลิง", value: "-", unit: "บาท", trend: "0%", trendUp: false, icon: Fuel, color: "bg-orange-50", iconColor: "text-orange-600", valueColor: "text-slate-900" },
    { title: "ชั่วโมงใช้งานรถ", value: "-", unit: "ชม.", trend: "0%", trendUp: true, icon: Clock, color: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-slate-900" },
  ]);

  const [topDestinations, setTopDestinations] = useState<{name: string, count: number, percentage: number}[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [driverSummary, setDriverSummary] = useState<DriverSummary[]>([]);
  const [vehicleCompliance, setVehicleCompliance] = useState<VehicleCompliance[]>([]);
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
            { title: data.kpis[2].title, value: data.kpis[2].value, unit: data.kpis[2].unit, trend: data.kpis[2].trend, trendUp: data.kpis[2].status === 'positive', icon: Fuel, color: "bg-orange-50", iconColor: "text-orange-600", valueColor: "text-slate-900" },
            { title: data.kpis[3].title, value: data.kpis[3].value, unit: data.kpis[3].unit, trend: data.kpis[3].trend, trendUp: data.kpis[3].status === 'positive', icon: Clock, color: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-slate-900" },
          ]);

          if (data.recentTrips) {
            setRecentTrips(data.recentTrips.map((t: RecentTrip) => ({
              id: t.id,
              date: t.date,
              requester: t.requester, 
              destination: t.destination,
              driver: t.driver,
              distance: t.distance,
              cost: t.cost,
              status: t.status
            })));
          }
          if (data.topDestinations) setTopDestinations(data.topDestinations);
          if (data.expenseBreakdown) setExpenseBreakdown(data.expenseBreakdown);
          if (data.totalExpense !== undefined) setTotalExpense(data.totalExpense);
          if (data.driverSummary) setDriverSummary(data.driverSummary);
          if (data.vehicleCompliance) setVehicleCompliance(data.vehicleCompliance);
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
      <div className="bg-slate-50 h-[calc(100vh-76px)] overflow-hidden flex flex-col p-4 md:p-6 gap-4">
        
        {/* Fixed Header & Filters */}
        <div className="flex-none flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">รายงานและสถิติ</h1>
            <p className="text-sm text-slate-500 mt-0.5">ภาพรวมการใช้งานรถตู้ประจำคณะ สถิติสำคัญ และประวัติการเดินทาง</p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium pl-2">ช่วงวันที่:</span>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent text-slate-700 text-sm font-semibold py-1 pr-6 pl-1 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="month">เดือนนี้ (ก.ค. 67)</option>
                <option value="last_month">เดือนที่แล้ว (มิ.ย. 67)</option>
                <option value="year">ปีงบประมาณ 2567</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium pl-2">ประเภท:</span>
              <select className="bg-transparent text-slate-700 text-sm font-semibold py-1 pr-6 pl-1 focus:outline-none appearance-none cursor-pointer">
                <option>ทั้งหมด</option>
              </select>
            </div>
            

          </div>
        </div>

        {/* Fixed KPI Row */}
        <div className="flex-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${kpi.color}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{kpi.title}</p>
                  <div className="flex items-baseline gap-1.5">
                    <h3 className={`text-xl font-bold ${kpi.valueColor} leading-none`}>{kpi.value}</h3>
                    <span className="text-xs font-medium text-slate-500">{kpi.unit}</span>
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${kpi.trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'} px-2 py-1 rounded-full`}>
                {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Bottom Area with HIDDEN SCROLLBAR */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Row 1: 2 Balanced Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* 2. วันที่คนนิยมเดินทาง */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">วันที่คนนิยมเดินทาง</h3>
              </div>
              <div className="space-y-4 my-auto">
                {/* Mock data for travel dates */}
                {[
                  { date: "ทุกวันศุกร์", count: 12 },
                  { date: "ทุกวันจันทร์", count: 9 },
                  { date: "ช่วงสิ้นเดือน", count: 7 },
                  { date: "วันหยุดนักขัตฤกษ์", count: 4 }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="font-semibold text-slate-700 text-xs">{item.date}</span>
                    <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-2 py-1 rounded-md">{item.count} เที่ยว</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. ปลายทางยอดนิยม */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">ปลายทางยอดนิยม</h3>
              </div>
              <div className="space-y-3.5 my-auto">
                {topDestinations.map((dest, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-xs font-bold text-slate-700 truncate mr-2">{i + 1}. {dest.name}</span>
                      <span className="text-[11px] font-bold text-indigo-600 shrink-0">{dest.count} ครั้ง</span>
                    </div>
                    <div className="w-full h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${dest.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 2: Driver Summary & Fleet Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* สรุปการปฏิบัติงานพนักงานขับรถ (Takes 2 columns) */}
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-800 mb-3">สรุปการปฏิบัติงานพนักงานขับรถ</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold rounded-tl-lg">ชื่อคนขับ</th>
                      <th className="py-2.5 px-3 font-semibold">บทบาท</th>
                      <th className="py-2.5 px-3 font-semibold text-center">จำนวนเที่ยว</th>
                      <th className="py-2.5 px-3 font-semibold text-center rounded-tr-lg">สถานะปัจจุบัน</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-50">
                    {driverSummary.map((d, i) => (
                      <tr key={i}>
                        <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                          {d.initials ? (
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold shrink-0">{d.initials}</div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold shrink-0"><Users className="w-4 h-4"/></div>
                          )}
                          {d.name}
                        </td>
                        <td className={`py-3 px-3 font-medium ${d.role === 'พนักงานประจำ' ? 'text-indigo-600' : 'text-slate-500'}`}>{d.role}</td>
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

            {/* รถตู้ประจำคณะ (Takes 1 column) */}
            <div className="bg-indigo-950 rounded-xl overflow-hidden shadow-sm text-white flex flex-col justify-between">
              <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-300" />
                <span className="text-xs font-semibold">รถตู้ประจำคณะ</span>
              </div>
              {facultyVans.length > 0 ? (
                <div className="p-5 flex items-center gap-4 my-auto overflow-x-auto snap-x scrollbar-hide">
                  {facultyVans.map(van => (
                    <div key={van.id} className="flex-shrink-0 flex items-center gap-4 snap-center w-full min-w-full">
                      <div className="w-20 h-16 bg-white/10 rounded-xl flex items-center justify-center p-2 shrink-0">
                        <Car className="w-8 h-8 text-white/50" />
                      </div>
                      <div>
                        <h3 className="text-base font-black mb-2">{van.vanName} <span className="text-xs font-medium text-indigo-200">{van.plate}</span></h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                          <div className="flex items-center gap-1.5 text-indigo-200"><Users className="w-3 h-3" /> คนขับ</div>
                          <div className="flex items-center gap-1.5 text-indigo-200"><MapPin className="w-3 h-3" /> สถานะ</div>
                          <div className="font-bold text-xs truncate max-w-[120px]" title={van.driverName}>{van.driverName || '-'}</div>
                          <div className="font-bold text-xs">{van.status === 'ready' ? 'พร้อมใช้งาน' : van.status === 'maintenance' ? 'ซ่อมบำรุง' : van.status}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 flex flex-col items-center justify-center gap-2 my-auto text-white/50 py-10">
                  <Car className="w-10 h-10 mb-1 opacity-30" />
                  <p className="text-sm font-medium">ยังไม่มีรถตู้ประจำคณะ</p>
                </div>
              )}
            </div>

          </div>

          {/* Row 3: Recent Trips Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">ประวัติการเดินทางล่าสุด (Recent Completed Trips)</h3>
                <p className="text-xs text-slate-500 mt-0.5">รายการใช้รถตู้ที่เดินทางเสร็จสิ้นแล้วในรอบเดือนนี้</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">รหัสอ้างอิง</th>
                    <th className="py-3 px-4 font-semibold">วันที่</th>
                    <th className="py-3 px-4 font-semibold">ผู้ขอ / หน่วยงาน</th>
                    <th className="py-3 px-4 font-semibold">ปลายทาง</th>
                    <th className="py-3 px-4 font-semibold">คนขับ</th>
                    <th className="py-3 px-4 font-semibold text-right">ระยะทาง</th>
                    <th className="py-3 px-4 font-semibold text-right">ค่าใช้จ่ายรวม</th>
                    <th className="py-3 px-4 font-semibold text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{trip.id}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{trip.date}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{trip.requester}</td>
                      <td className="py-3 px-4 text-slate-700">{trip.destination}</td>
                      <td className="py-3 px-4 text-slate-600">{trip.driver}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">{trip.distance}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{trip.cost}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 4: Vehicle Compliance & Tax/Insurance Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> สถานะความคุ้มครอง & สัญญาภาษี/ประกันภัย (Vehicle Compliance)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">ตรวจสอบวันหมดอายุภาษี พรบ. ประกันภัย และกำหนดการเข้าเช็คระยะ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicleCompliance.map((v, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">วันหมดอายุภาษี</p>
                        <p className="font-bold text-slate-800 mt-0.5">{v.taxExp}</p>
                      </div>
                      {v.taxStatus === 'OK' ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded">ปกติ</span>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded">ใกล้หมด</span>
                      )}
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">วันหมดอายุประกันภัย</p>
                        <p className="font-bold text-slate-800 mt-0.5">{v.insExp}</p>
                      </div>
                      {v.insStatus === 'OK' ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded">ปกติ</span>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded">ใกล้หมด</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
