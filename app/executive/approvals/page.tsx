"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  CheckCircle2, XCircle, Clock, Search, Filter, LayoutGrid, List,
  AlertCircle, FileText, Calendar, MapPin, Users, ChevronRight, X,
  Check, Eye, ShieldCheck, TrendingUp, Sparkles, Building2, Car, Phone, Mail, FileCheck
} from "lucide-react";
import type { SystemBooking } from "@/lib/booking-system-types";

function formatDate(dateText: string) {
  if (!dateText) return "-";
  return new Date(dateText).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateShort(dateText: string) {
  if (!dateText) return "-";
  return new Date(dateText).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit"
  });
}

function formatTimeOnly(dateText: string) {
  if (!dateText) return "-";
  return new Date(dateText).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ExecutiveApprovalsPage() {
  const [approvals, setApprovals] = useState<SystemBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<SystemBooking | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      // Fetch all bookings for comprehensive executive dashboard view
      const response = await fetch("/api/bookings", { cache: "no-store" });
      const data = await response.json();
      setApprovals(data.bookings || []);
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const updateStatus = async (bookingId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    let finalReason = reason;
    if (status === "REJECTED" && !finalReason) {
      finalReason = window.prompt("โปรดระบุเหตุผลที่ไม่อนุมัติ") || "ไม่ผ่านเกณฑ์อนุมัติ";
    }

    await fetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason: finalReason }),
    });

    if (selectedBooking?.id === bookingId) {
      setSelectedBooking(null);
      setShowRejectInput(false);
      setRejectReason("");
    }

    await loadApprovals();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`ยืนยันอนุมัติคำขอใช้รถจำนวน ${selectedIds.length} รายการ?`)) return;

    for (const id of selectedIds) {
      await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
    }

    setSelectedIds([]);
    await loadApprovals();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApprovals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApprovals.map(b => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filtered List
  const filteredApprovals = approvals.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requesterFaculty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "pending") return item.status === "WAITING_EXEC" || item.status === "WAITING_ADMIN";
    if (activeTab === "approved") return item.status === "APPROVED";
    if (activeTab === "rejected") return item.status === "REJECTED";
    return true;
  });

  // KPI Metrics
  const totalCount = approvals.length;
  const pendingCount = approvals.filter(b => b.status === "WAITING_EXEC" || b.status === "WAITING_ADMIN").length;
  const approvedCount = approvals.filter(b => b.status === "APPROVED").length;
  const rejectedCount = approvals.filter(b => b.status === "REJECTED").length;
  const totalPassengers = approvals.reduce((sum, b) => sum + (b.passengers || 0), 0);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
        
        {/* Sticky Fixed Top Header */}
        <div className="sticky -top-6 lg:-top-8 z-20 bg-[#f3f4f7]/95 backdrop-blur-md pt-8 lg:pt-10 pb-4 border-b border-gray-200/80 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-[#311171]" size={28} />
              การอนุมัติคำขอใช้รถตู้
            </h1>
            <p className="text-xs font-bold text-gray-500 mt-0.5">
              ศูนย์พิจารณาอนุมัติคำขอใช้รถตู้ประจำคณะสำหรับผู้บริหารและผู้มีสิทธิ์อนุมัติ
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all animate-in zoom-in-95 cursor-pointer"
              >
                <Check size={16} strokeWidth={3} />
                อนุมัติที่เลือก ({selectedIds.length})
              </button>
            )}

            <div className="bg-purple-100 text-[#311171] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-purple-200/60">
              <Clock size={16} />
              รอพิจารณา: <span className="font-black text-sm">{pendingCount}</span> รายการ
            </div>
          </div>
        </div>

        {/* 🌟 KPI Summary Cards Header (Matching Attached Mockup Images 1 & 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Approval Status Summary */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <FileCheck size={18} className="text-[#311171]" />
                สรุปสถานะการอนุมัติคำขอ
              </h3>
              <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                อัปเดตเรียลไทม์
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-100">
              <div className="px-1">
                <p className="text-[11px] font-bold text-gray-400">คำขอทั้งหมด</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{totalCount}</p>
                <p className="text-[10px] font-bold text-blue-500 mt-0.5 flex items-center justify-center gap-0.5">
                  <TrendingUp size={10} /> +{totalCount > 0 ? totalCount : 0} รายการ
                </p>
              </div>

              <div className="px-1">
                <p className="text-[11px] font-bold text-gray-400">อนุมัติแล้ว</p>
                <p className="text-2xl font-black text-green-600 mt-1">{approvedCount}</p>
                <p className="text-[10px] font-bold text-green-500 mt-0.5">ผ่านการอนุมัติ</p>
              </div>

              <div className="px-1">
                <p className="text-[11px] font-bold text-gray-400">ไม่อนุมัติ</p>
                <p className="text-2xl font-black text-red-500 mt-1">{rejectedCount}</p>
                <p className="text-[10px] font-bold text-red-400 mt-0.5">ปฏิเสธแล้ว</p>
              </div>

              <div className="px-1">
                <p className="text-[11px] font-bold text-gray-400">รอพิจารณา</p>
                <p className="text-2xl font-black text-[#311171] mt-1">{pendingCount}</p>
                <p className="text-[10px] font-bold text-amber-500 mt-0.5 animate-pulse">รออนุมัติ</p>
              </div>
            </div>
          </div>

          {/* Card 2: Fleet & Usage Statistics Summary */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                สถิติการใช้งานรถตู้คณะ
              </h3>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                ภาพรวมเดือนนี้
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-100">
              <div className="px-1">
                <p className="text-[11px] font-bold text-gray-400">ผู้โดยสารรวม</p>
                <p className="text-2xl font-black text-[#311171] mt-1">{totalPassengers}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">คน</p>
              </div>

              <div className="px-1">
                <p className="text-[11px] font-bold text-gray-400">รถตู้พร้อมใช้</p>
                <p className="text-2xl font-black text-purple-700 mt-1">4</p>
                <p className="text-[10px] font-bold text-purple-500 mt-0.5">คัน</p>
              </div>

              <div className="px-1">
                <p className="text-[11px] font-bold text-gray-400">เฉลี่ย/สัปดาห์</p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {Math.ceil(totalCount / 4) || 1}
                </p>
                <p className="text-[10px] font-bold text-blue-400 mt-0.5">ทริป</p>
              </div>

              <div className="px-1">
                <p className="text-[11px] font-bold text-gray-400">อัตราอนุมัติ</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 100}%
                </p>
                <p className="text-[10px] font-bold text-emerald-500 mt-0.5">อนุมัติสำเร็จ</p>
              </div>
            </div>
          </div>

        </div>

        {/* 🌟 Toolbar Section: Search, Filters & View Mode (Matching Attached Mockup Images 1 & 3) */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Tabs Filter Badges */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                activeTab === "pending"
                  ? "bg-[#311171] text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              ⏳ รอพิจารณา ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                activeTab === "approved"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              ✅ อนุมัติแล้ว ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                activeTab === "rejected"
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              ❌ ไม่อนุมัติ ({rejectedCount})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                activeTab === "all"
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              ทั้งหมด ({totalCount})
            </button>
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาผู้ขอ, สถานที่, คณะ..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 shrink-0">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === "table" ? "bg-white text-[#311171] shadow-xs font-bold" : "text-gray-400 hover:text-gray-700"
                }`}
                title="มุมมองตาราง"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === "grid" ? "bg-white text-[#311171] shadow-xs font-bold" : "text-gray-400 hover:text-gray-700"
                }`}
                title="มุมมองการ์ด"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

        </div>

        {/* 🌟 Content View 1: Table View (Matching Attached Mockup Images 1 & 2) */}
        {viewMode === "table" && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-200">
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredApprovals.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="py-3.5 px-4">เลขที่ / ยื่นเมื่อ</th>
                    <th className="py-3.5 px-4">ผู้ขอใช้รถ & คณะ</th>
                    <th className="py-3.5 px-4">กำหนดการเดินทาง</th>
                    <th className="py-3.5 px-4">สถานที่ไป & วัตถุประสงค์</th>
                    <th className="py-3.5 px-4 text-center">ผู้โดยสาร</th>
                    <th className="py-3.5 px-4">จัดสรรรถ & คนขับ</th>
                    <th className="py-3.5 px-4 text-center">สถานะ</th>
                    <th className="py-3.5 px-4 text-center">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredApprovals.length > 0 ? (
                    filteredApprovals.map((req) => (
                      <tr 
                        key={req.id} 
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedBooking(req)}
                      >
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(req.id)}
                            onChange={() => toggleSelect(req.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-black text-gray-900 block">{req.id}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{formatDateShort(req.submittedAt)}</span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-[#311171] font-black flex items-center justify-center text-xs shrink-0">
                              {req.requester?.[0] || "U"}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 leading-tight">{req.requester}</p>
                              <p className="text-[10px] text-gray-500 font-bold leading-tight mt-0.5">{req.requesterFaculty}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-800 flex items-center gap-1">
                            <Calendar size={12} className="text-purple-600" />
                            {formatDateShort(req.startAt)}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {formatTimeOnly(req.startAt)} - {formatTimeOnly(req.endAt)} น.
                          </p>
                        </td>

                        <td className="py-4 px-4 max-w-[200px]">
                          <p className="font-black text-gray-900 truncate">{req.destination}</p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{req.purpose}</p>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-purple-50 text-[#311171] font-black text-xs">
                            {req.passengers} คน
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-800 text-[11px]">
                            🚗 {req.assignedVanPlate || "ยังไม่ระบุรถ"}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                            👤 {req.assignedDriverName || "ยังไม่ระบุคนขับ"}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {req.status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-black text-[11px]">
                              <CheckCircle2 size={12} /> อนุมัติแล้ว
                            </span>
                          )}
                          {req.status === "REJECTED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-black text-[11px]">
                              <XCircle size={12} /> ไม่อนุมัติ
                            </span>
                          )}
                          {(req.status === "WAITING_EXEC" || req.status === "WAITING_ADMIN") && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-black text-[11px]">
                              <Clock size={12} /> รอพิจารณา
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {(req.status === "WAITING_EXEC" || req.status === "WAITING_ADMIN") ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => updateStatus(req.id, "REJECTED")}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all border border-red-100"
                                title="ไม่อนุมัติ"
                              >
                                <X size={15} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => updateStatus(req.id, "APPROVED")}
                                className="px-3 py-1.5 bg-[#311171] hover:bg-[#250d55] text-white rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1"
                              >
                                <Check size={14} strokeWidth={3} /> อนุมัติ
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedBooking(req)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1 mx-auto"
                            >
                              <Eye size={13} /> รายละเอียด
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400 font-bold">
                        ไม่พบรายการคำขอใช้รถตู้ตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🌟 Content View 2: Grid View (Matching Attached Mockup Image 3) */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredApprovals.map((req) => (
              <div 
                key={req.id} 
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
                onClick={() => setSelectedBooking(req)}
              >
                <div>
                  {/* Card Top Header */}
                  <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                    <span className="font-black text-xs text-[#311171] bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100">
                      {req.id}
                    </span>
                    {req.status === "APPROVED" && (
                      <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-black text-[11px] flex items-center gap-1">
                        <CheckCircle2 size={12} /> อนุมัติแล้ว
                      </span>
                    )}
                    {req.status === "REJECTED" && (
                      <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-black text-[11px] flex items-center gap-1">
                        <XCircle size={12} /> ไม่อนุมัติ
                      </span>
                    )}
                    {(req.status === "WAITING_EXEC" || req.status === "WAITING_ADMIN") && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-black text-[11px] flex items-center gap-1">
                        <Clock size={12} /> รอพิจารณา
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#311171] font-black flex items-center justify-center text-sm shrink-0">
                        {req.requester?.[0] || "U"}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 text-sm leading-snug">{req.requester}</h4>
                        <p className="text-xs text-gray-500 font-bold mt-0.5">{req.requesterFaculty}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-400 flex items-center gap-1">
                          <MapPin size={12} className="text-purple-600" /> ปลายทาง:
                        </span>
                        <span className="font-black text-gray-900 truncate max-w-[150px]">{req.destination}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-400 flex items-center gap-1">
                          <Calendar size={12} className="text-purple-600" /> เดินทาง:
                        </span>
                        <span className="font-bold text-gray-800">{formatDateShort(req.startAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-400 flex items-center gap-1">
                          <Users size={12} className="text-purple-600" /> ผู้โดยสาร:
                        </span>
                        <span className="font-black text-[#311171]">{req.passengers} คน</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-bold text-gray-400">ข้อมูลจัดสรร:</p>
                      <p className="font-bold text-gray-800">🚗 {req.assignedVanPlate || "ยังไม่ระบุรถ"}</p>
                      <p className="font-bold text-gray-800">👤 {req.assignedDriverName || "ยังไม่ระบุคนขับ"}</p>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {(req.status === "WAITING_EXEC" || req.status === "WAITING_ADMIN") ? (
                    <>
                      <button
                        onClick={() => updateStatus(req.id, "REJECTED")}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-all border border-red-100 flex items-center justify-center gap-1"
                      >
                        <XCircle size={14} /> ไม่อนุมัติ
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, "APPROVED")}
                        className="flex-1 py-2 bg-[#311171] hover:bg-[#250d55] text-white rounded-xl font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={14} /> อนุมัติ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedBooking(req)}
                      className="w-full py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs border border-gray-200 transition-all flex items-center justify-center gap-1"
                    >
                      <Eye size={14} /> ดูรายละเอียดคำขอ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🌟 Sleek Side Drawer Panel for Request Details (Matching Attached Mockup Image 2) */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
              className="fixed inset-0" 
              onClick={() => setSelectedBooking(null)}
            />
            
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 z-10">
              
              <div>
                {/* Drawer Header */}
                <div className="p-6 bg-gradient-to-r from-[#2e0e64] to-[#451893] text-white flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold border border-white/20">
                      เลขที่: {selectedBooking.id}
                    </span>
                    <h3 className="text-xl font-black mt-3">{selectedBooking.destination}</h3>
                    <p className="text-xs text-purple-200 mt-1">
                      ยื่นคำขอเมื่อ: {formatDate(selectedBooking.submittedAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Content Details */}
                <div className="p-6 space-y-6">
                  
                  {/* Requester Info Card */}
                  <div className="flex items-center gap-4 bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
                    <div className="w-12 h-12 rounded-2xl bg-[#311171] text-white font-black flex items-center justify-center text-lg shrink-0">
                      {selectedBooking.requester?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">ผู้ขออนุญาตใช้รถ</p>
                      <p className="text-base font-black text-gray-900">{selectedBooking.requester}</p>
                      <p className="text-xs font-bold text-[#311171] mt-0.5">{selectedBooking.requesterFaculty}</p>
                    </div>
                  </div>

                  {/* Travel Schedule Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">รายละเอียดการเดินทาง</h4>
                    
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-200/60 text-xs">
                        <div>
                          <p className="text-gray-400 font-bold">วันเดินทางออก</p>
                          <p className="font-black text-gray-900 mt-0.5">{formatDate(selectedBooking.startAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-bold">วันเดินทางกลับ</p>
                          <p className="font-black text-gray-900 mt-0.5">{formatDate(selectedBooking.endAt)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400 font-bold">จำนวนผู้โดยสาร</p>
                          <p className="font-black text-[#311171] mt-0.5">{selectedBooking.passengers} คน</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-bold">วัตถุประสงค์</p>
                          <p className="font-black text-gray-900 mt-0.5">{selectedBooking.purpose}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Allocated Fleet Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">ข้อมูลการจัดสรรรถตู้และคนขับ</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400">ทะเบียนรถตู้</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">
                          {selectedBooking.assignedVanPlate || "ยังไม่ระบุ"}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400">พนักงานขับรถ</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">
                          {selectedBooking.assignedDriverName || "ยังไม่ระบุ"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attached Documents */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">เอกสารประกอบคำขอ</h4>
                    <button className="w-full p-3 bg-gray-50 hover:bg-purple-50/60 border border-gray-200 rounded-2xl text-xs font-bold text-[#311171] flex items-center justify-between transition-colors">
                      <span className="flex items-center gap-2">
                        <FileText size={16} /> เอกสารหนังสือขออนุญาตใช้รถตู้ (.pdf)
                      </span>
                      <span className="text-[10px] bg-purple-100 px-2 py-0.5 rounded-md font-black">เปิดดู</span>
                    </button>
                  </div>

                  {/* Reject Reason Input (If Reject toggled) */}
                  {showRejectInput && (
                    <div className="space-y-2 pt-2 animate-in fade-in">
                      <label className="block text-xs font-bold text-red-600">โปรดระบุเหตุผลที่ไม่อนุมัติ</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="เช่น รถตู้ไม่เพียงพอ หรือพนักงานขับรถติดภารกิจอื่น..."
                        className="w-full p-3 bg-red-50/50 border border-red-200 rounded-2xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 h-20 resize-none"
                      />
                    </div>
                  )}

                </div>
              </div>

              {/* Drawer Bottom Action Buttons */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-2">
                {(selectedBooking.status === "WAITING_EXEC" || selectedBooking.status === "WAITING_ADMIN") ? (
                  showRejectInput ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-2xl text-xs transition-all"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => updateStatus(selectedBooking.id, "REJECTED", rejectReason)}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-xs transition-all shadow-sm"
                      >
                        ยืนยันไม่อนุมัติ
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="py-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={16} /> ไม่อนุมัติ
                      </button>
                      <button
                        onClick={() => updateStatus(selectedBooking.id, "APPROVED")}
                        className="py-3.5 bg-[#311171] hover:bg-[#250d55] text-white rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={16} /> อนุมัติคำขอ
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center text-xs font-bold text-gray-500">
                    คำขอนี้ดำเนินการเสร็จสิ้นแล้ว ({selectedBooking.status === "APPROVED" ? "อนุมัติเรียบร้อย" : "ไม่อนุมัติ"})
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
