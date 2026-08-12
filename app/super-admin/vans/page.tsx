/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { getVans } from "@/app/actions/superadmin";
import { 
  Bus, CheckCircle2, Wrench, RefreshCw,
  Search, Eye, Edit, ChevronLeft, ChevronRight, X
  } from "lucide-react";

interface VanItem {
  id: number;
  plate: string;
  faculty: string;
  brandModel: string;
  seats: number;
  driver: string;
  driverAvatar: string;
  status: "READY" | "MAINTENANCE" | "DISABLED";
  nextInspection: string;
  nextService: string;
  image?: string | null;
  taxExp?: string | null;
  insExp?: string | null;
}

export default function SuperAdminVans() {
  const [selectedVanId, setSelectedVanId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVan, setEditingVan] = useState<VanItem | null>(null);
  const [detailVan, setDetailVan] = useState<VanItem | null>(null);

  const [vans, setVans] = useState<VanItem[]>([]);


  useEffect(() => {
    async function loadData() {
      try {
        const data = await getVans();
        setVans(data.map(v => ({
          ...v,
          brandModel: v.brand,
          seats: v.capacity,
          driverAvatar: v.driverAvatar,
          status: v.status as "READY" | "MAINTENANCE" | "DISABLED",
          nextInspection: v.nextMaintenance,
          nextService: "-",
          image: v.image,
          taxExp: v.taxExp,
          insExp: v.insExp
        })));
      } catch (error) {
        console.error("Failed to load vans", error);
        showToast("เกิดข้อผิดพลาดในการโหลดข้อมูลรถตู้");
      }
    }
    loadData();
  }, []);

  const selectedVan = selectedVanId ? vans.find(v => v.id === selectedVanId) : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredVans = vans.filter(v => {
    const matchesSearch = v.plate.toLowerCase().includes(search.toLowerCase());
    const matchesFaculty = facultyFilter === "ALL" || v.faculty === facultyFilter;
    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
    return matchesSearch && matchesFaculty && matchesStatus;
  });

  const totalItems = filteredVans.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedVans = filteredVans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: VanItem["status"]) => {
    switch (status) {
      case "READY":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">พร้อมใช้งาน</span>;
      case "MAINTENANCE":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">ซ่อมบำรุง</span>;
      case "DISABLED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">งดใช้งาน</span>;
    }
  };

  const totalVans = vans.length;
  const readyVans = vans.filter(v => v.status === "READY").length;
  const maintenanceVans = vans.filter(v => v.status === "MAINTENANCE").length;
  const readyPercent = totalVans > 0 ? ((readyVans / totalVans) * 100).toFixed(0) : "0";
  const maintenancePercent = totalVans > 0 ? ((maintenanceVans / totalVans) * 100).toFixed(0) : "0";

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in h-full"
      onClick={() => setSelectedVanId(null)}
    >
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top 3 Stat Cards (Style Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" onClick={(e) => e.stopPropagation()}>
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#311171]/20 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#311171] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#311171]/30">
              <Bus size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">รถตู้ทั้งหมด</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{totalVans} คัน</span>
              </div>
              <p className="text-xs font-bold text-purple-600 mt-0.5">100% ของทั้งหมด</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/30">
              <CheckCircle2 size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">พร้อมใช้งาน</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{readyVans} คัน</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">{readyPercent}% ของทั้งหมด</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-amber-200 hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#C39B22] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#C39B22]/30">
              <Wrench size={26} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600 mb-0.5">ซ่อมบำรุง</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{maintenanceVans} คัน</span>
              </div>
              <p className="text-xs font-bold text-amber-600 mt-0.5">{maintenancePercent}% ของทั้งหมด</p>
            </div>
          </div>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Faculty Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">คณะ</span>
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="คณะเภสัชฯ">คณะเภสัชฯ</option>
              <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
              <option value="คณะ ICT">คณะ ICT</option>
              <option value="คณะเกษตรฯ">คณะเกษตรฯ</option>
              <option value="คณะพลังงานฯ">คณะพลังงานฯ</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">สถานะ</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="READY">พร้อมใช้งาน</option>
              <option value="MAINTENANCE">ซ่อมบำรุง</option>
              <option value="DISABLED">งดใช้งาน</option>
            </select>
          </div>

          {/* Search input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="ค้นหาด้วยทะเบียนรถ"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => { setSearch(""); setFacultyFilter("ALL"); setStatusFilter("ALL"); }}
          className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw size={14} />
          <span>ล้างตัวกรอง</span>
        </button>
      </div>

      {/* Main Grid: Left Vans Table + Right Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left Side: Vans Table (8 cols) */}
        <div 
          className={`flex flex-col h-full min-h-0 transition-all duration-300 ${selectedVan ? 'lg:col-span-8' : 'lg:col-span-12'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col h-full flex-1">
            
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold text-gray-500">
                    <th className="py-3 px-4">ทะเบียนรถ</th>
                    <th className="py-3 px-3">คณะ</th>

                    <th className="py-3 px-3 text-center">ที่นั่ง</th>
                    <th className="py-3 px-3">คนขับประจำ</th>
                    <th className="py-3 px-3 text-center">สถานะ</th>
                    <th className="py-3 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {paginatedVans.map((v) => {
                    const isSelected = v.id === selectedVanId;
                    return (
                      <tr 
                        key={v.id}
                        onClick={() => setSelectedVanId(isSelected ? null : v.id)}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-purple-50/80 border-l-4 border-l-[#311171]" 
                            : "hover:bg-gray-50/80"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900 whitespace-nowrap">{v.plate}</p>
                        </td>
                        <td className="py-3 px-3 text-gray-700 whitespace-nowrap text-[11px]">{v.faculty}</td>

                        <td className="py-3 px-3 text-center font-bold text-gray-900">{v.seats}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800 text-[11px] font-bold">{v.driver}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(v.status)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); setDetailVan(v); }} className="p-1 text-gray-400 hover:text-purple-600"><Eye size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingVan(v); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit size={14} /></button>

                          </div>
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
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none"
                >
                  <option value={10}>10 รายการต่อหน้า</option>
                  <option value={20}>20 รายการต่อหน้า</option>
                  <option value={50}>50 รายการต่อหน้า</option>
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

        {/* Right Side: Maintenance Schedule + Selected Van Card (4 cols) */}
        {selectedVan && (
          <div 
            className="lg:col-span-4 flex flex-col space-y-4 h-full min-h-0 overflow-y-auto pr-1 animate-in fade-in slide-in-from-right-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
          


          {/* Card 2: ข้อมูลรถที่เลือก */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900">ข้อมูลรถที่เลือก</h3>

            <div className="text-center space-y-2">
              <div className="w-full h-32 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden relative border border-gray-200">
                <img 
                  src={selectedVan.image || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400"} 
                  alt={selectedVan.plate} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="font-black text-base text-gray-900">{selectedVan.plate}</h4>
                <p className="text-xs text-gray-500 font-medium">ที่นั่ง {selectedVan.seats} ที่นั่ง</p>
                <div className="mt-1.5">{getStatusBadge(selectedVan.status)}</div>
              </div>
            </div>

            {/* Inspection grids */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
              <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <p className="text-[10px] text-gray-400 font-medium">วันหมดอายุภาษี</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  {selectedVan.taxExp ? new Date(selectedVan.taxExp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'ไม่ระบุ'}
                </p>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <p className="text-[10px] text-gray-400 font-medium">วันหมดอายุประกัน</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  {selectedVan.insExp ? new Date(selectedVan.insExp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'ไม่ระบุ'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => setDetailVan(selectedVan)}
                className="flex-1 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Eye size={14} />
                <span>ดูรายละเอียด</span>
              </button>

              <button 
                onClick={() => setEditingVan(selectedVan)}
                className="flex-1 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Edit size={14} />
                <span>แก้ไขข้อมูล</span>
              </button>
            </div>

          </div>

          </div>
        )}

      </div>

      {/* ----- MODALS ----- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-gray-900">เพิ่มรถตู้ใหม่เข้าสู่ระบบ</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-gray-400"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">ทะเบียนรถ:</label>
                <input type="text" placeholder="เช่น นข 9999 เชียงใหม่" className="w-full p-3 border rounded-xl" />
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
              <button onClick={() => setIsAddOpen(false)} className="flex-1 bg-gray-100 py-2 rounded-xl text-xs font-bold">ยกเลิก</button>
              <button onClick={() => { setIsAddOpen(false); showToast("เพิ่มรถตู้ใหม่เรียบร้อยแล้ว"); }} className="flex-1 bg-[#311171] text-white py-2 rounded-xl text-xs font-bold">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: ดูรายละเอียดรถตู้ */}
      {detailVan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">รายละเอียดรถตู้</h3>
              <button onClick={() => setDetailVan(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong className="text-gray-900">ทะเบียน:</strong> {detailVan.plate}</p>
              <p><strong className="text-gray-900">สังกัด:</strong> {detailVan.faculty}</p>
              <p><strong className="text-gray-900">จำนวนที่นั่ง:</strong> {detailVan.seats} ที่นั่ง</p>
              <p><strong className="text-gray-900">คนขับประจำ:</strong> {detailVan.driver}</p>
            </div>
            <button onClick={() => setDetailVan(null)} className="w-full bg-gray-100 py-2.5 rounded-xl font-bold text-xs">ปิด</button>
          </div>
        </div>
      )}

      {/* 3. Modal: แก้ไขรถตู้ */}
      {editingVan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">แก้ไขข้อมูลรถตู้</h3>
              <button onClick={() => setEditingVan(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">ทะเบียนรถ:</label>
                <input type="text" defaultValue={editingVan.plate} className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="font-bold block mb-1">คนขับประจำ:</label>
                <input type="text" defaultValue={editingVan.driver} className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="font-bold block mb-1">สังกัดคณะ:</label>
                <select defaultValue={editingVan.faculty} className="w-full p-3 border rounded-xl bg-white outline-none">
                  <option value="คณะเภสัชฯ">คณะเภสัชฯ</option>
                  <option value="คณะวิทยาศาสตร์">คณะวิทยาศาสตร์</option>
                  <option value="คณะ ICT">คณะ ICT</option>
                  <option value="คณะเกษตรฯ">คณะเกษตรฯ</option>
                  <option value="คณะพลังงานฯ">คณะพลังงานฯ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingVan(null)} className="flex-1 bg-gray-100 py-2 rounded-xl text-xs font-bold">ยกเลิก</button>
              <button onClick={() => { setEditingVan(null); showToast("บันทึกการแก้ไขรถตู้เรียบร้อยแล้ว"); }} className="flex-1 bg-[#311171] text-white py-2 rounded-xl text-xs font-bold">บันทึก</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


