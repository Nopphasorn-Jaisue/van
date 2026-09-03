import React from "react";

export default function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string, style: string }> = {
    APPROVED: { label: "อนุมัติแล้ว", style: "bg-green-100 text-green-800 border-green-200" },
    PENDING: { label: "รออนุมัติ", style: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    WAITING_PROVIDER_REVIEW: { label: "รอการยืนยันจากคณะเจ้าของรถ", style: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    pending_cross_faculty: { label: "รอการยืนยันจากคณะเจ้าของรถ", style: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    WAITING_ADMIN: { label: "รอแอดมินคณะอนุมัติ", style: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    WAITING_EXEC: { label: "รอคณบดีอนุมัติ", style: "bg-orange-100 text-orange-700 border-orange-200" },
    WAITING_DMS: { label: "รอเอกสาร DMS", style: "bg-blue-100 text-blue-800 border-blue-200" },
    MAINTENANCE: { label: "รถซ่อมบำรุง", style: "bg-red-100 text-red-800 border-red-200" }
  };
  
  const current = config[status] || { label: status, style: "bg-yellow-100 text-yellow-800 border-yellow-300" };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${current.style}`}>
      {current.label}
    </span>
  );
}
