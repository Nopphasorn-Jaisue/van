"use client";
import React, { useState } from 'react';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserBookingActionsProps {
  bookingId: string;
  canEdit: boolean;
  canCancel: boolean;
}

export default function UserBookingActions({ bookingId, canEdit, canCancel }: UserBookingActionsProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    const confirmCancel = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอจอง #${bookingId}?`);
    if (!confirmCancel) return;

    try {
      setIsCancelling(true);
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', reason: 'ผู้ใช้งานขอยกเลิกการจอง' })
      });

      if (res.ok) {
        alert('ยกเลิกคำขอจองสำเร็จ');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการยกเลิกคำขอ');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleEdit = () => {
    router.push(`/bookings/new?edit=${bookingId}`);
  };

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
      {canEdit && (
        <button
          type="button"
          onClick={handleEdit}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-50 text-[#311171] hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors shadow-2xs"
        >
          <Edit size={13} />
          <span>แก้ไขการจอง</span>
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          disabled={isCancelling}
          onClick={handleCancel}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
        >
          {isCancelling ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          <span>{isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิกคำขอ'}</span>
        </button>
      )}
    </div>
  );
}
