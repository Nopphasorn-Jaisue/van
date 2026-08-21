"use client";
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { 
  FileText, Search, Filter,
  CheckCircle2, XCircle, Info, Calendar,
  MapPin, Users, User, Clock, 
  X, Download, Edit
} from 'lucide-react';
import type { SystemBooking } from '@/lib/booking-system-types';

interface MappedRequest {
  id: string;
  time: string;
  requester: string;
  department: string;
  date: string;
  timeRange: string;
  destination: string;
  passengers: number;
  reason: string;
  status: string;
  files: number;
  isCrossFaculty: boolean;
  coordinator: {
    name: string;
    role: string;
    dept: string;
    phone: string;
    email: string;
  };
  tripType: string;
  departureLocation: string;
  budget: string;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{id: string, type: string} | null>(null);
  const [infoReason, setInfoReason] = useState("");

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setSelectedRequestId(id);
        setActiveTab('all');
      }
    }
  }, []);

  const [requests, setRequests] = useState<MappedRequest[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      
      const formatThaiDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) + 
               ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      };
      
      const mapped = (data.bookings || []).map((b: SystemBooking) => {
        let statusLabel = 'pending';
        if (b.status === 'WAITING_ADMIN') statusLabel = 'pending';
        if (b.status === 'WAITING_EXEC') statusLabel = 'cross_faculty_pending';
        if (b.status === 'APPROVED') statusLabel = 'approved';
        if (b.status === 'REJECTED') statusLabel = 'rejected';
        
        return {
          id: b.id,
          time: formatThaiDateTime(b.submittedAt),
          requester: b.requester,
          department: b.requesterFaculty,
          date: new Date(b.startAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
          timeRange: `${new Date(b.startAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.endAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
          destination: b.destination,
          passengers: b.passengers,
          reason: b.purpose,
          status: statusLabel,
          files: 0,
          isCrossFaculty: false,
          coordinator: {
            name: b.requester,
            role: "ผู้ใช้งาน",
            dept: b.requesterFaculty,
            phone: "-",
            email: "-"
          },
          tripType: "ไป-กลับ",
          departureLocation: b.requesterFaculty,
          budget: "งบประมาณคณะ"
        };
      });
      setRequests(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  const confirmAction = (id: string, actionType: string) => {
    setPendingAction({ id, type: actionType });
    setInfoReason("");
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    const { id, type: actionType } = pendingAction;
    
    let dbStatus = '';
    if (actionType === 'อนุมัติ' || actionType === 'อนุญาตให้ยืม') dbStatus = 'WAITING_EXEC';
    if (actionType === 'ปฏิเสธ') dbStatus = 'REJECTED';

    if (dbStatus) {
      try {
        await fetch(`/api/bookings/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: dbStatus, reason: infoReason || actionType })
        });
        await loadRequests();
        setAlertMessage(`ดำเนินการ ${actionType} คำขอ ${id} สำเร็จ`);
        if (selectedRequestId === id) setSelectedRequestId(null);
      } catch (err) {
        console.error(err);
        setAlertMessage(`เกิดข้อผิดพลาด: ${err}`);
      }
    } else {
      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: 'need_info' } : req
      ));
    }
    setPendingAction(null);
  };

  const filteredRequests = requests.filter(req => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'pending' ? req.status === 'pending' :
      activeTab === 'need_info' ? req.status === 'need_info' :
      activeTab === 'cross_faculty' ? req.status === 'cross_faculty_pending' : true;
      
    const matchesSearch = 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesTab && matchesSearch;
  });

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const crossFacultyCount = requests.filter(r => r.status === 'cross_faculty_pending').length;
  const needInfoCount = requests.filter(r => r.status === 'need_info').length;

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0">
        
        {/* ----- Header ----- */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-[26px] font-black text-gray-900 leading-tight mb-2">คำขอที่ต้องอนุมัติ</h1>
            <p className="text-sm text-gray-500">จัดการและตรวจสอบคำขอใช้รถตู้ทั้งหมดของคณะ</p>
          </div>
          
          {/* Minimalist Stats Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-200 bg-yellow-50/50 text-yellow-700 text-sm font-bold">
              <Clock size={16} /> รอพิจารณา {pendingCount}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50/50 text-purple-700 text-sm font-bold">
              <Users size={16} /> ยืมคณะ {crossFacultyCount}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/50 text-blue-700 text-sm font-bold">
              <Info size={16} /> รอข้อมูล {needInfoCount}
            </div>
          </div>
        </div>

        {/* ----- Main Grid Layout ----- */}
        <div className={`flex-1 min-h-0 flex gap-6 ${selectedRequestId ? 'grid grid-cols-1 xl:grid-cols-[1fr_400px]' : ''}`}>
          
          {/* ----- Left Table Area ----- */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* Tabs & Search Bar */}
            <div className="border-b border-gray-100 flex flex-col md:flex-row justify-between items-end gap-4 px-6 pt-4 bg-white shrink-0">
              <div className="flex gap-6 overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-3 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'pending' ? 'border-[#311171] text-[#311171]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  รอการพิจารณา
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'pending' ? 'bg-[#f0eaff] text-[#311171]' : 'bg-gray-100 text-gray-500'}`}>
                    {pendingCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('cross_faculty')}
                  className={`py-3 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'cross_faculty' ? 'border-[#311171] text-[#311171]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ยืมข้ามคณะ
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'cross_faculty' ? 'bg-[#f0eaff] text-[#311171]' : 'bg-gray-100 text-gray-500'}`}>
                    {crossFacultyCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('need_info')}
                  className={`py-3 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'need_info' ? 'border-[#311171] text-[#311171]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  รอข้อมูลเพิ่ม
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'need_info' ? 'bg-[#f0eaff] text-[#311171]' : 'bg-gray-100 text-gray-500'}`}>
                    {needInfoCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-3 text-[14px] font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'all' ? 'border-[#311171] text-[#311171]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ทั้งหมด
                </button>
              </div>

              <div className="flex gap-3 pb-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="ค้นหาเลขคำขอ, ผู้ขอ, ปลายทาง..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:bg-white transition-all"
                  />
                </div>
                <button className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-bold shrink-0">
                  <Filter size={16} /> ตัวกรอง
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto bg-white [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <tr className="text-[12px] font-bold text-gray-500 border-b border-gray-100">
                    <th className="py-4 pl-6 pr-4 font-bold min-w-[200px]">เลขคำขอ</th>
                    <th className="py-4 px-4 font-bold min-w-[180px]">ผู้ขอใช้รถ</th>
                    <th className="py-4 px-4 font-bold min-w-[150px]">กำหนดการ</th>
                    <th className="py-4 px-4 font-bold min-w-[260px]">รายละเอียดการเดินทาง</th>
                    <th className="py-4 px-4 font-bold text-center w-32">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                    <tr 
                      key={req.id} 
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`transition-colors cursor-pointer group ${selectedRequestId === req.id ? 'bg-[#f0eaff]' : 'hover:bg-gray-50/50'}`}
                    >
                      {/* เลขคำขอ */}
                      <td className="py-5 pl-6 pr-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${req.isCrossFaculty ? 'bg-purple-100 text-purple-700' : 'bg-[#f0eaff] text-[#311171]'}`}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className={`text-[13px] font-black mb-1 ${req.isCrossFaculty ? 'text-purple-700' : 'text-[#311171]'}`}>{req.id}</div>
                            <div className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                              <Clock size={10} /> {req.time}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ผู้ขอใช้รถ */}
                      <td className="py-5 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
                            <User size={14} className="text-gray-400" /> {req.requester}
                          </div>
                          <div className="text-[11px] text-gray-500 ml-5">{req.department}</div>
                        </div>
                      </td>

                      {/* กำหนดการ */}
                      <td className="py-5 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <div className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" /> {req.date}
                          </div>
                          <div className="text-[11px] text-gray-500 ml-5">{req.timeRange}</div>
                        </div>
                      </td>

                      {/* รายละเอียด */}
                      <td className="py-5 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[13px] font-bold text-gray-900 flex items-start gap-1.5 line-clamp-1">
                            <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" /> 
                            <span title={req.destination}>{req.destination}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-gray-500 ml-5">
                            <div className="flex items-center gap-1">
                              <Users size={12} className="text-gray-400" /> {req.passengers} คน
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText size={12} className="text-gray-400" /> แนบ {req.files} ไฟล์
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-400 ml-5 line-clamp-1" title={req.reason}>
                            เหตุผล: {req.reason}
                          </div>
                        </div>
                      </td>

                      {/* สถานะ */}
                      <td className="py-5 px-4 align-top text-center">
                        {req.status === 'pending' ? (
                          <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 text-[11px] font-bold">
                            รอพิจารณา
                          </div>
                        ) : req.status === 'cross_faculty_pending' ? (
                          <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold">
                            ขอยืมจากคณะอื่น
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                            รอข้อมูลเพิ่ม
                          </div>
                        )}
                      </td>


                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <CheckCircle2 size={32} className="text-gray-300" />
                          </div>
                          <p className="text-lg font-bold text-gray-900 mb-1">ไม่มีคำขอรอพิจารณา</p>
                          <p className="text-sm">คุณจัดการคำขอใช้รถตู้ครบหมดแล้วในขณะนี้</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-[13px] bg-white">
              <p className="text-gray-500 font-medium">
                แสดง 1 ถึง {filteredRequests.length} จาก {filteredRequests.length} รายการ
              </p>
              <div className="flex gap-2">
                <button disabled className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 bg-gray-50 font-medium">
                  ก่อนหน้า
                </button>
                <button className="px-3 py-1.5 rounded-lg border border-[#311171] text-white bg-[#311171] font-bold">
                  1
                </button>
                <button disabled className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 bg-gray-50 font-medium">
                  ถัดไป
                </button>
              </div>
            </div>
          </div>

          {/* ----- Right Sidebar (Details) ----- */}
          {selectedRequestId && selectedRequest && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col min-h-0 w-full xl:w-[400px] shrink-0 animate-in slide-in-from-right-4 fade-in">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <h2 className="text-[16px] font-black text-gray-900">รายละเอียดคำขอ</h2>
                <button onClick={() => setSelectedRequestId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* ID & Status */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${selectedRequest.isCrossFaculty ? 'bg-purple-100 text-purple-700' : 'bg-[#f0eaff] text-[#311171]'}`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-black text-gray-900">{selectedRequest.id}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedRequest.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 
                        selectedRequest.status === 'cross_faculty_pending' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {selectedRequest.status === 'pending' ? 'รอพิจารณา' : 
                         selectedRequest.status === 'cross_faculty_pending' ? 'ยืมข้ามคณะ' : 'รอข้อมูลเพิ่ม'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {selectedRequest.time} (โดย {selectedRequest.requester})
                    </p>
                  </div>
                </div>

                {/* Trip Data */}
                <div>
                  <h4 className="text-[13px] font-black text-[#311171] mb-3">ข้อมูลการเดินทาง</h4>
                  <div className="space-y-2.5">
                    <div className="flex gap-2 text-[12px]">
                      <span className="w-24 shrink-0 text-gray-500">ประเภทการเดินทาง</span>
                      <span className="text-gray-900 font-medium">{selectedRequest.tripType}</span>
                    </div>
                    <div className="flex gap-2 text-[12px]">
                      <span className="w-24 shrink-0 text-gray-500">จุดออกเดินทาง</span>
                      <span className="text-gray-900 font-medium">{selectedRequest.departureLocation}</span>
                    </div>
                    <div className="flex gap-2 text-[12px]">
                      <span className="w-24 shrink-0 text-gray-500">ปลายทาง</span>
                      <span className="text-gray-900 font-medium">{selectedRequest.destination}</span>
                    </div>
                    <div className="flex gap-2 text-[12px]">
                      <span className="w-24 shrink-0 text-gray-500">วันที่ออกเดินทาง</span>
                      <span className="text-gray-900 font-medium">{selectedRequest.date} เวลา {selectedRequest.timeRange.split(' - ')[0]} น.</span>
                    </div>
                    <div className="flex gap-2 text-[12px]">
                      <span className="w-24 shrink-0 text-gray-500">วันที่กลับ</span>
                      <span className="text-gray-900 font-medium">{selectedRequest.date} เวลา {selectedRequest.timeRange.split(' - ')[1]} น.</span>
                    </div>
                    <div className="flex gap-2 text-[12px]">
                      <span className="w-24 shrink-0 text-gray-500">จำนวนผู้โดยสาร</span>
                      <span className="text-gray-900 font-medium">{selectedRequest.passengers} คน</span>
                    </div>
                    <div className="flex gap-2 text-[12px]">
                      <span className="w-24 shrink-0 text-gray-500">วัตถุประสงค์</span>
                      <span className="text-gray-900 font-medium">{selectedRequest.reason}</span>
                    </div>
                    <div className="flex gap-2 text-[12px]">
                      <span className="w-24 shrink-0 text-gray-500">งบประมาณ</span>
                      <span className="text-gray-900 font-medium">{selectedRequest.budget}</span>
                    </div>
                  </div>
                </div>

                {/* Coordinator */}
                <div>
                  <h4 className="text-[13px] font-black text-[#311171] mb-3">ผู้ประสานงาน</h4>
                  <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">{selectedRequest.coordinator.name}</p>
                      <p className="text-[11px] text-gray-500">{selectedRequest.coordinator.role}</p>
                      <p className="text-[11px] text-gray-500 mb-1">{selectedRequest.coordinator.dept}</p>
                      <p className="text-[11px] text-gray-600 font-medium">{selectedRequest.coordinator.phone}</p>
                      <p className="text-[11px] text-gray-600 font-medium">{selectedRequest.coordinator.email}</p>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <h4 className="text-[13px] font-black text-[#311171] mb-3">เอกสารแนบ</h4>
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-red-500" />
                      <div>
                        <p className="text-[12px] font-bold text-gray-900">โครงการและกำหนดการ.pdf</p>
                        <p className="text-[10px] text-gray-500">1.2 MB</p>
                      </div>
                    </div>
                    <Download size={16} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </div>
                </div>

                {/* Allocation Selection */}
                <div>
                  <h4 className="text-[13px] font-black text-[#311171] mb-3">การจัดสรร (โดยแอดมิน)</h4>
                  
                  <div className="space-y-4">
                    {/* Van Display */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1.5">รถประจำคณะ</label>
                      <div className="w-full bg-gray-50 border border-gray-200 text-[#311171] text-[12px] font-bold rounded-xl px-3 py-2.5">
                        รถตู้คณะเกษตร 01 (นข 1234 พะเยา)
                      </div>
                    </div>

                    {/* Driver Display */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1.5">คนขับประจำคณะ</label>
                      <div className="relative w-full bg-gray-50 border border-gray-200 text-[#311171] text-[12px] font-bold rounded-xl px-3 py-2.5 flex items-center justify-between">
                        <span>นายสมชาย ใจดี</span>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> พร้อมปฏิบัติงาน
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar Actions */}
              <div className="p-4 border-t border-gray-100 bg-white shrink-0 grid grid-cols-5 gap-2">
                <button 
                  onClick={() => alert('ฟีเจอร์แก้ไขคำขอกำลังอยู่ในช่วงพัฒนาและจะพร้อมใช้งานเร็วๆนี้ (Backend API /api/bookings/[id] รองรับแล้ว)')}
                  className="py-2.5 px-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-600 text-[12px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit size={14} /> แก้ไข
                </button>
                <a
                  href={`/faculty-admin/approvals/${selectedRequest.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[12px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText size={14} /> พิมพ์ใบขอ
                </a>
                <button 
                  onClick={() => confirmAction(selectedRequest.id, "ปฏิเสธ")}
                  className="py-2.5 px-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 text-[12px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} /> ปฏิเสธ
                </button>
                <button 
                  onClick={() => confirmAction(selectedRequest.id, "ข้อมูลเพิ่ม")}
                  className="py-2.5 px-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 text-[12px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Info size={14} /> ข้อมูลเพิ่ม
                </button>
                <button 
                  onClick={() => confirmAction(selectedRequest.id, "อนุมัติ")}
                  className="py-2.5 px-2 bg-[#2a8b5c] hover:bg-[#206a46] text-white text-[12px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 size={14} /> อนุมัติ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Action Confirmation Modal */}
      {pendingAction && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPendingAction(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-[90%] max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                  pendingAction.type === 'ปฏิเสธ' ? 'bg-red-100 text-red-600' :
                  pendingAction.type === 'ข้อมูลเพิ่ม' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {pendingAction.type === 'ปฏิเสธ' ? <XCircle size={24} strokeWidth={2.5} /> :
                   pendingAction.type === 'ข้อมูลเพิ่ม' ? <Info size={24} strokeWidth={2.5} /> :
                   <CheckCircle2 size={24} strokeWidth={2.5} />}
                </div>
                <button 
                  onClick={() => setPendingAction(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1">
                {pendingAction.type === 'ปฏิเสธ' ? 'ยืนยันการปฏิเสธ' :
                 pendingAction.type === 'ข้อมูลเพิ่ม' ? 'ขอข้อมูลเพิ่มเติม' :
                 'ยืนยันการอนุมัติ'}
              </h3>
              <p className="text-sm font-medium text-gray-600 leading-relaxed mb-4">
                {pendingAction.type === 'ข้อมูลเพิ่ม' 
                  ? `ระบุข้อมูลที่คุณต้องการเพิ่มเติมสำหรับคำขอ ${pendingAction.id}`
                  : `คุณต้องการ${pendingAction.type}คำขอ ${pendingAction.id} ใช่หรือไม่?`}
              </p>

              {pendingAction.type === 'ข้อมูลเพิ่ม' && (
                <textarea
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-24"
                  placeholder="พิมพ์ข้อความที่นี่..."
                  value={infoReason}
                  onChange={(e) => setInfoReason(e.target.value)}
                />
              )}
            </div>
            <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setPendingAction(null)}
                className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-bold py-2 px-4 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={executeAction}
                className={`text-white text-sm font-bold py-2 px-6 rounded-xl transition-colors shadow-sm ${
                  pendingAction.type === 'ปฏิเสธ' ? 'bg-red-600 hover:bg-red-700' :
                  pendingAction.type === 'ข้อมูลเพิ่ม' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-[#2a8b5c] hover:bg-[#206a46]'
                }`}
              >
                {pendingAction.type === 'ข้อมูลเพิ่ม' ? 'ส่งข้อความ' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setAlertMessage(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-[90%] max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 shadow-inner">
                  <CheckCircle2 size={24} strokeWidth={2.5} />
                </div>
                <button 
                  onClick={() => setAlertMessage(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1">สำเร็จ!</h3>
              <p className="text-sm font-medium text-gray-600 leading-relaxed">
                {alertMessage}
              </p>
            </div>
            <div className="bg-gray-50 px-5 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setAlertMessage(null)}
                className="bg-[#311171] hover:bg-[#250d55] text-white text-sm font-bold py-2 px-6 rounded-xl transition-colors shadow-sm"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
