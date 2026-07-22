"use client";
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Users, Mail, Phone, Shield, Search, Plus, Edit, 
  Trash2, X, Lock, Unlock, Calendar, AlertCircle, CheckCircle2, BadgeCheck
} from 'lucide-react';

interface DeanInfo {
  name: string;
  email: string;
  termStart: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vanAssigned: string;
  contractStart: string;
  isLocked: boolean;
  avatar: string;
}

export default function DriversPage() {
  // Mock Data: คณบดี (Dean)
  const deanInfo: DeanInfo = {
    name: "รศ.ดร.ตัวอย่าง คณบดี",
    email: "dean.agri@up.ac.th",
    termStart: "2024-01-15"
  };

  // Mock Data: คนขับรถ (Drivers)
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "d1",
      name: "นายสมชาย ใจดี",
      email: "somchai.ja@up.ac.th",
      phone: "081-234-5678",
      vanAssigned: "รถตู้คณะเกษตร 01 (นข 1234)",
      contractStart: "2020-05-10",
      isLocked: false,
      avatar: "https://i.pravatar.cc/150?u=d1"
    },
    {
      id: "d2",
      name: "นายสมเกียรติ รักงาน",
      email: "somkiat.ru@up.ac.th",
      phone: "089-876-5432",
      vanAssigned: "รถตู้คณะเกษตร 02 (นข 5678)",
      contractStart: "2025-01-20",
      isLocked: true,
      avatar: "https://i.pravatar.cc/150?u=d2"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vanAssigned: "",
    contractStart: ""
  });

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "ยืนยัน",
    confirmColor: "bg-[#311171]",
    onConfirm: () => {}
  });

  // Helper Functions for Dates
  const calculateExpiry = (startDate: string, years: number) => {
    const start = new Date(startDate);
    start.setFullYear(start.getFullYear() + years);
    return start;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (expiryDate: Date) => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const deanExpiryDate = calculateExpiry(deanInfo.termStart, 4);

  // Actions
  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      vanAssigned: "",
      contractStart: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingId(driver.id);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vanAssigned: driver.vanAssigned,
      contractStart: driver.contractStart
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setDrivers(drivers.map(d => d.id === editingId ? { ...d, ...formData } : d));
    } else {
      const newDriver: Driver = {
        id: `d${Date.now()}`,
        ...formData,
        isLocked: false,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
      };
      setDrivers([...drivers, newDriver]);
    }
    setIsModalOpen(false);
  };

  const toggleLock = (id: string) => {
    setDrivers(drivers.map(d => d.id === id ? { ...d, isLocked: !d.isLocked } : d));
  };

  const renewContract = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "ยืนยันการต่อสัญญา",
      message: "คุณต้องการต่อสัญญาคนขับและรถตู้ไปอีก 5 ปี นับจากวันนี้ใช่หรือไม่?",
      confirmText: "ยืนยันการต่อสัญญา",
      confirmColor: "bg-blue-600 hover:bg-blue-700",
      onConfirm: () => {
        const today = new Date().toISOString().split('T')[0];
        setDrivers(drivers.map(d => d.id === id ? { ...d, contractStart: today } : d));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteDriver = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "ยืนยันการลบข้อมูล",
      message: "คุณต้องการลบข้อมูลคนขับนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
      confirmText: "ลบข้อมูล",
      confirmColor: "bg-red-500 hover:bg-red-600",
      onConfirm: () => {
        setDrivers(drivers.filter(d => d.id !== id));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const mockFetchEmail = () => {
    if (formData.email.includes('@up.ac.th')) {
      // Mock fetching from University DB
      setFormData({
        ...formData,
        name: "ข้อมูล ดึงจากระบบมหาวิทยาลัย",
        phone: "080-000-0000"
      });
      alert('ดึงข้อมูลจากฐานข้อมูลมหาวิทยาลัยสำเร็จ!');
    } else {
      alert('กรุณากรอกอีเมลของมหาวิทยาลัย (@up.ac.th)');
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="max-w-[1400px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0">
        
        {/* ----- Header ----- */}
        <div className="mb-8 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-black text-gray-900 leading-tight mb-2">จัดการคนขับ</h1>
            <p className="text-sm text-gray-500">จัดการข้อมูลพนักงานขับรถ อายุสัญญา และข้อมูลคณบดี</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#311171] hover:bg-[#240c55] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              <Plus size={18} /> เพิ่มคนขับใหม่
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-10">
          
          {/* ----- Dean Section (Read Only) ----- */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold border border-blue-100">
                <Shield size={14} /> ข้อมูลถูกจัดการโดยผู้ดูแลระบบส่วนกลาง
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <BadgeCheck size={32} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-500 mb-1">ข้อมูลคณบดีประจำคณะ (วาระ 4 ปี)</h3>
                <h2 className="text-xl font-black text-gray-900 mb-1">{deanInfo.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Mail size={16} className="text-gray-400" /> {deanInfo.email}
                  </div>
                  <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 text-orange-700 font-medium">
                    <Calendar size={16} /> หมดวาระ: {formatDate(deanExpiryDate)} (เหลือ {getDaysRemaining(deanExpiryDate)} วัน)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ----- Toolbar ----- */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ หรือ อีเมลคนขับ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] shadow-sm transition-all"
              />
            </div>
            <div className="flex items-center gap-4 text-sm font-bold">
              <span className="text-gray-500">ทั้งหมด: <span className="text-gray-900">{drivers.length} คน</span></span>
            </div>
          </div>

          {/* ----- Drivers Grid ----- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDrivers.map(driver => {
              const expiryDate = calculateExpiry(driver.contractStart, 5);
              const daysLeft = getDaysRemaining(expiryDate);
              const isWarning = daysLeft <= 180; // น้อยกว่า 6 เดือน เตือน
              const isExpired = daysLeft <= 0;

              return (
                <div key={driver.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
                  
                  <div className="flex items-start gap-4 mb-5">
                    <div className="relative shrink-0">
                      <img src={driver.avatar} alt={driver.name} className={`w-16 h-16 rounded-xl object-cover ${driver.isLocked ? 'grayscale opacity-60' : ''}`} />
                      {driver.isLocked && (
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                          <Lock size={20} className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-black text-lg truncate ${driver.isLocked ? 'text-gray-400' : 'text-gray-900'}`}>{driver.name}</h3>
                        {driver.isLocked ? (
                          <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg border border-red-100 flex items-center gap-1 shrink-0">
                            <Lock size={10} strokeWidth={3} /> บัญชีถูกล็อก
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg border border-green-100 flex items-center gap-1 shrink-0">
                            <CheckCircle2 size={10} strokeWidth={3} /> ใช้งานปกติ
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={14} className="text-gray-400 shrink-0" />
                          <span className="truncate">{driver.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone size={14} className="text-gray-400 shrink-0" />
                          <span>{driver.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contract Section */}
                  <div className={`p-3 rounded-xl border ${isExpired ? 'bg-red-50 border-red-100' : isWarning ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'} mb-4`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-700">สัญญาจ้าง & รถตู้ (5 ปี)</span>
                      {isExpired ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={10}/> หมดสัญญาแล้ว</span>
                      ) : isWarning ? (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={10}/> ใกล้หมดสัญญา</span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-500">{daysLeft} วันเหลือ</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-gray-500">รถที่รับผิดชอบ:</span> <span className="font-bold text-gray-800">{driver.vanAssigned}</span></div>
                      <div className="text-right"><span className="text-gray-500">หมดอายุ:</span> <span className={`font-bold ${isExpired ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-800'}`}>{formatDate(expiryDate)}</span></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button 
                      onClick={() => renewContract(driver.id)}
                      className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-[11px] font-bold"
                    >
                      <Calendar size={14} /> ต่อสัญญา
                    </button>
                    <button 
                      onClick={() => toggleLock(driver.id)}
                      className={`py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-[11px] font-bold ${
                        driver.isLocked 
                          ? 'bg-green-50 hover:bg-green-100 text-green-600' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {driver.isLocked ? <><Unlock size={14} /> ปลดล็อก</> : <><Lock size={14} /> ระงับไอดี</>}
                    </button>
                    <button 
                      onClick={() => openEditModal(driver)}
                      className="py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[11px] rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit size={14} /> แก้ไข
                    </button>
                    <button 
                      onClick={() => deleteDriver(driver.id)}
                      className="py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-[11px] font-bold"
                    >
                      <Trash2 size={14} /> ลบ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredDrivers.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p>ไม่พบข้อมูลคนขับที่ค้นหา</p>
            </div>
          )}

        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-[90%] max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-black text-[#311171]">
                {editingId ? 'แก้ไขข้อมูลคนขับ' : 'เพิ่มคนขับรถใหม่'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {!editingId && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <label className="block text-sm font-bold text-blue-900 mb-2">ดึงข้อมูลจากระบบมหาลัย (UP Account)</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="เช่น user@up.ac.th"
                      className="flex-1 px-4 py-2 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button 
                      onClick={mockFetchEmail}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      ดึงข้อมูล
                    </button>
                  </div>
                </div>
              )}

              {editingId && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">อีเมล (มหาวิทยาลัย)</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อ - นามสกุล</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="กรอกชื่อ-นามสกุล"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">เบอร์โทรศัพท์ติดต่อ</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">รถตู้ที่รับผิดชอบ</label>
                  <input 
                    type="text" 
                    value={formData.vanAssigned}
                    onChange={(e) => setFormData({...formData, vanAssigned: e.target.value})}
                    placeholder="เช่น รถตู้คณะเกษตร 01 (นข 1234)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">วันที่เริ่มงาน / เริ่มสัญญา</label>
                  <input 
                    type="date" 
                    value={formData.contractStart}
                    onChange={(e) => setFormData({...formData, contractStart: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
                  <p className="text-xs text-gray-500 mt-1">ระบบจะคำนวณวันหมดสัญญา +5 ปี ให้อัตโนมัติ</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.name || !formData.email}
                className="px-5 py-2.5 bg-[#311171] hover:bg-[#240c55] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={18} /> บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-[90%] max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
                confirmModal.confirmColor.includes('red') ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
              }`}>
                {confirmModal.confirmColor.includes('red') ? <Trash2 size={32} /> : <AlertCircle size={32} />}
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">{confirmModal.title}</h2>
              <p className="text-sm text-gray-500">{confirmModal.message}</p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2.5 text-white text-sm font-bold rounded-xl transition-colors shadow-sm ${confirmModal.confirmColor}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
