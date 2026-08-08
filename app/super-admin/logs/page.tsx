"use client";

import React, { useState } from 'react';
import { 
  FileSignature, Search, Filter, History, User, AlertCircle, Settings
} from 'lucide-react';

export default function SuperAdminLogs() {
  const [search, setSearch] = useState("");

  const mockLogs = [
    { id: 1, action: "ลบผู้ใช้งานระบบ", user: "นายกฤษฎา วงศ์ไชย (Super Admin)", target: "นายสมชาย (Faculty Admin)", time: "10 นาทีที่แล้ว", type: "danger" },
    { id: 2, action: "เพิ่มสิทธิ์การเข้าถึง", user: "นายกฤษฎา วงศ์ไชย (Super Admin)", target: "นางสาวจิราภรณ์ (Faculty Admin)", time: "1 ชั่วโมงที่แล้ว", type: "warning" },
    { id: 3, action: "อนุมัติคำขอใช้รถตู้", user: "นางสาวจิราภรณ์ (Faculty Admin)", target: "คำขอ UP-6705-001", time: "2 ชั่วโมงที่แล้ว", type: "success" },
    { id: 4, action: "เข้าสู่ระบบ", user: "นายพงศ์พัฒนา (User)", target: "ระบบจองรถตู้", time: "เมื่อวานนี้ 15:30", type: "info" },
    { id: 5, action: "เปลี่ยนรหัสผ่าน", user: "นางสาวอัญชนา (Executive)", target: "บัญชีส่วนตัว", time: "25 พ.ค. 2567 09:00", type: "info" },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in pb-6 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent p-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2.5 bg-[#311171] text-white rounded-[14px]">
              <FileSignature size={24} strokeWidth={2.5} />
            </div>
            ประวัติการใช้งานระบบ (Audit Logs)
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            บันทึกประวัติการกระทำทั้งหมดภายในระบบ เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ, การกระทำ..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#311171]/20 outline-none w-full sm:w-64 transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            <Filter size={18} />
            <span>ตัวกรอง</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-[12px] font-bold text-gray-500 border-b border-gray-100 sticky top-0">
                <th className="py-4 px-6 font-bold w-1/4">การกระทำ</th>
                <th className="py-4 px-6 font-bold w-1/4">ผู้ดำเนินการ</th>
                <th className="py-4 px-6 font-bold w-1/4">เป้าหมาย</th>
                <th className="py-4 px-6 font-bold w-1/4 text-right">เวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[13px] font-medium">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="py-4 px-6 align-middle">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        log.type === 'danger' ? 'bg-rose-100 text-rose-600' :
                        log.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                        log.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-sky-100 text-sky-600'
                      }`}>
                        {log.type === 'danger' && <AlertCircle size={16} strokeWidth={2.5} />}
                        {log.type === 'warning' && <Settings size={16} strokeWidth={2.5} />}
                        {log.type === 'success' && <History size={16} strokeWidth={2.5} />}
                        {log.type === 'info' && <User size={16} strokeWidth={2.5} />}
                      </div>
                      <span className="font-bold text-gray-900">{log.action}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 align-middle text-gray-600">
                    {log.user}
                  </td>
                  <td className="py-4 px-6 align-middle text-gray-600">
                    {log.target}
                  </td>
                  <td className="py-4 px-6 align-middle text-right text-gray-400 font-bold">
                    {log.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-gray-500">แสดง 1 ถึง 5 จาก 1,240 รายการ</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-400 cursor-not-allowed">ก่อนหน้า</button>
            <button className="px-3 py-1.5 bg-[#311171] text-white rounded-lg text-xs font-bold shadow-sm">1</button>
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50">2</button>
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50">3</button>
            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50">ถัดไป</button>
          </div>
        </div>

      </div>

    </div>
  );
}

