"use client";
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Wrench, Search, Bus, Car
} from 'lucide-react';

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

export default function MaintenancePage() {
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kpiCostYTD, setKpiCostYTD] = useState(0);
  const [facultyVan, setFacultyVan] = useState<{plate: string, status: string} | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/maintenance');
      const data = await res.json();
      if (data.success) {
        setMaintenanceHistory(data.maintenanceHistory || []);
        setKpiCostYTD(data.kpiCostYTD || 0);
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
  }, []);

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
        <div className="flex justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900">ประวัติการซ่อมบำรุง</h1>
            <p className="text-xs text-slate-500 mt-1">รายการซ่อมบำรุงรถตู้ประจำคณะที่คนขับได้บันทึกไว้</p>
          </div>
        </div>

        {/* 2 Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-purple-100/60 text-purple-600 rounded-2xl shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-0.5">ค่าซ่อมบำรุงรวม (ปีนี้)</p>
              <h3 className="text-xl font-black text-slate-900 leading-tight">{kpiCostYTD.toLocaleString()} <span className="text-xs font-medium text-slate-500">บาท</span></h3>
            </div>
          </div>

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
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between min-h-[520px]">
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
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50/70 border-y border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">วันที่ซ่อม</th>
                      <th className="py-3 px-4 font-semibold">รถตู้</th>
                      <th className="py-3 px-4 font-semibold">รายการ</th>
                      <th className="py-3 px-4 font-semibold text-right">จำนวนเงิน</th>
                      <th className="py-3 px-4 font-semibold">สถานที่ซ่อม/อู่</th>
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
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{item.detail}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{item.amount}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">{item.garage}</td>
                      </tr>
                    ))}
                    {maintenanceHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">ไม่มีประวัติการซ่อมบำรุง</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
