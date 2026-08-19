"use client";

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  ChevronLeft, ChevronRight, Search, Loader2
} from 'lucide-react';
import { getAllFacultyBookingsWithLogs } from '@/app/actions/driver';

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
  assignedDriverId?: number;
}

interface DriverLogItem {
  mileageStart?: number | string | null;
  mileageEnd?: number | string | null;
  totalDistance?: number | null;
  fuelRemark?: string | null;
}

interface BookingItem {
  id: string | number;
  departureDate: string | Date;
  returnDate: string | Date;
  destination: string;
  assignedDriverId?: number;
  requester?: {
    name?: string | null;
  } | null;
  driverLog?: DriverLogItem | null;
  assignedDriver?: {
    user?: {
      name?: string | null;
    } | null;
  } | null;
}

export default function DriverUsageReportPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [driverName, setDriverName] = useState("พนักงานขับรถ");
  const [driverId, setDriverId] = useState<number | null>(null);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ตั้งค่าเริ่มต้นเดือนและปีปัจจุบันหลังจาก component mount เพื่อแก้ปัญหา hydration error
  useEffect(() => {
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    setSelectedMonth(thaiMonths[new Date().getMonth()]);
    setSelectedYear((new Date().getFullYear() + 543).toString());

    // Fetch current driver
    fetch('/api/driver/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.driverData) {
          setDriverId(data.driverData.id);
          if (data.driverData.user?.name) {
            setDriverName(data.driverData.user.name);
          }
        }
      })
      .catch(err => console.error("Error fetching driver:", err));
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!driverId) return;
      setIsLoading(true);
      try {
        const bookingsRes = await getAllFacultyBookingsWithLogs();
        if (bookingsRes.success && Array.isArray(bookingsRes.bookings)) {
          const loggedBookings = (bookingsRes.bookings as BookingItem[]).filter(
            (b): b is BookingItem & { driverLog: DriverLogItem } => Boolean(b.driverLog) && b.assignedDriverId === driverId
          );
          
          if (loggedBookings.length > 0) {
            const mapped: ReportRow[] = loggedBookings.map((b, index) => {
              const log = b.driverLog;
              const deptD = b.departureDate ? new Date(b.departureDate) : null;
              const retD = b.returnDate ? new Date(b.returnDate) : null;

              const isValidDept = deptD && !isNaN(deptD.getTime());
              const isValidRet = retD && !isNaN(retD.getTime());

              return {
                id: b.id,
                seq: index + 1,
                deptDate: isValidDept ? deptD.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : "-",
                deptTime: isValidDept ? deptD.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "-",
                user: b.requester?.name || "ผู้ขอใช้บริการ",
                destination: b.destination || "-",
                startMileage: log?.mileageStart != null ? log.mileageStart.toLocaleString() : "-",
                returnDate: isValidRet ? retD.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : "-",
                returnTime: isValidRet ? retD.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "-",
                endMileage: log?.mileageEnd != null ? log.mileageEnd.toLocaleString() : "-",
                totalDistance: log?.totalDistance || 0,
                driverName: b.assignedDriver?.user?.name || "-",
                remark: log?.fuelRemark || "-"
              };
            });

            // Use only fetched data from database
            setReportRows(mapped);
          } else {
            setReportRows([]);
          }
        } else {
          setReportRows([]);
        }
      } catch (err) {
        console.error("Error loading report data:", err);
        setReportRows([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [driverId]);

  const filteredRows = reportRows.filter(r => 
    (r.user?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (r.destination?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-12">
        
        {/* 🌟 Section Header: ประวัติการเดินทาง & Export Button */}
        <div className="flex justify-between items-center pt-2">

          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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
              className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="2567">2567</option>
              <option value="2568">2568</option>
              <option value="2569">2569</option>
              <option value="2570">2570</option>
            </select>
          </div>
        </div>

        {/* Search Bar (Optional Filter) */}
        <div className="relative w-full md:w-[40%]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามผู้ใช้รถ หรือ สถานที่ไป..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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
                {isLoading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-indigo-600 font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={20} className="animate-spin text-indigo-600" />
                        <span>กำลังโหลดข้อมูลการเดินทาง...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length > 0 ? (
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
                      <td className="py-3.5 px-3 text-center font-bold text-indigo-600">
                        {row.startMileage}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-gray-800">
                        {row.returnDate}
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-600">
                        {row.returnTime}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-indigo-600">
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
              <p className="text-xs font-bold text-gray-800">{driverName}</p>
              <div className="w-48 border-b border-gray-300 pt-2"></div>
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
