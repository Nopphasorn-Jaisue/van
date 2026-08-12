"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import DashboardLoader from "@/components/DashboardLoader";
import { Check, Clock, Calendar, MapPin, Users, CheckCircle2, Loader2, Sparkles, X, UserPlus, CheckSquare, XSquare } from "lucide-react";
import type { SystemBooking } from "@/lib/booking-system-types";
import { getAuthUser } from "@/app/actions/auth";

function formatDate(dateText: string) {
  if (!dateText) return "-";
  return new Date(dateText).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DeanDashboardPage() {
  const [approvals, setApprovals] = useState<SystemBooking[]>([]);
  const [stats, setStats] = useState({
    inFaculty: 0,
    outFaculty: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasFaculty, setHasFaculty] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Reject Modal State
  const [rejectingBooking, setRejectingBooking] = useState<SystemBooking | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const user = await getAuthUser();
      if (!user?.faculty?.nameTh) {
        setIsLoading(false);
        setHasFaculty(false);
        setApprovals([]);
        // We could alert here, but setting empty and stopping is safe.
        return;
      }
      setHasFaculty(true);
      const deanFaculty = user.faculty.nameTh;
      const response = await fetch("/api/bookings", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        const allBookings: SystemBooking[] = data.bookings || [];
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate stats for current month
        let inFaculty = 0;
        let outFaculty = 0;
        let approved = 0;
        let rejected = 0;

        allBookings.forEach(b => {
          // Fallback to startAt if submittedAt doesn't exist (though it should)
          const bookingDate = new Date(b.submittedAt || b.startAt);
          if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
            if (b.requesterFaculty === deanFaculty) {
              inFaculty++;
            } else {
              outFaculty++;
            }

            if (b.status === "APPROVED" || b.status === "COMPLETED") {
              approved++;
            } else if (b.status === "REJECTED") {
              rejected++;
            }
          }
        });

        setStats({ inFaculty, outFaculty, approved, rejected });

        // Filter only those waiting for EXECUTIVE approval
        const pending = allBookings.filter((b) => b.status === "WAITING_EXEC");
        setApprovals(pending);
      }
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleApprove = async (bookingId: string) => {
    if (!window.confirm("ยืนยันการอนุมัติคำขอใช้รถตู้รายการนี้?")) return;
    
    setProcessingId(bookingId);
    try {
      await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", reason: "อนุมัติโดยคณบดี" }),
      });
      await loadApprovals();
    } catch (error) {
      console.error("Failed to approve:", error);
      alert("เกิดข้อผิดพลาดในการอนุมัติ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingBooking) return;
    if (!rejectReason.trim()) {
      alert("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
      return;
    }
    
    setProcessingId(rejectingBooking.id);
    try {
      await fetch(`/api/bookings/${rejectingBooking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", reason: rejectReason }),
      });
      setRejectingBooking(null);
      setRejectReason("");
      await loadApprovals();
    } catch (error) {
      console.error("Failed to reject:", error);
      alert("เกิดข้อผิดพลาดในการปฏิเสธ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
        
        {/* Header & Stats */}
        <div className="bg-gradient-to-br from-[#311171] to-[#4a1c99] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles size={120} />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2 tracking-tight">ภาพรวมประจำเดือนนี้</h1>
            <p className="text-purple-200 font-medium text-sm max-w-lg mb-8">
              สรุปสถิติการขอใช้รถตู้ของคณะ และสถานะการพิจารณาคำขอ
            </p>
            
            {/* Stats Row */}
            {!hasFaculty && (
              <div className="bg-red-500/20 text-red-100 p-4 rounded-xl border border-red-500/30 mb-6">
                <strong>ไม่พบข้อมูลคณะต้นสังกัดของคุณ</strong> ระบบไม่สามารถแสดงคำขอที่ต้องอนุมัติได้
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 text-purple-200 mb-2">
                  <Users size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">ขอโดยคนในคณะ</span>
                </div>
                <p className="text-3xl font-black">{stats.inFaculty} <span className="text-sm font-medium text-purple-200">คน</span></p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 text-purple-200 mb-2">
                  <UserPlus size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">ขอโดยคนนอกคณะ</span>
                </div>
                <p className="text-3xl font-black">{stats.outFaculty} <span className="text-sm font-medium text-purple-200">คน</span></p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 text-emerald-300 mb-2">
                  <CheckSquare size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">อนุมัติแล้ว</span>
                </div>
                <p className="text-3xl font-black">{stats.approved} <span className="text-sm font-medium text-emerald-200">ครั้ง</span></p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <div className="flex items-center gap-2 text-rose-300 mb-2">
                  <XSquare size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">ไม่อนุมัติ</span>
                </div>
                <p className="text-3xl font-black">{stats.rejected} <span className="text-sm font-medium text-rose-200">ครั้ง</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals List */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Clock className="text-[#311171]" /> รายการรอพิจารณา 
            <span className="bg-purple-100 text-[#311171] px-2 py-0.5 rounded-full text-sm">{approvals.length}</span>
          </h2>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <DashboardLoader text="กำลังตรวจสอบรายการค้างพิจารณา..." />
            </div>
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-4 opacity-50" />
              <h3 className="text-xl font-black text-gray-800">ไม่มีรายการค้างพิจารณา</h3>
              <p className="text-gray-500 mt-2 text-sm font-medium">คุณได้จัดการคำขอทั้งหมดเรียบร้อยแล้ว</p>
            </div>
          ) : (
            approvals.map((booking) => (
              <div 
                key={booking.id}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/40 transition-all hover:shadow-2xl hover:shadow-purple-200/50 flex flex-col lg:flex-row gap-6 items-center"
              >
                <div className="flex-1 w-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 tracking-wider">
                        <Clock size={12} strokeWidth={3} />
                        ต้องการพิจารณา
                      </span>
                      <h3 className="text-lg font-black text-gray-900 mt-3 leading-tight">{booking.purpose}</h3>
                      <p className="text-sm font-bold text-[#311171] mt-1">ผู้ขอ: {booking.requester} • สังกัด: {booking.requesterFaculty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Calendar size={14} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">วันที่เดินทาง</p>
                        <p className="text-sm font-bold text-gray-700">{formatDate(booking.startAt)}</p>
                        <p className="text-xs text-gray-500">ถึง {formatDate(booking.endAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <MapPin size={14} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">สถานที่</p>
                        <p className="text-sm font-bold text-gray-700">{booking.destination}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Users size={12} /> ผู้โดยสาร {booking.passengers} คน
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-auto shrink-0 flex flex-row lg:flex-col gap-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-5 lg:pt-0 lg:pl-6 justify-center">
                  <button
                    disabled={processingId === booking.id}
                    onClick={() => handleApprove(booking.id)}
                    className="flex-1 lg:w-40 bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all"
                  >
                    {processingId === booking.id ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={20} strokeWidth={3} />
                        อนุมัติ
                      </>
                    )}
                  </button>
                  <button
                    disabled={processingId === booking.id}
                    onClick={() => setRejectingBooking(booking)}
                    className="flex-1 lg:w-40 bg-rose-50 hover:bg-rose-100 text-rose-600 active:scale-95 disabled:opacity-50 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-rose-200"
                  >
                    <X size={20} strokeWidth={3} />
                    ไม่อนุมัติ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Reject Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 bg-rose-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XSquare size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">ไม่อนุมัติคำขอ</h3>
                <p className="text-xs font-bold text-gray-500">{rejectingBooking.purpose}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ระบุเหตุผลที่ไม่อนุมัติ <span className="text-rose-500">*</span></label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none h-24"
                  placeholder="เช่น รถตู้ไม่ว่าง, อยู่นอกเหนือเขตพื้นที่ให้บริการ, ข้อมูลไม่ครบถ้วน..."
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setRejectingBooking(null);
                  setRejectReason("");
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                disabled={processingId !== null}
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectReason.trim() || processingId !== null}
                className="px-5 py-2.5 rounded-xl font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {processingId === rejectingBooking.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <X size={18} strokeWidth={3} />
                )}
                ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
