"use client";

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  FilePlus, Search, CheckCircle, XCircle, AlertCircle, Receipt, CarFront
} from 'lucide-react';

interface ExpenseData {
  id: number;
  category: string;
  amount: number;
  status: string;
  remark?: string;
  imgUrl?: string;
  driverLog?: {
    driver?: {
      user?: {
        name?: string;
      };
      assignedVan?: {
        plate?: string;
      };
    };
  };
}

export default function FacultyTripExpenses() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faculty-admin/expenses');
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/faculty-admin/expenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expenseId: id, status })
      });
      
      const data = await res.json();
      if (data.success) {
        setExpenses(expenses.map(exp => 
          exp.id === id ? { ...exp, status } : exp
        ));
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const searchString = searchQuery.toLowerCase();
    const driverName = exp.driverLog?.driver?.user?.name?.toLowerCase() || '';
    const category = exp.category?.toLowerCase() || '';
    const vanPlate = exp.driverLog?.driver?.assignedVan?.plate?.toLowerCase() || '';
    
    return driverName.includes(searchString) || 
           category.includes(searchString) ||
           vanPlate.includes(searchString);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
            <CheckCircle size={12} /> อนุมัติแล้ว
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            <XCircle size={12} /> ไม่อนุมัติ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-200">
            <AlertCircle size={12} /> รอตรวจสอบ
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efeaff] text-[#311171] text-xs font-bold mb-3">
              <FilePlus size={14} /> เบิกค่าใช้จ่ายรายทริป
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">รายการขอเบิกค่าใช้จ่าย</h1>
            <p className="text-gray-500 mt-1">ตรวจสอบและอนุมัติค่าใช้จ่ายที่เกิดจากการวิ่งงานของคนขับ</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="ค้นหาชื่อคนขับ, ประเภทค่าใช้จ่าย..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] outline-none transition-all shadow-sm"
            />
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171]"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Receipt className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">ไม่มีรายการขอเบิก</h3>
            <p className="text-gray-500 text-sm max-w-md">ยังไม่มีข้อมูลการเบิกค่าใช้จ่ายของคนขับในคณะ หรือไม่พบข้อมูลที่ค้นหา</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">พนักงานขับรถ</th>
                    <th className="px-6 py-4 whitespace-nowrap">ประเภทรายการ</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">จำนวนเงิน (บาท)</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">สถานะ</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">หลักฐาน</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                            {exp.driverLog?.driver?.user?.name?.charAt(0) || "ด"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{exp.driverLog?.driver?.user?.name || "ไม่ระบุ"}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <CarFront size={10} />
                              {exp.driverLog?.driver?.assignedVan?.plate || "ไม่ระบุทะเบียน"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{exp.category}</span>
                          {exp.remark && <span className="text-xs text-gray-500 max-w-[200px] truncate">{exp.remark}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-[#311171] text-base">{exp.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(exp.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {exp.imgUrl ? (
                          <a 
                            href={exp.imgUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#311171] hover:underline text-xs font-bold"
                          >
                            <Receipt size={14} /> ดูใบเสร็จ
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">ไม่มีไฟล์แนบ</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={updatingId === exp.id || exp.status === 'APPROVED'}
                            onClick={() => handleUpdateStatus(exp.id, 'APPROVED')}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="อนุมัติ"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            disabled={updatingId === exp.id || exp.status === 'REJECTED'}
                            onClick={() => handleUpdateStatus(exp.id, 'REJECTED')}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="ไม่อนุมัติ"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
