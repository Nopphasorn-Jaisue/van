"use client";

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
  FileSignature, Search, Calendar, CarFront, Image as ImageIcon
} from 'lucide-react';
type DriverLog = {
  id: string | number;
  totalDistance: number;
  mileageStart: number;
  mileageEnd: number;
  imgStartUrl?: string | null;
  imgEndUrl?: string | null;
  booking?: {
    destination?: string;
    departureDate: string | Date;
    objective?: string;
  };
  driver?: {
    user?: {
      name?: string;
    };
    assignedVan?: {
      plate?: string;
    };
  };
};

export default function FacultyDriverRecords() {
  const [logs, setLogs] = useState<DriverLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/faculty-admin/driver-logs');
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const searchString = searchQuery.toLowerCase();
    const destination = log.booking?.destination?.toLowerCase() || '';
    const driverName = log.driver?.user?.name?.toLowerCase() || '';
    const vanPlate = log.driver?.assignedVan?.plate?.toLowerCase() || '';
    
    return destination.includes(searchString) || 
           driverName.includes(searchString) ||
           vanPlate.includes(searchString);
  });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efeaff] text-[#311171] text-xs font-bold mb-3">
              <FileSignature size={14} /> บันทึกการเดินทาง
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">ตรวจสอบบันทึกการเดินทาง</h1>
            <p className="text-gray-500 mt-1">ตรวจสอบระยะทางและการวิ่งงานของคนขับในคณะ</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="ค้นหาสถานที่, ชื่อคนขับ, ทะเบียนรถ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] outline-none transition-all shadow-sm"
            />
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171]"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FileSignature className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">ไม่พบบันทึกการเดินทาง</h3>
            <p className="text-gray-500 text-sm max-w-md">ยังไม่มีข้อมูลบันทึกการเดินทางของคนขับในคณะ หรือไม่พบข้อมูลที่ค้นหา</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">รายละเอียดการเดินทาง</th>
                    <th className="px-6 py-4 whitespace-nowrap">พนักงานขับรถ</th>
                    <th className="px-6 py-4 whitespace-nowrap">เลขไมล์ / ระยะทางรวม</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">รูปถ่ายหน้าปัด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => {
                    const departDate = log.booking?.departureDate ? new Date(log.booking.departureDate) : null;
                    
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-900 truncate max-w-[250px]">
                              {log.booking?.destination || "ไม่ระบุสถานที่"}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar size={12} />
                              <span>{departDate ? departDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'ไม่ระบุวันที่'}</span>
                              {log.booking?.objective && (
                                <span className="truncate max-w-[150px] text-gray-400"> - {log.booking.objective}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                              {log.driver?.user?.name?.charAt(0) || "ด"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{log.driver?.user?.name || "ไม่ระบุ"}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <CarFront size={10} />
                                {log.driver?.assignedVan?.plate || "ไม่ระบุทะเบียน"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#311171]">{log.totalDistance} กม.</span>
                            <span className="text-xs text-gray-500">
                              เริ่ม {log.mileageStart} - จบ {log.mileageEnd}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {log.imgStartUrl || log.imgEndUrl ? (
                              <button 
                                className="p-2 text-[#311171] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                onClick={() => window.open(log.imgEndUrl || log.imgStartUrl || undefined, '_blank')}
                              >
                                <ImageIcon size={14} /> ดูรูป
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">ไม่มีรูป</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
