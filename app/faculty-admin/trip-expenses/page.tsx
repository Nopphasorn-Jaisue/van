"use client";

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  FilePlus, Search, CheckCircle, XCircle, AlertCircle, Receipt, CarFront, Plus, X, Trash2, Edit
} from 'lucide-react';

interface ExpenseData {
  id: number | string;
  category?: string;
  type?: string;
  amount: number;
  status: string;
  remark?: string;
  receiptUrl?: string;
  createdAt?: string;
  driverLog?: {
    driver?: {
      user?: {
        name?: string;
      };
      assignedVan?: {
        plate?: string;
      };
    };
    booking?: {
      destination?: string;
    };
  };
}

export default function FacultyTripExpenses() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    driverName: 'นายสมชาย ใจดี',
    vanPlate: 'นข 6789 พะเยา',
    destination: 'อ.เชียงคำ จ.พะเยา',
    category: 'น้ำมันเชื้อเพลิง',
    amount: '',
    remark: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faculty-admin/expenses');
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          if (data.success && Array.isArray(data.expenses)) {
            setExpenses(data.expenses);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      driverName: 'นายสมชาย ใจดี',
      vanPlate: 'นข 6789 พะเยา',
      destination: 'อ.เชียงคำ จ.พะเยา',
      category: 'น้ำมันเชื้อเพลิง',
      amount: '',
      remark: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: ExpenseData) => {
    setEditingId(exp.id);
    setFormData({
      driverName: exp.driverLog?.driver?.user?.name || 'นายสมชาย ใจดี',
      vanPlate: exp.driverLog?.driver?.assignedVan?.plate || 'นข 6789 พะเยา',
      destination: exp.driverLog?.booking?.destination || 'อ.เชียงคำ จ.พะเยา',
      category: exp.category || exp.type || 'น้ำมันเชื้อเพลิง',
      amount: String(exp.amount || ''),
      remark: exp.remark || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      id: editingId || undefined,
      category: formData.category,
      type: formData.category,
      amount: Number(formData.amount) || 0,
      remark: formData.remark,
      status: 'PENDING',
      driverLog: {
        driver: {
          user: { name: formData.driverName },
          assignedVan: { plate: formData.vanPlate }
        },
        booking: {
          destination: formData.destination
        }
      }
    };

    try {
      if (editingId) {
        setExpenses(expenses.map(e => String(e.id) === String(editingId) ? {
          ...e,
          category: formData.category,
          type: formData.category,
          amount: Number(formData.amount) || 0,
          remark: formData.remark,
          driverLog: {
            driver: {
              user: { name: formData.driverName },
              assignedVan: { plate: formData.vanPlate }
            },
            booking: {
              destination: formData.destination
            }
          }
        } : e));
        setIsModalOpen(false);
      } else {
        const res = await fetch('/api/faculty-admin/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          fetchExpenses();
        }
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number | string, status: 'APPROVED' | 'REJECTED') => {
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
          String(exp.id) === String(id) ? { ...exp, status } : exp
        ));
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteExpense = async (id: number | string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการเบิกนี้?")) return;
    try {
      await fetch(`/api/faculty-admin/expenses?id=${id}`, { method: 'DELETE' });
      setExpenses(expenses.filter(e => String(e.id) !== String(id)));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const searchString = searchQuery.toLowerCase();
    const driverName = exp.driverLog?.driver?.user?.name?.toLowerCase() || '';
    const category = (exp.category || exp.type || '').toLowerCase();
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
      <div className="w-full space-y-6 pb-20 animate-in fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efeaff] text-[#311171] text-xs font-bold mb-3">
              <FilePlus size={14} /> เบิกค่าใช้จ่ายรายทริป
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">รายการขอเบิกค่าใช้จ่าย</h1>
            <p className="text-gray-500 mt-1">ตรวจสอบ บันทึก และอนุมัติค่าใช้จ่ายที่เกิดจากการวิ่งงานของคนขับ</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder="ค้นหาชื่อคนขับ, ประเภทค่าใช้จ่าย..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shrink-0 transition-all"
            >
              <Plus size={16} />
              <span>เพิ่มรายการเบิก</span>
            </button>
          </div>
        </div>

        {/* List */}
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
                    <th className="px-6 py-4 whitespace-nowrap">ประเภทรายการ / ปลายทาง</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">จำนวนเงิน (บาท)</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">สถานะ</th>
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
                          <span className="font-bold text-gray-900">{exp.category || exp.type || "ค่าใช้จ่ายทั่วไป"}</span>
                          <span className="text-xs text-gray-500">
                            {exp.driverLog?.booking?.destination || "ไม่ระบุทริป"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-lg text-[#311171]">
                          ฿{exp.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(exp.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {exp.status === 'PENDING' && (
                            <>
                              <button
                                disabled={updatingId === exp.id}
                                onClick={() => handleUpdateStatus(exp.id, 'APPROVED')}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                              >
                                อนุมัติ
                              </button>
                              <button
                                disabled={updatingId === exp.id}
                                onClick={() => handleUpdateStatus(exp.id, 'REJECTED')}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all"
                              >
                                ไม่อนุมัติ
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="แก้ไขรายการ"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="ลบรายการ"
                          >
                            <Trash2 size={16} />
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

      {/* Modal: เพิ่ม/แก้ไข รายการเบิก */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#311171] text-white">
              <div className="flex items-center gap-2">
                <FilePlus size={18} />
                <h3 className="font-bold text-base">{editingId ? 'แก้ไขรายการขอเบิกค่าใช้จ่าย' : 'บันทึกขอเบิกค่าใช้จ่าย'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ชื่อพนักงานขับรถ</label>
                  <select 
                    value={formData.driverName}
                    onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  >
                    <option value="นายสมชาย ใจดี">นายสมชาย ใจดี</option>
                    <option value="นายอนุชา คำมี">นายอนุชา คำมี</option>
                    <option value="นายวิชัย แสนดี">นายวิชัย แสนดี</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ทะเบียนรถตู้</label>
                  <select 
                    value={formData.vanPlate}
                    onChange={e => setFormData({ ...formData, vanPlate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  >
                    <option value="นข 6789 พะเยา">นข 6789 พะเยา</option>
                    <option value="นข 1122 พะเยา">นข 1122 พะเยา</option>
                    <option value="นข 2233 พะเยา">นข 2233 พะเยา</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ประเภทรายการเบิก</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                >
                  <option value="น้ำมันเชื้อเพลิง">น้ำมันเชื้อเพลิง</option>
                  <option value="ค่าทางด่วน / ค่ายานพาหนะ">ค่าทางด่วน / ค่ายานพาหนะ</option>
                  <option value="ค่าที่พักพนักงานขับรถ">ค่าที่พักพนักงานขับรถ</option>
                  <option value="ค่าซ่อมแซมฉุกเฉินระหว่างทริป">ค่าซ่อมแซมฉุกเฉินระหว่างทริป</option>
                  <option value="ค่าใช้จ่ายอื่นๆ">ค่าใช้จ่ายอื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">สถานที่ / ทริปที่เดินทาง</label>
                <input 
                  type="text"
                  value={formData.destination}
                  onChange={e => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="เช่น อ.เชียงคำ, มหาวิทยาลัยเชียงใหม่"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">จำนวนเงิน (บาท)</label>
                <input 
                  required
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="เช่น 1500"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <input 
                  type="text"
                  value={formData.remark}
                  onChange={e => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="เช่น เติมน้ำมันดีเซล B7 ปั๊ม PTT"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#311171] text-white font-bold rounded-xl hover:bg-[#230b54] shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}
