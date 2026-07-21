"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import AppShell from "@/components/AppShell";
import type { SystemDriverLog } from "@/lib/booking-system-types";

type DriverDashboardResponse = {
  success: boolean;
  dashboard?: {
    logs: SystemDriverLog[];
  };
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DriverLogsPage() {
  const [driverId, setDriverId] = useState("drv-001");
  const [logs, setLogs] = useState<SystemDriverLog[]>([]);

  const loadLogs = async (id: string) => {
    const response = await fetch(`/api/drivers/${id}/dashboard`, { cache: "no-store" });
    const data = (await response.json()) as DriverDashboardResponse;
    setLogs(data.dashboard?.logs || []);
  };

  useEffect(() => {
    loadLogs(driverId);
  }, [driverId]);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-gray-900">รายงานการใช้รถ (แบบ 4)</h1>
            <p className="text-gray-500">ประวัติบันทึกเลขไมล์จากระบบคนขับ</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 bg-white text-sm font-semibold"
            >
              <option value="drv-001">นายสมชาย ใจดี</option>
              <option value="drv-002">นายอนุชา คำมี</option>
              <option value="drv-003">นายวิชัย แสนดี</option>
              <option value="drv-004">นายประเสริฐ จันทรดี</option>
              <option value="drv-005">นายชูชาติ สุขใจ</option>
              <option value="drv-006">นายธนวัฒน์ วันดี</option>
            </select>
            <Link href="/driver/dashboard" className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700">
              <ArrowLeft size={14} /> กลับหน้าแดชบอร์ด
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-gray-700">
            <FileText size={18} /> รายการบันทึกล่าสุด
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 text-left">เวลา</th>
                  <th className="p-3 text-left">เลขคำขอ</th>
                  <th className="p-3 text-right">ไมล์เริ่ม</th>
                  <th className="p-3 text-right">ไมล์สิ้นสุด</th>
                  <th className="p-3 text-right">ระยะทางรวม</th>
                  <th className="p-3 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100">
                    <td className="p-3">{formatDate(log.createdAt)}</td>
                    <td className="p-3 font-bold text-gray-900">{log.bookingId}</td>
                    <td className="p-3 text-right">{log.mileageStart.toLocaleString("th-TH")}</td>
                    <td className="p-3 text-right">{log.mileageEnd.toLocaleString("th-TH")}</td>
                    <td className="p-3 text-right font-bold text-green-700">{log.totalDistance.toLocaleString("th-TH")}</td>
                    <td className="p-3">{log.fuelRemark || "-"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">ยังไม่มีข้อมูลบันทึกการเดินทาง</td>
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
