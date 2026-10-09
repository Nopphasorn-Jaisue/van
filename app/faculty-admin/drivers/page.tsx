"use client";
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Users, Mail, Phone, Search, Plus, Edit, 
  Trash2, X, Lock, Unlock, Calendar, AlertCircle, CheckCircle2, Camera,
  RefreshCcw, CarFront, Link2, Loader2, ShieldCheck, Check
} from 'lucide-react';
import { getPendingAvailabilityRequests, updateAvailabilityApproval } from '@/app/actions/driver-availability';
import { getFaculties } from '@/app/actions/superadmin';
import { lookupUniversityUser } from '@/app/actions/driver';


interface FacultyOption {
  id: number;
  name: string;
  adminName?: string;
  adminPhone?: string;
  vansCount?: number;
  driversCount?: number;
}

interface VanOption {
  id: string | number;
  dbId?: number;
  vanName: string;
  plate: string;
  facultyId?: number | string;
  facultyName?: string;
  faculty?: string | {
    id: number;
    nameTh?: string;
  };
}

interface RawDriverData {
  vanAssigned?: string;
  dbId?: number;
  id: number | string;
  name?: string;
  email?: string;
  phone: string;
  vanPlate?: string;
  assignedVanId?: number | string;
  facultyId?: number | string;
  contractStart?: string;
  licenseExpiry?: string;
  isActive: boolean;
  avatar?: string;
  user?: {
    name: string;
    email: string;
  };
  assignedVan?: {
    id: number | string;
  };
}


interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vanAssigned: string;
  assignedVanId?: string;
  facultyId?: string;
  contractStart: string;
  licenseExpiry: string;
  isLocked: boolean;
  isActive?: boolean;
  avatar: string;
}



export default function DriversPage() {
  const [mounted, setMounted] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [pendingRequests, setPendingRequests] = useState<Awaited<ReturnType<typeof getPendingAvailabilityRequests>>>([]);

  const [adminId, setAdminId] = useState<number | null>(null);
  const [userFacultyId, setUserFacultyId] = useState<string>("1");
  const [userFacultyName, setUserFacultyName] = useState<string>("คณะเทคโนโลยีสารสนเทศและการสื่อสาร");
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [vans, setVans] = useState<VanOption[]>([]);

  const loadDrivers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/drivers?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        const mapped = (data.drivers || []).map((d: RawDriverData) => ({
          id: d.id.toString(),
          name: d.name || d.user?.name || 'ไม่มีชื่อ',
          email: d.email || d.user?.email || 'ไม่มีอีเมล',
          phone: d.phone,
          vanAssigned: d.vanAssigned || (d.assignedVan as { plate?: string } | undefined)?.plate || (d as { vanPlate?: string }).vanPlate || 'ยังไม่ผูกทะเบียน',
          assignedVanId: d.assignedVanId ? d.assignedVanId.toString() : (d.assignedVan?.id ? d.assignedVan.id.toString() : ""),
          facultyId: d.facultyId ? d.facultyId.toString() : "",
          contractStart: d.contractStart || '2024-01-01',
          licenseExpiry: d.licenseExpiry && !d.licenseExpiry.startsWith('2025') ? d.licenseExpiry : '2029-01-01',
          isLocked: !d.isActive,
          avatar: (d.avatar && !d.avatar.includes('unsplash.com') && !d.avatar.includes('pravatar.cc')) ? d.avatar : ""
        }));
        setDrivers(mapped);
        try {
          sessionStorage.setItem('cached_faculty_drivers', JSON.stringify(mapped));
        } catch {}
      }
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
    try {
      const cached = sessionStorage.getItem('cached_faculty_drivers');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDrivers(parsed);
          setIsLoading(false);
        }
      }
    } catch {}
    loadDrivers(true);
    setTimeout(() => setIsLoading(false), 1200);
    
    fetch('/api/me')
      .then(res => res.json())
      .then((me) => {
        if (me && me.authenticated !== false) {
          if (me.id) setAdminId(Number(me.id));
          const facId = me.facultyId || me.user?.facultyId || 1;
          setUserFacultyId(String(facId));
          const fName = me.faculty || me.facultyName || me.user?.facultyName;
          if (fName) setUserFacultyName(fName);
        }
      })
      .catch(console.error);

    fetch(`/api/vans?_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.vans && Array.isArray(data.vans)) {
          setVans(data.vans);
        }
      })
      .catch(console.error);

    getFaculties().then(setFaculties).catch(console.error);

    loadPendingRequests();
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
      console.error(err);
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
    assignedVanId: "",
    facultyId: "",
    contractStart: "",
    licenseExpiry: "",
    isLocked: false,
    avatar: ""
  });

  const [isLookingUpEmail, setIsLookingUpEmail] = useState(false);
  const [lookupNotice, setLookupNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleLookupByEmail = async (overrideEmail?: string) => {
    const targetEmail = (overrideEmail !== undefined ? overrideEmail : formData.email).trim().toLowerCase();
    if (!targetEmail) {
      setLookupNotice({ type: 'error', message: 'กรุณากรอกอีเมลมหาวิทยาลัย (@up.ac.th) ก่อนดึงข้อมูล' });
      setTimeout(() => setLookupNotice(null), 3500);
      return;
    }
    setIsLookingUpEmail(true);
    setLookupNotice(null);
    try {
      const res = await lookupUniversityUser(targetEmail);
      if (res.found && res.user) {
        setFormData(prev => ({
          ...prev,
          name: res.user.name || prev.name,
          avatar: res.user.avatar || prev.avatar,
          assignedVanId: res.user.assignedVanId ? String(res.user.assignedVanId).replace(/\D/g, '') : prev.assignedVanId,
          vanAssigned: res.user.vanPlate || prev.vanAssigned
        }));
        if (res.user.avatar) {
          setLookupNotice({
            type: 'success',
            message: `ดึงข้อมูลสำเร็จ: ${res.user.name} (พร้อมรูปโปรไฟล์ 365)`
          });
        } else {
          setLookupNotice({
            type: 'info',
            message: `ดึงชื่อสำเร็จ: ${res.user.name} แต่ยังไม่มีรูป 365 ในระบบ (สามารถกด 'อัปโหลดรูปใหม่' เพื่อใส่รูปได้ทันที)`
          });
        }
      } else {
        setLookupNotice({
          type: 'info',
          message: 'ไม่พบข้อมูลในระบบสำหรับอีเมลนี้ คุณสามารถอัปโหลดรูปและกรอกข้อมูลเองได้เลย'
        });
      }
    } catch {
      setLookupNotice({ type: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsLookingUpEmail(false);
      setTimeout(() => setLookupNotice(null), 4500);
    }
  };

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
    setShowUrlInput(false);
    setLookupNotice(null);
    const targetFacId = userFacultyId || "1";
    const matchingVans = vans.filter(v => {
      const vFacId = v.facultyId !== undefined ? String(v.facultyId) : "";
      return !vFacId || vFacId === targetFacId || (v.facultyName && userFacultyName && v.facultyName.includes(userFacultyName));
    });
    const defaultVanId = matchingVans.length > 0 ? String(matchingVans[0].dbId || matchingVans[0].id).replace(/\D/g, '') : "";

    const todayStr = new Date().toISOString().split('T')[0];
    const expiryDate = calculateExpiry(todayStr, 5);
    const expiryStr = expiryDate.toISOString().split('T')[0];

    setFormData({
      name: "",
      email: "",
      phone: "",
      vanAssigned: matchingVans.length > 0 ? matchingVans[0].plate : "",
      assignedVanId: defaultVanId,
      facultyId: targetFacId,
      contractStart: todayStr,
      licenseExpiry: expiryStr,
      isLocked: false,
      avatar: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingId(driver.id);
    setShowUrlInput(false);
    setLookupNotice(null);
    const facId = driver.facultyId ? String(driver.facultyId) : (userFacultyId || "1");
    
    // Find driver's assigned van ID (numeric string)
    let driverVanId = driver.assignedVanId ? String(driver.assignedVanId).replace(/\D/g, '') : "";
    
    // If not set, check if vanAssigned matches any van plate
    if (!driverVanId && driver.vanAssigned) {
      const matched = vans.find(v => v.plate && driver.vanAssigned.includes(v.plate));
      if (matched) {
        driverVanId = String(matched.dbId || matched.id).replace(/\D/g, '');
      }
    }

    // If still not set, default to first van of this faculty
    if (!driverVanId) {
      const facVans = vans.filter(v => {
        const vFacId = v.facultyId !== undefined ? String(v.facultyId) : "";
        return !vFacId || vFacId === facId;
      });
      if (facVans.length > 0) {
        driverVanId = String(facVans[0].dbId || facVans[0].id).replace(/\D/g, '');
      }
    }

    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      vanAssigned: driver.vanAssigned,
      assignedVanId: driverVanId,
      facultyId: facId,
      contractStart: driver.contractStart,
      licenseExpiry: driver.licenseExpiry,
      isLocked: driver.isLocked,
      avatar: driver.avatar || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const targetFacId = formData.facultyId || userFacultyId || "1";
      const payload = {
        ...formData,
        facultyId: targetFacId
      };
      if (editingId) {
        setDrivers(prev => prev.map(d => d.id === editingId ? { ...d, ...payload } : d));
        try { sessionStorage.removeItem('cached_faculty_drivers'); } catch {}
        await fetch(`/api/drivers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      try { sessionStorage.removeItem('cached_faculty_drivers'); } catch {}
      setIsModalOpen(false);
      await loadDrivers(true);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLock = async (driver: Driver) => {
    const nextLocked = !driver.isLocked;
    // Optimistic UI update
    setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, isLocked: nextLocked } : d));
    try {
      await fetch(`/api/drivers/${driver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: driver.phone,
          isLocked: nextLocked,
          isActive: !nextLocked
        })
      });
      loadDrivers();
    } catch (err) {
      console.error(err);
      loadDrivers();
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



  const filteredDrivers = (drivers || []).filter(d => {
    const name = (d?.name || '').toLowerCase();
    const email = (d?.email || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  if (!mounted) return null;

  return (
    <AppShell>
      <div className="max-w-[1400px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0">

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="mb-6 shrink-0">
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

        {/* ----- Toolbar ----- */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ หรือ อีเมลคนขับ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="text-gray-500">ทั้งหมด: <span className="text-gray-900">{drivers.length} คน</span></span>
            <span className="text-gray-500">พร้อมปฏิบัติหน้าที่: <span className="text-green-600">{drivers.filter(d => d.isActive && !d.isLocked).length} คน</span></span>
          </div>
        </div>

        {/* ----- Grid Content ----- */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                        {driver.avatar && driver.avatar.trim() !== '' ? (
                          <img src={driver.avatar} alt={driver.name} className={`w-16 h-16 rounded-xl object-cover ${driver.isLocked ? 'grayscale opacity-60' : ''}`} />
                        ) : (
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-[#311171] to-[#4c1d95] text-white font-black text-xl flex items-center justify-center shadow-inner ${driver.isLocked ? 'grayscale opacity-60' : ''}`}>
                            {driver.name ? driver.name.trim().charAt(0) : <Users size={24} />}
                          </div>
                        )}
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] border border-purple-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/60 via-white to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#311171]/10 flex items-center justify-center text-[#311171]">
                  <Users size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#311171] leading-tight">
                    {editingId ? 'แก้ไขข้อมูลคนขับ' : 'เพิ่มคนขับรถใหม่'}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    จัดการข้อมูลประจำตัว บัญชีมหาวิทยาลัย และสังกัดรถตู้
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* Lookup Notice Alert */}
              {lookupNotice && (
                <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all animate-in fade-in ${
                  lookupNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  lookupNotice.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {lookupNotice.type === 'success' && <Check size={16} className="text-emerald-600 shrink-0" />}
                  {lookupNotice.type === 'error' && <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                  {lookupNotice.type === 'info' && <AlertCircle size={16} className="text-blue-600 shrink-0" />}
                  <span className="flex-1">{lookupNotice.message}</span>
                </div>
              )}

              {/* Profile Image Card */}
              <div className="bg-gradient-to-br from-purple-50/40 via-white to-gray-50 border border-purple-100/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 shadow-sm">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#311171]/20 shadow-md bg-gray-100 flex items-center justify-center ring-4 ring-purple-100">
                    {formData.avatar && formData.avatar.trim() !== '' ? (
                      <img src={formData.avatar} alt="Driver Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={38} className="text-gray-400" />
                    )}
                  </div>
                  <label 
                    className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-[1px]"
                    title="คลิกเพื่อเปลี่ยนรูปภาพ"
                  >
                    <Camera size={20} />
                    <span className="text-[10px] font-bold mt-1">เปลี่ยนรูป</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const uploadForm = new FormData();
                          uploadForm.append('file', file);
                          uploadForm.append('type', 'drivers');
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: uploadForm
                          });
                          const data = await res.json();
                          if (data.success && data.url) {
                            setFormData(prev => ({ ...prev, avatar: data.url }));
                            return;
                          }
                        } catch (err) {
                          console.warn('Server upload failed, falling back to base64', err);
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }} 
                    />
                  </label>
                </div>

                <div className="flex-1 w-full text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-bold text-gray-800">รูปภาพโปรไฟล์คนขับ</span>
                    {formData.email && formData.email.toLowerCase().endsWith('@up.ac.th') && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 text-[#311171] px-2 py-0.5 rounded-full">
                        <ShieldCheck size={12} /> บัญชีทางการ มพ.
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    รองรับไฟล์รูปภาพ PNG, JPG หรือดึงรูปทางการอัตโนมัติจากบัญชีอีเมลมหาวิทยาลัย
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:border-[#311171] hover:text-[#311171] text-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm">
                      <Camera size={14} />
                      <span>อัปโหลดรูปใหม่</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const uploadForm = new FormData();
                            uploadForm.append('file', file);
                            uploadForm.append('type', 'drivers');
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: uploadForm
                            });
                            const data = await res.json();
                            if (data.success && data.url) {
                              setFormData(prev => ({ ...prev, avatar: data.url }));
                              return;
                            }
                          } catch (err) {
                            console.warn('Server upload failed, falling back to base64', err);
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }} 
                      />
                    </label>

                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium"
                      >
                        ลบรูป
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-gray-400 hover:text-gray-600 underline font-medium ml-auto"
                    >
                      {showUrlInput ? 'ซ่อน URL' : 'ระบุ URL เอง'}
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="pt-2 animate-in fade-in duration-150">
                      <div className="relative">
                        <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          value={formData.avatar}
                          onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                          placeholder="https://example.com/avatar.jpg หรือ /uploads/..."
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#311171]/20 font-mono text-gray-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* University Email Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    อีเมลมหาวิทยาลัย (University Email) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400">ใช้อีเมล @up.ac.th เพื่อดึงข้อมูลและรูปทางการ</span>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="เช่น 66012555@up.ac.th หรือ user@up.ac.th"
                    className="w-full pl-10 pr-44 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 font-medium text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupByEmail()}
                    disabled={isLookingUpEmail || !formData.email}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-[#311171] hover:bg-[#240c55] disabled:opacity-40 disabled:hover:bg-[#311171] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                    title="ดึงรูปภาพโปรไฟล์จาก Microsoft 365 และข้อมูลคนขับตามอีเมลนี้"
                  >
                    {isLookingUpEmail ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RefreshCcw size={13} />
                    )}
                    <span>ดึงรูป & ข้อมูล 365</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  กรอกอีเมลมหาวิทยาลัยแล้วกดปุ่มเพื่อดึงรูปโปรไฟล์ทางการจากระบบ Microsoft 365 อัตโนมัติ
                </p>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Users size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="กรอกชื่อ-นามสกุล คนขับ"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 font-medium text-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      เบอร์โทรศัพท์ติดต่อ
                    </label>
                    <span className="text-[11px] text-gray-400">กรอกเอง</span>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone size={16} />
                    </div>
                    <input 
                      type="text" 
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="กรอกเบอร์โทร เช่น 0812345678"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 font-medium tracking-wide text-gray-800"
                    />
                  </div>
                </div>
              </div>
              
              {/* Contract Date & Driver License Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">วันที่เริ่มสัญญา</label>
                    <span className="text-[10px] bg-purple-100 text-[#311171] font-bold px-1.5 py-0.5 rounded">ระยะสัญญา 5 ปี</span>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type="date" 
                      value={formData.contractStart ? formData.contractStart.split('T')[0] : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const next = { ...prev, contractStart: val };
                          if (val) {
                            const startD = new Date(val);
                            startD.setFullYear(startD.getFullYear() + 5);
                            next.licenseExpiry = startD.toISOString().split('T')[0];
                          }
                          return next;
                        });
                      }}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 font-medium text-gray-700 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">วันหมดอายุใบขับขี่</label>
                    <button
                      type="button"
                      onClick={() => {
                        const baseDate = formData.contractStart ? new Date(formData.contractStart) : new Date();
                        baseDate.setFullYear(baseDate.getFullYear() + 5);
                        setFormData(prev => ({ ...prev, licenseExpiry: baseDate.toISOString().split('T')[0] }));
                      }}
                      className="text-[10px] text-[#311171] hover:underline font-bold"
                    >
                      + 5 ปีอัตโนมัติ
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type="date" 
                      value={formData.licenseExpiry ? formData.licenseExpiry.split('T')[0] : ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 font-medium text-gray-700 bg-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Faculty and Van Section */}
              {(() => {
                const facultyObj = faculties.find(f => String(f.id) === String(formData.facultyId || userFacultyId));
                const displayFacultyName = facultyObj?.name || userFacultyName || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร';
                const targetFacId = formData.facultyId || userFacultyId || "1";
                const matchingFacultyVans = vans.filter(v => {
                  const vFacId = v.facultyId !== undefined ? String(v.facultyId) : "";
                  return !vFacId || vFacId === targetFacId || (v.facultyName && displayFacultyName && v.facultyName.includes(displayFacultyName));
                });

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">สังกัดคณะ (Faculty)</label>
                      <div className="w-full px-3.5 py-2.5 bg-purple-50/70 border border-purple-200/90 rounded-xl text-sm font-bold text-[#311171] flex items-center justify-between shadow-sm min-h-[44px]">
                        <div className="flex items-center gap-2 min-w-0 mr-2">
                          <Users size={16} className="text-[#311171] shrink-0" />
                          <span className="truncate" title={displayFacultyName}>{displayFacultyName}</span>
                        </div>
                        <span className="text-[10px] bg-[#311171] text-white px-2 py-0.5 rounded-md shrink-0 font-bold whitespace-nowrap">
                          คณะของคุณ
                        </span>
                      </div>
                      <input type="hidden" value={targetFacId} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
                        <CarFront size={14} className="text-[#311171]" />
                        <span>รถตู้ประจำการ (Van)</span>
                      </label>
                      <div className="relative">
                        <select 
                          value={formData.assignedVanId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const matchedVan = vans.find(v => String(v.dbId || v.id).replace(/\D/g, '') === selectedId);
                            setFormData(prev => ({
                              ...prev, 
                              assignedVanId: selectedId,
                              vanAssigned: matchedVan?.plate || prev.vanAssigned
                            }));
                          }}
                          className="w-full pl-3.5 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 font-bold text-gray-800 bg-white shadow-sm min-h-[44px]"
                        >
                          <option value="">-- ไม่ระบุรถตู้ --</option>
                          {matchingFacultyVans.map(v => {
                            const val = String(v.dbId || v.id).replace(/\D/g, '');
                            return (
                              <option key={v.id} value={val}>
                                {v.vanName ? `${v.vanName} (${v.plate})` : v.plate}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">รถตู้ที่คนขับท่านนี้รับผิดชอบประจำ</p>
                    </div>
                  </div>
                );
              })()}

            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/80 rounded-b-3xl">
              <div className="text-xs text-gray-400">
                <span className="text-rose-500">*</span> จำเป็นต้องระบุข้อมูล
              </div>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-200/70 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={!formData.name || !formData.email}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#311171] to-[#451897] hover:from-[#250d55] hover:to-[#311171] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-purple-950/20 hover:shadow-lg flex items-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
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
