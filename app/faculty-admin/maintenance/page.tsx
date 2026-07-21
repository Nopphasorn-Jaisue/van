"use client";
import React from 'react';
import AppShell from '@/components/AppShell';

export default function Page() {
  return (
    <AppShell>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[calc(100vh-120px)] flex flex-col">
        <h2 className="text-xl font-black text-gray-900 mb-2">จัดการซ่อมบำรุง</h2>
        <p className="text-sm text-gray-500 mb-6">บันทึกและติดตามประวัติการซ่อมบำรุงรถตู้</p>
        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-8">
           <p className="text-gray-400 font-medium">เนื้อหาจัดการซ่อมบำรุงจะแสดงที่นี่..</p>
        </div>
      </div>
    </AppShell>
  );
}
