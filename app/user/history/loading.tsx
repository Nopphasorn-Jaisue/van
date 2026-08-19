import React from 'react';
import AppShell from '@/components/AppShell';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#311171] animate-spin mb-4" />
        <h3 className="text-xl font-bold text-gray-900">กำลังโหลดประวัติการจอง...</h3>
        <p className="text-gray-500 mt-2">กรุณารอสักครู่ ระบบกำลังดึงข้อมูล</p>
      </div>
    </AppShell>
  );
}
