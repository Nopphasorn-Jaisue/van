/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
// Used REST API for stable real-time data loading
import { 
  Building2, Users, Bus, UserCheck, Plus, MoreVertical, X,
  Phone, Mail, MapPin, Edit, UserCog, History, ChevronLeft, ChevronRight,
  CheckCircle2, Trash2
} from "lucide-react";

interface FacultyItem {
  id: number;
  name: string;
  code: string;
  adminName: string;
  adminTitle: string;
  adminPhone: string;
  adminEmail: string;
  executiveName: string;
  executiveTitle: string;
  executivePhone: string;
  executiveEmail: string;
  totalVans: number;
  mainDrivers: number;
  subDrivers: number;
  phone: string;
  email: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function SuperAdminFaculties() {
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyItem | null>(null);
  const [changeAdminFaculty, setChangeAdminFaculty] = useState<FacultyItem | null>(null);
  const [historyFaculty, setHistoryFaculty] = useState<FacultyItem | null>(null);
  const [deleteConfirmFaculty, setDeleteConfirmFaculty] = useState<FacultyItem | null>(null);

  
  const [allUsersList, setAllUsersList] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/super-admin/faculties');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setFaculties(result.data);
          try { sessionStorage.setItem('cached_superadmin_faculties_v3', JSON.stringify(result.data)); } catch {}
          return;
        }
      }
      showToast("เกิดข้อผิดพลาดในการโหลดข้อมูลคณะ");
    } catch (error) {
      console.error("Failed to load faculties", error);
      showToast("เกิดข้อผิดพลาดในการโหลดข้อมูลคณะ");
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await fetch('/api/super-admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) setAllUsersList(data.users);
      }
    } catch {}
  };

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('cached_superadmin_faculties_v3');
      if (cached) setFaculties(JSON.parse(cached));
    } catch {}
    loadData();
    fetchUsersList();
  }, []);

  const selectedFaculty = selectedFacultyId ? faculties.find(f => f.id === selectedFacultyId) : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteFaculty = async (faculty: FacultyItem) => {
    try {
      const res = await fetch(`/api/super-admin/faculties?id=${faculty.id}`, {
        method: 'DELETE'
      });
      const result = await res.json().catch(() => ({ success: false, error: 'เกิดข้อผิดพลาดในการลบคณะ' }));
      if (res.ok && result.success) {
        showToast(result.message || "ลบคณะเรียบร้อยแล้ว");
        setFaculties(prev => prev.filter(f => f.id !== faculty.id));
        if (selectedFacultyId === faculty.id) setSelectedFacultyId(null);
      } else {
        showToast(result.error || result.message || "ไม่สามารถลบคณะได้");
      }
    } catch (error) {
      console.error("Failed to delete faculty", error);
      showToast("เกิดข้อผิดพลาดในการลบคณะ");
    } finally {
      setDeleteConfirmFaculty(null);
    }
  };

  const totalFaculties = faculties.length;
  const activeFaculties = faculties.filter(f => f.status === "ACTIVE").length;
  const activePercent = totalFaculties > 0 ? ((activeFaculties / totalFaculties) * 100).toFixed(0) : "0";

  const totalVans = faculties.reduce((acc, curr) => acc + curr.totalVans, 0);
  const totalDrivers = faculties.reduce((acc, curr) => acc + curr.mainDrivers + (curr.subDrivers || 0), 0);

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in h-full"
      onClick={() => setSelectedFacultyId(null)}
    >
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs" onClick={(e) => e.stopPropagation()}>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">จัดการข้อมูลคณะ</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">กำหนดผู้ดูแลคณะ รถประจำคณะ และรายชื่อคนขับประจำ/สำรองของแต่ละคณะ</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus size={15} />
            <span>เพิ่มคณะ</span>
          </button>


        </div>
      </div>


      {/* Top 4 Stat Cards (Image 2 Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" onClick={(e) => e.stopPropagation()}>
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#311171]/20 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#311171] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#311171]/30">
              <Building2 size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">คณะทั้งหมด</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{totalFaculties} คณะ</span>
              </div>
              <p className="text-xs font-bold text-purple-600 mt-0.5">ในระบบทั้งหมด</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/30">
              <Users size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">คณะที่ใช้งานอยู่</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{activeFaculties} คณะ</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">Active {activePercent}%</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-blue-200">
              <Bus size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">รถประจำคณะ</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{totalVans} คัน</span>
              </div>
              <p className="text-xs font-bold text-blue-600 mt-0.5">ทั้งหมด {totalVans} คัน</p>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#C39B22]/30 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#C39B22] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#C39B22]/30">
              <UserCheck size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">พนักงานขับรถทั้งหมด</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{totalDrivers} คน</span>
              </div>
              <p className="text-xs font-bold text-amber-600 mt-0.5">ทั้งหมด {totalDrivers} คน</p>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Layout: Left Table + Right Faculty Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left Side: Faculties Table (8 cols) */}
        <div 
          className={`flex flex-col h-full min-h-0 transition-all duration-300 ${selectedFaculty ? 'lg:col-span-8' : 'lg:col-span-12'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col min-h-0 flex-1">
            
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500">
                    <th className="py-3 px-5">คณะ</th>
                    <th className="py-3 px-3">ชื่อย่อ</th>
                    <th className="py-3 px-3">ผู้ดูแลคณะ</th>
                    <th className="py-3 px-3 text-center">รถประจำคณะ</th>
                    <th className="py-3 px-3 text-center">พนักงานขับรถ</th>
                    <th className="py-3 px-3">ติดต่อ</th>
                    <th className="py-3 px-3 text-center">สถานะ</th>
                    <th className="py-3 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {faculties.map((f) => {
                    const isSelected = f.id === selectedFacultyId;
                    return (
                      <tr 
                        key={f.id} 
                        onClick={() => setSelectedFacultyId(isSelected ? null : f.id)}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-purple-50/90 border-l-4 border-l-[#311171]" 
                            : "hover:bg-gray-50/80"
                        }`}
                      >
                        <td className="py-3 px-5 font-bold text-gray-900 whitespace-nowrap">{f.name}</td>
                        <td className="py-3 px-3 font-mono font-bold text-purple-700">{f.code}</td>
                        <td className="py-3 px-3 text-gray-700 whitespace-nowrap">{f.adminName}</td>
                        <td className="py-3 px-3 text-center font-bold text-gray-900">{f.totalVans} คัน</td>
                        <td className="py-3 px-3 text-center font-bold text-gray-900">{f.mainDrivers} คน</td>
                        <td className="py-3 px-3 font-mono text-gray-600 text-[11px] whitespace-nowrap">{f.phone}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            ใช้งานอยู่
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center flex items-center justify-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingFaculty(f); }}
                            className="p-1.5 text-gray-400 hover:text-[#311171] rounded-lg"
                            title="แก้ไข"
                          >
                            <MoreVertical size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmFaculty(f); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <span>แสดง</span>
                <select className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none">
                  <option>10</option>
                  <option>20</option>
                </select>
                <span>รายการต่อหน้า</span>
              </div>

              <div>แสดง 1 - 10 จาก 18 รายการ</div>

              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400"><ChevronLeft size={14} /></button>
                <button className="px-3 py-1 bg-[#311171] text-white rounded-lg font-bold">1</button>
                <button className="px-3 py-1 border border-gray-200 rounded-lg font-bold">2</button>
                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-600"><ChevronRight size={14} /></button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Selected Faculty Drawer / Details (4 cols) */}
        {selectedFaculty && (
          <div 
            className="lg:col-span-4 flex flex-col space-y-4 h-full min-h-0 overflow-y-auto pr-1 animate-in fade-in slide-in-from-right-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900">รายละเอียดคณะ</h3>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={16} /></button>
            </div>

            {/* Faculty Title Badge */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-[#311171] rounded-2xl">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="font-black text-base text-gray-900">{selectedFaculty.name}</h4>
                <span className="font-mono text-xs font-bold text-purple-700">{selectedFaculty.code}</span>
              </div>
            </div>

            {/* ข้อมูลติดต่อ */}
            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-gray-900 text-xs">ข้อมูลติดต่อ</h5>
              <div className="space-y-1.5 text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-purple-600 shrink-0" />
                  <span>{selectedFaculty.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-purple-600 shrink-0" />
                  <span>{selectedFaculty.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">{selectedFaculty.address}</span>
                </div>
              </div>
            </div>

            {/* ผู้อนุมัติผู้บริหาร */}
            <div className="space-y-2 text-xs bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
              <h5 className="font-bold text-gray-900 text-xs">ผู้อนุมัติผู้บริหาร</h5>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" 
                  alt={selectedFaculty.executiveName}
                  className="w-10 h-10 rounded-full object-cover border border-purple-200" 
                />
                <div>
                  <p className="font-bold text-gray-900">{selectedFaculty.executiveName}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{selectedFaculty.executiveTitle}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                    <Phone size={11} className="text-gray-400" />
                    <span>{selectedFaculty.executivePhone}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                    <Mail size={11} className="text-gray-400" />
                    <span>{selectedFaculty.executiveEmail}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ผู้ดูแลคณะ (ปัจจุบัน) */}
            <div className="space-y-2 text-xs bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
              <h5 className="font-bold text-gray-900 text-xs">ผู้ดูแลคณะ (ปัจจุบัน)</h5>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" 
                  alt={selectedFaculty.adminName}
                  className="w-10 h-10 rounded-full object-cover border border-purple-200" 
                />
                <div>
                  <p className="font-bold text-gray-900">{selectedFaculty.adminName}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{selectedFaculty.adminTitle}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                    <Phone size={11} className="text-gray-400" />
                    <span>{selectedFaculty.adminPhone}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                    <Mail size={11} className="text-gray-400" />
                    <span>{selectedFaculty.adminEmail}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button 
                onClick={() => setEditingFaculty(selectedFaculty)}
                className="w-full py-2.5 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Edit size={14} />
                <span>แก้ไขข้อมูล</span>
              </button>

              <button 
                onClick={() => setChangeAdminFaculty(selectedFaculty)}
                className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <UserCog size={14} />
                <span>เปลี่ยนผู้ดูแล</span>
              </button>

              <button 
                onClick={() => setHistoryFaculty(selectedFaculty)}
                className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <History size={14} />
                <span>ดูประวัติ</span>
              </button>
            </div>

          </div>
          </div>
        )}

      </div>

      {/* ----- MODALS ----- */}

      {/* 1. Modal: เพิ่มคณะใหม่ */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setIsAddOpen(false);
              showToast("เพิ่มคณะใหม่เข้าสู่ระบบเรียบร้อยแล้ว");
            }} 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">เพิ่มคณะ / หน่วยงานใหม่</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">ชื่อคณะ:</label>
                <input type="text" required placeholder="เช่น คณะสถาปัตยกรรมศาสตร์" className="w-full p-3 border border-gray-200 rounded-xl outline-none" />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">ชื่อย่อ (ENG Code):</label>
                <input type="text" required placeholder="เช่น ARCH" className="w-full p-3 border border-gray-200 rounded-xl outline-none font-mono" />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">ผู้ดูแลคณะ:</label>
                <input type="text" placeholder="ระบุชื่อผู้ดูแล" className="w-full p-3 border border-gray-200 rounded-xl outline-none" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-bold text-xs">ยกเลิก</button>
              <button type="submit" className="flex-1 bg-[#311171] text-white py-2.5 rounded-xl font-bold text-xs shadow-md">บันทึกข้อมูล</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Modal: เปลี่ยนผู้ดูแล */}
      {changeAdminFaculty && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">แต่งตั้งผู้ดูแลคณะใหม่</h3>
              <button onClick={() => setChangeAdminFaculty(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X size={20} /></button>
            </div>

            <p className="text-xs text-gray-500 font-medium">คณะ: <strong className="text-gray-900">{changeAdminFaculty.name}</strong></p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">เลือกผู้ดูแลท่านใหม่:</label>
                <select className="w-full p-3 border border-gray-200 rounded-xl outline-none font-bold">
                  <option>นายกฤษฎา วงศ์ไชย (krisada.w@up.ac.th)</option>
                  <option>นางสาวจิราภรณ์ แซ่ตั้ง (jiraporn.t@up.ac.th)</option>
                  <option>นายสมชาย ใจดี (somchai.j@up.ac.th)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setChangeAdminFaculty(null)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-bold text-xs">ยกเลิก</button>
              <button 
                onClick={() => {
                  setChangeAdminFaculty(null);
                  showToast("แต่งตั้งผู้ดูแลคณะเรียบร้อยแล้ว");
                }} 
                className="flex-1 bg-[#311171] text-white py-2.5 rounded-xl font-bold text-xs shadow-md"
              >
                ยืนยันการเปลี่ยน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: แก้ไขข้อมูลคณะ */}
      {editingFaculty && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">แก้ไขข้อมูลคณะ</h3>
              <button onClick={() => setEditingFaculty(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 font-medium">แก้ไขข้อมูล: <strong className="text-gray-900">{editingFaculty.name} ({editingFaculty.code})</strong></p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">เบอร์ติดต่อ:</label>
                <input 
                  type="text" 
                  maxLength={10}
                  defaultValue={editingFaculty.phone} 
                  onChange={(e) => setEditingFaculty({...editingFaculty, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none" 
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingFaculty(null)} className="flex-1 bg-gray-100 py-2.5 rounded-xl font-bold text-xs">ยกเลิก</button>
              <button onClick={() => { setEditingFaculty(null); showToast("แก้ไขข้อมูลคณะเรียบร้อยแล้ว"); }} className="flex-1 bg-[#311171] text-white py-2.5 rounded-xl font-bold text-xs shadow-md">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: ประวัติคณะ */}
      {historyFaculty && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">ประวัติกิจกรรมและการใช้งาน</h3>
              <button onClick={() => setHistoryFaculty(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 font-medium">ประวัติของ: <strong className="text-gray-900">{historyFaculty.name}</strong></p>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-gray-800">เปลี่ยนผู้ดูแลคณะเป็น {historyFaculty.adminName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">15 พ.ค. 2567 10:30</p>
              </div>
            </div>
            <button onClick={() => setHistoryFaculty(null)} className="w-full bg-gray-100 py-2.5 rounded-xl font-bold text-xs">ปิด</button>
          </div>
        </div>
      )}

      {/* 5. Modal: ยืนยันการลบคณะ */}
      {deleteConfirmFaculty && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900">ยืนยันการลบคณะ?</h3>
            <p className="text-sm text-gray-500 font-medium">
              คุณแน่ใจหรือไม่ว่าต้องการลบ <strong className="text-gray-900">{deleteConfirmFaculty.name}</strong>ออกจากระบบ? ข้อมูลที่เกี่ยวข้องอาจได้รับผลกระทบ
            </p>
            <div className="flex gap-2 pt-4">
              <button 
                onClick={() => setDeleteConfirmFaculty(null)} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition-all"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => handleDeleteFaculty(deleteConfirmFaculty)} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

