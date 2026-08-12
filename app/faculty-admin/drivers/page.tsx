"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Users, Mail, Phone, Search, Plus, Edit, 
  Trash2, X, Lock, Unlock, Calendar, AlertCircle, CheckCircle2, Camera, UserX
} from 'lucide-react';
import { getPendingAvailabilityRequests, updateAvailabilityApproval } from '@/app/actions/driver-availability';


interface ApiDriver {
  id: string;
  name: string;
  email?: string;
  phone: string;
  vanPlate?: string;
  contractStart?: string;
  licenseExpiry?: string;
  isActive?: boolean;
  avatar?: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vanAssigned: string;
  contractStart: string;
  licenseExpiry: string;
  isLocked: boolean;
  avatar: string;
}

export default function DriversPage() {
  const [mounted, setMounted] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const [adminId, setAdminId] = useState<number | null>(null);

  const loadDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      const data = await res.json();
      const mapped = (data.drivers || []).map((d: any) => ({
        id: d.id.toString(),
        name: d.user?.name || 'ไม่มีชื่อ',
        email: d.user?.email || 'ไม่มีอีเมล',
        phone: d.phone,
        vanAssigned: d.vanPlate || 'ยังไม่ผูกทะเบียน',
        contractStart: d.contractStart || '2024-01-01',
        licenseExpiry: d.licenseExpiry || '2025-01-01',
        isLocked: !d.isActive,
        avatar: d.avatar || `https://i.pravatar.cc/150?u=${d.id}`
      }));
      setDrivers(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const reqs = await getPendingAvailabilityRequests();
      setPendingRequests(reqs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDrivers();
    loadPendingRequests();
    
    // Fetch current admin info
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setAdminId(data.id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleApprove = async (id: number, approval: 'APPROVED' | 'REJECTED') => {
    if (!adminId) {
      alert("ไม่พบข้อมูลผู้ดำเนินการ โปรดรีเฟรชหน้าเว็บ");
      return;
    }
    try {
      await updateAvailabilityApproval(id, approval, adminId);
      loadPendingRequests();
      alert(`ทำรายการสำเร็จ (${approval})`);
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vanAssigned: "",
    contractStart: "",
    licenseExpiry: "",
    isLocked: false,
    avatar: ""
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

  const calculateExpiry = (startDate: string, years: number) => {
    const start = new Date(startDate);
    start.setFullYear(start.getFullYear() + years);
    return start;
  };

  const getDaysRemaining = (expiryDate: Date) => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      vanAssigned: "",
      contractStart: new Date().toISOString().split('T')[0],
      licenseExpiry: new Date().toISOString().split('T')[0],
      isLocked: false,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"
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
      contractStart: driver.contractStart,
      licenseExpiry: driver.licenseExpiry,
      isLocked: driver.isLocked,
      avatar: driver.avatar || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await fetch(`/api/drivers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      loadDrivers();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLock = async (driver: Driver) => {
    try {
      await fetch(`/api/drivers/${driver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: driver.phone,
          isLocked: !driver.isLocked
        })
      });
      loadDrivers();
    } catch (err) {
      console.error(err);
    }
  };

  const renewContract = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "ยืนยันการต่อสัญญา",
      message: "คุณต้องการต่อสัญญาคนขับและรถตู้ไปอีก 5 ปี นับจากวันนี้ใช่หรือไม่?",
      confirmText: "ยืนยันการต่อสัญญา",
      confirmColor: "bg-blue-600 hover:bg-blue-700",
      onConfirm: async () => {
        const today = new Date().toISOString().split('T')[0];
        try {
          await fetch(`/api/drivers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractStart: today })
          });
          loadDrivers();
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
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
      onConfirm: async () => {
        try {
          await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
          loadDrivers();
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };



  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <AppShell>
      <div className="w-full space-y-6 animate-in fade-in pb-6 flex flex-col h-full">


        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="px-6 flex-shrink-0">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                <AlertCircle size={20} />
                คำขอเปลี่ยนสถานะ/ลางานรอดำเนินการ ({pendingRequests.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#311171]">
                        {req.driver.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{req.driver.user.name}</p>
                        <p className="text-xs text-gray-500">วันที่: {new Date(req.date).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-red-600 mb-1">
                      ขอสถานะ: {req.status === 'SICK_LEAVE' ? 'ลาป่วย' : req.status === 'PERSONAL_LEAVE' ? 'ลากิจ' : req.status === 'SUBSTITUTE' ? 'ปฏิบัติงานแทน' : req.status}
                    </p>
                    <p className="text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">{req.reason || '-'}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(req.id, 'APPROVED')} className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors">อนุมัติ</button>
                      <button onClick={() => handleApprove(req.id, 'REJECTED')} className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors">ปฏิเสธ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
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
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-500 font-bold">กำลังโหลดข้อมูล...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDrivers.map(driver => {
                const expiryDate = calculateExpiry(driver.contractStart, 5);
                const daysLeft = getDaysRemaining(expiryDate);
                const isWarning = daysLeft <= 180;
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
                        <div className="text-right"><span className="text-gray-500">หมดอายุสัญญา:</span> <span className={`font-bold ${isExpired ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-800'}`}>{formatDate(expiryDate)}</span></div>
                        <div className="col-span-2 text-right mt-1"><span className="text-gray-500">ใบขับขี่หมดอายุ:</span> <span className="font-bold text-gray-800">{formatDate(new Date(driver.licenseExpiry))}</span></div>
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
                        onClick={() => toggleLock(driver)}
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
          )}
          
          {!isLoading && filteredDrivers.length === 0 && (
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
              
              {/* Profile Image Section */}
              <div className="flex flex-col items-center justify-center gap-2 pb-2">
                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-[#311171]/20 shadow-md bg-gray-100 flex items-center justify-center">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Driver Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={40} className="text-gray-400" />
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                    <Camera size={20} />
                    <span className="text-[10px] font-bold mt-1">อัปโหลดรูป</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
                <div className="w-full">
                  <label className="block text-[11px] font-bold text-gray-500 text-center mb-1">หรือระบุ URL รูปโปรไฟล์</label>
                  <input 
                    type="text" 
                    value={formData.avatar}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#311171]/20 text-center"
                  />
                </div>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">อีเมล (มหาวิทยาลัย)</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="เช่น user@up.ac.th"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">วันที่เริ่มสัญญา</label>
                  <input 
                    type="date" 
                    value={formData.contractStart ? formData.contractStart.split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, contractStart: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">วันหมดอายุใบขับขี่</label>
                  <input 
                    type="date" 
                    value={formData.licenseExpiry ? formData.licenseExpiry.split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
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
