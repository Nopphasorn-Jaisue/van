/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { getDrivers } from "@/app/actions/superadmin";
import { 
  UserCheck, Users, Plus, Calendar,
  Search, Phone, Mail, AlertTriangle, ChevronLeft, ChevronRight, X, MapPin,
  CheckCircle2, FileText, UserPlus, Edit, Trash2
} from "lucide-react";

interface DriverItem {
  id: number;
  avatar: string;
  name: string;
  employeeId: string;
  faculty: string;
  type: "MAIN" | "SUB";
  assignedVan: string;
  vanModel: string;
  phone: string;
  email: string;
  licenseNo: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  expiryDays: number;
  status: "READY" | "SUBBING" | "SICK";
}

export default function SuperAdminDrivers() {
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isAssignSubOpen, setIsAssignSubOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverItem | null>(null);

  const [drivers, setDrivers] = useState<DriverItem[]>([]);


  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDrivers();
        setDrivers(data.map(d => ({
          ...d,
          type: d.type as "MAIN" | "SUB",
          status: d.status as "READY" | "SUBBING" | "SICK"
        })));
      } catch (error) {
        console.error("Failed to load drivers", error);
        showToast("เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงานขับรถ");
      }
    }
    loadData();
  }, []);

  const selectedDriver = selectedDriverId ? drivers.find(d => d.id === selectedDriverId) : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(search.toLowerCase()) || 
      d.phone.includes(search) || 
      d.assignedVan.toLowerCase().includes(search.toLowerCase());
    const matchesFaculty = facultyFilter === "ALL" || d.faculty === facultyFilter;
    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesFaculty && matchesStatus;
  });

  const getStatusBadge = (status: DriverItem["status"]) => {
    switch (status) {
      case "READY":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">พร้อมปฏิบัติงาน</span>;
      case "SUBBING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-200">ปฏิบัติงานแทน</span>;
      case "SICK":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">ลาป่วย</span>;
    }
  };

  const totalDrivers = drivers.length;
  const mainDrivers = drivers.filter(d => d.type === "MAIN").length;
  const subDrivers = drivers.filter(d => d.type === "SUB").length;
  const expiringDrivers = drivers.filter(d => d.expiryDays < 30).length;

  const mainPercent = totalDrivers > 0 ? ((mainDrivers / totalDrivers) * 100).toFixed(2) : "0.00";
  const subPercent = totalDrivers > 0 ? ((subDrivers / totalDrivers) * 100).toFixed(2) : "0.00";

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in h-full"
      onClick={() => setSelectedDriverId(null)}
    >
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2 z-50">
          <CheckCircle2 size={20} />
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}

      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#311171] tracking-tight">จัดการพนักงานขับรถ</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">จัดการข้อมูลและสถานะของพนักงานขับรถทั้งหมดในระบบ</p>
        </div>
        <div className="flex gap-2">


        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" onClick={(e) => e.stopPropagation()}>
        
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100/80 text-[#311171] rounded-2xl">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">พนักงานขับรถทั้งหมด</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{totalDrivers}</span>
                <span className="text-xs font-medium text-gray-500">คน</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-medium pl-1">👥 ทั้งหมด</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100/80 text-[#311171] rounded-2xl">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">พนักงานขับรถหลัก</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{mainDrivers}</span>
                <span className="text-xs font-medium text-gray-500">คน</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 pl-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{mainPercent}% ของทั้งหมด</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100/80 text-[#311171] rounded-2xl">
              <UserPlus size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">พนักงานขับรถสำรอง</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{subDrivers}</span>
                <span className="text-xs font-medium text-gray-500">คน</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 pl-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            <span>{subPercent}% ของทั้งหมด</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100/80 text-amber-600 rounded-2xl">
              <FileText size={22} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">ใบขับขี่ใกล้หมดอายุ</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{expiringDrivers}</span>
                <span className="text-xs font-medium text-gray-500">รายการ</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 pl-1 mt-1">
            <AlertTriangle size={12} className="text-amber-500" />
            <span>ภายใน 30 วัน</span>
          </div>
        </div>

      </div>

      {/* Action Bar + Filters */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
        
        {/* Left Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddDriverOpen(true)}
            className="px-4 py-2 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus size={15} />
            <span>+ เพิ่มพนักงานขับรถ</span>
          </button>

          <button
            onClick={() => setIsAssignSubOpen(true)}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Calendar size={15} />
            <span>มอบหมายปฏิบัติงานแทน</span>
          </button>
        </div>

        {/* Right Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
          >
            <option value="ALL">เลือกคณะทั้งหมด</option>
            <option value="คณะเภสัชฯ">คณะเภสัชฯ</option>
            <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
            <option value="คณะ ICT">คณะ ICT</option>
            <option value="คณะเกษตรฯ">คณะเกษตรฯ</option>
            <option value="คณะพลังงานฯ">คณะพลังงานฯ</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
          >
            <option value="ALL">เลือกสถานะทั้งหมด</option>
            <option value="READY">พร้อมปฏิบัติงาน</option>
            <option value="SUBBING">ปฏิบัติงานแทน</option>
            <option value="SICK">ลาป่วย</option>
          </select>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร, ทะเบียนรถ"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* Main Grid: Left Drivers Table + Right Selected Driver Detail (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left Table (8 cols) */}
        <div 
          className={`flex flex-col h-full min-h-0 transition-all duration-300 ${selectedDriver ? 'lg:col-span-8' : 'lg:col-span-12'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col min-h-0 flex-1">
            
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500">
                    <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-3">คณะ</th>
                    <th className="py-3 px-3">ประเภท</th>
                    <th className="py-3 px-3">รถประจำ</th>
                    <th className="py-3 px-3">เบอร์โทร</th>
                    <th className="py-3 px-3">ใบขับขี่หมดอายุ</th>
                    <th className="py-3 px-3 text-center">สถานะ</th>
                    <th className="py-3 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {filteredDrivers.map((d) => {
                    const isSelected = d.id === selectedDriverId;
                    const isLicenseAlert = d.expiryDays <= 30;
                    return (
                      <tr 
                        key={d.id}
                        onClick={() => setSelectedDriverId(isSelected ? null : d.id)}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-purple-50/80 border-l-4 border-l-[#311171]" 
                            : "hover:bg-gray-50/80"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img src={d.avatar} alt={d.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
                            <div>
                              <p className="font-bold text-gray-900 whitespace-nowrap">{d.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">รหัส: {d.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-700 whitespace-nowrap text-[11px]">{d.faculty}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {d.type === "MAIN" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">หลัก</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">สำรอง</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-bold text-gray-800 text-[11px]">{d.assignedVan}</p>

                        </td>
                        <td className="py-3 px-3 font-mono text-gray-700 whitespace-nowrap">{d.phone}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className={`font-bold text-[11px] ${isLicenseAlert ? "text-amber-600" : "text-gray-800"}`}>
                            {d.expiryDate}
                          </p>
                          {d.expiryDays < 0 ? (
                            <p className="text-[10px] font-bold text-rose-600">(หมดอายุแล้ว)</p>
                          ) : (
                            <p className={`text-[10px] font-bold ${isLicenseAlert ? "text-amber-600" : "text-emerald-600"}`}>
                              (อีก {d.expiryDays} วัน)
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(d.status)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
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
              <div>แสดง 1 - {filteredDrivers.length} จาก 28 รายการ</div>
              <div className="flex items-center gap-2">
                <span>แสดงต่อหน้า:</span>
                <select className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none">
                  <option>10</option>
                  <option>20</option>
                </select>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded-lg border border-gray-200"><ChevronLeft size={14} /></button>
                  <button className="px-2.5 py-0.5 bg-[#311171] text-white rounded-lg font-bold">1</button>
                  <button className="px-2.5 py-0.5 border border-gray-200 rounded-lg font-bold">2</button>
                  <button className="px-2.5 py-0.5 border border-gray-200 rounded-lg font-bold">3</button>
                  <button className="p-1 rounded-lg border border-gray-200"><ChevronRight size={14} /></button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side Drawer / Driver Details (4 cols) */}
        {selectedDriver && (
          <div 
            className="lg:col-span-4 flex flex-col space-y-4 h-full min-h-0 overflow-y-auto pr-1 animate-in fade-in slide-in-from-right-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            
            {/* Header Profile */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedDriver.avatar} 
                  alt={selectedDriver.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-gray-900">{selectedDriver.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#311171] text-white">
                      {selectedDriver.type === "MAIN" ? "พนักงานขับรถหลัก" : "พนักงานขับรถสำรอง"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">รหัสพนักงาน {selectedDriver.employeeId}</p>
                  <p className="text-xs text-gray-600 font-medium">{selectedDriver.faculty}</p>
                </div>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            {/* Contact details */}
            <div className="text-xs space-y-1 text-gray-600 font-medium bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
              <p className="flex items-center gap-2"><Phone size={13} className="text-purple-600" /> {selectedDriver.phone}</p>
              <p className="flex items-center gap-2 font-mono"><Mail size={13} className="text-purple-600" /> {selectedDriver.email}</p>
            </div>

            {/* ข้อมูลใบขับขี่ */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-gray-900">ข้อมูลใบขับขี่</h4>
              <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-1.5 font-medium text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">ประเภทใบขับขี่:</span>
                  <span className="font-bold text-gray-900 font-mono">{selectedDriver.licenseType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">เลขที่ใบขับขี่:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedDriver.licenseNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">วันออกใบขับขี่:</span>
                  <span>{selectedDriver.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">วันหมดอายุ:</span>
                  <span className="font-bold text-amber-600">{selectedDriver.expiryDate} (อีก {selectedDriver.expiryDays} วัน)</span>
                </div>

                {selectedDriver.expiryDays <= 30 && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 flex items-center gap-1.5 font-bold">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <span>ใบขับขี่ใกล้หมดอายุ กรุณาต่ออายุใบขับขี่ล่วงหน้า</span>
                  </div>
                )}
              </div>
            </div>

            {/* ปฏิทินความพร้อมใช้งาน */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">ปฏิทินความพร้อมใช้งาน</h4>
                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                  <button><ChevronLeft size={14} /></button>
                  <span>พฤษภาคม 2567</span>
                  <button><ChevronRight size={14} /></button>
                </div>
              </div>

              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100 space-y-2">
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-400 text-[10px]">
                  <span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-700 text-xs">
                  <span className="p-1 rounded-lg">19</span>
                  <span className="p-1 rounded-lg">20</span>
                  <span className="p-1 rounded-lg">21</span>
                  <span className="p-1 rounded-lg bg-[#311171] text-white">22</span>
                  <span className="p-1 rounded-lg">23</span>
                  <span className="p-1 rounded-lg">24</span>
                  <span className="p-1 rounded-lg">25</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[10px] font-medium text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> พร้อมปฏิบัติงาน</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> ปฏิบัติงานแทน</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> ลาป่วย</span>
                </div>
              </div>
            </div>

            {/* ประวัติการเดินทางล่าสุด */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">ประวัติการเดินทางล่าสุด</h4>
                <button className="text-[11px] font-bold text-purple-700 hover:underline">ดูทั้งหมด</button>
              </div>

              <div className="space-y-2">
                {[
                  { title: "เดินทางไป คณะเภสัชฯ", van: "รถตู้ นข 1234 เชียงใหม่", date: "21 พ.ค. 2567 09:00", icon: MapPin },
                  { title: "เดินทางไป คณะเกษตรศาสตร์", van: "รถตู้ นข 1234 เชียงใหม่", date: "20 พ.ค. 2567 13:30", icon: MapPin },
                  { title: "เดินทางไป โรงพยาบาลมหาราชนครเชียงใหม่", van: "รถตู้ นข 1234 เชียงใหม่", date: "20 พ.ค. 2567 08:15", icon: MapPin },
                ].map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 bg-gray-50/70 rounded-xl border border-gray-100">
                    <div className="p-1.5 bg-purple-100 text-[#311171] rounded-lg shrink-0">
                      <t.icon size={13} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-[11px]">{t.title}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{t.van} • {t.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={() => setEditingDriver(selectedDriver)}
                className="flex-1 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Edit size={14} />
                <span>แก้ไขข้อมูล</span>
              </button>
              <button 
                onClick={() => { setSelectedDriverId(null); showToast("ลบพนักงานขับรถเรียบร้อยแล้ว"); }}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>ลบข้อมูล</span>
              </button>
            </div>

          </div>
          </div>
        )}

      </div>

      {/* MODALS */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-gray-900">เพิ่มพนักงานขับรถใหม่</h3>
              <button onClick={() => setIsAddDriverOpen(false)} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">ชื่อ - นามสกุล:</label>
                <input type="text" placeholder="เช่น นายสมชาย ใจดี" className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="font-bold block mb-1">เบอร์โทรศัพท์:</label>
                <input type="text" placeholder="081-234-5678" className="w-full p-3 border rounded-xl font-mono" />
              </div>
              <div>
                <label className="font-bold block mb-1">สังกัดคณะ:</label>
                <select className="w-full p-3 border rounded-xl bg-white outline-none">
                  <option value="">เลือกคณะ</option>
                  <option value="คณะเภสัชฯ">คณะเภสัชฯ</option>
                  <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
                  <option value="คณะ ICT">คณะ ICT</option>
                  <option value="คณะเกษตรฯ">คณะเกษตรฯ</option>
                  <option value="คณะพลังงานฯ">คณะพลังงานฯ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsAddDriverOpen(false)} className="flex-1 bg-gray-100 py-2 rounded-xl text-xs font-bold">ยกเลิก</button>
              <button onClick={() => { setIsAddDriverOpen(false); showToast("เพิ่มพนักงานขับรถเรียบร้อยแล้ว"); }} className="flex-1 bg-[#311171] text-white py-2 rounded-xl text-xs font-bold">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {editingDriver && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-gray-900">แก้ไขข้อมูลพนักงานขับรถ</h3>
              <button onClick={() => setEditingDriver(null)} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">ชื่อ - นามสกุล:</label>
                <input type="text" defaultValue={editingDriver.name} className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="font-bold block mb-1">เบอร์โทรศัพท์:</label>
                <input type="text" defaultValue={editingDriver.phone} className="w-full p-3 border rounded-xl font-mono" />
              </div>
              <div>
                <label className="font-bold block mb-1">สังกัดคณะ:</label>
                <select defaultValue={editingDriver.faculty} className="w-full p-3 border rounded-xl bg-white outline-none">
                  <option value="คณะเภสัชฯ">คณะเภสัชฯ</option>
                  <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
                  <option value="คณะ ICT">คณะ ICT</option>
                  <option value="คณะเกษตรฯ">คณะเกษตรฯ</option>
                  <option value="คณะพลังงานฯ">คณะพลังงานฯ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingDriver(null)} className="flex-1 bg-gray-100 py-2 rounded-xl text-xs font-bold">ยกเลิก</button>
              <button onClick={() => { setEditingDriver(null); showToast("บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว"); }} className="flex-1 bg-[#311171] text-white py-2 rounded-xl text-xs font-bold">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {isAssignSubOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-gray-900">มอบหมายคนขับสำรองปฏิบัติงานแทน</h3>
              <button onClick={() => setIsAssignSubOpen(false)} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 font-medium">เลือกพนักงานขับรถหลัก และพนักงานขับรถสำรองที่มาปฏิบัติงานแทน</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">คนขับหลักที่ต้องการลา/ไม่พร้อม:</label>
                <select className="w-full p-3 border rounded-xl font-bold">
                  <option>นายสมชาย ใจดี (คณะวิทยาศาสตร์)</option>
                  <option>นายวิจัย คำปิน (คณะเภสัชฯ)</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">คนขับสำรองที่มอบหมายแทน:</label>
                <select className="w-full p-3 border rounded-xl font-bold">
                  <option>นายณัฐพล อินทร์แก้ว (คณะเกษตรศาสตร์)</option>
                  <option>นายธนวัฒน์ ศรีสุข (คณะศึกษาศาสตร์)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsAssignSubOpen(false)} className="flex-1 bg-gray-100 py-2 rounded-xl text-xs font-bold">ยกเลิก</button>
              <button onClick={() => { setIsAssignSubOpen(false); showToast("มอบหมายการปฏิบัติงานแทนเรียบร้อยแล้ว"); }} className="flex-1 bg-[#311171] text-white py-2 rounded-xl text-xs font-bold">บันทึกการมอบหมาย</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


