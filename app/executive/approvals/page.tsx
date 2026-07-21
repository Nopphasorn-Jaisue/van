"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FileText,
  Paperclip,
  Users,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import type { SystemBooking } from "@/lib/booking-system-types";

function formatDate(dateText: string) {
  return new Date(dateText).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ExecutiveApprovalsPage() {
  const [approvals, setApprovals] = useState<SystemBooking[]>([]);

  const loadApprovals = async () => {
    const response = await fetch("/api/bookings?status=WAITING_EXEC", { cache: "no-store" });
    const data = await response.json();
    setApprovals(data.bookings || []);
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const updateStatus = async (bookingId: string, status: "APPROVED" | "REJECTED") => {
    const reason = status === "REJECTED"
      ? window.prompt("โปรดระบุเหตุผลที่ไม่อนุมัติ") || "ไม่ผ่านเกณฑ์อนุมัติ"
      : undefined;

    await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });

    await loadApprovals();
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto animate-in fade-in">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">พิจารณาอนุมัติคำขอใช้รถ</h1>
            <p className="text-gray-500">รับข้อมูลที่ถูกจัดสรรคนขับจากฝ่ายแอดมิน แล้วอนุมัติ/ไม่อนุมัติได้ทันที</p>
          </div>
          <div className="bg-purple-100 text-[#311171] px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <AlertCircle size={18} />
            รอการพิจารณา: {approvals.length} รายการ
          </div>
        </div>

        <div className="space-y-5">
          {approvals.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-[#311171] to-[#4a1c82] px-6 py-3 flex justify-between items-center">
                <span className="text-white font-bold text-sm tracking-wide">เลขที่: {req.id}</span>
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                  ผู้โดยสาร {req.passengers} คน
                </span>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">{req.destination}</h2>
                    <p className="text-sm font-bold text-[#311171]">{req.purpose}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1"><Users size={12} /> ผู้ขออนุญาต</p>
                      <p className="text-sm font-bold text-gray-800">{req.requester}</p>
                      <p className="text-xs text-gray-500">{req.requesterFaculty}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1"><CalendarDays size={12} /> วันเวลาเดินทาง</p>
                      <p className="text-sm font-bold text-gray-800">{formatDate(req.startAt)}</p>
                      <p className="text-xs text-gray-500">ถึง {formatDate(req.endAt)}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-400 mb-2 flex items-center gap-1"><Paperclip size={12} /> เอกสารประกอบ</p>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#311171] hover:bg-purple-50 transition-colors">
                      <FileText size={14} /> เอกสารคำขอจากระบบ
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-3">ข้อมูลการจัดสรร</p>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                      <p className="text-[10px] font-bold text-gray-400">รถตู้ที่มอบหมาย</p>
                      <p className="text-sm font-black text-gray-800">{req.assignedVanPlate || "ยังไม่ระบุ"}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400">พนักงานขับรถ</p>
                      <p className="text-sm font-black text-gray-800">{req.assignedDriverName || "ยังไม่ระบุ"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <button
                      onClick={() => updateStatus(req.id, "REJECTED")}
                      className="py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg font-bold text-sm hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle size={16} /> ไม่อนุมัติ
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, "APPROVED")}
                      className="py-2.5 bg-[#311171] text-white rounded-lg font-bold text-sm hover:bg-[#250d55] shadow-md transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 size={16} /> อนุมัติ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {approvals.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <CheckCircle2 size={56} className="mx-auto text-green-400 mb-4" />
              <h3 className="text-xl font-black text-gray-900 mb-1">ไม่มีรายการรออนุมัติ</h3>
              <p className="text-gray-500">ระบบเชื่อมสถานะเรียบร้อยแล้ว</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
