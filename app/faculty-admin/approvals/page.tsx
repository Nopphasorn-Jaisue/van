"use client";
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { 
  FileText, Search, Filter,
  CheckCircle2, XCircle, Info, Calendar,
  MapPin, Users, User, Clock, 
  X, Download, Edit, Trash2
} from 'lucide-react';

interface MappedRequest {
  assignedVanPlate?: string;
  assignedDriverName?: string;
  id: string;
  time: string;
  requester: string;
  department: string;
  date: string;
  returnDateStr?: string;
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
  startAtRaw?: string;
  endAtRaw?: string;
  phone?: string;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{id: string, type: string} | null>(null);
  const [infoReason, setInfoReason] = useState("");

  // Modals for Edit and Delete
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState<MappedRequest | null>(null);
  const [editingBooking, setEditingBooking] = useState<MappedRequest | null>(null);
  const [editFormData, setEditFormData] = useState({
    destination: '',
    reason: '',
    startDate: '',
    startTime: '08:30',
    returnDate: '',
    endTime: '16:30',
    passengers: 1,
    tripType: 'ในจังหวัดพะเยา',
    budget: 'งบประมาณคณะ',
    phone: ''
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);

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

  const loadRequests = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        
        const formatThaiDateTime = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                 ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        };
        
        const mapped = (data.bookings || []).map((b: any) => {
          const isCross = (b.requesterFacultyId && b.targetFacultyId && Number(b.requesterFacultyId) !== Number(b.targetFacultyId)) || b.status === 'WAITING_EXEC';
          let statusLabel = 'pending';
          if (b.status === 'APPROVED') {
            statusLabel = 'approved';
          } else if (b.status === 'REJECTED') {
            statusLabel = 'rejected';
          } else if (isCross) {
            statusLabel = 'cross_faculty_pending';
          } else if (b.status === 'WAITING_ADMIN') {
            statusLabel = 'pending';
          }
          
          const startDate = new Date(b.startAt);
          const endDate = new Date(b.endAt);
          
          return {
            id: b.id,
            time: formatThaiDateTime(b.submittedAt),
            requester: b.requester,
            department: b.requesterFaculty,
            date: startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            returnDateStr: endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            timeRange: `${startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
            destination: b.destination,
            passengers: b.passengers || 1,
            reason: b.purpose,
            status: statusLabel,
            files: 0,
            isCrossFaculty: isCross,
            coordinator: {
              name: b.requester,
              role: "ผู้ใช้งาน",
              dept: b.requesterFaculty,
              phone: b.phone || "-",
              email: "-"
            },
            tripType: b.tripType || "ไป-กลับ",
            departureLocation: b.requesterFaculty,
            budget: b.budgetSource || "งบประมาณคณะ",
            startAtRaw: b.startAt,
            endAtRaw: b.endAt,
            phone: b.phone || ""
          };
        });
        setRequests(mapped);
        try {
          sessionStorage.setItem('cached_faculty_approvals', JSON.stringify(mapped));
        } catch {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    try {
      const cached = sessionStorage.getItem('cached_faculty_approvals');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRequests(parsed);
          setIsLoading(false);
        }
      }
    } catch {}
    loadRequests(true);
    const safetyTimer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(safetyTimer);
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

  // Open Edit Modal
  const handleOpenEditModal = (req: MappedRequest) => {
    let startD = '';
    let startT = '08:30';
    let endD = '';
    let endT = '16:30';

    if (req.startAtRaw) {
      const d = new Date(req.startAtRaw);
      startD = d.toISOString().split('T')[0];
      startT = d.toTimeString().slice(0, 5);
    }
    if (req.endAtRaw) {
      const d = new Date(req.endAtRaw);
      endD = d.toISOString().split('T')[0];
      endT = d.toTimeString().slice(0, 5);
    }

    setEditFormData({
      destination: req.destination || '',
      reason: req.reason || '',
      startDate: startD || new Date().toISOString().split('T')[0],
      startTime: startT,
      returnDate: endD || startD || new Date().toISOString().split('T')[0],
      endTime: endT,
      passengers: req.passengers || 1,
      tripType: req.tripType || 'ในจังหวัดพะเยา',
      budget: req.budget || 'งบประมาณคณะ',
      phone: req.phone === '-' ? '' : (req.phone || '')
    });
    setPhoneError(null);
    setEditingBooking(req);
  };

  // Save Edit Booking
  const handleSaveEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    if (editFormData.phone && editFormData.phone.length !== 10) {
      setPhoneError('เบอร์โทรศัพท์ต้องครบ 10 หลัก');
      return;
    }

    try {
      const startDateTime = new Date(`${editFormData.startDate}T${editFormData.startTime}:00`);
      const endDateTime = new Date(`${editFormData.returnDate}T${editFormData.endTime}:00`);

      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: editFormData.destination,
          purpose: editFormData.reason,
          passengers: editFormData.passengers,
          startAt: startDateTime.toISOString(),
          endAt: endDateTime.toISOString(),
          tripType: editFormData.tripType,
          budgetSource: editFormData.budget,
          phone: editFormData.phone || '-'
        })
      });

      const result = await res.json();
      if (res.ok && (result.success || result.booking)) {
        setAlertMessage(`แก้ไขข้อมูลคำขอ ${editingBooking.id} สำเร็จเรียบร้อยแล้ว`);
        setEditingBooking(null);
        await loadRequests(true);
      } else {
        alert(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // Confirm Delete Booking
  const handleDeleteBooking = async () => {
    if (!deleteConfirmBooking) return;
    const targetId = deleteConfirmBooking.id;

    try {
      const res = await fetch(`/api/bookings/${targetId}`, {
        method: 'DELETE'
      });
      const result = await res.json().catch(() => ({ success: false }));
      if (res.ok && (result.success !== false)) {
        setRequests(prev => prev.filter(r => r.id !== targetId));
        if (selectedRequestId === targetId) setSelectedRequestId(null);
        setDeleteConfirmBooking(null);
        setAlertMessage(`ลบคำขอ ${targetId} เรียบร้อยแล้ว`);
        try {
          const updated = requests.filter(r => r.id !== targetId);
          sessionStorage.setItem('cached_faculty_approvals', JSON.stringify(updated));
        } catch {}
      } else {
        alert(result.error || "ไม่สามารถลบคำขอได้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการลบคำขอ");
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'pending' ? (req.status === 'pending' || req.status === 'cross_faculty_pending') :
      activeTab === 'need_info' ? req.status === 'need_info' :
      activeTab === 'cross_faculty' ? (req.isCrossFaculty && (req.status === 'cross_faculty_pending' || req.status === 'pending')) : true;
      
    const matchesSearch = 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesTab && matchesSearch;
  });

  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  const isCrossFacultyRequest = selectedRequest ? (selectedRequest.isCrossFaculty || selectedRequest.status === 'cross_faculty_pending' || activeTab === 'cross_faculty') : false;

  const pendingCount = requests.filter(r => r.status === 'pending' || r.status === 'cross_faculty_pending').length;
  const crossFacultyCount = requests.filter(r => r.isCrossFaculty && (r.status === 'cross_faculty_pending' || r.status === 'pending')).length;
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
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
            
            {/* Top Toolbar (Tabs & Search) */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shrink-0">
              
              {/* Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'pending'
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-300'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  รอการพิจารณา <span className="ml-1 opacity-70">{pendingCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab('cross_faculty')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'cross_faculty'
                      ? 'bg-purple-50 text-purple-800 border border-purple-300'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  ยืมข้ามคณะ <span className="ml-1 opacity-70">{crossFacultyCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab('need_info')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'need_info'
                      ? 'bg-blue-50 text-blue-800 border border-blue-300'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  รอข้อมูลเพิ่ม <span className="ml-1 opacity-70">{needInfoCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  ทั้งหมด
                </button>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาเลขคำขอ, ผู้ขอ, ปลายทาง..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] w-48 sm:w-64 transition-all"
                  />
                </div>
                <button className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs font-bold">
                  <Filter size={14} />
                  <span className="hidden sm:inline">ตัวกรอง</span>
                </button>
              </div>

            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-600 bg-white sticky top-0 z-10">
                    <th className="py-3 px-4">เลขคำขอ</th>
                    <th className="py-3 px-4">ผู้ขอใช้รถ</th>
                    <th className="py-3 px-4">กำหนดการ</th>
                    <th className="py-3 px-4">รายละเอียดการเดินทาง</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[12px]">
                  {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`cursor-pointer transition-colors group ${
                        selectedRequestId === req.id 
                          ? 'bg-[#f0eaff]/80' 
                          : 'hover:bg-gray-50/80'
                      }`}
                    >
                      {/* เลขคำขอ */}
                      <td className="py-5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${req.isCrossFaculty ? 'bg-purple-100 text-purple-700' : 'bg-[#f0eaff] text-[#311171]'}`}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block leading-tight">{req.id}</span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 font-medium">
                              <Clock size={12} /> {req.time}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ผู้ขอใช้รถ */}
                      <td className="py-5 px-4 align-top">
                        <div>
                          <span className="font-bold text-gray-900 flex items-center gap-1.5 leading-tight">
                            <User size={14} className="text-gray-400" />
                            {req.requester}
                          </span>
                          <span className="text-[11px] text-gray-400 block mt-1 ml-5 font-medium">{req.department}</span>
                        </div>
                      </td>

                      {/* กำหนดการ */}
                      <td className="py-5 px-4 align-top">
                        <div>
                          <span className="font-bold text-gray-900 flex items-center gap-1.5 leading-tight">
                            <Calendar size={14} className="text-gray-400" />
                            {req.date}
                          </span>
                          <span className="text-[11px] text-gray-400 block mt-1 ml-5 font-medium">{req.timeRange}</span>
                        </div>
                      </td>

                      {/* รายละเอียดการเดินทาง */}
                      <td className="py-5 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-bold text-gray-900 flex items-center gap-1.5 leading-tight">
                            <MapPin size={14} className="text-purple-600 shrink-0" />
                            {req.destination}
                          </span>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 ml-5">
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
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCrossFacultyRequest ? 'bg-purple-100 text-purple-700' : 'bg-[#f0eaff] text-[#311171]'}`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-black text-gray-900">{selectedRequest.id}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCrossFacultyRequest ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        selectedRequest.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {isCrossFacultyRequest ? 'ยืมข้ามคณะ' :
                         selectedRequest.status === 'pending' ? 'รอพิจารณา' : 'รอข้อมูลเพิ่ม'}
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
                      <span className="text-gray-900 font-medium">{selectedRequest.returnDateStr || selectedRequest.date} เวลา {selectedRequest.timeRange.split(' - ')[1]} น.</span>
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
                      <p className="text-[11px] text-gray-600 font-medium">โทร: {selectedRequest.coordinator.phone}</p>
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

                {/* Allocation Selection / Cross Faculty Notice */}
                <div>
                  {isCrossFacultyRequest ? (
                    <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                        <Users size={16} className="text-purple-600" />
                        <span>คำขอยืมรถข้ามคณะ</span>
                      </div>
                      <p className="text-[11px] text-purple-700 leading-relaxed font-medium">
                        คำขอนี้ส่งไปยังคณะเจ้าของรถเพื่อขอยืมรถตู้ โดยทางคณะเจ้าของรถจะเป็นผู้พิจารณาอนุมัติและจัดสรรคนขับและรถตู้
                      </p>
                      <div className="text-[11px] text-gray-600 pt-1 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">สถานะคำขอ:</span>
                          <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full text-[10px]">
                            รอคณะปลายทางพิจารณาอนุมัติ
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-[13px] font-black text-[#311171] mb-3">การจัดสรร (โดยแอดมิน)</h4>
                      <div className="space-y-4">
                        {/* Van Display */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1.5">รถประจำคณะ</label>
                          <div className="w-full bg-purple-50 border border-purple-200 text-[#311171] text-[12px] font-bold rounded-xl px-3 py-2.5 flex items-center justify-between">
                            <span>{selectedRequest.assignedVanPlate || "1นช3009 กรุงเทพมหานคร (ICT)"}</span>
                            <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">พร้อมใช้งาน</span>
                          </div>
                        </div>

                        {/* Driver Display */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1.5">คนขับประจำคณะ</label>
                          <div className="relative w-full bg-emerald-50 border border-emerald-200 text-emerald-950 text-[12px] font-bold rounded-xl px-3 py-2.5 flex items-center justify-between">
                            <span>{selectedRequest.assignedDriverName || "นาย (คนขับประจำคณะ ICT)"}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> พร้อมปฏิบัติงาน
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Sidebar Actions */}
              {isCrossFacultyRequest ? (
                /* Cross-faculty action buttons: Only Edit & Delete */
                <div className="p-4 border-t border-gray-100 bg-white shrink-0 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleOpenEditModal(selectedRequest)}
                    className="py-3 px-3 bg-white hover:bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs hover:border-orange-300"
                  >
                    <Edit size={16} /> แก้ไขข้อมูล
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmBooking(selectedRequest)}
                    className="py-3 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs hover:border-red-300"
                  >
                    <Trash2 size={16} /> ลบคำขอ
                  </button>
                </div>
              ) : (
                /* Regular internal booking action buttons: All 5 actions */
                <div className="p-4 border-t border-gray-100 bg-white shrink-0 grid grid-cols-5 gap-2">
                  <button 
                    onClick={() => handleOpenEditModal(selectedRequest)}
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setEditingBooking(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">แก้ไขข้อมูลคำขอ</h3>
                <p className="text-xs text-purple-700 font-bold mt-0.5">เลขที่คำขอ: {editingBooking.id}</p>
              </div>
              <button 
                onClick={() => setEditingBooking(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditBooking} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Destination */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">สถานที่ไป / ปลายทาง <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={editFormData.destination}
                  onChange={(e) => setEditFormData({...editFormData, destination: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171]"
                  placeholder="เช่น โรงพยาบาลพะเยา, มหาวิทยาลัยเชียงใหม่"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">วัตถุประสงค์ <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  rows={2}
                  value={editFormData.reason}
                  onChange={(e) => setEditFormData({...editFormData, reason: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171] resize-none"
                  placeholder="ระบุวัตถุประสงค์การเดินทาง"
                />
              </div>

              {/* Dates and Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">วันที่ออกเดินทาง</label>
                  <input 
                    type="date" 
                    required
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({...editFormData, startDate: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">เวลาออกเดินทาง</label>
                  <input 
                    type="time" 
                    required
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">วันที่เดินทางกลับ</label>
                  <input 
                    type="date" 
                    required
                    value={editFormData.returnDate}
                    onChange={(e) => setEditFormData({...editFormData, returnDate: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">เวลาเดินทางกลับ</label>
                  <input 
                    type="time" 
                    required
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({...editFormData, endTime: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171]"
                  />
                </div>
              </div>

              {/* Passengers & Trip Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">จำนวนผู้โดยสาร (คน)</label>
                  <input 
                    type="number" 
                    min={1}
                    max={15}
                    required
                    value={editFormData.passengers}
                    onChange={(e) => setEditFormData({...editFormData, passengers: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ประเภทการเดินทาง</label>
                  <select 
                    value={editFormData.tripType}
                    onChange={(e) => setEditFormData({...editFormData, tripType: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171] bg-white"
                  >
                    <option value="ในจังหวัดพะเยา">ในจังหวัดพะเยา</option>
                    <option value="ต่างจังหวัด">ต่างจังหวัด</option>
                  </select>
                </div>
              </div>

              {/* Phone & Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">เบอร์ติดต่อ (10 หลัก)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      maxLength={10}
                      value={editFormData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditFormData({...editFormData, phone: val});
                        if (val && val.length !== 10) {
                          setPhoneError('เบอร์โทรศัพท์ต้องครบ 10 หลัก');
                        } else {
                          setPhoneError(null);
                        }
                      }}
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171]"
                      placeholder="08XXXXXXXX"
                    />
                  </div>
                  {phoneError && <p className="text-[10px] text-red-500 mt-1 font-bold">{phoneError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">แหล่งงบประมาณ</label>
                  <input 
                    type="text" 
                    value={editFormData.budget}
                    onChange={(e) => setEditFormData({...editFormData, budget: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#311171]"
                    placeholder="งบประมาณคณะ"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold text-xs text-gray-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#311171] hover:bg-purple-900 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-colors"
                >
                  บันทึกการแก้ไข
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBooking && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setDeleteConfirmBooking(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Trash2 size={30} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">ยืนยันการลบคำขอ?</h3>
              <p className="text-xs text-gray-500 font-medium mt-1.5 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบคำขอเลขที่ <strong className="text-gray-900">{deleteConfirmBooking.id}</strong>?
                {deleteConfirmBooking.isCrossFaculty && <span className="block mt-1 text-purple-700 font-bold">(คำขอยืมรถข้ามคณะ)</span>}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDeleteConfirmBooking(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleDeleteBooking}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors"
              >
                ลบคำขอ
              </button>
            </div>
          </div>
        </div>
      )}

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
