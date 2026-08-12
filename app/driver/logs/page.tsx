"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Printer, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import type { SystemDriverLog } from "@/lib/booking-system-types";

type DriverDashboardResponse = {
  success: boolean;
  dashboard?: {
    logs: SystemDriverLogWithLegs[];
  };
};

type LogLeg = {
  returnDate: string;
  deptTime: string;
  passenger: string;
  destination: string;
  startMileage: number;
  returnTime: string;
  endMileage: number;
  distance: number;
  driver: string;
  remark: string;
};

type SystemDriverLogWithLegs = SystemDriverLog & { legs: LogLeg[] };

function formatDate(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DriverLogsPage() {
  const [driverId, setDriverId] = useState<string>("");
  const [logs, setLogs] = useState<SystemDriverLogWithLegs[]>([]);

  const loadLogs = async (id: string) => {
    try {
      const response = await fetch(`/api/drivers/${id}/dashboard`, { cache: "no-store" });
      const data = (await response.json()) as DriverDashboardResponse;
      setLogs(data.dashboard?.logs || []);
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    async function init() {
      const meRes = await fetch('/api/driver/me');
      const meData = await meRes.json();
      if (meData.success && meData.driverData && meData.driverData.id) {
        const id = meData.driverData.id.toString();
        setDriverId(id);
        loadLogs(id);
      }
    }
    init();
  }, []);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        
        {/* Sticky Fixed Top Header */}
        <div className="sticky -top-6 lg:-top-8 z-20 bg-[#f3f4f7]/95 backdrop-blur-md pt-8 lg:pt-10 pb-4 border-b border-gray-200/80 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-[#311171]" /> รายงานการใช้รถ (แบบ 4)
            </h1>
            <p className="text-xs text-gray-500">ประวัติบันทึกสมุดการใช้รถและเลขไมล์ประจำวัน</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-xl border border-gray-200 px-4 py-2 bg-white text-xs font-semibold text-[#311171]">
              รหัสพนักงานขับรถ: {driverId || 'กำลังโหลด...'}
            </div>

            <Link href="/driver/records" className="inline-flex items-center gap-1.5 rounded-xl bg-[#311171] text-white px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-[#250d55]">
              <Plus size={14} /> บันทึกการเดินทางใหม่
            </Link>

            <Link href="/driver/dashboard" className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50">
              <ArrowLeft size={14} /> แดชบอร์ด
            </Link>
          </div>
        </div>

        {/* Official Logbook Table Container */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-4 md:p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">สมุดบันทึกการใช้รถทางการ (Logbook Table View)</h2>
            <button 
              onClick={() => window.print()}
              className="text-xs font-bold text-[#311171] hover:underline flex items-center gap-1"
            >
              <Printer size={14} /> พิมพ์รายงาน
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-900 min-w-[880px] font-sans">
              <thead>
                <tr className="bg-slate-200/90 text-slate-900 border-b border-slate-900 text-center font-bold">
                  <th rowSpan={2} className="border border-slate-900 p-2 w-12">ลำดับที่</th>
                  <th colSpan={2} className="border border-slate-900 p-2">ออกเดินทาง</th>
                  <th rowSpan={2} className="border border-slate-900 p-2 w-20">ผู้ใช้รถ</th>
                  <th rowSpan={2} className="border border-slate-900 p-2">สถานที่ไป</th>
                  <th rowSpan={2} className="border border-slate-900 p-2 w-28">ระยะ กม./ไมล์<br/>เมื่อออกเดินทาง</th>
                  <th colSpan={2} className="border border-slate-900 p-2">กลับถึงสำนักงาน</th>
                  <th rowSpan={2} className="border border-slate-900 p-2 w-28">ระยะ กม./ไมล์<br/>เมื่อกลับถึงสำนักงาน</th>
                  <th rowSpan={2} className="border border-slate-900 p-2 w-24">รวมระยะทาง<br/>กม./ไมล์</th>
                  <th rowSpan={2} className="border border-slate-900 p-2 w-24">พนักงานขับรถ</th>
                  <th rowSpan={2} className="border border-slate-900 p-2 w-24">หมายเหตุ</th>
                </tr>
                <tr className="bg-slate-200/90 text-slate-900 border-b border-slate-900 text-center font-bold">
                  <th className="border border-slate-900 p-1.5 w-24">วันที่</th>
                  <th className="border border-slate-900 p-1.5 w-16">เวลา</th>
                  <th className="border border-slate-900 p-1.5 w-24">วันที่</th>
                  <th className="border border-slate-900 p-1.5 w-16">เวลา</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="border border-slate-900 p-8 text-center text-slate-500 font-medium">
                      ไม่มีประวัติการบันทึกสมุดใช้รถ
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <React.Fragment key={log.id}>
                      {log.legs.length > 0 ? log.legs.map((leg, legIdx: number) => (
                        <tr key={`${log.id}-leg-${legIdx}`} className="hover:bg-slate-50 border-b border-slate-400">
                          {legIdx === 0 && (
                            <td rowSpan={log.legs.length} className="border border-slate-900 p-2 text-center font-bold align-top bg-slate-50">
                              {idx + 1}.
                            </td>
                          )}
                          <td className="border border-slate-900 p-2 text-center whitespace-nowrap">{leg.returnDate}</td>
                          <td className="border border-slate-900 p-2 text-center whitespace-nowrap font-mono">{leg.deptTime}</td>
                          <td className="border border-slate-900 p-2 text-center font-bold text-slate-700">{leg.passenger}</td>
                          <td className="border border-slate-900 p-2 font-bold text-slate-900">{leg.destination}</td>
                          <td className="border border-slate-900 p-2 text-right font-mono">{leg.startMileage.toLocaleString("th-TH")}</td>
                          <td className="border border-slate-900 p-2 text-center whitespace-nowrap">{leg.returnDate}</td>
                          <td className="border border-slate-900 p-2 text-center whitespace-nowrap font-mono">{leg.returnTime}</td>
                          <td className="border border-slate-900 p-2 text-right font-mono">{leg.endMileage.toLocaleString("th-TH")}</td>
                          <td className="border border-slate-900 p-2 text-right font-mono font-bold text-emerald-700">{leg.distance}</td>
                          <td className="border border-slate-900 p-2 text-center font-medium">{leg.driver}</td>
                          <td className="border border-slate-900 p-2 text-center text-slate-400">{leg.remark || "-"}</td>
                        </tr>
                      )) : (
                        <tr key={log.id} className="hover:bg-slate-50 border-b border-slate-400">
                          <td className="border border-slate-900 p-2 text-center font-bold align-top bg-slate-50">
                            {idx + 1}.
                          </td>
                          <td colSpan={11} className="border border-slate-900 p-2 text-center text-slate-400">
                            (ไม่มีรายละเอียดทริป)
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Logs List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between text-gray-700">
            <span className="font-bold text-xs flex items-center gap-2">
              <FileText size={16} /> รายการบันทึกจากระบบฐานข้อมูล ({logs.length} รายการ)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold">
                <tr>
                  <th className="p-3 text-left">เวลาบันทึก</th>
                  <th className="p-3 text-left">เลขคำขอ</th>
                  <th className="p-3 text-right">ไมล์เริ่ม</th>
                  <th className="p-3 text-right">ไมล์สิ้นสุด</th>
                  <th className="p-3 text-right">ระยะทางรวม</th>
                  <th className="p-3 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 hover:bg-slate-50">
                    <td className="p-3">{formatDate(log.createdAt)}</td>
                    <td className="p-3 font-bold text-gray-900">{log.bookingId}</td>
                    <td className="p-3 text-right font-mono">{log.mileageStart.toLocaleString("th-TH")}</td>
                    <td className="p-3 text-right font-mono">{log.mileageEnd.toLocaleString("th-TH")}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{log.totalDistance.toLocaleString("th-TH")} กม.</td>
                    <td className="p-3">{log.fuelRemark || "-"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">ไม่มีข้อมูลบันทึกเพิ่มเติมในฐานข้อมูล</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
