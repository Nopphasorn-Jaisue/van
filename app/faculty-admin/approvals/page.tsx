"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  FileText, Search,
  CheckCircle2, XCircle, Info, Calendar,
  MapPin, User, Clock, 
  X, Edit, Trash2, Printer, ArrowUpRight, ArrowDownLeft, History, Check, ShieldAlert
} from 'lucide-react';

interface ApiRawBookingItem {
  id: string;
  requester?: string;
  requesterEmail?: string;
  phone?: string;
  requesterFaculty?: string;
  requesterFacultyId?: number;
  targetFaculty?: string;
  targetFacultyId?: number;
  destination?: string;
  purpose?: string;
  passengers?: number;
  startAt?: string;
  endAt?: string;
  submittedAt?: string;
  budgetSource?: string;
  tripType?: string;
  status?: string;
  rejectReason?: string | null;
  assignedDriverName?: string;
  assignedVanPlate?: string;
}

interface MappedRequest {
  id: string;
  time: string;
  requester: string;
  requesterEmail: string;
  department: string;
  requesterFacultyId: number;
  targetFaculty: string;
  targetFacultyId: number;
  date: string;
  returnDateStr?: string;
  timeRange: string;
  destination: string;
  passengers: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'need_info';
  rawStatus: string;
  rejectReason?: string | null;
  files: number;
  isIncomingBorrow: boolean;
  isOutgoingBorrow: boolean;
  isOwnerOfVan: boolean;
  assignedVanPlate?: string;
  assignedDriverName?: string;
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
  const [activeTab, setActiveTab] = useState<'pending' | 'incoming' | 'outgoing' | 'history'>('pending');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{id: string, type: string} | null>(null);
  const [infoReason, setInfoReason] = useState("");
  const [currentAdminFacultyId, setCurrentAdminFacultyId] = useState<number>(1);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setSelectedRequestId(id);
        setActiveTab('history');
      }
    }
  }, []);

  const [requests, setRequests] = useState<MappedRequest[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // 1. Fetch current admin user
      let myFacultyId = currentAdminFacultyId;
      try {
        const meRes = await fetch('/api/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user?.facultyId) {
            myFacultyId = Number(meData.user.facultyId);
            setCurrentAdminFacultyId(myFacultyId);
          }
        }
      } catch {}

      // 2. Fetch bookings directly from DB via API (no-cache)
      const res = await fetch('/api/bookings?t=' + Date.now());
      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        
        const formatThaiDateTime = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                 ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        };
        
        const mapped: MappedRequest[] = (data.bookings || []).map((b: ApiRawBookingItem) => {
          const reqFacId = Number(b.requesterFacultyId || 1);
          const tgtFacId = Number(b.targetFacultyId || 1);

          const isIncoming = (tgtFacId === myFacultyId && reqFacId !== myFacultyId);
          const isOutgoing = (reqFacId === myFacultyId && tgtFacId !== myFacultyId);
          const isOwner = (tgtFacId === myFacultyId);

          let statusLabel: 'pending' | 'approved' | 'rejected' | 'need_info' = 'pending';
          if (b.status === 'APPROVED' || b.status === 'COMPLETED') {
            statusLabel = 'approved';
          } else if (b.status === 'REJECTED') {
            statusLabel = 'rejected';
          } else if (b.status === 'WAITING_ADMIN' || b.status === 'WAITING_EXEC') {
            statusLabel = 'pending';
          }
          
          const startDate = new Date(b.startAt || Date.now());
          const endDate = new Date(b.endAt || Date.now());
          
          return {
            id: b.id,
            time: formatThaiDateTime(b.submittedAt || new Date().toISOString()),
            requester: b.requester,
            requesterEmail: b.requesterEmail || "-",
            department: b.requesterFaculty,
            requesterFacultyId: reqFacId,
            targetFaculty: b.targetFaculty,
            targetFacultyId: tgtFacId,
            date: startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            returnDateStr: endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            timeRange: `${startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
            destination: b.destination,
            passengers: b.passengers || 1,
            reason: b.purpose,
            status: statusLabel,
            rawStatus: b.status,
            rejectReason: b.rejectReason,
            files: 0,
            isIncomingBorrow: isIncoming,
            isOutgoingBorrow: isOutgoing,
            isOwnerOfVan: isOwner,
            assignedVanPlate: b.assignedVanPlate,
            assignedDriverName: b.assignedDriverName,
            coordinator: {
              name: b.requester,
              role: "ผู้ขอใช้รถ",
              dept: b.requesterFaculty,
              phone: b.phone || "-",
              email: b.requesterEmail || "-"
            },
            tripType: b.tripType || "ในจังหวัดพะเยา",
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

  useEffect(() => {
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
    if (actionType === 'อนุมัติ' || actionType === 'อนุญาตให้ยืม') dbStatus = 'APPROVED';
    if (actionType === 'ปฏิเสธ') dbStatus = 'REJECTED';

    if (dbStatus) {
      try {
        await fetch(`/api/bookings/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: dbStatus, rejectReason: infoReason || actionType })
        });
        await loadRequests(true);
        setAlertMessage(`ดำเนินการ ${actionType} คำขอ ${id} สำเร็จเรียบร้อยแล้ว`);
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

  // Counts for Tabs
  const pendingCount = requests.filter(r => r.isOwnerOfVan && r.status === 'pending').length;
  const incomingCount = requests.filter(r => r.isIncomingBorrow && r.status === 'pending').length;
  const outgoingCount = requests.filter(r => r.isOutgoingBorrow).length;
  const historyList = requests.filter(r => r.status === 'approved' || r.status === 'rejected');
  const historyCount = historyList.length;
  const approvedHistoryCount = historyList.filter(r => r.status === 'approved').length;
  const rejectedHistoryCount = historyList.filter(r => r.status === 'rejected').length;

  // Filter logic
  const filteredRequests = requests.filter(req => {
    let matchesTab = false;
    if (activeTab === 'pending') {
      matchesTab = req.isOwnerOfVan && req.status === 'pending';
    } else if (activeTab === 'incoming') {
      matchesTab = req.isIncomingBorrow && req.status === 'pending';
    } else if (activeTab === 'outgoing') {
      matchesTab = req.isOutgoingBorrow;
    } else if (activeTab === 'history') {
      const isHistoryItem = (req.status === 'approved' || req.status === 'rejected');
      if (!isHistoryItem) return false;
      if (historyFilter === 'approved') matchesTab = req.status === 'approved';
      else if (historyFilter === 'rejected') matchesTab = req.status === 'rejected';
      else matchesTab = true;
    }
      
    const matchesSearch = 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesTab && matchesSearch;
  });

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0">
        
        {/* ----- Header ----- */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-[26px] font-black text-gray-900 leading-tight mb-1">คำขอที่ต้องอนุมัติ & จัดการการยืมรถ</h1>
            <p className="text-xs text-gray-500">จัดการคำขอใช้รถตู้ของคณะ คำขอยืมรถจากคณะอื่น และตรวจสอบประวัติการอนุมัติ/ปฏิเสธทั้งหมด</p>
          </div>
          
          {/* Top Quick Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-yellow-200 bg-yellow-50 text-yellow-800 text-xs font-bold shadow-2xs">
              <Clock size={15} className="text-yellow-600" /> รอเราพิจารณา: {pendingCount}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-purple-800 text-xs font-bold shadow-2xs">
              <ArrowDownLeft size={15} className="text-purple-600" /> เขามายืมเรา: {incomingCount}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold shadow-2xs">
              <ArrowUpRight size={15} className="text-blue-600" /> เราไปยืมเขา: {outgoingCount}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-xs font-bold shadow-2xs">
              <History size={15} className="text-gray-500" /> ประวัติ: {historyCount}
            </div>
          </div>
        </div>

        {/* Alert Feedback Notification */}
        {alertMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span>{alertMessage}</span>
            <button onClick={() => setAlertMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-black">✕</button>
          </div>
        )}

        {/* ----- Main Grid Layout ----- */}
        <div className={`flex-1 min-h-0 flex gap-6 ${selectedRequestId ? 'grid grid-cols-1 xl:grid-cols-[1fr_420px]' : ''}`}>
          
          {/* ----- Left Table Area ----- */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-2xs flex flex-col min-h-0 overflow-hidden">
            
            {/* Top Toolbar (Tabs & Search) */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shrink-0">
              
              {/* Main Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'pending'
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-300 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  รอการพิจารณา <span className="ml-1 opacity-75">({pendingCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('incoming')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'incoming'
                      ? 'bg-purple-50 text-purple-800 border border-purple-300 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  คำขอเข้า (ยืมรถเรา) <span className="ml-1 opacity-75">({incomingCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('outgoing')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'outgoing'
                      ? 'bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  คำขอออก (เราไปยืมเขา) <span className="ml-1 opacity-75">({outgoingCount})</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    activeTab === 'history'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  ประวัติ <span className="ml-1 opacity-75">({historyCount})</span>
                </button>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาเลขคำขอ, ผู้ขอ, คณะ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-1.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171] w-48 sm:w-60 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* History Sub-Filter Bar (Only visible when activeTab === 'history') */}
            {activeTab === 'history' && (
              <div className="px-4 py-2.5 bg-slate-50/80 border-b border-gray-100 flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-gray-500 font-bold">
                  <History size={14} className="text-gray-400" />
                  <span>ตัวกรองประวัติ:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      historyFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ทั้งหมด ({historyCount})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('approved')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      historyFilter === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 size={13} /> อนุมัติแล้ว ({approvedHistoryCount})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('rejected')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      historyFilter === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
                    }`}
                  >
                    <XCircle size={13} /> ปฏิเสธ ({rejectedHistoryCount})
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="py-3 px-4">เลขคำขอ</th>
                    <th className="py-3 px-4">ผู้ขอใช้รถ / คณะ</th>
                    <th className="py-3 px-4">กำหนดการ</th>
                    <th className="py-3 px-4">รายละเอียดการเดินทาง</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredRequests.length > 0 ? filteredRequests.map((req) => (
                    <tr 
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`hover:bg-purple-50/40 transition-colors cursor-pointer ${selectedRequestId === req.id ? 'bg-purple-50/70' : ''}`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${
                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            req.isIncomingBorrow ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <FileText size={15} />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">{req.id}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{req.time}</div>
                          </div>
                        </div>
                      </td>

                      {/* Requester & Faculty */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <User size={13} className="text-gray-400" />
                          <span>{req.requester}</span>
                        </div>
                        <div className="text-[11px] text-purple-700 font-bold mt-0.5">
                          {req.department}
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-gray-800">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{req.date}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium ml-4">
                          {req.timeRange}
                        </div>
                      </td>

                      {/* Destination & Purpose */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <MapPin size={13} className="text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{req.destination}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[200px] mt-0.5">
                          {req.passengers} คน • {req.reason}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {req.status === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1 w-fit mx-auto">
                            <CheckCircle2 size={12} /> อนุมัติแล้ว
                          </span>
                        ) : req.status === 'rejected' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center justify-center gap-1 w-fit mx-auto">
                            <XCircle size={12} /> ปฏิเสธ
                          </span>
                        ) : req.isIncomingBorrow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
                            ขอยืมรถเรา (รออนุมัติ)
                          </span>
                        ) : req.isOutgoingBorrow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            รอคณะปลายทางอนุมัติ
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
                            รอพิจารณา
                          </span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <CheckCircle2 size={36} className="text-gray-300 mb-2" />
                          <p className="text-base font-bold text-gray-800">ไม่มีรายการในส่วนนี้</p>
                          <p className="text-xs text-gray-400 mt-0.5">คุณจัดการคำขอในส่วนนี้ครบถ้วนแล้ว</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
              <span>แสดง {filteredRequests.length} จาก {requests.length} รายการ (ข้อมูลจริงจากฐานข้อมูล)</span>
            </div>
          </div>

          {/* ----- Right Sidebar (Details & Action Panel) ----- */}
          {selectedRequestId && selectedRequest && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col min-h-0 w-full xl:w-[420px] shrink-0 animate-in slide-in-from-right-4 fade-in">
              
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <h2 className="text-sm font-black text-gray-900">รายละเอียดคำขอ & การอนุมัติ</h2>
                <button onClick={() => setSelectedRequestId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* ID & Type Banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    selectedRequest.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    selectedRequest.isIncomingBorrow ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-sm font-black text-slate-900">{selectedRequest.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedRequest.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        selectedRequest.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        selectedRequest.isIncomingBorrow ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-yellow-50 text-yellow-800 border-yellow-200'
                      }`}>
                        {selectedRequest.status === 'approved' ? 'อนุมัติแล้ว' :
                         selectedRequest.status === 'rejected' ? 'ปฏิเสธ' :
                         selectedRequest.isIncomingBorrow ? 'ยืมรถเรา' :
                         selectedRequest.isOutgoingBorrow ? 'เราไปยืมเขา' : 'ภายในคณะ'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ยื่นเมื่อ {selectedRequest.time}
                    </p>
                  </div>
                </div>

                {/* Status Notice for Rejected */}
                {selectedRequest.status === 'rejected' && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-red-700">
                      <XCircle size={15} />
                      <span>ผลการพิจารณา: ปฏิเสธคำขอ</span>
                    </div>
                    <p className="text-xs text-red-800 font-medium">
                      <strong>เหตุผลการปฏิเสธ:</strong> {selectedRequest.rejectReason || "ไม่อนุญาต / รถไม่ว่างในวันเวลาดังกล่าว"}
                    </p>
                  </div>
                )}

                {/* Status Notice for Approved */}
                {selectedRequest.status === 'approved' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <CheckCircle2 size={15} />
                      <span>ผลการพิจารณา: อนุมัติการใช้รถเรียบร้อยแล้ว</span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      รถตู้: <strong>{selectedRequest.assignedVanPlate || "1นช3009 กรุงเทพมหานคร"}</strong> | คนขับ: <strong>{selectedRequest.assignedDriverName || "พนักงานขับรถ"}</strong>
                    </p>
                  </div>
                )}

                {/* Outgoing Live Progress Stepper */}
                {selectedRequest.isOutgoingBorrow && selectedRequest.status === 'pending' && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                    <div className="flex items-center gap-2 text-blue-950 font-black text-xs">
                      <ArrowUpRight size={16} className="text-blue-600" />
                      <span>ติดตามผลการอนุมัติ (เราขอยืม {selectedRequest.targetFaculty})</span>
                    </div>
                    
                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        <span>1. ส่งคำขอยืมรถไปยังคณะปลายทางแล้ว</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-blue-700 animate-pulse">
                        <Clock size={15} className="text-blue-600 shrink-0" />
                        <span>2. รอคณะปลายทาง ({selectedRequest.targetFaculty}) พิจารณาอนุมัติ</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Incoming Notice for Owner Faculty */}
                {selectedRequest.isIncomingBorrow && selectedRequest.status === 'pending' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                      <ArrowDownLeft size={16} className="text-purple-600" />
                      <span>{selectedRequest.department} ขอยืมรถตู้คณะเรา</span>
                    </div>
                    <p className="text-[11px] text-purple-700 font-medium leading-relaxed">
                      คุณในฐานะแอดมินคณะเจ้าของรถ สามารถกด <strong>"อนุมัติให้ยืม"</strong> หรือ <strong>"ปฏิเสธ"</strong> ได้ทันทีที่ปุ่มด้านล่าง
                    </p>
                  </div>
                )}

                {/* Real Trip Details */}
                <div>
                  <h4 className="text-xs font-black text-[#311171] mb-2.5 uppercase tracking-wide">ข้อมูลการเดินทาง (ข้อมูลจริง)</h4>
                  <div className="space-y-2 text-xs bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">ผู้ขอใช้รถ:</span>
                      <span className="font-bold text-gray-900">{selectedRequest.requester} ({selectedRequest.department})</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">สถานที่ไป:</span>
                      <span className="font-bold text-emerald-800">{selectedRequest.destination}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">วันเดินทาง:</span>
                      <span className="font-medium text-gray-800">{selectedRequest.date} ({selectedRequest.timeRange})</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">ผู้โดยสาร:</span>
                      <span className="font-medium text-gray-800">{selectedRequest.passengers} ท่าน</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">วัตถุประสงค์:</span>
                      <span className="font-medium text-gray-800">{selectedRequest.reason}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">ประเภทเดินทาง:</span>
                      <span className="font-medium text-gray-800">{selectedRequest.tripType}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">งบประมาณ:</span>
                      <span className="font-medium text-gray-800">{selectedRequest.budget}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">เบอร์โทรติดต่อ:</span>
                      <span className="font-bold text-gray-900">{selectedRequest.phone || selectedRequest.coordinator.phone || "-"}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-gray-500 font-bold">อีเมลผู้ขอ:</span>
                      <span className="font-medium text-gray-700">{selectedRequest.requesterEmail || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Real Allocation Info */}
                <div>
                  <h4 className="text-xs font-black text-[#311171] mb-2.5 uppercase tracking-wide">การจัดสรรรถและคนขับ</h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-purple-50 border border-purple-200 text-[#311171] font-bold rounded-xl flex items-center justify-between">
                      <span>ทะเบียนรถ: {selectedRequest.assignedVanPlate || "1นช3009 กรุงเทพมหานคร"}</span>
                      <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">ประจำคณะ</span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold rounded-xl flex items-center justify-between">
                      <span>คนขับ: {selectedRequest.assignedDriverName || "นาย (พนักงานขับรถ)"}</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">พร้อมปฏิบัติงาน</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons Panel */}
              <div className="p-4 border-t border-gray-100 bg-white shrink-0 space-y-2">
                {selectedRequest.status === 'pending' && selectedRequest.isOwnerOfVan ? (
                  /* เจ้าของรถ: เมื่อรอพิจารณา มีปุ่มอนุมัติให้ยืม, ปฏิเสธ */
                  <div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        onClick={() => confirmAction(selectedRequest.id, selectedRequest.isIncomingBorrow ? 'อนุญาตให้ยืม' : 'อนุมัติ')}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 size={16} /> {selectedRequest.isIncomingBorrow ? 'อนุมัติให้ยืม' : 'อนุมัติคำขอ'}
                      </button>
                      <button
                        onClick={() => confirmAction(selectedRequest.id, 'ปฏิเสธ')}
                        className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <XCircle size={16} /> ปฏิเสธคำขอ
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleOpenEditModal(selectedRequest)}
                        className="py-2 px-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Edit size={14} /> แก้ไข
                      </button>
                      <a
                        href={`/faculty-admin/approvals/${selectedRequest.id}/print`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Printer size={14} /> พิมพ์
                      </a>
                      <button
                        onClick={() => setDeleteConfirmBooking(selectedRequest)}
                        className="py-2 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} /> ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  /* รายการในประวัติ หรือคำขอออก: มีปุ่มแก้ไข, พิมพ์, ลบ/ยกเลิก */
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleOpenEditModal(selectedRequest)}
                      className="py-2.5 px-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Edit size={14} /> แก้ไขข้อมูล
                    </button>
                    <a
                      href={`/faculty-admin/approvals/${selectedRequest.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-2 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Printer size={14} /> พิมพ์ใบขอใช้
                    </a>
                    <button
                      onClick={() => setDeleteConfirmBooking(selectedRequest)}
                      className="py-2.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Trash2 size={14} /> ลบคำขอ
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Confirmation Modal */}
        {pendingAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <h3 className="text-base font-black text-gray-900">
                ยืนยันการ{pendingAction.type}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการ <strong>{pendingAction.type}</strong> คำขอเลขที่ <strong>{pendingAction.id}</strong>?
              </p>
              {pendingAction.type === 'ปฏิเสธ' && (
                <textarea
                  placeholder="ระบุเหตุผลการปฏิเสธ (ถ้ามี)..."
                  value={infoReason}
                  onChange={(e) => setInfoReason(e.target.value)}
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  rows={3}
                />
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setPendingAction(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={executeAction}
                  className={`px-4 py-2 text-white font-bold text-xs rounded-xl transition-colors ${
                    pendingAction.type === 'ปฏิเสธ' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-black text-sm">
                <Trash2 size={20} />
                <span>ยืนยันการลบคำขอ</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                คุณต้องการลบคำขอเลขที่ <strong>{deleteConfirmBooking.id}</strong> ({deleteConfirmBooking.destination}) ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setDeleteConfirmBooking(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteBooking}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  ลบคำขอทันที
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Edit size={18} className="text-orange-500" />
                  แก้ไขคำขอ {editingBooking.id}
                </h3>
                <button onClick={() => setEditingBooking(null)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>

              <form onSubmit={handleSaveEditBooking} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">สถานที่ปลายทาง</label>
                  <input
                    type="text"
                    required
                    value={editFormData.destination}
                    onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">วัตถุประสงค์การเดินทาง</label>
                  <textarea
                    required
                    rows={2}
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#311171]/20 focus:border-[#311171]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">วันออกเดินทาง</label>
                    <input
                      type="date"
                      required
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">เวลาออกเดินทาง</label>
                    <input
                      type="time"
                      required
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">วันเดินทางกลับ</label>
                    <input
                      type="date"
                      required
                      value={editFormData.returnDate}
                      onChange={(e) => setEditFormData({ ...editFormData, returnDate: e.target.value })}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">เวลาเดินทางกลับ</label>
                    <input
                      type="time"
                      required
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">จำนวนผู้โดยสาร</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      required
                      value={editFormData.passengers}
                      onChange={(e) => setEditFormData({ ...editFormData, passengers: Number(e.target.value) })}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">เบอร์โทรติดต่อ (10 หลัก)</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                    {phoneError && <span className="text-[10px] text-red-500 font-bold">{phoneError}</span>}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingBooking(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#311171] hover:bg-[#250d57] text-white font-bold rounded-xl shadow-xs"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
