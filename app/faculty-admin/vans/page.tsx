"use client";
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Plus, Edit, Trash2, 
  Users, Fuel, Wrench, Share2, Lock, Check, Search, X, Image as ImageIcon
} from 'lucide-react';

interface Van {
  id: string;
  vanName: string;
  plate: string;
  capacity: number;
  fuelType: string;
  status: string;
  isShared?: boolean;
  image: string;
}

export default function VansPage() {
  // Mock Data
  const [vans, setVans] = useState([
    {
      id: "v1",
      vanName: "รถตู้คณะเกษตร 01",
      plate: "ทะเบียน นข 1234 พะเยา",
      capacity: 12,
      fuelType: "ดีเซล",
      status: "ready",
      isShared: true, // เปิดให้คณะอื่นยืมได้
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vanName: "",
    plate: "",
    capacity: 12,
    fuelType: "ดีเซล",
    status: "ready",
    image: ""
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      vanName: "",
      plate: "",
      capacity: 12,
      fuelType: "ดีเซล",
      status: "ready",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=80"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (van: Van) => {
    setEditingId(van.id);
    setFormData({
      vanName: van.vanName,
      plate: van.plate,
      capacity: van.capacity,
      fuelType: van.fuelType,
      status: van.status,
      image: van.image
    });
    setIsModalOpen(true);
  };

  const saveVan = () => {
    if (editingId) {
      setVans(vans.map(v => v.id === editingId ? { ...v, ...formData } : v));
    } else {
      setVans([...vans, { id: `v${Date.now()}`, ...formData, isShared: false }]);
    }
    setIsModalOpen(false);
  };

  const deleteVan = (id: string) => {
    if (confirm('คุณต้องการลบรถตู้คันนี้ใช่หรือไม่?')) {
      setVans(vans.filter(v => v.id !== id));
    }
  };

  const toggleShareStatus = (id: string) => {
    setVans(vans.map(van => 
      van.id === id ? { ...van, isShared: !van.isShared } : van
    ));
  };

  const filteredVans = vans.filter(v => 
    v.vanName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="max-w-[1400px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0">
        
        {/* ----- Header ----- */}
        <div className="mb-8 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-black text-gray-900 leading-tight mb-2">จัดการรถประจำคณะ</h1>
            <p className="text-sm text-gray-500">เพิ่ม ลบ และแก้ไขข้อมูลรถตู้ของคณะ รวมถึงการตั้งค่าการยืมข้ามคณะ</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#311171] hover:bg-[#240c55] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              <Plus size={18} /> เพิ่มรถตู้ใหม่
            </button>
          </div>
        </div>

        {/* ----- Toolbar ----- */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อรถ หรือ ทะเบียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="text-gray-500">ทั้งหมด: <span className="text-gray-900">{vans.length} คัน</span></span>
            <span className="text-gray-500">เปิดแชร์: <span className="text-green-600">{vans.filter(v => v.isShared).length} คัน</span></span>
          </div>
        </div>

        {/* ----- Grid Content ----- */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVans.map(van => (
              <div key={van.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                {/* Image */}
                <div className="h-40 relative overflow-hidden bg-gray-100">
                  <img src={van.image} alt={van.vanName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    {van.status === 'ready' ? (
                      <span className="px-2.5 py-1 bg-green-500 text-white text-[10px] font-black rounded-lg shadow-sm flex items-center gap-1.5">
                        <Check size={12} strokeWidth={3} /> พร้อมใช้งาน
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-orange-500 text-white text-[10px] font-black rounded-lg shadow-sm flex items-center gap-1.5">
                        <Wrench size={12} strokeWidth={3} /> ซ่อมบำรุง
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg leading-tight">{van.vanName}</h3>
                      <p className="text-xs font-bold text-[#311171]">{van.plate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <Users size={14} className="text-gray-400" />
                      <span className="font-bold">{van.capacity} ที่นั่ง</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <Fuel size={14} className="text-gray-400" />
                      <span className="font-bold">{van.fuelType}</span>
                    </div>
                  </div>

                  {/* Settings section */}
                  <div className="mt-auto">
                    <div className="h-px w-full bg-gray-100 mb-4"></div>
                    
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                      <div className="flex gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${van.isShared ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                          {van.isShared ? <Share2 size={16} /> : <Lock size={16} />}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-gray-900 leading-tight">
                            {van.isShared ? 'เปิดให้คณะอื่นยืม' : 'สงวนสิทธิ์เฉพาะคณะ'}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {van.isShared ? 'คณะอื่นสามารถเห็นและจองได้' : 'ไม่แสดงในส่วนกลาง'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button 
                        onClick={() => toggleShareStatus(van.id)}
                        className={`w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${van.isShared ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${van.isShared ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(van)}
                        className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit size={14} /> แก้ไขข้อมูล
                      </button>
                      <button 
                        onClick={() => deleteVan(van.id)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
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
                {editingId ? 'แก้ไขข้อมูลรถตู้' : 'เพิ่มรถตู้ใหม่'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* Image Preview */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">รูปภาพรถ</label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-400" size={32} />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({...formData, image: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#311171]/10 file:text-[#311171] hover:file:bg-[#311171]/20 file:transition-colors file:cursor-pointer cursor-pointer border border-gray-200 rounded-xl p-1"
                    />
                    <p className="text-xs text-gray-500 mt-2 font-medium">อัปโหลดรูปภาพรถตู้จากอุปกรณ์ของคุณ</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อรถตู้</label>
                  <input 
                    type="text" 
                    value={formData.vanName}
                    onChange={(e) => setFormData({...formData, vanName: e.target.value})}
                    placeholder="เช่น รถตู้คณะเกษตร 01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ป้ายทะเบียน</label>
                  <input 
                    type="text" 
                    value={formData.plate}
                    onChange={(e) => setFormData({...formData, plate: e.target.value})}
                    placeholder="เช่น นข 1234 พะเยา"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">จำนวนที่นั่ง</label>
                  <input 
                    type="number" 
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทเชื้อเพลิง</label>
                  <select 
                    value={formData.fuelType}
                    onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171]"
                  >
                    <option value="ดีเซล">ดีเซล</option>
                    <option value="เบนซิน">เบนซิน</option>
                    <option value="EV (ไฟฟ้า)">EV (ไฟฟ้า)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">สถานะความพร้อม</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="ready"
                      checked={formData.status === 'ready'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="accent-[#311171] w-4 h-4"
                    />
                    <span className="text-sm font-bold text-green-600">พร้อมใช้งาน</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="maintenance"
                      checked={formData.status === 'maintenance'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="accent-[#311171] w-4 h-4"
                    />
                    <span className="text-sm font-bold text-orange-600">กำลังซ่อมบำรุง</span>
                  </label>
                </div>
              </div>

            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={saveVan}
                className="px-6 py-2 text-sm font-bold text-white bg-[#311171] hover:bg-[#240c55] rounded-xl transition-colors shadow-sm"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
