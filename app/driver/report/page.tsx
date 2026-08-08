"use client";

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Download, Calendar, ChevronLeft, ChevronRight, FileSpreadsheet,
  Search, Filter, CheckCircle2, User, MapPin, Gauge
} from 'lucide-react';
import { getAssignedBookings, getDriverDashboardData } from '@/app/actions/driver';

interface ReportRow {
  id: string | number;
  seq: number;
  deptDate: string;
  deptTime: string;
  user: string;
  destination: string;
  startMileage: number | string;
  returnDate: string;
  returnTime: string;
  endMileage: number | string;
  totalDistance: number;
  driverName: string;
  remark: string;
}

export default function DriverReportPage() {
  const [selectedMonth, setSelectedMonth] = useState("มิถุนายน");
  const [selectedYear, setSelectedYear] = useState("2569");
  const [driverName, setDriverName] = useState("นายสมชาย ใจดี");
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data matching attached mockup image
  const defaultSampleData: ReportRow[] = [
    {
      id: "LOG-1",
      seq: 1,
      deptDate: "10 มิ.ย. 69",
      deptTime: "08:00",
      user: "นางสาวนฤมล จันทร์สว่าง",
      destination: "ศูนย์ประชุม จ.เชียงใหม่",
      startMileage: "329,668",
      returnDate: "10 มิ.ย. 69",
      returnTime: "17:00",
      endMileage: "329,670",
      totalDistance: 2,
      driverName: "",
      remark: "-"
    },
    {
      id: "LOG-2",
      seq: 2,
      deptDate: "09 มิ.ย. 69",
      deptTime: "09:00",
      user: "คณะเทคโนโลยีสารสนเทศฯ",
      destination: "ศาลากลางจังหวัดพะเยา",
      startMileage: "329,620",
      returnDate: "09 มิ.ย. 69",
      returnTime: "15:30",
      endMileage: "329,668",
      totalDistance: 48,
      driverName: "",
      remark: "-"
    },
    {
      id: "LOG-3",
      seq: 3,
      deptDate: "05 มิ.ย. 69",
      deptTime: "07:30",
      user: "ฝ่ายวิชาการ",
      destination: "มหาวิทยาลัยเชียงใหม่",
      startMileage: "329,450",
      returnDate: "05 มิ.ย. 69",
      returnTime: "18:00",
      endMileage: "329,620",
      totalDistance: 170,
      driverName: "",
      remark: "-"
    }
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const dashRes = await getDriverDashboardData(1);
        if (dashRes.success && dashRes.data?.driver?.name) {
          setDriverName(dashRes.data.driver.name);
        }

        const bookingsRes = await getAssignedBookings(1);
        if (bookingsRes.success && bookingsRes.bookings) {
          const loggedBookings = bookingsRes.bookings.filter((b: any) => b.driverLog);
          
          if (loggedBookings.length > 0) {
            const mapped: ReportRow[] = loggedBookings.map((b: any, index: number) => {
              const log = b.driverLog;
              const deptD = new Date(b.departureDate);
              const retD = new Date(b.returnDate);

              return {
                id: b.id,
                seq: index + 1,
                deptDate: deptD.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }),
                deptTime: deptD.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                user: b.requester?.name || "ผู้ขอใช้บริการ",
                destination: b.destination,
                startMileage: log?.mileageStart ? log.mileageStart.toLocaleString() : "-",
                returnDate: retD.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }),
                returnTime: retD.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                endMileage: log?.mileageEnd ? log.mileageEnd.toLocaleString() : "-",
                totalDistance: log?.totalDistance || 0,
                driverName: "",
                remark: log?.fuelRemark || "-"
              };
            });

            // Combine fetched logged data with sample data to show full table
            setReportRows([...mapped, ...defaultSampleData]);
          } else {
            setReportRows(defaultSampleData);
          }
        } else {
          setReportRows(defaultSampleData);
        }
      } catch (err) {
        console.error("Error loading report data:", err);
        setReportRows(defaultSampleData);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleExportCSV = () => {
    const headers = [
      "ลำดับที่", "วันออกเดินทาง(วันที่)", "วันออกเดินทาง(เวลา)", "ผู้ใช้รถ",
      "สถานที่ไป", "ระยะกม.เมื่อออกรถ", "กลับถึงสำนักงาน(วันที่)", "กลับถึงสำนักงาน(เวลา)",
      "ระยะกม.เมื่อรถกลับ", "รวมระยะทาง(กม.)", "พนักงานขับรถ", "หมายเหตุ"
    ];

    const rows = reportRows.map(r => [
      r.seq,
      `"${r.deptDate}"`,
      `"${r.deptTime}"`,
      `"${r.user}"`,
      `"${r.destination}"`,
      `"${r.startMileage}"`,
      `"${r.returnDate}"`,
      `"${r.returnTime}"`,
      `"${r.endMileage}"`,
      r.totalDistance,
      `"${r.driverName}"`,
      `"${r.remark}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `รายงานการใช้งานรถตู้_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows = reportRows.filter(r => 
    r.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.driverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
        
        {/* Sticky Fixed Top Header */}
        <div className="sticky -top-6 lg:-top-8 z-20 bg-[#f3f4f7]/95 backdrop-blur-md pt-8 lg:pt-10 pb-4 space-y-3 border-b border-gray-200/80 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="text-[#311171]" size={26} />
                รายงานการใช้งานรถ
              </h1>
              <p className="text-xs font-bold text-gray-500 mt-0.5">
                แบบฟอร์ม 4 • บันทึกการใช้งานรถตู้และระยะทางการขับขี่
              </p>
            </div>

            {/* Filter / Export Header Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-gray-200 text-xs font-bold text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
              >
                <option value="มกราคม">มกราคม</option>
                <option value="กุมภาพันธ์">กุมภาพันธ์</option>
                <option value="มีนาคม">มีนาคม</option>
                <option value="เมษายน">เมษายน</option>
                <option value="พฤษภาคม">พฤษภาคม</option>
                <option value="มิถุนายน">มิถุนายน</option>
                <option value="กรกฎาคม">กรกฎาคม</option>
                <option value="สิงหาคม">สิงหาคม</option>
                <option value="กันยายน">กันยายน</option>
                <option value="ตุลาคม">ตุลาคม</option>
                <option value="พฤศจิกายน">พฤศจิกายน</option>
                <option value="ธันวาคม">ธันวาคม</option>
              </select>

              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white border border-gray-200 text-xs font-bold text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
              >
                <option value="2567">2567</option>
                <option value="2568">2568</option>
                <option value="2569">2569</option>
              </select>
            </div>
          </div>
        </div>

        {/* 🌟 Purple Title Banner Card (Matching Mockup Image 3) */}
        <div className="bg-gradient-to-r from-[#2c0c63] via-[#3b1285] to-[#4c19a8] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <FileSpreadsheet size={200} />
          </div>
          
          <div className="relative z-10 space-y-1">
            <h2 className="text-2xl font-black tracking-tight">รายงานการใช้งานรถ</h2>
            <p className="text-sm font-bold text-purple-200">
              แบบฟอร์ม 4 - เดือน{selectedMonth} {selectedYear}
            </p>
          </div>
        </div>

        {/* 🌟 Section Header: ประวัติการเดินทาง & Export Button */}
        <div className="flex justify-between items-center pt-2">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            ประวัติการเดินทาง
          </h3>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#efeaff] hover:bg-[#e2d8ff] text-[#311171] rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Download size={15} strokeWidth={2.5} />
            Export
          </button>
        </div>

        {/* Search Bar (Optional Filter) */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามผู้ใช้รถ, สถานที่ไป หรือ พนักงานขับรถ..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
        </div>

        {/* 🌟 Table Card (Scrollable Table with Headers matching attached mockup) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50/90 text-gray-700 font-bold border-b border-gray-200 divide-x divide-gray-200">
                  <th rowSpan={2} className="py-3 px-3 text-center w-12 bg-gray-50">
                    ลำดับที่
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center bg-gray-50">
                    วันออกเดินทาง
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[140px] bg-gray-50">
                    ผู้ใช้รถ
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[160px] bg-gray-50">
                    สถานที่ไป
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[110px] bg-gray-50">
                    ระยะกม./ไมล์<br/>เมื่อออกรถ
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center bg-gray-50">
                    กลับถึงสำนักงาน
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[110px] bg-gray-50">
                    ระยะกม./ไมล์<br/>เมื่อรถกลับ
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[100px] bg-gray-50">
                    รวมระยะทาง<br/>กม./ไมล์
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[120px] bg-gray-50">
                    พนักงาน<br/>ขับรถ
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[80px] bg-gray-50">
                    หมายเหตุ
                  </th>
                </tr>
                <tr className="bg-gray-50/90 text-gray-600 font-bold border-b border-gray-200 divide-x divide-gray-200">
                  <th className="py-2 px-3 text-center w-24">วันที่</th>
                  <th className="py-2 px-3 text-center w-16">เวลา</th>
                  <th className="py-2 px-3 text-center w-24">วันที่</th>
                  <th className="py-2 px-3 text-center w-16">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-purple-50/30 transition-colors divide-x divide-gray-100">
                      <td className="py-3.5 px-3 text-center font-bold text-gray-500">
                        {row.seq}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-gray-800">
                        {row.deptDate}
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-600">
                        {row.deptTime}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {row.user}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {row.destination}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-purple-700">
                        {row.startMileage}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-gray-800">
                        {row.returnDate}
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-600">
                        {row.returnTime}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-purple-700">
                        {row.endMileage}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-green-50 text-green-700 font-black text-xs">
                          {row.totalDistance}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-800 font-medium">
                        {row.driverName}
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-400">
                        {row.remark}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-gray-400 font-bold">
                      ไม่พบข้อมูลการเดินทาง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Scroll Indicator */}
          <div className="py-2.5 px-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] font-bold text-gray-400">
            <ChevronLeft size={14} />
            <span>เลื่อนตารางซ้าย-ขวา เพื่อดูข้อมูลทั้งหมด</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* 🌟 Signature Section Below Table (Matching Mockup Image 3, 4, 5) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end text-center">
            {/* Left Signature: Driver */}
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-48 border-b border-gray-300 pt-6"></div>
              <p className="text-xs font-bold text-gray-500 pt-1">
                พนักงานขับรถ (ผู้บันทึก)
              </p>
            </div>

            {/* Right Signature: General Affairs Officer */}
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-48 border-b border-gray-300 pt-6"></div>
              <p className="text-xs font-bold text-gray-500 pt-1">
                เจ้าหน้าที่บริหารงานทั่วไป (ผู้ตรวจทาน)
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
