"use client";
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Wrench, FileText, AlertTriangle, Plus, Search, CheckCircle, 
  FilePlus, Car, Calendar, Shield, Eye, Edit3, ChevronLeft, ChevronRight, Bus
} from 'lucide-react';

interface VanOption {
  id: string | number;
  plate: string;
}

interface MaintenanceRecord {
  id: string | number;
  date: string;
  van: string;
  province: string;
  typeColor: string;
  type: string;
  detail: string;
  amount: string | number;
  garage: string;
}

interface UpcomingDueItem {
  id: string | number;
  iconBg: string;
  iconType: string;
  title: string;
  van?: string;
  dueDate: string;
  daysLeft: string;
}

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'record'>('overview');
  
  const [vans, setVans] = useState<VanOption[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [upcomingDueItems, setUpcomingDueItems] = useState<UpcomingDueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [kpiCostYTD, setKpiCostYTD] = useState(0);
  const [kpiTaxInsYTD, setKpiTaxInsYTD] = useState(0);
  const [facultyVan, setFacultyVan] = useState<{plate: string, status: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    vanId: '',
    date: '',
    type: 'MAINTENANCE',
    detail: '',
    amount: '',
    garage: ''
  });

  const loadData = async () => {
    try {
      const res = await fetch('/api/maintenance');
      const data = await res.json();
      if (data.success) {
        setVans(data.vans || []);
        setMaintenanceHistory(data.maintenanceHistory || []);
        setUpcomingDueItems(data.upcomingDueItems || []);
        setKpiCostYTD(data.kpiCostYTD || 0);
        setKpiTaxInsYTD(data.kpiTaxInsYTD || 0);
        setFacultyVan(data.facultyVan || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vanId || !formData.amount) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert('บันทึกข้อมูลเรียบร้อย');
        setActiveTab('overview');
        setFormData({
          vanId: '',
          date: new Date().toISOString().split('T')[0],
          type: 'MAINTENANCE',
          detail: '',
          amount: '',
          garage: ''
        });
        loadData();
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-full min-h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#582be8]"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="w-full p-4 md:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">จัดการซ่อมบำรุง & ภาษี</h1>
            <p className="text-xs text-slate-500 mt-1">บันทึกประวัติซ่อมบำรุง ค่าต่อภาษี พร.บ. และประกันภัยรถตู้</p>
          </div>
          <button 
            onClick={() => setActiveTab('record')}
            className="flex items-center gap-2 bg-[#582be8] hover:bg-[#4820c9] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> บันทึกรายการใหม่
          </button>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-purple-100/60 text-purple-600 rounded-2xl shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-0.5">ค่าซ่อมบำรุง (ปีนี้)</p>
              <h3 className="text-xl font-black text-slate-900 leading-tight">{kpiCostYTD.toLocaleString()} <span className="text-xs font-medium text-slate-500">บาท</span></h3>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-emerald-100/60 text-emerald-600 rounded-2xl shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-0.5">ค่าภาษี/ประกัน (ปีนี้)</p>
              <h3 className="text-xl font-black text-slate-900 leading-tight">{kpiTaxInsYTD.toLocaleString()} <span className="text-xs font-medium text-slate-500">บาท</span></h3>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-blue-100/60 text-blue-600 rounded-2xl shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-0.5">รถตู้ประจำคณะ</p>
              <h3 className="text-base font-black text-slate-900 leading-tight mb-1">{facultyVan?.plate || 'ไม่มีข้อมูล'}</h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${facultyVan ? 'bg-emerald-500' : 'bg-slate-300'} inline-block`}></span>
                <span className={`text-[11px] font-bold ${facultyVan ? 'text-emerald-600' : 'text-slate-400'}`}>{facultyVan?.status || 'ไม่ระบุ'}</span>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl border border-orange-100/80 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-orange-100/60 text-orange-600 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-orange-500 mb-0.5">แจ้งเตือนครบกำหนด</p>
              <h3 className="text-base font-black text-slate-900 leading-tight mb-1">
                {upcomingDueItems.length > 0 ? upcomingDueItems[0].title : 'ไม่มีแจ้งเตือน'}
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${upcomingDueItems.length > 0 ? 'bg-orange-500' : 'bg-slate-300'} inline-block`}></span>
                <span className={`text-[11px] font-bold ${upcomingDueItems.length > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                  {upcomingDueItems.length > 0 ? upcomingDueItems[0].daysLeft : 'ปกติ'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Main Card (3 Cols wide) - Sharp top corners, rounded bottom corners */}
          <div className="lg:col-span-3 bg-white rounded-t-none rounded-b-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between min-h-[520px]">
            
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100 mb-6 gap-6">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-xs font-bold transition-all relative ${
                  activeTab === 'overview' 
                    ? 'text-[#582be8] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#582be8]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ประวัติการซ่อมบำรุง
              </button>
              <button 
                onClick={() => setActiveTab('record')}
                className={`pb-3 text-xs font-bold transition-all relative ${
                  activeTab === 'record' 
                    ? 'text-[#582be8] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#582be8]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                บันทึกรายการใหม่
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="flex-1 flex flex-col justify-between space-y-6">
                
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="ค้นหาทะเบียนรถ หรือรายการ..." 
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-purple-500 transition-all" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <select className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white text-slate-700 outline-none cursor-pointer">
                      <option value="">รถทุกคัน</option>
                      <option value="1">นข 1234</option>
                      <option value="2">ฮภ 9988</option>
                      <option value="3">กง 5555</option>
                    </select>
                    <select className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white text-slate-700 outline-none cursor-pointer">
                      <option value="">ทุกประเภท</option>
                      <option value="MAINTENANCE">ซ่อมบำรุง</option>
                      <option value="TAX">ต่อภาษี</option>
                      <option value="INSURANCE">ประกันภัย</option>
                    </select>
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-50/70 border-y border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 font-semibold">วันที่</th>
                        <th className="py-3 px-4 font-semibold">รถตู้</th>
                        <th className="py-3 px-4 font-semibold">ประเภท</th>
                        <th className="py-3 px-4 font-semibold">รายการ</th>
                        <th className="py-3 px-4 font-semibold text-right">จำนวนเงิน</th>
                        <th className="py-3 px-4 font-semibold">สถานที่/อู่</th>
                        <th className="py-3 px-4 font-semibold text-center">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {maintenanceHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium">{item.date}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{item.van}</p>
                                <p className="text-[10px] text-slate-400 font-normal">{item.province}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border ${item.typeColor}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">{item.detail}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">{item.amount}</td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">{item.garage}</td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 gap-3">
                  <p>แสดง 1 ถึง 4 จาก 4 รายการ</p>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-7 h-7 bg-[#582be8] text-white font-bold rounded-lg text-xs flex items-center justify-center shadow-sm">
                      1
                    </button>
                    <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <select className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-slate-700 outline-none cursor-pointer">
                      <option>10 / หน้า</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'record' && (
              <div className="max-w-2xl mx-auto py-4">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">เลือกรถตู้</label>
                      <select 
                        required
                        value={formData.vanId}
                        onChange={(e) => setFormData({...formData, vanId: e.target.value})}
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50/50"
                      >
                        <option value="">-- เลือกรถตู้ --</option>
                        {vans.map(v => <option key={v.id} value={v.id}>{v.plate}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">วันที่ทำรายการ</label>
                      <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">ประเภทรายการ</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'MAINTENANCE', label: 'ซ่อมบำรุง', icon: Wrench },
                        { id: 'TAX', label: 'ต่อภาษี / พรบ.', icon: FileText },
                        { id: 'INSURANCE', label: 'ประกันภัยรถยนต์', icon: FilePlus }
                      ].map((type) => (
                        <label key={type.id} className="cursor-pointer">
                          <input 
                            type="radio" 
                            name="recordType" 
                            className="peer sr-only" 
                            value={type.id} 
                            checked={formData.type === type.id}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                          />
                          <div className="rounded-xl border border-slate-200 p-3.5 flex flex-col items-center justify-center gap-2 text-slate-500 peer-checked:border-purple-600 peer-checked:bg-purple-50 peer-checked:text-purple-700 hover:bg-slate-50 transition-all">
                            <type.icon className="w-5 h-5" />
                            <span className="text-xs font-bold">{type.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">รายละเอียดรายการ</label>
                    <input 
                      type="text" 
                      required
                      value={formData.detail}
                      onChange={(e) => setFormData({...formData, detail: e.target.value})}
                      placeholder="ระบุรายละเอียด เช่น เปลี่ยนถ่ายน้ำมันเครื่อง..." 
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">จำนวนเงิน (บาท)</label>
                      <input 
                        type="number" 
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="0.00" 
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">สถานที่ / อู่ / ตัวแทน</label>
                      <input 
                        type="text" 
                        value={formData.garage}
                        onChange={(e) => setFormData({...formData, garage: e.target.value})}
                        placeholder="ชื่ออู่ซ่อมรถ..." 
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-purple-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setActiveTab('overview')} className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors">
                      ยกเลิก
                    </button>
                    <button type="submit" className="px-6 py-2.5 bg-[#582be8] hover:bg-[#4820c9] text-white rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* Right Sidebar Card (1 Col wide) - Square corners top and bottom */}
          <div className="lg:col-span-1 bg-white rounded-none border border-slate-100 shadow-sm p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-800">รายการใกล้ครบกำหนด</h3>
              </div>

              <div className="space-y-3">
                {upcomingDueItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${item.iconBg}`}>
                        {item.iconType === 'tax' ? <FileText className="w-4 h-4" /> : item.iconType === 'insurance' ? <Shield className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{item.title}</p>
                        {item.van && <p className="text-[10px] text-slate-500 font-bold mt-0.5">{item.van}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.dueDate}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] text-slate-400">เหลืออีก</p>
                      <p className="text-xs font-bold text-red-500">{item.daysLeft}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-[#582be8] font-bold text-xs rounded-xl transition-colors text-center">
              ดูรายการทั้งหมด
            </button>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
