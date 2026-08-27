/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
// Used REST API for stable real-time data loading
import { 
  UserCheck, Users, Calendar,
  Search, Phone, Mail, ChevronLeft, ChevronRight, X, MapPin,
  CheckCircle2, Edit, Trash2
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

  status: "READY" | "SUBBING" | "SICK";
  recentTrips?: { title: string; van: string; date: string }[];
  availabilities?: { date: string; status: "READY" | "SUBSTITUTE" | "SICK_LEAVE" | "PERSONAL_LEAVE" }[];
}

export default function SuperAdminDrivers() {
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isAssignSubOpen, setIsAssignSubOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverItem | null>(null);

  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [facultiesList, setFacultiesList] = useState<{id: number, name: string}[]>([]);


  const loadData = async () => {
    try {
      const [resDrivers, resFacs] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/super-admin/faculties')
      ]);

      if (resDrivers.ok) {
        const driversJson = await resDrivers.json();
        const rawDrivers = Array.isArray(driversJson) ? driversJson : (driversJson.drivers || []);
        const formatted: DriverItem[] = rawDrivers.map((d: any) => ({
          id: d.id,
          avatar: d.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
          name: d.name || d.user?.name || 'ไม่ระบุชื่อ',
          employeeId: d.employeeId || `DRV-${String(d.id).padStart(3, '0')}`,
          faculty: d.faculty?.nameTh || d.faculty || 'ส่วนกลาง',
          type: (d.type === 'PRIMARY' || d.type === 'MAIN') ? 'MAIN' : 'SUB',
          assignedVan: d.assignedVan || (d.assignedVanInfo?.plate || 'ไม่มีรถประจำ'),
          vanModel: d.vanModel || 'Toyota Commuter',
          phone: d.phone || '-',
          email: d.email || d.user?.email || '-',
          status: d.isActive === false ? 'SICK' : (d.status || 'READY'),
          recentTrips: d.recentTrips || [],
          availabilities: d.availabilities || []
        }));
        setDrivers(formatted);
        try { sessionStorage.setItem('cached_superadmin_drivers', JSON.stringify(formatted)); } catch {}
      }

      if (resFacs.ok) {
        const facsJson = await resFacs.json();
        if (facsJson.success && Array.isArray(facsJson.data)) {
          const uniqueFaculties = facsJson.data.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.name === v.name) === i);
          const facList = uniqueFaculties.map((f: any) => ({ id: f.id, name: f.name }));
          setFacultiesList(facList);
          try { sessionStorage.setItem('cached_superadmin_faculties_list', JSON.stringify(facList)); } catch {}
        }
      }
    } catch (error) {
      console.error("Failed to load drivers", error);
      showToast("เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงานขับรถ");
    }
  };

  useEffect(() => {
    try {
      const cachedDrivers = sessionStorage.getItem('cached_superadmin_drivers');
      if (cachedDrivers) setDrivers(JSON.parse(cachedDrivers));
      const cachedFacs = sessionStorage.getItem('cached_superadmin_faculties_list');
      if (cachedFacs) setFacultiesList(JSON.parse(cachedFacs));
    } catch {}
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

  const totalItems = filteredDrivers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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


      {/* Top 2 Stat Cards (Image 2 Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" onClick={(e) => e.stopPropagation()}>
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#311171]/20 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#311171] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#311171]/30">
              <Users size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">พนักงานขับรถทั้งหมด</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{totalDrivers} คน</span>
              </div>
              <p className="text-xs font-bold text-purple-600 mt-0.5">ในระบบทั้งหมด</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/30">
              <UserCheck size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">พร้อมปฏิบัติหน้าที่</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{totalDrivers} คน</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">พร้อมปฏิบัติงาน 100%</p>
            </div>
          </div>
        </div>

      </div>

      {/* Action Bar + Filters */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
        
        {/* Left Actions */}
        <div className="flex gap-2 shrink-0">
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
            {facultiesList.map(f => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
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

                    <th className="py-3 px-3 text-center">สถานะ</th>
                    <th className="py-3 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {paginatedDrivers.map((d) => {
                    const isSelected = d.id === selectedDriverId;

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



            {/* ปฏิทินความพร้อมใช้งาน */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">ปฏิทินความพร้อมใช้งาน</h4>
                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                  <button><ChevronLeft size={14} /></button>
                  <span>{new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                  <button><ChevronRight size={14} /></button>
                </div>
              </div>

              <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100 space-y-2">
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-400 text-[10px]">
                  <span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-700 text-xs">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const curr = new Date();
                    const first = curr.getDate() - curr.getDay();
                    const d = new Date(curr.getTime());
                    d.setDate(first + i);

                    const avail = selectedDriver.availabilities?.find(a => new Date(a.date).toDateString() === d.toDateString());
                    let bgClass = "";
                    if (avail) {
                      if (avail.status === "READY") bgClass = "bg-emerald-500 text-white";
                      else if (avail.status === "SUBSTITUTE") bgClass = "bg-sky-500 text-white";
                      else if (avail.status === "SICK_LEAVE" || avail.status === "PERSONAL_LEAVE") bgClass = "bg-rose-500 text-white";
                    } else if (d.toDateString() === new Date().toDateString()) {
                      bgClass = "bg-[#311171] text-white";
                    }

                    return (
                      <span key={i} className={`p-1 rounded-lg ${bgClass}`}>
                        {d.getDate()}
                      </span>
                    );
                  })}
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
                {selectedDriver.recentTrips && selectedDriver.recentTrips.length > 0 ? (
                  selectedDriver.recentTrips.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2 bg-gray-50/70 rounded-xl border border-gray-100">
                      <div className="p-1.5 bg-purple-100 text-[#311171] rounded-lg shrink-0">
                        <MapPin size={13} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-[11px]">{t.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{t.van} • {new Date(t.date).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4 text-[11px]">ไม่มีประวัติการเดินทางล่าสุด</p>
                )}
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
                <input 
                  type="text" 
                  maxLength={10}
                  defaultValue={editingDriver.phone} 
                  onChange={(e) => setEditingDriver({...editingDriver, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  className="w-full p-3 border rounded-xl font-mono" 
                />
              </div>
              <div>
                <label className="font-bold block mb-1">สังกัดคณะ:</label>
                <select 
                  disabled
                  defaultValue={editingDriver.faculty} 
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed appearance-none outline-none"
                >
                  {facultiesList.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
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
              <h3 className="text-lg font-black text-gray-900">มอบหมายคนขับปฏิบัติงานแทน</h3>
              <button onClick={() => setIsAssignSubOpen(false)} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 font-medium">เลือกพนักงานขับรถ และพนักงานขับรถที่มาปฏิบัติงานแทน</p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">คนขับที่ต้องการลา/ไม่พร้อม:</label>
                <select className="w-full p-3 border rounded-xl font-bold">
                  <option>นายสมชาย ใจดี (คณะวิทยาศาสตร์)</option>
                  <option>นายวิจัย คำปิน (คณะเภสัชฯ)</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">คนขับที่มอบหมายปฏิบัติงานแทน:</label>
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


