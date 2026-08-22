/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Edit, Shield, Users, X, CheckCircle2,
  ChevronLeft, ChevronRight, Trash2, Save, Briefcase, Crown,
  Check, Minus
} from "lucide-react";

interface UserItem {
  id: number;
  avatar: string | null;
  name: string;
  faculty: string;
  role: "SUPER_ADMIN" | "FACULTY_ADMIN" | "EXECUTIVE" | "DRIVER" | "USER";
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  lastLogin?: string;
}

export default function SuperAdminUsers() {

  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [showRoleSummaryModal, setShowRoleSummaryModal] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Default fallback user items
  const initialUsers: UserItem[] = [];

  // User data state
  const [usersData, setUsersData] = useState<UserItem[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(true);
  const [customFaculties, setCustomFaculties] = useState<string[]>([]);
  const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/super-admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setUsersData(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "FACULTY_ADMIN" as UserItem["role"],
    faculty: "คณะเภสัชฯ"
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      
      if (res.ok) {
        setIsAddUserOpen(false);
        setNewUser({ name: "", email: "", role: "FACULTY_ADMIN", faculty: "คณะเภสัชฯ" });
        showToast(`เพิ่มผู้ใช้งาน ${newUser.name} เรียบร้อยแล้ว`);
        fetchUsers();
      } else {
        showToast(`เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน`);
      }
    } catch (err) {
      console.warn("POST user error:", err);
      showToast(`เกิดข้อผิดพลาด: ระบบเชื่อมต่อขัดข้อง`);
    }
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });

      if (res.ok) {
        setEditingUser(null);
        showToast(`อัปเดตข้อมูลของ ${editingUser.name} เรียบร้อยแล้ว`);
        fetchUsers();
      } else {
        showToast(`เกิดข้อผิดพลาดในการอัปเดตข้อมูล`);
      }
    } catch (err) {
      console.warn("PUT user error:", err);
      showToast(`เกิดข้อผิดพลาด: ระบบเชื่อมต่อขัดข้อง`);
    }
  };

  const handleDeleteUser = (id: number, name: string) => {
    setUserToDelete({ id, name });
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const { id, name } = userToDelete;

    try {
      const res = await fetch(`/api/super-admin/users?id=${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setUserToDelete(null);
        showToast(`ลบผู้ใช้งาน ${name} เรียบร้อยแล้ว`);
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => null);
        showToast(errData?.error || `เกิดข้อผิดพลาดในการลบข้อมูล`);
      }
    } catch (err) {
      console.warn("DELETE user error:", err);
      showToast(`เกิดข้อผิดพลาด: ระบบเชื่อมต่อขัดข้อง`);
    }
  };

  const filteredUsers = usersData.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFaculty = facultyFilter === "ALL" || u.faculty === facultyFilter;
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesFaculty && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getRoleBadge = (role: UserItem["role"]) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">ผู้ดูแลระบบสูงสุด</span>;
      case "FACULTY_ADMIN":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-sky-100 text-sky-700 border border-sky-200">ผู้ดูแลระดับคณะ</span>;
      case "EXECUTIVE":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200">ผู้บริหาร</span>;
      case "DRIVER":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">พนักงานขับรถ</span>;
      case "USER":
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">ผู้ใช้งานทั่วไป (นิสิต/บุคลากร)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-gray-100 text-gray-600 border border-gray-200">{role}</span>;
    }
  };

  const getStatusBadge = (status: UserItem["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ใช้งานอยู่</span>;
      case "SUSPENDED":
        return <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-500"></span> ถูกระงับ</span>;
      case "PENDING":
        return <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500"></span> รออนุมัติ</span>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-5 animate-in fade-in">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-transparent p-5 ">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">จัดการผู้ใช้งานระบบ</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">ศูนย์จัดการระบบส่วนกลาง / จัดการผู้ใช้งานระบบ</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRoleSummaryModal(true)}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Users size={15} />
            <span>สรุปบทบาทผู้ใช้งาน</span>
          </button>

          <button 
            onClick={() => setShowMatrixModal(true)}
            className="px-4 py-2 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Shield size={15} />
            <span>บทบาทและสิทธิ์</span>
          </button>


        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-h-0 space-y-5">
        
        {/* Users Main Panel */}
        <div className="flex flex-col h-full flex-1 min-h-0">
          
          {/* Table Container Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col h-full flex-1">
            
            {/* Filter Bar */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, อีเมล"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#311171]/20"
                  />
                </div>

                {/* Faculty Filter */}
                <select
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
                >
                  <option value="ALL">คณะ: ทั้งหมด</option>
                  <option value="คณะเภสัชฯ">คณะเภสัชฯ</option>
                  <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
                  <option value="คณะ ICT">คณะ ICT</option>
                  <option value="คณะเกษตรฯ">คณะเกษตรฯ</option>
                  <option value="คณะพลังงานฯ">คณะพลังงานฯ</option>
                  {customFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                </select>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
                >
                  <option value="ALL">บทบาท: ทั้งหมด</option>
                  <option value="SUPER_ADMIN">ผู้ดูแลระบบสูงสุด</option>
                  <option value="FACULTY_ADMIN">ผู้ดูแลระดับคณะ</option>
                  <option value="EXECUTIVE">ผู้บริหาร</option>
                  <option value="DRIVER">พนักงานขับรถ</option>
                  <option value="USER">ผู้ใช้งานทั่วไป (นิสิต/บุคลากร)</option>
                </select>
              </div>

              {/* Top Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-3.5 py-2 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <span>+ เพิ่มผู้ใช้งาน</span>
                </button>
              </div>
            </div>

            {/* Main Users Table */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500">
                    <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-3">คณะ</th>
                    <th className="py-3 px-3">บทบาท</th>
                    <th className="py-3 px-3">อีเมล</th>
                    <th className="py-3 px-3">สถานะ</th>
                    <th className="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500 font-bold">
                        กำลังโหลดข้อมูลผู้ใช้งาน...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500 font-bold">
                        ไม่พบข้อมูลผู้ใช้งาน
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-gray-900 whitespace-nowrap">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-700 whitespace-nowrap">{user.faculty}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="py-3 px-3 font-mono text-gray-600 text-[11px]">{user.email}</td>
                      <td className="py-3 px-3 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (user.role === 'DRIVER') {
                                showToast('คนขับรถตู้ สามารถแก้ไขและลบได้โดยแอดมินคณะเท่านั้น');
                                return;
                              }
                              setEditingUser(user);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${user.role === 'DRIVER' ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-[#311171] hover:bg-purple-50'}`}
                            title={user.role === 'DRIVER' ? 'แก้ไขโดยแอดมินคณะเท่านั้น' : 'แก้ไข'}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (user.role === 'DRIVER') {
                                showToast('คนขับรถตู้ สามารถแก้ไขและลบได้โดยแอดมินคณะเท่านั้น');
                                return;
                              }
                              handleDeleteUser(user.id, user.name);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${user.role === 'DRIVER' ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'}`}
                            title={user.role === 'DRIVER' ? 'ลบโดยแอดมินคณะเท่านั้น' : 'ลบ'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 font-medium">
              <div>
                <span className="text-gray-500 font-medium">แสดง {isLoading ? 0 : (currentPage - 1) * pageSize + 1} - {isLoading ? 0 : Math.min(currentPage * pageSize, filteredUsers.length)} จาก {isLoading ? 0 : filteredUsers.length} รายการ</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none"
                  >
                    <option value={10}>10 รายการต่อหน้า</option>
                    <option value={20}>20 รายการต่อหน้า</option>
                    <option value={50}>50 รายการต่อหน้า</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-50"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button className="px-3 py-1 bg-[#311171] text-white rounded-lg font-bold">{currentPage}</button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / pageSize), p + 1))}
                    disabled={currentPage >= Math.ceil(filteredUsers.length / pageSize)}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ----- MODALS ----- */}

      {/* 1. Modal: เพิ่มผู้ใช้ใหม่ */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleAddUserSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">เพิ่มผู้ใช้งานใหม่ในระบบ</h3>
              <button type="button" onClick={() => setIsAddUserOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">ชื่อ - นามสกุล:</label>
                <input 
                  type="text"
                  required
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
                />
              </div>



              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">อีเมลมหาวิทยาลัย:</label>
                <input 
                  type="email"
                  required
                  placeholder="somchai.j@up.ac.th"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">สิทธิ์การใช้งาน (Role):</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserItem["role"]})}
                  className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
                >
                  <option value="FACULTY_ADMIN">ผู้ดูแลระดับคณะ</option>
                  <option value="EXECUTIVE">ผู้บริหาร</option>
                  <option value="USER">ผู้ใช้งานทั่วไป (นิสิต/บุคลากร)</option>
                </select>
              </div>

              {true && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">คณะ / สังกัด:</label>
                    <button type="button" onClick={() => setIsAddFacultyOpen(true)} className="text-[10px] text-[#311171] hover:bg-purple-50 px-2 py-0.5 rounded-lg font-bold transition-colors">+ เพิ่มคณะใหม่</button>
                  </div>
                  <select
                    value={newUser.faculty}
                    onChange={(e) => setNewUser({...newUser, faculty: e.target.value})}
                    className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
                  >
                    <option value="คณะเทคโนโลยีสารสนเทศและการสื่อสาร">คณะเทคโนโลยีสารสนเทศและการสื่อสาร</option>
                    <option value="คณะเภสัชฯ">คณะเภสัชฯ</option>
                    <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
                    <option value="คณะเกษตรฯ">คณะเกษตรฯ</option>
                    <option value="คณะพลังงานฯ">คณะพลังงานฯ</option>
                    {![
                      "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", "คณะเภสัชฯ", "คณะวิทยาศาสตร์", "คณะเกษตรฯ", "คณะพลังงานฯ"
                    ].includes(newUser.faculty) && !customFaculties.includes(newUser.faculty) && newUser.faculty && (
                      <option value={newUser.faculty}>{newUser.faculty}</option>
                    )}
                    {customFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAddUserOpen(false)} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-[#311171] hover:bg-[#230b54] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Save size={15} /> บันทึกข้อมูล
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Modal: สรุปบทบาทผู้ใช้งาน */}
      {showRoleSummaryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Users className="text-[#311171]" />
                สรุปบทบาทผู้ใช้งาน
              </h3>
              <button onClick={() => setShowRoleSummaryModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { role: "FACULTY_ADMIN", label: "ผู้ดูแลระดับคณะ", icon: Shield, color: "bg-sky-100 text-sky-600" },
                { role: "EXECUTIVE", label: "ผู้บริหาร", icon: Briefcase, color: "bg-amber-100 text-amber-600" },
                { role: "SUPER_ADMIN", label: "ผู้ดูแลระบบสูงสุด", icon: Crown, color: "bg-purple-100 text-purple-600" },
              ].map((item) => {
                const Icon = item.icon;
                const count = usersData.filter(u => u.role === item.role).length;
                const pct = usersData.length > 0 ? ((count / usersData.length) * 100).toFixed(1) + "%" : "0%";
                return (
                  <div key={item.role} className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 hover:border-[#311171]/30 hover:bg-purple-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${item.color}`}>
                        <Icon size={18} />
                      </div>
                      <span className="font-bold text-sm text-gray-800 font-mono">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-gray-900">{count}</span>
                      <span className="text-xs text-gray-400 font-medium w-10 text-right">({pct})</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-2">
              <button 
                onClick={() => setShowRoleSummaryModal(false)} 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: สิทธิ์และเมทริกซ์สิทธิ์เต็ม */}
      {showMatrixModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Shield className="text-[#311171]" />
                เมทริกซ์กำหนดสิทธิ์ตามบทบาทผู้ใช้งาน (Role & Permissions Matrix)
              </h3>
              <button onClick={() => setShowMatrixModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                    <th className="p-3">ฟังก์ชัน / สิทธิ์ระบบ</th>
                    <th className="p-3 text-center">ผู้ดูแลระดับคณะ</th>
                    <th className="p-3 text-center">ผู้บริหาร</th>
                    <th className="p-3 text-center">พนักงานขับรถ</th>
                    <th className="p-3 text-center">ผู้ดูแลระบบสูงสุด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {[
                    { name: "ดูปฏิทินและการจอง", fa: true, ex: true, dr: true, sa: true },
                    { name: "ส่งคำขอจองรถตู้", fa: true, ex: true, dr: false, sa: true },
                    { name: "อนุมัติคำขอในระดับคณะ", fa: true, ex: false, dr: false, sa: true },
                    { name: "อนุมัติคำขอระดับบริหาร", fa: false, ex: true, dr: false, sa: true },
                    { name: "จัดการภารกิจเดินรถประจำวัน", fa: false, ex: false, dr: true, sa: true },
                    { name: "จัดการข้อมูลรถตู้ในสังกัด", fa: true, ex: false, dr: false, sa: true },
                    { name: "จัดการข้อมูลคนขับในสังกัด", fa: true, ex: false, dr: false, sa: true },
                    { name: "จัดการสิทธิ์และผู้ใช้ทั้งมหาวิทยาลัย", fa: false, ex: false, dr: false, sa: true },
                  ].map((p, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/20">
                      <td className="p-3 font-bold text-gray-800">{p.name}</td>
                      <td className="p-3 text-center">{p.fa ? <Check size={14} className="mx-auto text-emerald-600 font-bold" /> : <Minus size={14} className="mx-auto text-gray-300" />}</td>
                      <td className="p-3 text-center">{p.ex ? <Check size={14} className="mx-auto text-emerald-600 font-bold" /> : <Minus size={14} className="mx-auto text-gray-300" />}</td>
                      <td className="p-3 text-center">{p.dr ? <Check size={14} className="mx-auto text-emerald-600 font-bold" /> : <Minus size={14} className="mx-auto text-gray-300" />}</td>
                      <td className="p-3 text-center">{p.sa ? <Check size={14} className="mx-auto text-emerald-600 font-bold" /> : <Minus size={14} className="mx-auto text-gray-300" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-right">
              <button 
                onClick={() => setShowMatrixModal(false)}
                className="px-5 py-2 bg-[#311171] text-white text-xs font-bold rounded-xl hover:bg-[#230b54]"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: แก้ไขผู้ใช้ */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleUpdateUserSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">แก้ไขข้อมูลผู้ใช้งาน</h3>
                <p className="text-xs text-gray-500 font-mono">{editingUser.email}</p>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">ชื่อ - นามสกุล:</label>
                <input 
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">อีเมล (Email):</label>
                <input 
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">สิทธิ์การใช้งาน (Role):</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value as UserItem["role"]})}
                  className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
                >
                  <option value="FACULTY_ADMIN">ผู้ดูแลระดับคณะ</option>
                  <option value="EXECUTIVE">ผู้บริหาร</option>
                  <option value="USER">ผู้ใช้งานทั่วไป (นิสิต/บุคลากร)</option>
                </select>
              </div>

              {true && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">คณะ / สังกัด:</label>
                    <button type="button" onClick={() => setIsAddFacultyOpen(true)} className="text-[10px] text-[#311171] hover:bg-purple-50 px-2 py-0.5 rounded-lg font-bold transition-colors">+ เพิ่มคณะใหม่</button>
                  </div>
                  <select
                    value={editingUser.faculty}
                    onChange={(e) => setEditingUser({...editingUser, faculty: e.target.value})}
                    className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
                  >
                    <option value="คณะเทคโนโลยีสารสนเทศและการสื่อสาร">คณะเทคโนโลยีสารสนเทศและการสื่อสาร</option>
                    <option value="คณะเภสัชฯ">คณะเภสัชฯ</option>
                    <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
                    <option value="คณะเกษตรฯ">คณะเกษตรฯ</option>
                    <option value="คณะพลังงานฯ">คณะพลังงานฯ</option>
                    {![
                      "คณะเทคโนโลยีสารสนเทศและการสื่อสาร", "คณะเภสัชฯ", "คณะวิทยาศาสตร์", "คณะเกษตรฯ", "คณะพลังงานฯ"
                    ].includes(editingUser.faculty) && !customFaculties.includes(editingUser.faculty) && editingUser.faculty && (
                      <option value={editingUser.faculty}>{editingUser.faculty}</option>
                    )}
                    {customFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">สถานะผู้ใช้:</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({...editingUser, status: e.target.value as UserItem["status"]})}
                  className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
                >
                  <option value="ACTIVE">ACTIVE (ใช้งานอยู่)</option>
                  <option value="SUSPENDED">SUSPENDED (ถูกระงับ)</option>
                  <option value="PENDING">PENDING (รออนุมัติ)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setEditingUser(null)} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-[#311171] hover:bg-[#230b54] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Save size={15} /> บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Faculty Modal */}
      {isAddFacultyOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-4">เพิ่มคณะ/สังกัดใหม่</h3>
            <input
              type="text"
              autoFocus
              value={newFacultyName}
              onChange={(e) => setNewFacultyName(e.target.value)}
              placeholder="ระบุชื่อคณะ เช่น คณะสถาปัตยกรรมศาสตร์"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#311171]/20 outline-none mb-6"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddFacultyOpen(false);
                  setNewFacultyName("");
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newFacultyName.trim() && !customFaculties.includes(newFacultyName.trim())) {
                    setCustomFaculties([...customFaculties, newFacultyName.trim()]);
                  }
                  setIsAddFacultyOpen(false);
                  setNewFacultyName("");
                }}
                className="flex-1 px-4 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-purple-900/20"
              >
                เพิ่มคณะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal (NO Emojis, Clean & Modern) */}
      {userToDelete && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto">
              <Trash2 size={26} strokeWidth={2.5} />
            </div>
            
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-gray-900">ยืนยันการลบผู้ใช้งาน</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน <span className="text-rose-600 font-bold">&quot;{userToDelete.name}&quot;</span> ออกจากระบบ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


