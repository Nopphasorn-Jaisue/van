"use client";
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Plus, Edit, Trash2, 
  Users, Fuel, Wrench, Share2, Lock, Check, Search
} from 'lucide-react';

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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#311171] hover:bg-[#240c55] text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
              <Plus size={18} /> เพิ่มรถตู้ใหม่
            </button>
          </div>
        </div>

        {/* ----- Toolbar ----- */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row justify-between gap-4 shrink-0">
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
                      <button className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <Edit size={14} /> แก้ไขข้อมูล
                      </button>
                      <button className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors">
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
    </AppShell>
  );
}
