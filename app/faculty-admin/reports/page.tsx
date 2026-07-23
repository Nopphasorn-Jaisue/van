"use client";
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { CalendarDays, MapPin, Clock, Download, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Users, Car, Fuel, AlertCircle, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

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

type TripType = {
  label: string;
  val: string;
  col: string;
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
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [driverSummary, setDriverSummary] = useState<DriverSummary[]>([]);
  const [vehicleCompliance, setVehicleCompliance] = useState<VehicleCompliance[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
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
          if (data.tripTypes) setTripTypes(data.tripTypes);
          if (data.expenseBreakdown) setExpenseBreakdown(data.expenseBreakdown);
          if (data.totalExpense !== undefined) setTotalExpense(data.totalExpense);
          if (data.driverSummary) setDriverSummary(data.driverSummary);
          if (data.vehicleCompliance) setVehicleCompliance(data.vehicleCompliance);
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
            
            <div className="flex items-center gap-2 ml-auto md:ml-2">
              <button className="flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
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
          
          {/* Row 1: 3 Balanced Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. สัดส่วนประเภทการเดินทาง */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-800 mb-4">สัดส่วนประเภทการเดินทาง</h3>
              <div className="flex flex-col items-center justify-center gap-4 my-auto">
                <div className="relative w-32 h-32 shrink-0 mx-auto">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="20" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="20" strokeDasharray="113.1 138.1" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray="62.8 188.4" strokeDashoffset="-113.1" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0ea5e9" strokeWidth="20" strokeDasharray="50.2 201" strokeDashoffset="-175.9" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="20" strokeDasharray="25.1 226.1" strokeDashoffset="-226.1" />
                  </svg>
                  <div className="absolute inset-0 rounded-full bg-white scale-[0.65] shadow-inner"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full pt-2">
                  {tripTypes.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-full ${item.col}`}></div><span className="text-slate-600 font-medium text-[11px]">{item.label}</span></div>
                      <span className="font-bold text-slate-800 text-[11px]">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. ค่าใช้จ่ายแยกตามประเภท */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-800 mb-4">ค่าใช้จ่ายแยกตามประเภท</h3>
              <div className="space-y-4 my-auto">
                {expenseBreakdown.map((exp, i) => {
                  const Icon = exp.icon === 'Fuel' ? Fuel : (exp.icon === 'MapPin' ? MapPin : AlertCircle);
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 ${exp.bgClass} rounded-lg ${exp.textClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-slate-700">{exp.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{exp.amount.toLocaleString()} ฿</span>
                          <span className="text-slate-400 font-medium text-[11px]">{exp.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${exp.colorClass} rounded-full`} style={{ width: `${exp.percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-4">
                <span className="text-xs font-bold text-slate-700">รวมค่าใช้จ่าย</span>
                <span className="text-lg font-black text-slate-900">{totalExpense.toLocaleString()} <span className="text-xs font-bold text-slate-500">บาท</span></span>
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
              <div className="p-5 flex items-center gap-4 my-auto">
                <div className="w-20 h-16 bg-white/10 rounded-xl flex items-center justify-center p-2 shrink-0">
                  <Car className="w-8 h-8 text-white/50" />
                </div>
                <div>
                  <h3 className="text-base font-black mb-2">นข 1234 <span className="text-xs font-medium text-indigo-200">พะเยา</span></h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    <div className="flex items-center gap-1.5 text-indigo-200"><MapPin className="w-3 h-3" /> ระยะทาง</div>
                    <div className="flex items-center gap-1.5 text-indigo-200"><Users className="w-3 h-3" /> คนขับ</div>
                    <div className="font-bold text-xs">1,250 กม.</div>
                    <div className="font-bold text-xs">สมชาย ใจดี</div>
                  </div>
                </div>
              </div>
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
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-indigo-600" />
                      <span className="font-black text-sm text-slate-900">{v.plate}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">เช็คระยะถัดไป: <span className="text-slate-800">{v.nextCheck}</span></span>
                  </div>
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
