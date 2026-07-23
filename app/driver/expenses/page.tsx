"use client";

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, CheckCircle, 
  Clock, XCircle, Search, Plus, Trash2, Camera, UploadCloud,
  Car, Tag
} from 'lucide-react';
import { getAssignedBookings, getDriverExpensesHistory, submitTripExpenses } from '@/app/actions/driver';

interface ExpenseItem {
  id: string;
  category: string;
  amount: string;
  remark: string;
  imagePreview?: string;
}

interface AssignedTripData {
  id: string;
  destination: string;
  departureDate: string | Date;
  objective: string;
  requester?: {
    name: string;
  };
  driverLog: {
    id: number;
  } | null;
}

interface ExpenseResponseData {
  id: string | number;
  createdAt: string | Date;
  category: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remark?: string | null;
  driverLog: {
    bookingId: string;
    booking: {
      destination: string;
    }
  };
}

interface ExpenseRecord {
  id: string;
  bookingId: string;
  tripName: string;
  date: string;
  category: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remark?: string | null;
}

export default function DriverExpensesPage() {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [selectedTrip, setSelectedTrip] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Search & Filter for History
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [assignedTrips, setAssignedTrips] = useState<AssignedTripData[]>([]);
  const [historyList, setHistoryList] = useState<ExpenseRecord[]>([]);

  // Dynamic Expense Items
  const [items, setItems] = useState<ExpenseItem[]>([
    { id: '1', category: 'ค่าน้ำมัน', amount: '', remark: '', imagePreview: '' }
  ]);

  useEffect(() => {
    async function loadData() {
      // Mock driverId = 1
      const resTrips = await getAssignedBookings(1);
      const resExp = await getDriverExpensesHistory(1);

      if (resTrips.success && resTrips.bookings) {
        // กรองเฉพาะทริปที่มี DriverLog แล้ว จึงจะเบิกได้
        const readyForExpense = resTrips.bookings.filter((b: AssignedTripData) => b.driverLog);
        setAssignedTrips(readyForExpense);
        if (readyForExpense.length > 0) {
          setSelectedTrip(readyForExpense[0].id);
        }
      }

      if (resExp.success && resExp.expenses) {
        const mapped = resExp.expenses.map((e: ExpenseResponseData) => ({
          id: `EXP-${e.id}`,
          bookingId: e.driverLog.bookingId,
          tripName: e.driverLog.booking.destination,
          date: new Date(e.createdAt).toLocaleDateString('th-TH'),
          category: e.category,
          amount: e.amount,
          status: e.status,
          remark: e.remark
        }));
        setHistoryList(mapped);
      }
    }
    loadData();
  }, []);

  const currentTripObj = assignedTrips.find(t => t.id === selectedTrip) || null;

  const addItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, category: 'ค่าน้ำมัน', amount: '', remark: '', imagePreview: '' }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ExpenseItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTripObj || !currentTripObj.driverLog) {
      alert("ไม่พบข้อมูลสมุดรถสำหรับทริปนี้ กรุณาบันทึกสมุดรถก่อนเบิกค่าใช้จ่าย");
      return;
    }
    
    setIsSubmitting(true);

    const expensesToSubmit = items.map(item => ({
      category: item.category,
      amount: item.amount,
      remark: item.remark
    }));

    const res = await submitTripExpenses(currentTripObj.driverLog.id, expensesToSubmit);
    
    setIsSubmitting(false);
    
    if (res.success) {
      setSuccess(true);
      
      // Refresh history
      const resExp = await getDriverExpensesHistory(1);
      if (resExp.success && resExp.expenses) {
        const mapped = resExp.expenses.map((exp: ExpenseResponseData) => ({
          id: `EXP-${exp.id}`,
          bookingId: exp.driverLog.bookingId,
          tripName: exp.driverLog.booking.destination,
          date: new Date(exp.createdAt).toLocaleDateString('th-TH'),
          category: exp.category,
          amount: exp.amount,
          status: exp.status,
          remark: exp.remark
        }));
        setHistoryList(mapped);
      }
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการบันทึกค่าใช้จ่าย");
    }
  };

  // Filtered History
  const filteredHistory = historyList.filter(item => {
    const matchesSearch = item.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.tripName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell>
      <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
        
        {/* Sticky Fixed Top Header */}
        <div className="sticky -top-6 lg:-top-8 z-20 bg-[#f3f4f7]/95 backdrop-blur-md pt-8 lg:pt-10 pb-4 space-y-3 border-b border-gray-200/80 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                เบิกค่าใช้จ่ายรายทริป
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                บันทึกค่าน้ำมัน ค่าทางด่วน ค่าที่จอดรถ และค่าเบี้ยเลี้ยงประจำทริป เพื่อส่งอนุมัติเบิกจ่าย
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/driver/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                <ArrowLeft size={14} /> แดชบอร์ด
              </Link>
            </div>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex bg-gray-200/80 p-1 rounded-xl shadow-inner text-xs max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('submit')}
              className={`flex-1 py-2 font-bold rounded-lg transition-all ${activeTab === 'submit' ? 'bg-white text-[#311171] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ทำรายการเบิกใหม่
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-[#311171] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ประวัติการเบิกจ่าย ({historyList.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Submit Form */}
        {activeTab === 'submit' && (
          <div>
            {success ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center max-w-lg mx-auto space-y-4 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">ส่งรายการเบิกเงินเรียบร้อย!</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  รายการเบิกค่าใช้จ่ายสำหรับทริป <b>{currentTripObj?.destination || ''}</b> จำนวน <b>{totalAmount.toLocaleString("th-TH")} บาท</b> ถูกส่งเข้าระบบแอดมินคณะเรียบร้อยแล้ว
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    ดูประวัติการเบิก
                  </button>
                  <button 
                    onClick={() => {
                      setSuccess(false);
                      setItems([{ id: '1', category: 'ค่าน้ำมัน', amount: '', remark: '', imagePreview: '' }]);
                    }}
                    className="px-5 py-2.5 bg-[#311171] hover:bg-[#250d55] text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    ทำรายการเบิกใหม่
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Select Trip Card */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-4">
                  <div className="flex items-center gap-2 text-[#311171] border-b border-gray-100 pb-3">
                    <Car size={20} />
                    <h2 className="font-black text-base text-gray-900">1. เลือกรอบการเดินทาง (ทริปที่ต้องการเบิก)</h2>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">ทริปขอใช้รถที่รับมอบหมาย (ที่มีสมุดรถแล้ว)</label>
                    <select
                      value={selectedTrip}
                      onChange={(e) => setSelectedTrip(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#311171]/20 transition-all"
                    >
                      {assignedTrips.length === 0 && <option value="">ไม่มีทริปที่เบิกได้</option>}
                      {assignedTrips.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.id} : {trip.destination} ({new Date(trip.departureDate).toLocaleDateString('th-TH')}) - ผู้ขอ: {trip.requester?.name || '-'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Trip Details Banner */}
                  {currentTripObj && (
                    <div className="bg-[#311171]/5 p-4 rounded-2xl border border-[#311171]/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-[#311171] bg-white px-2.5 py-0.5 rounded-md border border-[#311171]/20">
                            {currentTripObj.id}
                          </span>
                          <span className="font-bold text-gray-700">{new Date(currentTripObj.departureDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        <p className="font-black text-sm text-gray-900">{currentTripObj.destination}</p>
                        <p className="text-gray-500 mt-0.5">ผู้ขอจอง: {currentTripObj.requester?.name || '-'} • โครงการ: {currentTripObj.objective || '-'}</p>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle size={14} /> ภารกิจพร้อมทำเรื่องเบิก
                      </span>
                    </div>
                  )}
                </div>

                {/* Expense Items Card */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2 text-[#311171]">
                      <Tag size={20} />
                      <h2 className="font-black text-base text-gray-900">2. รายการค่าใช้จ่ายรายทริป</h2>
                    </div>

                    <button 
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1.5 bg-[#311171] hover:bg-[#250d55] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm"
                    >
                      <Plus size={14} /> เพิ่มรายการค่าใช้จ่าย
                    </button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-3 relative hover:border-purple-200 transition-all">
                        
                        <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#311171] text-white text-[11px] font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            รายการค่าใช้จ่ายที่ {index + 1}
                          </span>

                          {items.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="ลบรายการนี้"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {/* Category Pills */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1.5">ประเภทค่าใช้จ่าย</label>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {['ค่าน้ำมัน', 'ค่าทางด่วน', 'ค่าจอดรถ','ค่าซ่อมฉุกเฉิน'].map(cat => (
                              <button
                                type="button"
                                key={cat}
                                onClick={() => updateItem(item.id, 'category', cat)}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs border ${
                                  item.category === cat 
                                    ? 'bg-[#311171] text-white border-[#311171] shadow-xs' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Amount & Remark Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-gray-600 mb-1">จำนวนเงิน (บาท)</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                placeholder="0.00"
                                value={item.amount}
                                onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-mono font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#311171]/20"
                                required
                              />
                              <span className="absolute right-3 top-2.5 font-bold text-gray-400">บาท</span>
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold text-gray-600 mb-1">รายละเอียด / หมายเหตุ</label>
                            <input 
                              type="text" 
                              placeholder="ระบุสถานที่/เลขที่ใบเสร็จ..."
                              value={item.remark}
                              onChange={(e) => updateItem(item.id, 'remark', e.target.value)}
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#311171]/20"
                            />
                          </div>
                        </div>

                        {/* Receipt Upload Box */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">รูปถ่ายใบเสร็จ / สลิป (ถ้ามี)</label>
                          <label className="border-2 border-dashed border-gray-200 rounded-xl p-3 bg-white flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                            <Camera size={16} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-600">ถ่ายรูปหรือแนบสลิปใบเสร็จ</span>
                            <input type="file" accept="image/*" className="hidden" />
                          </label>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* Total Summary */}
                  <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-purple-900">รวมจำนวนเงินที่ขอเบิกสำหรับทริปนี้ ({items.length} รายการ)</p>
                      <p className="text-[11px] text-purple-600">เงินจะถูกส่งตรวจสอบโดยแอดมินและงานการเงินคณะ</p>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-[#311171] font-mono">
                        {totalAmount.toLocaleString("th-TH")}
                      </span>
                      <span className="text-xs font-bold text-[#311171] ml-1">บาท</span>
                    </div>
                  </div>

                </div>

                {/* Submit Action */}
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#311171] hover:bg-[#250d55] text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  {isSubmitting ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  ) : (
                    <><UploadCloud size={20} /> ยืนยันส่งคำขอเบิกเงินรายทริป</>
                  )}
                </button>

              </form>
            )}
          </div>
        )}

        {/* Tab 2: History View */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="ค้นหารหัสคำขอ, ชื่อทริป, ประเภทค่าใช้จ่าย..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white"
                />
              </div>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="ALL">สถานะทั้งหมด</option>
                <option value="PENDING">รอดำเนินการ</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
                <option value="REJECTED">ไม่อนุมัติ</option>
              </select>
            </div>

            {/* History Table Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-700 flex items-center justify-between">
                <span>ประวัติรายการเบิกเงิน ({filteredHistory.length} รายการ)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px] text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 font-bold uppercase tracking-wider">
                      <th className="p-3">รหัสรายการ</th>
                      <th className="p-3">ทริปเดินทาง</th>
                      <th className="p-3">ประเภทค่าใช้จ่าย</th>
                      <th className="p-3 text-right">จำนวนเงิน</th>
                      <th className="p-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-gray-900">
                          <div>{item.id}</div>
                          <div className="text-[10px] text-gray-400">{item.date}</div>
                        </td>
                        <td className="p-3 font-bold text-gray-800">
                          <div>{item.tripName}</div>
                          <div className="text-[10px] font-mono text-[#311171]">{item.bookingId}</div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-100">
                            <FileText size={12} /> {item.category}
                          </span>
                          {item.remark && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{item.remark}</p>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-gray-900 text-sm">
                          {item.amount.toLocaleString("th-TH")} ฿
                        </td>
                        <td className="p-3 text-center">
                          {item.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5" /> อนุมัติแล้ว
                            </span>
                          )}
                          {item.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <Clock className="w-3.5 h-3.5" /> รอดำเนินการ
                            </span>
                          )}
                          {item.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                              <XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          ไม่พบประวัติรายการเบิกเงินที่ตรงตามเงื่อนไข
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
