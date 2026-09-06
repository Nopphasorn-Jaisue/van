"use client";
import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, X, MapPin, Globe, Users,
  AlertTriangle, Plus, Trash2, Compass, Send, Check
} from 'lucide-react';
import Swal from 'sweetalert2';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import ThaiTimePicker from '@/components/ThaiTimePicker';
import { thaiProvinces } from '@/Frontend/data/provinces';
import { facultiesList } from '@/Frontend/data/faculties';
import { facultyVansList } from '@/Frontend/data/faculty-vans';
import { OptimizationRecommendationResult } from '@/Backend/services/van-ranking';

export interface SelectedVanItem {
  id: string;
  vanId: string;
  facultyName?: string;
  isBorrow?: boolean;
  plate?: string;
  driverName?: string;
  phone?: string;
}

export interface CalendarModalEvent {
  id?: string | number;
  vanId?: string;
  facultyId?: string;
  date?: Date | string;
  returnDate?: Date | string;
  time?: string;
  destination?: string;
  purpose?: string;
  passengers?: number;
  status?: string;
  bookingFaculty?: string;
  requester?: string;
  phone?: string;
  department?: string;
  tripType?: "ในจังหวัดพะเยา" | "ต่างจังหวัด" | string;
  selectedVans?: SelectedVanItem[];
  assignedVans?: SelectedVanItem[];
  coordinatorName?: string;
  coordinatorPhone?: string;
  passengerNames?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  destinations?: { id: string; place: string; province: string }[];
  [key: string]: unknown;
}

interface CalendarBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  editingEvent?: CalendarModalEvent | null;
  currentUser?: { name: string; faculty: string; phone?: string; role?: string } | null;
  initialDate?: string;
  existingBookings?: CalendarModalEvent[];
}

export default function CalendarBookingModal({
  isOpen,
  onClose,
  onSaveSuccess,
  editingEvent,
  currentUser,
  initialDate,
  existingBookings = []
}: CalendarBookingModalProps) {
  const d = new Date();
  const defaultDateStr = initialDate || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const userFac = currentUser?.faculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร";

  // Form State
  const [form, setForm] = useState({
    // 1. ผู้ขอ & ผู้ประสานงาน
    requester: "",
    requesterPhone: "",
    coordinatorName: "",
    coordinatorPhone: "",
    passengerNames: "",
    bookingFaculty: userFac,

    // 2. วันและเวลาเดินทาง (Fixed Time Window)
    startDate: defaultDateStr,
    startTime: "08:30",
    endDate: defaultDateStr,
    endTime: "16:30",

    // 3 & 4. ผู้โดยสารและจำนวนรถ
    passengerCount: 1,
    requestedVehicleCount: 1,

    // 5. ขอบเขต
    tripScope: "ในจังหวัดพะเยา" as "ในจังหวัดพะเยา" | "ต่างจังหวัด",

    // 6. วัตถุประสงค์
    purpose: "",
    budgetSource: "งบประมาณคณะ",

    // 7 & 8. ปลายทางหลายแห่ง & จังหวัด
    destinations: [
      { id: "dest-1", place: "", province: "พะเยา" }
    ],

    // 9. จุดรับและจุดส่ง
    pickupLocation: "มหาวิทยาลัยพะเยา",
    dropoffLocation: "",

    // 10. Preference คณะ
    preferredFaculty: "all", // "all", "own", หรือชื่อคณะ
    selectedVanIds: [] as string[]
  });

  const [rankingData, setRankingData] = useState<OptimizationRecommendationResult | null>(null);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset form when modal opens or editingEvent changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingEvent) {
      let sDate = defaultDateStr;
      let eDate = defaultDateStr;
      if (editingEvent.date) {
        const sd = editingEvent.date instanceof Date ? editingEvent.date : new Date(editingEvent.date);
        if (!isNaN(sd.getTime())) {
          sDate = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
        }
      }
      if (editingEvent.returnDate) {
        const ed = editingEvent.returnDate instanceof Date ? editingEvent.returnDate : new Date(editingEvent.returnDate);
        if (!isNaN(ed.getTime())) {
          eDate = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`;
        }
      } else {
        eDate = sDate;
      }

      let sTime = "08:30";
      let eTime = "16:30";
      if (editingEvent.time) {
        const cleaned = editingEvent.time.replace(/น\./g, '').trim();
        const parts = cleaned.split('-').map(s => s.trim());
        if (parts[0]) sTime = parts[0];
        if (parts[1]) eTime = parts[1];
      }

      const existingDests = editingEvent.destinations && editingEvent.destinations.length > 0 
        ? editingEvent.destinations 
        : [{ id: "dest-1", place: editingEvent.destination || "", province: "พะเยา" }];

      const initialSelectedVanIds = editingEvent.assignedVans?.map(v => v.vanId) || 
        (editingEvent.vanId ? [editingEvent.vanId] : []);

      setForm({
        requester: editingEvent.requester || currentUser?.name || "",
        requesterPhone: editingEvent.phone || currentUser?.phone || "",
        coordinatorName: editingEvent.coordinatorName || "",
        coordinatorPhone: editingEvent.coordinatorPhone || "",
        passengerNames: editingEvent.passengerNames || "",
        bookingFaculty: editingEvent.bookingFaculty || userFac,
        startDate: sDate,
        startTime: sTime,
        endDate: eDate,
        endTime: eTime,
        passengerCount: Number(editingEvent.passengers || 1),
        requestedVehicleCount: Math.max(1, initialSelectedVanIds.length),
        tripScope: (editingEvent.tripType === "ต่างจังหวัด" ? "ต่างจังหวัด" : "ในจังหวัดพะเยา") as "ในจังหวัดพะเยา" | "ต่างจังหวัด",
        purpose: editingEvent.purpose || "",
        budgetSource: "งบประมาณคณะ",
        destinations: existingDests,
        pickupLocation: editingEvent.pickupLocation || "มหาวิทยาลัยพะเยา",
        dropoffLocation: editingEvent.dropoffLocation || "",
        preferredFaculty: "all",
        selectedVanIds: initialSelectedVanIds
      });
    } else {
      // New booking modal
      setForm({
        requester: currentUser?.name || "",
        requesterPhone: currentUser?.phone || "",
        coordinatorName: "",
        coordinatorPhone: "",
        passengerNames: "",
        bookingFaculty: userFac,
        startDate: defaultDateStr,
        startTime: "08:30",
        endDate: defaultDateStr,
        endTime: "16:30",
        passengerCount: 1,
        requestedVehicleCount: 1,
        tripScope: "ในจังหวัดพะเยา",
        purpose: "",
        budgetSource: "งบประมาณคณะ",
        destinations: [{ id: `dest-${Date.now()}`, place: "", province: "พะเยา" }],
        pickupLocation: "มหาวิทยาลัยพะเยา",
        dropoffLocation: "",
        preferredFaculty: "all",
        selectedVanIds: []
      });
    }
    setFormError(null);
  }, [isOpen, editingEvent, currentUser, defaultDateStr, userFac]);

  // Run Optimization & Ranking when date/time or parameters change
  useEffect(() => {
    if (!isOpen || !form.startDate || !form.startTime || !form.endDate || !form.endTime) return;

    const startIso = `${form.startDate}T${form.startTime}:00`;
    const endIso = `${form.endDate}T${form.endTime}:00`;

    setIsLoadingRanking(true);
    fetch('/api/vans/ranking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startAt: startIso,
        endAt: endIso,
        requestedCount: form.requestedVehicleCount,
        passengerCount: form.passengerCount,
        preferredFaculty: form.preferredFaculty === 'own' ? userFac : form.preferredFaculty,
        userFaculty: userFac
      })
    })
      .then(res => res.json())
      .then(data => {
        const resObj = (data.result || data) as OptimizationRecommendationResult;
        if (resObj && resObj.rankedAvailableVans) {
          setRankingData(resObj);
          // Auto select the top available vans if none selected or if count changed
          const availableVans = resObj.rankedAvailableVans || [];
          const topIds = availableVans.slice(0, form.requestedVehicleCount).map((v: { id: string }) => v.id);
          setForm(prev => {
            if (prev.selectedVanIds.length === 0 || prev.selectedVanIds.length !== prev.requestedVehicleCount) {
              return { ...prev, selectedVanIds: topIds };
            }
            return prev;
          });
        }
      })
      .catch(err => console.error("Error fetching ranking:", err))
      .finally(() => setIsLoadingRanking(false));
  }, [isOpen, form.startDate, form.startTime, form.endDate, form.endTime, form.requestedVehicleCount, form.passengerCount, form.preferredFaculty, userFac]);

  // Destination helpers
  const addDestination = () => {
    setForm(prev => ({
      ...prev,
      destinations: [
        ...prev.destinations,
        { id: `dest-${Date.now()}-${prev.destinations.length + 1}`, place: '', province: 'พะเยา' }
      ]
    }));
  };

  const removeDestination = (id: string) => {
    if (form.destinations.length <= 1) return;
    setForm(prev => ({
      ...prev,
      destinations: prev.destinations.filter(d => d.id !== id)
    }));
  };

  const updateDestination = (id: string, field: 'place' | 'province', val: string) => {
    setForm(prev => ({
      ...prev,
      destinations: prev.destinations.map(d => d.id === id ? { ...d, [field]: val } : d)
    }));
  };

  const toggleVanSelection = (vanId: string) => {
    setForm(prev => {
      if (prev.selectedVanIds.includes(vanId)) {
        return {
          ...prev,
          selectedVanIds: prev.selectedVanIds.filter(id => id !== vanId)
        };
      } else {
        if (prev.selectedVanIds.length >= prev.requestedVehicleCount) {
          const next = [...prev.selectedVanIds.slice(1), vanId];
          return { ...prev, selectedVanIds: next };
        }
        return {
          ...prev,
          selectedVanIds: [...prev.selectedVanIds, vanId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Validation
    const cleanRequesterPhone = (form.requesterPhone || '').replace(/\D/g, '');
    if (!form.requester.trim()) {
      setFormError("กรุณากรอกชื่อผู้ขอใช้บริการ");
      setIsSubmitting(false);
      return;
    }
    if (cleanRequesterPhone.length !== 10 || !cleanRequesterPhone.startsWith('0')) {
      setFormError("กรุณากรอกเบอร์โทรศัพท์ผู้ขอใช้บริการให้ถูกต้อง (10 หลัก ขึ้นต้นด้วย 0)");
      setIsSubmitting(false);
      return;
    }

    if (form.coordinatorPhone) {
      const cleanCoordPhone = form.coordinatorPhone.replace(/\D/g, '');
      if (cleanCoordPhone.length !== 10 || !cleanCoordPhone.startsWith('0')) {
        setFormError("เบอร์โทรศัพท์ผู้ประสานงานต้องมี 10 หลักและขึ้นต้นด้วย 0");
        setIsSubmitting(false);
        return;
      }
    }

    const filledDestinations = form.destinations.filter(d => d.place.trim());
    if (filledDestinations.length === 0) {
      setFormError("กรุณาระบุสถานที่ปลายทางอย่างน้อย 1 แห่ง");
      setIsSubmitting(false);
      return;
    }

    if (!form.purpose.trim()) {
      setFormError("กรุณาระบุวัตถุประสงค์การเดินทาง");
      setIsSubmitting(false);
      return;
    }

    const combinedDestination = filledDestinations.map(d => `${d.place} (${d.province})`).join(', ');
    const combinedTime = `${form.startTime} - ${form.endTime} น.`;

    // Overlap conflict checking
    const parseTimeStr = (t: string) => {
      const parts = t.replace(/น\./g, '').split('-').map(s => s.trim());
      return { start: parts[0] || '08:30', end: parts[1] || '16:30' };
    };

    const newStart = form.startTime;
    const newEnd = form.endTime;

    for (const vId of form.selectedVanIds) {
      const conflict = existingBookings.find(b => {
        if (editingEvent?.id && b.id === editingEvent.id) return false;
        if (b.status === 'rejected' || b.status === 'cancelled') return false;
        if (b.vanId !== vId) return false;

        const bStartDate = b.date instanceof Date ? b.date.toISOString().slice(0, 10) : String(b.date).slice(0, 10);
        const bEndDate = b.returnDate ? (b.returnDate instanceof Date ? b.returnDate.toISOString().slice(0, 10) : String(b.returnDate).slice(0, 10)) : bStartDate;

        const targetStart = form.startDate;
        const targetEnd = form.endDate;

        const isDateOverlap = targetStart <= bEndDate && targetEnd >= bStartDate;
        if (!isDateOverlap) return false;

        const bTime = parseTimeStr(b.time || '');
        return (newStart < bTime.end) && (newEnd > bTime.start);
      });

      if (conflict) {
        const targetVan = facultyVansList.find(v => v.id === vId);
        const vanLabel = targetVan ? `${targetVan.vanName} (${targetVan.plate})` : 'รถตู้ที่เลือก';
        const result = await Swal.fire({
          icon: 'warning',
          title: 'แจ้งเตือนคิวจองซ้ำซ้อน',
          html: `<div class="text-left text-xs space-y-1">
            <p><b>${vanLabel}</b> มีคิวจองในช่วงเวลาเดียวกันแล้ว:</p>
            <p>• วันที่: ${conflict.date}</p>
            <p>• เวลา: ${conflict.time}</p>
            <p>• ผู้ขอ: ${conflict.requester || '-'}</p>
            <p>• ปลายทาง: ${conflict.destination}</p>
            <p class="pt-2 font-bold text-amber-700">คุณต้องการยืนยันบันทึกการจองนี้ต่อไปหรือไม่?</p>
          </div>`,
          showCancelButton: true,
          confirmButtonText: 'ยืนยันบันทึกต่อไป',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#311171'
        });

        if (!result.isConfirmed) {
          setIsSubmitting(false);
          return;
        }
        break;
      }
    }

    // Prepare assigned vans payload
    const primaryVanId = form.selectedVanIds[0] || "v-ict";
    const primaryVan = facultyVansList.find(v => v.id === primaryVanId) || facultyVansList[0];

    const assignedVansList: SelectedVanItem[] = form.selectedVanIds.map((vId, idx) => {
      const v = facultyVansList.find(item => item.id === vId);
      const isBorrow = v ? v.facultyName !== userFac : false;
      return {
        id: `van-${Date.now()}-${idx + 1}`,
        vanId: vId,
        facultyName: v ? v.facultyName : userFac,
        isBorrow: isBorrow,
        plate: v ? v.plate : '',
        driverName: v ? v.driverName : '',
        phone: v ? v.driverPhone : ''
      };
    });

    const isCrossFaculty = assignedVansList.some(v => v.isBorrow);
    const now = new Date();
    const timestampStr = now.toISOString();
    const currentYearBE = now.getFullYear() + 543;
    const generatedBookingId = `UPV-${currentYearBE}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const payload = {
      id: editingEvent?.id || undefined,
      booking_id: generatedBookingId,
      request_timestamp: timestampStr,
      vanId: primaryVanId,
      facultyId: primaryVan ? primaryVan.facultyId : "ict",
      bookingFaculty: userFac,
      destination: combinedDestination,
      destinations: filledDestinations,
      purpose: form.purpose.trim(),
      purpose_raw: form.purpose.trim(),
      purposeDetail: form.purpose.trim(),
      routeDetail: `${form.pickupLocation} ➔ ${combinedDestination}`,
      date: form.startDate,
      returnDate: form.endDate,
      time: combinedTime,
      passengers: Number(form.passengerCount || 1),
      passenger_count: Number(form.passengerCount || 1),
      requested_vehicle_count: Number(form.requestedVehicleCount || 1),
      requester: form.requester.trim(),
      phone: cleanRequesterPhone,
      coordinator_name: form.coordinatorName.trim(),
      coordinator_phone: form.coordinatorPhone.trim(),
      passenger_names: form.passengerNames.trim(),
      pickup_location: form.pickupLocation.trim(),
      dropoff_location: form.dropoffLocation.trim(),
      department: "สำนักงานคณบดี",
      tripType: form.tripScope,
      trip_scope: form.tripScope,
      status: isCrossFaculty ? "pending_cross_faculty" : "pending",
      statusText: isCrossFaculty ? "รอการยืนยันจากคณะเจ้าของรถ" : "รอดำเนินการ (รอคณบดีอนุมัติ)",
      statusTime: "บันทึกในระบบ",
      assignedVans: assignedVansList,
      selectedVans: assignedVansList
    };

    try {
      const res = await fetch('/api/calendar-events', {
        method: editingEvent?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "เกิดข้อผิดพลาดในการบันทึกตาราง");
      }

      await Swal.fire({
        icon: 'success',
        title: editingEvent?.id ? 'แก้ไขข้อมูลสำเร็จ' : 'บันทึกคำขอจองสำเร็จ',
        html: `<div class="text-xs text-slate-600 space-y-1">
          <p><b>รหัสคำขอ:</b> ${generatedBookingId}</p>
          <p><b>ประทับเวลา (FCFS):</b> ${new Date(timestampStr).toLocaleString('th-TH')}</p>
          <p><b>จำนวนรถ:</b> ${form.requestedVehicleCount} คัน (บันทึกเข้าระบบเรียบร้อย)</p>
        </div>`,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#311171'
      });

      onSaveSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Save calendar error:", err);
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      setFormError(msg);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถบันทึกได้',
        text: msg,
        confirmButtonColor: '#311171'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[#311171] via-[#3d158c] to-[#4c1ba6] text-white shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {editingEvent?.id ? 'แก้ไขตารางการจองรถตู้' : 'เพิ่มตารางการจองรถตู้'}
              </h3>
              
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto text-xs space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
              <AlertTriangle size={16} className="text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* SECTION 1: วันและเวลาเดินทาง (Fixed Time Window - ข้อ 2) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CalendarDays size={15} className="text-[#311171]" />
                <span>1. กำหนดการเดินทาง (Fixed Time Window)</span>
              </div>
              <span className="text-[10px] font-bold text-[#311171] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                {form.startDate === form.endDate ? "ทริปวันเดียว" : "ทริปข้ามคืน / หลายวัน"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* ขาไป */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  กำหนดการขาไป (วันที่ และ เวลาเริ่ม) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <ThaiDatePicker 
                    value={form.startDate}
                    onChange={val => setForm(prev => ({ ...prev, startDate: val, endDate: prev.endDate < val ? val : prev.endDate }))}
                  />
                  <ThaiTimePicker 
                    value={form.startTime}
                    onChange={val => setForm(prev => ({ ...prev, startTime: val }))}
                  />
                </div>
              </div>

              {/* ขากลับ */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  กำหนดการขากลับ (วันที่ และ เวลาสิ้นสุด) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <ThaiDatePicker 
                    value={form.endDate}
                    onChange={val => setForm(prev => ({ ...prev, endDate: val }))}
                  />
                  <ThaiTimePicker 
                    value={form.endTime}
                    onChange={val => setForm(prev => ({ ...prev, endTime: val }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ข้อมูลผู้ขอ & ผู้ประสานงาน (ข้อ 1) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Users size={15} className="text-[#311171]" />
              <span>2. ข้อมูลผู้ขอใช้บริการ ผู้ประสานงาน และผู้โดยสาร</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อผู้ขอใช้บริการ <span className="text-rose-500">*</span>
                </label>
                <input 
                  required
                  type="text"
                  value={form.requester}
                  onChange={e => setForm({ ...form, requester: e.target.value })}
                  placeholder="เช่น ผศ.ดร.สมชาย ใจดี"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800 outline-none focus:border-[#311171]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  เบอร์โทรศัพท์ผู้ขอ (10 หลัก) <span className="text-rose-500">*</span>
                </label>
                <input 
                  required
                  type="tel"
                  maxLength={10}
                  value={form.requesterPhone}
                  onChange={e => setForm({ ...form, requesterPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="0812345678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800 outline-none focus:border-[#311171]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  ชื่อผู้ประสานงานประจำทริป <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <input 
                  type="text"
                  value={form.coordinatorName}
                  onChange={e => setForm({ ...form, coordinatorName: e.target.value })}
                  placeholder="เช่น นายประสาน งานดี"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  เบอร์โทรผู้ประสานงาน (10 หลัก) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <input 
                  type="tel"
                  maxLength={10}
                  value={form.coordinatorPhone}
                  onChange={e => setForm({ ...form, coordinatorPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="0898765432"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                รายชื่อผู้โดยสารและตำแหน่ง <span className="text-slate-400 font-normal">(ไม่รวมคนขับ)</span>
              </label>
              <textarea 
                rows={2}
                value={form.passengerNames}
                onChange={e => setForm({ ...form, passengerNames: e.target.value })}
                placeholder="เช่น 1. ดร.สมศักดิ์ (อาจารย์) 2. นายกิตติ (นิสิต) 3. น.ส.วิภา (เจ้าหน้าที่)..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171] resize-none"
              />
            </div>
          </div>

          {/* SECTION 3: จำนวนผู้โดยสาร & จำนวนรถ & Capacity (ข้อ 3, 4) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  จำนวนผู้โดยสารรวม (passenger_count) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={form.passengerCount}
                  onChange={e => setForm({ ...form, passengerCount: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800 outline-none focus:border-[#311171]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  จำนวนผู้โดยสารรวมทั้งหมดของภารกิจ ไม่รวมคนขับ
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  จำนวนรถที่ต้องการ (requested_vehicle_count) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number"
                  min={1}
                  max={5}
                  required
                  value={form.requestedVehicleCount}
                  onChange={e => setForm({ ...form, requestedVehicleCount: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-black text-[#311171] outline-none focus:border-[#311171]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  ระบุจำนวนรถแยกจากผู้โดยสาร รองรับ Partial Fulfillment
                </span>
              </div>
            </div>

            {/* Capacity Warning Banner */}
            {rankingData?.capacityWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800 animate-in fade-in">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">คำเตือนด้านความจุ:</span> ผู้โดยสาร {form.passengerCount} คน อาจเกินความจุมาตรฐานของรถที่เลือก ({rankingData.totalCapacityOfAvailable} ที่นั่ง)
                  <span className="block text-[10px] text-amber-700/80 mt-0.5">
                    ระบบอนุญาตให้บันทึกคำขอได้ โดยผู้ดูแลระบบจะเป็นผู้ตัดสินใจขั้นสุดท้าย
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: เส้นทาง จุดรับ-ส่ง และ ปลายทางหลายแห่ง (ข้อ 7, 8, 9, 5) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <MapPin size={15} className="text-[#311171]" />
              <span>3. เส้นทาง ขอบเขต และจุดหมายปลายทาง</span>
            </div>

            {/* ขอบเขตการเดินทาง (ข้อ 5) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">ขอบเขตการเดินทาง (trip_scope)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tripScope: 'ในจังหวัดพะเยา' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    form.tripScope === 'ในจังหวัดพะเยา'
                      ? 'bg-[#311171] text-white border-[#311171] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MapPin size={14} className={form.tripScope === 'ในจังหวัดพะเยา' ? 'text-white' : 'text-[#311171]'} />
                  <span>ในจังหวัดพะเยา</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tripScope: 'ต่างจังหวัด' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    form.tripScope === 'ต่างจังหวัด'
                      ? 'bg-[#311171] text-white border-[#311171] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Globe size={14} className={form.tripScope === 'ต่างจังหวัด' ? 'text-white' : 'text-[#311171]'} />
                  <span>ต่างจังหวัด (ภายนอกจังหวัด)</span>
                </button>
              </div>
            </div>

            {/* จุดรับ & จุดส่ง (ข้อ 9) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จุดรับผู้โดยสาร (pickup_location) <span className="text-rose-500">*</span>
                </label>
                <input 
                  required
                  type="text"
                  value={form.pickupLocation}
                  onChange={e => setForm({ ...form, pickupLocation: e.target.value })}
                  placeholder="เช่น มหาวิทยาลัยพะเยา, หน้าอาคาร ICT"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  จุดส่งผู้โดยสาร (dropoff_location) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <input 
                  type="text"
                  value={form.dropoffLocation}
                  onChange={e => setForm({ ...form, dropoffLocation: e.target.value })}
                  placeholder="เช่น มหาวิทยาลัยพะเยา"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171]"
                />
              </div>
            </div>

            {/* ปลายทางหลายแห่ง + 77 จังหวัด (ข้อ 7, 8) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">
                  สถานที่ปลายทาง (รองรับหลายจุดหมาย) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addDestination}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#311171] hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>เพิ่มจุดหมาย</span>
                </button>
              </div>

              <div className="space-y-2">
                {form.destinations.map((dest, idx) => (
                  <div key={dest.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-[#311171] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input 
                      required
                      type="text"
                      placeholder="ระบุสถานที่ปลายทาง เช่น ศูนย์ประชุมนานาชาติเชียงใหม่"
                      value={dest.place}
                      onChange={e => updateDestination(dest.id, 'place', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 outline-none focus:border-[#311171]"
                    />
                    <select
                      value={dest.province}
                      onChange={e => updateDestination(dest.id, 'province', e.target.value)}
                      className="w-32 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none focus:border-[#311171] cursor-pointer"
                    >
                      {thaiProvinces.map(p => (
                        <option key={p.id} value={p.nameTh}>{p.nameTh}</option>
                      ))}
                    </select>
                    {form.destinations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDestination(dest.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        title="ลบจุดหมายนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 5: วัตถุประสงค์ (ข้อ 6) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <label className="block font-bold text-slate-700">
              วัตถุประสงค์การเดินทาง (purpose & purpose_raw) <span className="text-rose-500">*</span>
            </label>
            <input 
              required
              type="text"
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              placeholder="เช่น เข้าร่วมการแข่งขันโครงงานวิชาการ, นำนิสิตศึกษาดูงานนอกสถานที่..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium text-slate-800 outline-none focus:border-[#311171]"
            />
          </div>

          {/* SECTION 6: การจัดสรรรถและคนขับ (Vehicle-Driver Pair Optimization - ข้อ 10, 11, 12, 13, 14) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Compass size={15} className="text-[#311171]" />
                <span>4. การจัดสรรรถและคนขับ (Vehicle-Driver Workload Ranking)</span>
              </div>
              <span className="text-[10px] font-bold text-[#311171] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                คนขับประจำรถ
              </span>
            </div>

            {/* Preference (ข้อ 10) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">ความประสงค์ในการเลือกคณะ (Preference)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, preferredFaculty: 'all' })}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    form.preferredFaculty === 'all'
                      ? 'border-[#311171] bg-purple-50 text-[#311171] ring-2 ring-[#311171]/20'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <p className="text-[11px] font-black">ค้นหาจากทุกคณะ</p>
                  <p className="text-[9px] text-slate-500 font-normal">ระบบคัดเลือกรถที่เหมาะสมที่สุด</p>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, preferredFaculty: 'own' })}
                  className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                    form.preferredFaculty === 'own'
                      ? 'border-[#311171] bg-purple-50 text-[#311171] ring-2 ring-[#311171]/20'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <p className="text-[11px] font-black">รถประจำคณะตนเอง</p>
                  <p className="text-[9px] text-slate-500 font-normal">{userFac}</p>
                </button>

                <div>
                  <select
                    value={form.preferredFaculty !== 'all' && form.preferredFaculty !== 'own' ? form.preferredFaculty : ''}
                    onChange={e => {
                      if (e.target.value) setForm({ ...form, preferredFaculty: e.target.value });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      form.preferredFaculty !== 'all' && form.preferredFaculty !== 'own'
                        ? 'border-[#311171] bg-purple-50 text-[#311171] ring-2 ring-[#311171]/20'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <option value="">-- ระบุคณะที่ต้องการยืม --</option>
                    {facultiesList.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Partial Fulfillment Summary (ข้อ 4, 14) */}
            {rankingData && (
              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black text-[#311171]">ผลการค้นหารถที่พร้อมให้บริการ:</span>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    ขอทั้งหมด <b>{form.requestedVehicleCount}</b> คัน • พบพร้อมให้บริการ <b>{rankingData.availableCount}</b> คัน
                    {rankingData.missingCount > 0 && (
                      <span className="text-amber-700 font-bold ml-1">
                        • ยังขาดอีก {rankingData.missingCount} คัน (Partial Fulfillment)
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                  เลือกแล้ว {form.selectedVanIds.length}/{form.requestedVehicleCount} คัน
                </span>
              </div>
            )}

            {/* Recommended Vans Cards */}
            {isLoadingRanking ? (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
                <div className="w-5 h-5 border-2 border-[#311171] border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                <span className="text-[11px]">กำลังตรวจสอบคิวว่างและจัดอันดับภาระงาน...</span>
              </div>
            ) : rankingData && rankingData.rankedAvailableVans.length > 0 ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {rankingData.rankedAvailableVans.map(van => {
                  const isSelected = form.selectedVanIds.includes(van.id);
                  return (
                    <div 
                      key={van.id}
                      onClick={() => toggleVanSelection(van.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#311171] bg-purple-50/90 ring-2 ring-[#311171]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          isSelected ? 'bg-[#311171] text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{van.rank}
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={van.driverImage} 
                          alt="driver" 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-[11px] text-slate-800 truncate">{van.facultyName}</span>
                            <span className="text-[10px] text-[#311171] font-bold shrink-0">({van.plate})</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">
                            คนขับ: {van.driverName} • โทร: {van.driverPhone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block">ภาระงาน</span>
                          <span className="text-[10px] font-black text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded">
                            {van.workloadScore} งาน
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                          isSelected ? 'bg-[#311171] text-white' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-bold text-center">
                ไม่พบรถตู้ที่ว่างตรงกับช่วงวันและเวลาที่กำหนด กรุณาปรับเปลี่ยนเวลาหรือติดต่อผู้ดูแลระบบส่วนกลาง
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 bg-gradient-to-r from-[#311171] to-[#4c1ba6] hover:opacity-95 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>{editingEvent?.id ? 'บันทึกการแก้ไข' : 'บันทึกตารางการจอง'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
