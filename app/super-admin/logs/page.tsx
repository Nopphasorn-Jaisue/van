"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileSignature, Search, Filter, History, User, AlertCircle, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getAuditLogs } from '@/app/actions/audit';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

type AuditLogItem = {
  id: number;
  action: string;
  target: string | null;
  type: string;
  createdAt: Date;
  user: { name: string; role: string } | null;
};

export default function SuperAdminLogs() {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await getAuditLogs(search);
      setLogs(data);
      setLoading(false);
    };
    
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [search]);

  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500 font-bold">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500 font-bold">ไม่พบประวัติการใช้งาน</td>
                </tr>
              ) : paginatedLogs.map((log) => (
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
                    {log.user ? `${log.user.name} (${log.user.role})` : '-'}
                  </td>
                  <td className="py-4 px-6 align-middle text-gray-600">
                    {log.target || '-'}
                  </td>
                  <td className="py-4 px-6 align-middle text-right text-gray-400 font-bold">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: th })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div>แสดง {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ</div>
          <div className="flex items-center gap-2">
            <span>แสดงต่อหน้า:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold ${
                    currentPage === i + 1 
                      ? "bg-[#311171] text-white" 
                      : "border border-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

