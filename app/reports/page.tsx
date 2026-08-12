"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

// Data structures for Reports
interface FacultyTripStats {
  internal: number;
  external: number;
  inProvince: number;
  outProvince: number;
}
interface DriverWorkload {
  id: string;
  name: string;
  hours_this_week: number;
  max_safe_hours: number;
  trips: number;
  status: string;
}
interface FleetStatus {
  faculty: string;
  total_vans: number;
  active: number;
  maintenance: number;
  usage_rate: string;
}
interface WeeklyDensity {
  day: string;
  trips: number;
  percent: number;
}
interface CrossFacultyUsage {
  borrower: string;
  lender: string;
  count: number;
  percent: number;
}

import { getDashboardReports } from '@/app/actions/reports';

// ==========================================
// 3. Main Page Component
// ==========================================
export default function ReportsPage() {
  const [role, setRole] = useState("FACULTY_ADMIN");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getDashboardReports();
        if (res.success && res.data) {
          setRole(res.data.role || 'FACULTY_ADMIN');
          setReportData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <AppShell><div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูลเชิงปฏิบัติการ...</div></AppShell>;

  return (
    <AppShell>
      {/* สลับ Component ตาม Role อัตโนมัติ */}
      {role === "SUPER_ADMIN" ? <SuperAdminView data={reportData} /> : <FacultyAdminView data={reportData} />}
    </AppShell>
  );
}

// ==========================================
// 📊 VIEW A: หน้า Report สำหรับผู้ดูแลรถตู้คณะ
// ==========================================
function FacultyAdminView({ data }: { data: any }) {
  const { facultyTripStats, driverWorkload } = data;
  const totalTrips = (facultyTripStats?.internal || 0) + (facultyTripStats?.external || 0);

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="รายงานข้อมูลเชิงปฏิบัติการ (Faculty Admin)"
        description="ตรวจสอบภาระงานพนักงานขับรถ และสัดส่วนการให้บริการของคณะคุณในเดือนนี้"
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* --- ส่วนที่ 1: การจัดการความปลอดภัยคนขับ (Driver Workload & Safety) --- */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">ภาระงานพนักงานขับรถ (สัปดาห์นี้)</h2>
            <p className="text-sm text-gray-500">ติดตามชั่วโมงขับรถเพื่อป้องกันความเหนื่อยล้า (Fatigue Management)</p>
          </div>

          <div className="space-y-4">
            {(driverWorkload || []).map((driver: DriverWorkload) => {
              const percent = Math.min((driver.hours_this_week / driver.max_safe_hours) * 100, 100);
              const isWarning = driver.status === "warning";

              return (
                <div key={driver.id} className="p-4 rounded-2xl border border-gray-100 flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{driver.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">รับงานไปแล้ว {driver.trips} เที่ยว</p>
                  </div>
                  {isWarning ? (
                    <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">⚠️ ใกล้เกินลิมิต</span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">✓ พักผ่อนเพียงพอ</span>
                  )}
                  <div className="h-2.5 w-16 overflow-hidden rounded-full bg-gray-200">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* --- ส่วนที่ 2: สัดส่วนการใช้งาน (Usage Demographics) --- */}
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm flex-1">
            <h2 className="mb-4 text-lg font-bold text-gray-900">สัดส่วนผู้ใช้บริการ ({totalTrips} ทริป)</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-purple-800">คนในคณะของเรา</span>
                  <span>{facultyTripStats?.internal || 0} ทริป</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${totalTrips > 0 ? (facultyTripStats?.internal / totalTrips) * 100 : 0}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-blue-600">คณะอื่นยืม (Cross-Faculty)</span>
                  <span>{facultyTripStats?.external || 0} ทริป</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalTrips > 0 ? (facultyTripStats?.external / totalTrips) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm flex-1">
            <h2 className="mb-4 text-lg font-bold text-gray-900">ลักษณะการเดินทาง</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-center">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">ต่างจังหวัด</p>
                <p className="mt-2 text-3xl font-black text-orange-900">{facultyTripStats?.outProvince || 0}</p>
                <p className="text-xs text-orange-700 mt-1">ทริป</p>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-center">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide">ภายในจังหวัด</p>
                <p className="mt-2 text-3xl font-black text-teal-900">{facultyTripStats?.inProvince || 0}</p>
                <p className="text-xs text-teal-700 mt-1">ทริป</p>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 📊 VIEW B: หน้า Report สำหรับผู้บริหารส่วนกลาง
// ==========================================
function SuperAdminView({ data }: { data: any }) {
  const { fleetStatus, weeklyDensity, crossFacultyUsage, facultyTripStats } = data;
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="รายงานภาพรวมระดับมหาวิทยาลัย (Super Admin)"
        description="วิเคราะห์ข้อมูลการใช้งานรถตู้ ความหนาแน่น และการยืมข้ามคณะของมหาวิทยาลัยพะเยา"
      />

      {/* --- Section 1: KPI Cards ระดับมหาวิทยาลัย --- */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="คนในคณะจอง" value={facultyTripStats?.internal || 0} suffix="ครั้ง" color="blue" />
        <StatCard title="นอกคณะยืมรถ" value={facultyTripStats?.external || 0} suffix="ครั้ง" color="purple" />
        <StatCard title="วิ่งในจังหวัด" value={facultyTripStats?.inProvince || 0} suffix="เที่ยว" color="green" />
        <StatCard title="วิ่งต่างจังหวัด" value={facultyTripStats?.outProvince || 0} suffix="เที่ยว" color="orange" />
      </div>

      {/* --- Section 2: กราฟวิเคราะห์ (Charts) --- */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* กราฟความหนาแน่นของการใช้รถ (Usage Density) */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">ความหนาแน่นของการใช้รถ (รายสัปดาห์)</h2>
            <p className="text-sm text-gray-500">Peak Time ส่วนใหญ่กระจุกตัวในวันพุธและศุกร์</p>
          </div>
          
          <div className="flex items-end justify-between h-40 mt-4 gap-1">
            {(weeklyDensity || []).map((d: WeeklyDensity, i: number) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <span className="text-[10px] text-gray-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{d.trips}</span>
                <div className="w-full max-w-[24px] bg-[#311171]/20 rounded-t-sm relative flex justify-center">
                  <div 
                    className="absolute bottom-0 w-full bg-[#311171] rounded-t-sm transition-all duration-1000"
                    style={{ height: `${d.percent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600 mt-2">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* กราฟแสดงความสัมพันธ์การยืมข้ามคณะ (Cross-Faculty Borrowing) */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">คณะที่ขอยืมรถข้ามสายมากที่สุด (Top 4)</h2>
            <p className="text-sm text-gray-500">แสดงข้อมูล "ผู้ยืม" ➔ "ผู้ให้ยืม (เจ้าของรถ)"</p>
          </div>

          <div className="space-y-4">
            {(crossFacultyUsage || []).map((usage: CrossFacultyUsage, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-gray-700">{usage.borrower} <span className="text-purple-500 font-normal">➔ ยืม ➔</span> {usage.lender}</span>
                  <span className="font-bold text-gray-900">{usage.count} ครั้ง</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-800 transition-all duration-1000"
                    style={{ width: `${usage.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- Section 3: ตารางสรุปภาพรวมทรัพยากร (Fleet Health) --- */}
      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">สถานะทรัพยากรรถตู้แยกตามคณะ (Fleet Health)</h2>
            <p className="text-sm text-gray-500">ข้อมูลอัปเดตแบบ Real-time ทั่วทั้งมหาวิทยาลัย</p>
          </div>
          <button className="mt-3 sm:mt-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
            ⬇️ ดาวน์โหลดรายงาน (Excel)
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 mt-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">คณะ / หน่วยงาน</th>
                <th className="p-4 font-semibold text-center">รถในสังกัด (คัน)</th>
                <th className="p-4 font-semibold text-center">พร้อมใช้ (คัน)</th>
                <th className="p-4 font-semibold text-center">ซ่อมบำรุง (คัน)</th>
                <th className="p-4 font-semibold">อัตราการใช้งาน (Usage Rate)</th>
              </tr>
            </thead>
            <tbody>
              {(fleetStatus || []).map((fleet: FleetStatus, idx: number) => (
                <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="p-4 font-bold text-purple-900">{fleet.faculty}</td>
                  <td className="p-4 text-center font-medium">{fleet.total_vans}</td>
                  <td className="p-4 text-center font-bold text-green-600">{fleet.active}</td>
                  <td className="p-4 text-center font-bold text-red-500">{fleet.maintenance}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 rounded-full bg-gray-200 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: fleet.usage_rate }} />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{fleet.usage_rate}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// 4. Helper Components
// ==========================================

function GlobalStatCard({ title, value, unit, subtitle, tone }: { title: string; value: string; unit: string; subtitle: string; tone: "purple" | "blue" | "green" | "yellow" }) {
  const toneConfig = {
    purple: "text-purple-900 bg-purple-50/50 border-purple-100",
    blue: "text-blue-900 bg-blue-50/50 border-blue-100",
    green: "text-green-900 bg-green-50/50 border-green-100",
    yellow: "text-yellow-900 bg-yellow-50/50 border-yellow-100",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneConfig[tone]}`}>
      <p className="text-sm font-bold text-gray-600 mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black">{value}</span>
        <span className="text-sm font-bold opacity-70">{unit}</span>
      </div>
      <p className="mt-2 text-xs font-medium text-gray-500">{subtitle}</p>
    </div>
  );
}
