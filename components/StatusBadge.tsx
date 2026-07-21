import React from "react";

export default function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string, style: string }> = {
    APPROVED: { label: "อนุมัติแล้ว", style: "bg-green-100 text-green-800 border-green-200" },
    PENDING: { label: "รออนุมัติ", style: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    WAITING_DMS: { label: "รอเอกสาร DMS", style: "bg-blue-100 text-blue-800 border-blue-200" },
    MAINTENANCE: { label: "รถซ่อมบำรุง", style: "bg-red-100 text-red-800 border-red-200" }
  };
  
  // ถ้า Status ที่ส่งมาไม่ตรงกับ 4 ตัวข้างบน จะใช้สีเทาเป็นค่าเริ่มต้น
  const current = config[status] || { label: status, style: "bg-gray-100 text-gray-800 border-gray-200" };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${current.style}`}>
      {current.label}
    </span>
  );
}




// type StatusBadgeProps = {
//   status: string;
// };

// const statusMap: Record<string, string> = {
//   DRAFT: "แบบร่าง",
//   SUBMITTED: "ส่งคำขอแล้ว",
//   WAITING_PROVIDER_REVIEW: "รอคณะเจ้าของรถตรวจสอบ",
//   WAITING_DMS_APPROVAL: "รออนุมัติใน DMS",
//   APPROVED: "อนุมัติแล้ว",
//   REJECTED: "ไม่อนุมัติ",
//   CANCELLED: "ยกเลิก",
//   COMPLETED: "เสร็จสิ้น",
// };

// export default function StatusBadge({ status }: StatusBadgeProps) {
//   return (
//     <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
//       {statusMap[status] || status}
//     </span>
//   );
// }