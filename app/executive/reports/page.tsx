"use client";

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { getExecutiveReportData } from '@/app/actions/executive';
import { 
  BarChart3, CalendarDays, CheckCircle2, Route, Gauge, Users, 
  ChevronLeft, ChevronRight, Printer, Navigation, MapPin, 
  Map, Activity, LayoutList
} from 'lucide-react';

interface ReportData {
  kpis: {
    totalTrips: number;
    totalDistance: number;
    avgDistance: number | string;
    uniqueRequesters: number;
    totalPassengers: number;
  };
  longestTrip: { id: string, destination: string, distance: number, date: string } | null;
  shortestTrip: { id: string, destination: string, distance: number, date: string } | null;
  distanceBreakdown: { short: number, medium: number, long: number };
  topTraveler: { name: string, count: number };
  topDestination: { name: string, count: number };
  tableRows: {
    id: string;
    date: string;
    requesterName: string;
    destination: string;
    objective: string;
    driverName: string;
    distance: number;
  }[];
}

export default function ExecutiveReportsPage() {
  const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [facultyName, setFacultyName] = useState("กำลังโหลดข้อมูล...");
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSelectedMonth(thaiMonths[new Date().getMonth()]);
    setSelectedYear((new Date().getFullYear() + 543).toString());
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!selectedMonth || !selectedYear) return;
      setIsLoading(true);
      try {
        const res = await getExecutiveReportData(selectedMonth, selectedYear);
        if (res.success && res.data) {
          setData(res.data);
          if (res.facultyName) setFacultyName(res.facultyName);
        } else {
          console.error("Failed to load report", res.error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedMonth, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  const handlePrevMonth = () => {
    let mIdx = thaiMonths.indexOf(selectedMonth);
    let y = parseInt(selectedYear);
    if (mIdx === 0) {
      mIdx = 11;
      y -= 1;
    } else {
      mIdx -= 1;
    }
    setSelectedMonth(thaiMonths[mIdx]);
    setSelectedYear(y.toString());
  };

  const handleNextMonth = () => {
    let mIdx = thaiMonths.indexOf(selectedMonth);
    let y = parseInt(selectedYear);
    if (mIdx === 11) {
      mIdx = 0;
      y += 1;
    } else {
      mIdx += 1;
    }
    setSelectedMonth(thaiMonths[mIdx]);
    setSelectedYear(y.toString());
  };

  if (!data && !isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">ไม่พบข้อมูล</div>
      </AppShell>
    );
  }

  // Calculate percentages for Distance Breakdown
  const totalBreakdown = (data?.distanceBreakdown.short || 0) + (data?.distanceBreakdown.medium || 0) + (data?.distanceBreakdown.long || 0);
  const getPct = (val: number) => totalBreakdown === 0 ? 0 : Math.round((val / totalBreakdown) * 100);

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-12 print:max-w-none print:m-0 print:p-0">
        
        {/* Header Gradient Card */}
        <div className="bg-gradient-to-br from-[#2a0c63] via-[#4c1d95] to-[#2e1065] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden print:bg-white print:text-black print:shadow-none print:p-4">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
             <BarChart3 size={300} className="-mt-12 -mr-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              
              <div className="space-y-3 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-purple-100 backdrop-blur-sm border border-white/10 print:bg-gray-100 print:text-gray-800">
                  <Activity size={14} />
                  รายงานเชิงบริหาร (Executive Analytics) | {facultyName}
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">รายงานการใช้รถตู้ประจำเดือน</h1>
                <p className="text-purple-200 text-sm md:text-base leading-relaxed print:text-gray-600">
                  สรุปพฤติกรรมการเดินทางของผู้ขอใช้รถ จุดหมายปลายทางยอดนิยม และการวิเคราะห์ระยะทางเพื่อการตัดสินใจเชิงนโยบาย
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto print:hidden">
                <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2 font-bold min-w-[120px] justify-center">
                    <CalendarDays size={18} />
                    <span>{selectedMonth} {selectedYear}</span>
                  </div>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <button 
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-black py-3 px-6 rounded-2xl transition-colors shadow-lg"
                >
                  <Printer size={18} />
                  พิมพ์รายงาน
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay or Content */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#311171]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow print:border-gray-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-bold text-gray-500">การเดินทางที่อนุมัติ</span>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900">{data?.kpis.totalTrips || 0}</span>
                    <span className="text-sm font-bold text-gray-400">เที่ยว</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">จากคำขอทั้งหมด {data?.kpis.totalTrips || 0} รายการ (100%)</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow print:border-gray-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-bold text-gray-500">ระยะทางรวมทั้งหมด</span>
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Route size={20} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900">{data?.kpis.totalDistance.toLocaleString() || 0}</span>
                    <span className="text-sm font-bold text-gray-400">กิโลเมตร</span>
                  </div>
                  <p className="text-xs font-bold text-purple-600 mt-2 flex items-center gap-1">
                    ในเดือน {selectedMonth}
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow print:border-gray-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-bold text-gray-500">ระยะทางเฉลี่ยต่อทริป</span>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Gauge size={20} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900">{data?.kpis.avgDistance || 0}</span>
                    <span className="text-sm font-bold text-gray-400">กม./เที่ยว</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">เฉลี่ยความยาวต่อรอบภารกิจ</p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow print:border-gray-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-bold text-gray-500">บุคลากรที่ขอใช้รถ</span>
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900">{data?.kpis.uniqueRequesters || 0}</span>
                    <span className="text-sm font-bold text-gray-400">คน</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">รวมผู้โดยสาร {data?.kpis.totalPassengers || 0} คน-ครั้ง</p>
                </div>
              </div>
            </div>

            {/* Longest vs Shortest Trips */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Gauge className="text-indigo-600" size={20} />
                สถิติระยะทาง: ทริปที่เดินทางไกลที่สุด vs ใกล้ที่สุด
              </h2>
              <p className="text-sm text-gray-500">เปรียบเทียบภารกิจที่ใช้ระยะทางยาวนานที่สุดและใกล้ที่สุดของคณะในรอบเดือน</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Longest Trip Card */}
                <div className="bg-gradient-to-br from-[#2a0c63] to-[#4c1d95] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden print:bg-white print:text-black print:border print:border-gray-300">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                    <Navigation size={180} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-8">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded-full text-xs font-bold print:text-gray-800 print:bg-gray-100">
                        <Activity size={14} />
                        เดินทางไกลที่สุด (Longest Trip)
                      </div>
                      {data?.longestTrip && (
                        <div className="text-right">
                          <span className="text-3xl font-black">{data.longestTrip.distance.toLocaleString()}</span>
                          <span className="text-sm text-purple-200 ml-1">กม.</span>
                        </div>
                      )}
                    </div>
                    {data?.longestTrip ? (
                      <div>
                        <h3 className="text-xl font-bold mb-1">{data.longestTrip.destination}</h3>
                        <p className="text-purple-200 text-sm">
                          วันที่: {new Date(data.longestTrip.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24">
                        <span className="text-purple-300 font-bold">ไม่มีข้อมูลการเดินทางในเดือนนี้</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shortest Trip Card */}
                <div className="bg-gradient-to-br from-[#064e3b] to-[#047857] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden print:bg-white print:text-black print:border print:border-gray-300">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                    <MapPin size={180} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-8">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-400/20 text-emerald-300 rounded-full text-xs font-bold print:text-gray-800 print:bg-gray-100">
                        <MapPin size={14} />
                        เดินทางใกล้ที่สุด (Shortest Trip)
                      </div>
                      {data?.shortestTrip && (
                        <div className="text-right">
                          <span className="text-3xl font-black">{data.shortestTrip.distance.toLocaleString()}</span>
                          <span className="text-sm text-emerald-200 ml-1">กม.</span>
                        </div>
                      )}
                    </div>
                    {data?.shortestTrip ? (
                      <div>
                        <h3 className="text-xl font-bold mb-1">{data.shortestTrip.destination}</h3>
                        <p className="text-emerald-200 text-sm">
                          วันที่: {new Date(data.shortestTrip.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24">
                        <span className="text-emerald-300 font-bold">ไม่มีข้อมูลการเดินทางในเดือนนี้</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Distance Range Breakdown */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 print:border-gray-300">
              <h3 className="text-sm font-bold text-indigo-600 mb-6 flex items-center gap-2">
                <Route size={18} />
                การกระจายตัวของระยะทางภารกิจ (Distance Range Breakdown)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Short */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-700">ระยะใกล้ ({"<"} 50 กม.)</span>
                    <span className="text-indigo-600">{data?.distanceBreakdown.short || 0} ทริป ({getPct(data?.distanceBreakdown.short || 0)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${getPct(data?.distanceBreakdown.short || 0)}%` }}></div>
                  </div>
                </div>

                {/* Medium */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-700">ระยะปานกลาง (50 - 200 กม.)</span>
                    <span className="text-amber-500">{data?.distanceBreakdown.medium || 0} ทริป ({getPct(data?.distanceBreakdown.medium || 0)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${getPct(data?.distanceBreakdown.medium || 0)}%` }}></div>
                  </div>
                </div>

                {/* Long */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-700">ระยะไกล ({">"} 200 กม.)</span>
                    <span className="text-rose-500">{data?.distanceBreakdown.long || 0} ทริป ({getPct(data?.distanceBreakdown.long || 0)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${getPct(data?.distanceBreakdown.long || 0)}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Top Traveler */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center min-h-[200px] print:border-gray-300">
                <div className="flex justify-between items-center w-full mb-6">
                  <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-2">
                    <Users size={18} />
                    ใครในคณะเดินทางบ่อยสุด
                  </h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">Top {data?.topTraveler.count || 0} ท่าน</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  {data?.topTraveler.count ? (
                    <>
                      <span className="text-2xl font-black text-gray-900">{data.topTraveler.name}</span>
                      <span className="text-sm text-gray-500 mt-2">จัดอันดับบุคลากร/อาจารย์ที่มีจำนวนการขอใช้รถสูงสุดในรอบเดือน</span>
                    </>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-2">
                      <Users size={32} />
                      <span className="font-medium text-sm">ยังไม่มีข้อมูลการเดินทางในเดือนนี้</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Destination */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center min-h-[200px] print:border-gray-300">
                <div className="flex justify-between items-center w-full mb-6">
                  <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-2">
                    <Map size={18} />
                    เดินทางไปไหนบ่อยสุด
                  </h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{data?.topDestination.count || 0} จุดหมาย</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  {data?.topDestination.count ? (
                    <>
                      <span className="text-2xl font-black text-gray-900">{data.topDestination.name}</span>
                      <span className="text-sm text-gray-500 mt-2">จุดหมายปลายทางยอดนิยมที่มีการใช้รถตู้เดินทางไปมากที่สุด</span>
                    </>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-2">
                      <MapPin size={32} />
                      <span className="font-medium text-sm">ยังไม่มีข้อมูลจุดหมายปลายทางในเดือนนี้</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden print:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <LayoutList size={18} className="text-[#311171]" />
                    บันทึกการเดินทางประจำเดือน {selectedMonth} {selectedYear}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">แสดงรายละเอียดคำขอทั้งหมดที่ได้รับการอนุมัติในรอบเดือนนี้ ({data?.tableRows.length || 0} รายการ)</p>
                </div>
              </div>

              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                      <th className="py-3 px-4">รหัสจอง</th>
                      <th className="py-3 px-4">วันที่เดินทาง</th>
                      <th className="py-3 px-4">ผู้ขอใช้รถ</th>
                      <th className="py-3 px-4">จุดหมายปลายทาง</th>
                      <th className="py-3 px-4 max-w-[200px]">วัตถุประสงค์</th>
                      <th className="py-3 px-4">คนขับ</th>
                      <th className="py-3 px-4 text-right">ระยะทาง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {data?.tableRows.map((row) => (
                      <tr key={row.id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-gray-400">{row.id}</td>
                        <td className="py-3 px-4 font-medium">{new Date(row.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-3 px-4 font-bold">{row.requesterName}</td>
                        <td className="py-3 px-4">{row.destination}</td>
                        <td className="py-3 px-4 max-w-[200px] truncate text-gray-500" title={row.objective}>{row.objective || '-'}</td>
                        <td className="py-3 px-4">{row.driverName}</td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-600">{row.distance.toLocaleString()} กม.</td>
                      </tr>
                    ))}
                    {data?.tableRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">ไม่มีข้อมูลการเดินทางในเดือนนี้</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
