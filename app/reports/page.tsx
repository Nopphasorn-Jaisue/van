"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

// ==========================================
// 1. Mock Data สำหรับ Faculty Admin (ระดับคณะ)
// ==========================================
const FACULTY_TRIP_STATS = {
  internal: 45, // คนในคณะจอง
  external: 12, // คนนอกคณะจองข้ามมา
  inProvince: 35, // วิ่งในจังหวัด
  outProvince: 22, // วิ่งต่างจังหวัด
};

const DRIVER_WORKLOAD = [
  { 
    id: "d1", 
    name: "นายสมชาย ใจดี", 
    hours_this_week: 45, // ชั่วโมงทำงานสัปดาห์นี้
    max_safe_hours: 48, // ลิมิตความปลอดภัยตามกฎหมายแรงงาน
    trips: 5,
    status: "warning" // warning เพราะใกล้ทะลุลิมิต
  },
  { 
    id: "d2", 
    name: "นายบุญฤทธิ์ บัวบาน", 
    hours_this_week: 22, 
    max_safe_hours: 48, 
    trips: 3,
    status: "safe" 
  },
];

// ==========================================
// 2. Mock Data สำหรับ Super Admin (ระดับมหาลัย)
// ==========================================
const FLEET_STATUS = [
  { faculty: "คณะวิศวกรรมศาสตร์", total_vans: 3, active: 2, maintenance: 1, usage_rate: "88%" },
  { faculty: "คณะวิทยาศาสตร์", total_vans: 2, active: 2, maintenance: 0, usage_rate: "75%" },
  { faculty: "คณะนิติศาสตร์", total_vans: 1, active: 1, maintenance: 0, usage_rate: "50%" },
  { faculty: "คณะรัฐศาสตร์และสังคมศาสตร์", total_vans: 4, active: 3, maintenance: 1, usage_rate: "95%" },
];

const WEEKLY_DENSITY = [
    { day: "จ", trips: 15, percent: 30 },
    { day: "อ", trips: 22, percent: 45 },
    { day: "พ", trips: 48, percent: 95 },
    { day: "พฤ", trips: 30, percent: 60 },
    { day: "ศ", trips: 50, percent: 100 },
    { day: "ส", trips: 18, percent: 38 },
    { day: "อา", trips: 8, percent: 15 },
];

const CROSS_FACULTY_USAGE = [
    { borrower: "คณะนิติศาสตร์", lender: "วิศวกรรมศาสตร์", count: 18, percent: 90 },
    { borrower: "คณะวิทยาศาสตร์สุขภาพ", lender: "พยาบาลศาสตร์", count: 15, percent: 75 },
    { borrower: "คณะสถาปัตยกรรมศาสตร์", lender: "วิศวกรรมศาสตร์", count: 11, percent: 60 },
    { borrower: "คณะเกษตรศาสตร์", lender: "รัฐศาสตร์และสังคมศาสตร์", count: 9, percent: 50 },
];


// ==========================================
// 3. Main Page Component
// ==========================================
export default function ReportsPage() {
  const [role, setRole] = useState("FACULTY_ADMIN");

  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await fetch('/api/me', { cache: 'no-store' });
        const data = await response.json();
        setRole(data.role || 'FACULTY_ADMIN');
      } catch {
        setRole('FACULTY_ADMIN');
      }
    };
    loadRole();
  }, []);

  return (
    <AppShell>
      {/* สลับ Component ตาม Role อัตโนมัติ */}
      {role === "SUPER_ADMIN" ? <SuperAdminView /> : <FacultyAdminView />}
    </AppShell>
  );
}

// ==========================================
// 📊 VIEW A: หน้า Report สำหรับผู้ดูแลรถตู้คณะ
// ==========================================
function FacultyAdminView() {
  const totalTrips = FACULTY_TRIP_STATS.internal + FACULTY_TRIP_STATS.external;

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

          <div className="space-y-6">
            {DRIVER_WORKLOAD.map((driver) => {
              const percent = Math.min((driver.hours_this_week / driver.max_safe_hours) * 100, 100);
              const isWarning = driver.status === "warning";

              return (
                <div key={driver.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-bold text-gray-800">{driver.name}</div>
                    {isWarning ? (
                      <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">⚠️ ใกล้เกินลิมิต</span>
                    ) : (
                      <span className="rounded bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">✓ พักผ่อนเพียงพอ</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>ขับไปแล้ว {driver.hours_this_week} ชม. (ออกรถ {driver.trips} ทริป)</span>
                    <span>ลิมิต {driver.max_safe_hours} ชม.</span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
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
                  <span>{FACULTY_TRIP_STATS.internal} ทริป</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${(FACULTY_TRIP_STATS.internal / totalTrips) * 100}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-blue-600">คณะอื่นยืม (Cross-Faculty)</span>
                  <span>{FACULTY_TRIP_STATS.external} ทริป</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(FACULTY_TRIP_STATS.external / totalTrips) * 100}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm flex-1">
            <h2 className="mb-4 text-lg font-bold text-gray-900">ลักษณะการเดินทาง</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-center">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">ต่างจังหวัด</p>
                <p className="mt-2 text-3xl font-black text-orange-900">{FACULTY_TRIP_STATS.outProvince}</p>
                <p className="text-xs text-orange-700 mt-1">ทริป</p>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-center">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide">ภายในจังหวัด</p>
                <p className="mt-2 text-3xl font-black text-teal-900">{FACULTY_TRIP_STATS.inProvince}</p>
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
// 📊 VIEW B: หน้า Report สำหรับ Super Admin
// ==========================================
function SuperAdminView() {
  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="รายงานภาพรวมระดับมหาวิทยาลัย (Super Admin)"
        description="วิเคราะห์ข้อมูลการใช้งานรถตู้ ความหนาแน่น และการยืมข้ามคณะของมหาวิทยาลัยพะเยา"
      />

      {/* --- Section 1: KPI Cards ระดับมหาวิทยาลัย --- */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlobalStatCard title="จำนวนรถตู้ทั้งหมดในระบบ" value="42" unit="คัน" subtitle="พร้อมใช้งาน 38 คัน" tone="purple" />
        <GlobalStatCard title="ทริปการเดินทาง (เดือนนี้)" value="1,245" unit="ทริป" subtitle="เพิ่มขึ้น 12% จากเดือนที่แล้ว" tone="blue" />
        <GlobalStatCard title="อัตราการยืมข้ามคณะ" value="35" unit="%" subtitle="ลดภาระส่วนกลางได้ดีเยี่ยม" tone="green" />
        <GlobalStatCard title="งบประมาณที่ประหยัดได้" value="1.2" unit="ล้านบาท" subtitle="จากการทำ Smart Matchmaking" tone="yellow" />
      </div>

      {/* --- Section 2: กราฟวิเคราะห์ (Charts) --- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* กราฟความหนาแน่นของการใช้รถ (Usage Density) */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">ความหนาแน่นของการใช้รถ (รายสัปดาห์)</h2>
            <p className="text-sm text-gray-500">Peak Time ส่วนใหญ่กระจุกตัวในวันพุธและศุกร์</p>
          </div>
          
          <div className="flex h-64 items-end justify-between gap-2 px-2">
            {WEEKLY_DENSITY.map((item) => (
              <div key={item.day} className="group relative flex w-full flex-col items-center">
                {/* Tooltip (แสดงเมื่อ Hover) */}
                <div className="absolute -top-10 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap">
                  {item.trips} ทริป
                </div>
                {/* Bar */}
                <div 
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${item.percent > 80 ? 'bg-purple-800 hover:bg-purple-900' : 'bg-purple-200 hover:bg-purple-300'}`}
                  style={{ height: `${item.percent}%` }}
                />
                <span className="mt-3 text-xs font-medium text-gray-600">{item.day}</span>
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

          <div className="space-y-6 mt-4">
            {CROSS_FACULTY_USAGE.map((data, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-gray-700">{data.borrower} <span className="text-purple-500 font-normal">➔ ยืม ➔</span> {data.lender}</span>
                  <span className="font-bold text-gray-900">{data.count} ครั้ง</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-800 transition-all duration-1000"
                    style={{ width: `${data.percent}%` }}
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
              {FLEET_STATUS.map((fleet, idx) => (
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
