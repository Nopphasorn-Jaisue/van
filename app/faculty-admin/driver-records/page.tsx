"use client";

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
  FileSignature, Search, Calendar, CarFront, Image as ImageIcon, Plus, X, Trash2, Edit
} from 'lucide-react';

type DriverLog = {
  id: string | number;
  totalDistance?: number;
  mileageStart?: number;
  mileageEnd?: number;
  imgStartUrl?: string | null;
  imgEndUrl?: string | null;
  createdAt?: string;
  booking?: {
    destination?: string;
    departureDate?: string | Date;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    destination: '',
    objective: '',
    driverName: 'นายสมชาย ใจดี',
    vanPlate: 'นข 6789 พะเยา',
    mileageStart: '',
    mileageEnd: '',
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/faculty-admin/driver-logs');
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          if (data.success && Array.isArray(data.logs)) {
            setLogs(data.logs);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      destination: '',
      objective: '',
      driverName: 'นายสมชาย ใจดี',
      vanPlate: 'นข 6789 พะเยา',
      mileageStart: '',
      mileageEnd: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (log: DriverLog) => {
    setEditingId(log.id);
    setFormData({
      destination: log.booking?.destination || '',
      objective: log.booking?.objective || '',
      driverName: log.driver?.user?.name || 'นายสมชาย ใจดี',
      vanPlate: log.driver?.assignedVan?.plate || 'นข 6789 พะเยา',
      mileageStart: String(log.mileageStart ?? ''),
      mileageEnd: String(log.mileageEnd ?? ''),
    });
    setIsModalOpen(true);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const start = Number(formData.mileageStart) || 0;
    const end = Number(formData.mileageEnd) || 0;
    const distance = Math.max(0, end - start);

    const payload = {
      id: editingId || undefined,
      totalDistance: distance,
      mileageStart: start,
      mileageEnd: end,
      booking: {
        destination: formData.destination || "ไม่ระบุสถานที่",
        departureDate: new Date().toISOString(),
        objective: formData.objective || "บันทึกการเดินทางของคนขับ"
      },
      driver: {
        user: { name: formData.driverName },
        assignedVan: { plate: formData.vanPlate }
      }
    };

    try {
      if (editingId) {
        // Edit mode
        setLogs(prev => prev.map(l => String(l.id) === String(editingId) ? {
          ...l,
          totalDistance: distance,
          mileageStart: start,
          mileageEnd: end,
          booking: {
            ...(l.booking || {}),
            destination: formData.destination,
            objective: formData.objective
          },
          driver: {
            user: { name: formData.driverName },
            assignedVan: { plate: formData.vanPlate }
          }
        } : l));
        setIsModalOpen(false);
      } else {
        // Create mode
        const res = await fetch('/api/faculty-admin/driver-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          fetchLogs();
        }
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string | number) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกการเดินทางนี้?")) return;
    try {
      await fetch(`/api/faculty-admin/driver-logs?id=${id}`, { method: 'DELETE' });
      setLogs(logs.filter(l => String(l.id) !== String(id)));
    } catch (error) {
      console.error(error);
    }
  };

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
      <div className="w-full space-y-6 pb-20 animate-in fade-in">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efeaff] text-[#311171] text-xs font-bold mb-3">
              <FileSignature size={14} /> บันทึกการเดินทาง
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">ตรวจสอบบันทึกการเดินทาง</h1>
            <p className="text-gray-500 mt-1">ตรวจสอบ บันทึก และแก้ไขข้อมูลระยะทางและการวิ่งงานของคนขับในคณะ</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder="ค้นหาสถานที่, ชื่อคนขับ, ทะเบียนรถ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm shrink-0 transition-all"
            >
              <Plus size={16} />
              <span>บันทึกใหม่</span>
            </button>
          </div>
        </div>

        {/* Content */}
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
                    <th className="px-6 py-4 whitespace-nowrap text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => {
                    const departDate = log.booking?.departureDate ? new Date(log.booking.departureDate) : null;
                    const mileageStartVal = Number(log.mileageStart || 0);
                    const mileageEndVal = Number(log.mileageEnd || 0);
                    const totalDistVal = Number(log.totalDistance || 0);
                    
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-900 truncate max-w-[250px]">
                              {log.booking?.destination || "ไม่ระบุสถานที่"}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar size={12} />
                              <span>{departDate && !isNaN(departDate.getTime()) ? departDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'ไม่ระบุวันที่'}</span>
                              {log.booking?.objective && (
                                <span className="truncate max-w-[200px] text-gray-400"> - {log.booking.objective}</span>
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
                            <span className="font-bold text-[#311171]">{totalDistVal.toLocaleString()} กม.</span>
                            <span className="text-xs text-gray-500">
                              เริ่ม {mileageStartVal.toLocaleString()} - จบ {mileageEndVal.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {log.imgStartUrl || log.imgEndUrl ? (
                              <button 
                                className="p-2 text-[#311171] bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                onClick={() => window.open(log.imgEndUrl || log.imgStartUrl || undefined, '_blank')}
                              >
                                <ImageIcon size={14} /> ดูรูป
                              </button>
                            ) : null}
                            <button
                              onClick={() => handleOpenEditModal(log)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="แก้ไขบันทึก"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบบันทึก"
                            >
                              <Trash2 size={16} />
                            </button>
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

      {/* Modal: เพิ่ม/แก้ไข บันทึกการเดินทาง */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#311171] text-white">
              <div className="flex items-center gap-2">
                <FileSignature size={18} />
                <h3 className="font-bold text-base">{editingId ? 'แก้ไขบันทึกการเดินทาง' : 'บันทึกการเดินทางใหม่'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">สถานที่ไป (ปลายทาง)</label>
                <input 
                  required
                  type="text"
                  value={formData.destination}
                  onChange={e => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="เช่น อ.เมือง จ.เชียงราย, มหาวิทยาลัยเชียงใหม่"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171] focus:ring-1 focus:ring-[#311171]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">วัตถุประสงค์ / ภารกิจ</label>
                <input 
                  type="text"
                  value={formData.objective}
                  onChange={e => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="เช่น นำนิสิตศึกษาดูงาน, เข้าร่วมประชุมวิชาการ"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171] focus:ring-1 focus:ring-[#311171]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ชื่อพนักงานขับรถ</label>
                  <select 
                    value={formData.driverName}
                    onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  >
                    <option value="นายสมชาย ใจดี">นายสมชาย ใจดี</option>
                    <option value="นายอนุชา คำมี">นายอนุชา คำมี</option>
                    <option value="นายวิชัย แสนดี">นายวิชัย แสนดี</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ทะเบียนรถตู้</label>
                  <select 
                    value={formData.vanPlate}
                    onChange={e => setFormData({ ...formData, vanPlate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  >
                    <option value="นข 6789 พะเยา">นข 6789 พะเยา</option>
                    <option value="นข 1122 พะเยา">นข 1122 พะเยา</option>
                    <option value="นข 2233 พะเยา">นข 2233 พะเยา</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">เลขไมล์เริ่มต้น (กม.)</label>
                  <input 
                    required
                    type="number"
                    value={formData.mileageStart}
                    onChange={e => setFormData({ ...formData, mileageStart: e.target.value })}
                    placeholder="เช่น 45000"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">เลขไมล์สิ้นสุด (กม.)</label>
                  <input 
                    required
                    type="number"
                    value={formData.mileageEnd}
                    onChange={e => setFormData({ ...formData, mileageEnd: e.target.value })}
                    placeholder="เช่น 45150"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#311171]"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#311171] text-white font-bold rounded-xl hover:bg-[#230b54] shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}
