"use client";
import React, { useState, useEffect, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { 
  MapPin, Users, FileText, Send, 
  Paperclip, UploadCloud, X,
  ChevronLeft, ChevronRight, Check,
  AlertTriangle, Plus, Trash2, Clock, Calendar,
  ShieldCheck, Award, User, Compass
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import ThaiTimePicker from '@/components/ThaiTimePicker';
import { thaiProvinces } from '@/Frontend/data/provinces';
import { facultiesList } from '@/Frontend/data/faculties';
import type { OptimizationRecommendationResult } from '@/Backend/services/van-ranking';
import { checkMultiDayTrip } from '@/lib/trip-calculation';

interface DestinationItem {
  id: string;
  place: string;
  province: string;
}

function BookingFormContent() {
  const searchParams = useSearchParams();
  const prefilledDate = searchParams?.get('date');
  const prefilledVanId = searchParams?.get('vanId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSamePersonCoordinator, setIsSamePersonCoordinator] = useState(true);
  const [isSamePickupDropoff, setIsSamePickupDropoff] = useState(true);
  const [successResult, setSuccessResult] = useState<{
    bookingId: string;
    requestTimestamp: string;
    vanCount: number;
  } | null>(null);

  // ข้อมูลผู้ใช้จริงจากระบบ
  const [userProfile, setUserProfile] = useState({
    name: "กำลังโหลดข้อมูล...",
    position: "อาจารย์ / บุคลากร",
    faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    email: "",
    phone: ""
  });

  // วันและเวลาเริ่มต้น
  const d = new Date();
  const initDate = prefilledDate || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // 1. ฟอร์มข้อมูลตาม 16 ข้อกำหนด
  const [form, setForm] = useState({
    // ข้อ 1: ผู้ขอและผู้ประสานงาน
    requesterPhone: "",
    coordinatorName: "",
    coordinatorPhone: "",
    passengerNames: "",

    // ข้อ 2: วันและเวลาเดินทาง (Fixed Time Window)
    startDate: initDate,
    startTime: "08:30",
    endDate: initDate,
    endTime: "16:30",

    // ข้อ 3 & 4: จำนวนผู้โดยสารและจำนวนรถ
    passengerCount: 1,
    requestedVehicleCount: 1,

    // ข้อ 5: ขอบเขตการเดินทาง
    tripScope: "ในจังหวัดพะเยา" as "ในจังหวัดพะเยา" | "ต่างจังหวัด",

    // ข้อ 6: วัตถุประสงค์
    purpose: "",
    budgetSource: "งบประมาณคณะ",

    // ข้อ 7 & 8: ปลายทางและจังหวัด
    destinations: [
      { id: "dest-1", place: "", province: "พะเยา" }
    ] as DestinationItem[],

    // ข้อ 9: จุดรับและจุดส่ง
    pickupLocation: "มหาวิทยาลัยพะเยา",
    dropoffLocation: "",

    // ข้อ 10: คณะที่ต้องการใช้รถ (Preference)
    preferredFaculty: "all", // "all", "own", หรือชื่อคณะ

    // รถที่เลือกไว้โดยตรง (ถ้ามี)
    selectedVanIds: (prefilledVanId ? [prefilledVanId] : []) as string[]
  });

  // State สำหรับผลลัพธ์การจัดอันดับและรถที่ว่าง (Optimization / Ranking)
  const [rankingData, setRankingData] = useState<OptimizationRecommendationResult | null>(null);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data && (data.name || data.fullName)) {
          const uFac = data.faculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร";
          setUserProfile({
            name: data.name || data.fullName || "ผู้ขอใช้บริการ",
            position: data.role === 'FACULTY_ADMIN' ? "ผู้ดูแลระบบคณะ" : data.role === 'EXECUTIVE' ? "ผู้บริหาร" : "อาจารย์ / บุคลากร",
            faculty: uFac,
            email: data.email || "",
            phone: data.phone || ""
          });
          if (data.phone) {
            setForm(prev => (prev.requesterPhone ? prev : { ...prev, requesterPhone: data.phone }));
          }
        }
      })
      .catch(err => console.error("Error fetching user profile:", err));
  }, []);

  // เมื่อเปลี่ยนวัน-เวลา, จำนวนรถ, หรือ Preference ให้รันการจัดอันดับรถ (Optimization) อัตโนมัติ
  useEffect(() => {
    if (!form.startDate || !form.startTime || !form.endDate || !form.endTime) return;

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
        preferredFaculty: form.preferredFaculty === 'own' ? userProfile.faculty : (form.preferredFaculty !== 'all' ? form.preferredFaculty : undefined),
        userFaculty: userProfile.faculty
      })
    })
      .then(res => res.json())
      .then((data: OptimizationRecommendationResult) => {
        setRankingData(data);
        // อัปเดต selectedVanIds อัตโนมัติเป็นรถที่ผ่านการจัดอันดับลำดับแรกๆ ตามจำนวนที่ขอ
        if (data.rankedAvailableVans && data.rankedAvailableVans.length > 0) {
          const topIds = data.rankedAvailableVans.slice(0, form.requestedVehicleCount).map(v => v.id);
          setForm(prev => ({ ...prev, selectedVanIds: topIds }));
        }
      })
      .catch(err => console.error("Error fetching van ranking:", err))
      .finally(() => setIsLoadingRanking(false));
  }, [form.startDate, form.startTime, form.endDate, form.endTime, form.requestedVehicleCount, form.passengerCount, form.preferredFaculty, userProfile.faculty]);

  // จัดการเพิ่ม/ลบจุดหมายปลายทาง (ข้อ 7 & 8)
  const addDestination = () => {
    setForm(prev => ({
      ...prev,
      destinations: [
        ...prev.destinations,
        { id: `dest-${Date.now()}`, place: "", province: form.tripScope === 'ในจังหวัดพะเยา' ? 'พะเยา' : 'เชียงใหม่' }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  // ตรวจสอบความถูกต้องและส่งฟอร์มจอง
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. ตรวจสอบปลายทาง
    const emptyDest = form.destinations.some(d => !d.place.trim());
    if (emptyDest) {
      alert("กรุณาระบุสถานที่ปลายทางให้ครบทุกจุด");
      return;
    }

    // 2. ตรวจสอบจุดรับ-ส่ง
    if (!form.pickupLocation.trim()) {
      alert("กรุณาระบุจุดรับผู้โดยสาร");
      return;
    }

    // 3. ตรวจสอบวันและเวลา
    if (!form.startDate || !form.startTime || !form.endDate || !form.endTime) {
      alert("กรุณาระบุวันและเวลาเดินทางให้ครบถ้วน");
      return;
    }
    const startObj = new Date(`${form.startDate}T${form.startTime}:00`);
    const endObj = new Date(`${form.endDate}T${form.endTime}:00`);
    if (endObj.getTime() <= startObj.getTime()) {
      alert("เวลาสิ้นสุดการเดินทางต้องอยู่หลังเวลาเริ่มต้น");
      return;
    }

    // 4. ตรวจสอบวัตถุประสงค์
    if (!form.purpose.trim()) {
      alert("กรุณาระบุวัตถุประสงค์การเดินทาง");
      return;
    }

    // 5. ตรวจสอบผู้โดยสาร
    if (Number(form.passengerCount) < 1) {
      alert("กรุณาระบุจำนวนผู้โดยสารอย่างน้อย 1 คน");
      return;
    }
    // 5. ตรวจสอบรายชื่อผู้โดยสาร (ถ้าไม่ได้พิมพ์ ให้ตรวจสอบว่ามีการแนบไฟล์หรือไม่)
    if (!form.passengerNames.trim() && attachments.length === 0) {
      alert("กรุณาระบุรายชื่อผู้โดยสาร หรือแนบไฟล์เอกสารโครงการ/หนังสือขออนุมัติ");
      return;
    }

    // 6. ตรวจสอบเบอร์โทรศัพท์
    const cleanRequesterPhone = form.requesterPhone.replace(/\D/g, '');
    if (cleanRequesterPhone.length !== 10 || !cleanRequesterPhone.startsWith('0')) {
      alert("กรุณากรอกเบอร์โทรศัพท์ผู้ขอจองให้ครบ 10 หลัก (ขึ้นต้นด้วย 0)");
      return;
    }

    const finalCoordName = isSamePersonCoordinator ? userProfile.name : form.coordinatorName.trim();
    const finalCoordPhone = isSamePersonCoordinator ? cleanRequesterPhone : (form.coordinatorPhone || '').replace(/\D/g, '');

    if (!isSamePersonCoordinator && finalCoordPhone) {
      if (finalCoordPhone.length !== 10 || !finalCoordPhone.startsWith('0')) {
        alert("เบอร์โทรศัพท์ผู้ประสานงานต้องครบ 10 หลัก (ขึ้นต้นด้วย 0)");
        return;
      }
    }

    const finalDropoff = isSamePickupDropoff ? form.pickupLocation : (form.dropoffLocation || form.pickupLocation);

    setIsSubmitting(true);
    try {
      // อัปโหลดไฟล์เอกสารแนบ (ถ้ามี)
      const uploadedAttachments: Array<{ id: string; name: string; url: string; size: number; type: string }> = [];
      for (const file of attachments) {
        let uploaded = false;
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('type', 'documents');
          const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
          if (upRes.ok) {
            const upData = await upRes.json();
            if (upData.success && upData.url) {
              uploadedAttachments.push({
                id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: upData.fileName || file.name,
                url: upData.url,
                size: upData.fileSize || file.size,
                type: upData.fileType || file.type
              });
              uploaded = true;
            }
          }
        } catch (e) {
          console.warn("Upload error, using fallback:", e);
        }

        if (!uploaded) {
          try {
            const b64 = await new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result as string);
              r.onerror = reject;
              r.readAsDataURL(file);
            });
            uploadedAttachments.push({
              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: file.name,
              url: b64,
              size: file.size,
              type: file.type
            });
          } catch (err) {
            console.error("FileReader fallback error:", err);
          }
        }
      }

      const requestTimestamp = new Date().toISOString();
      const primaryDest = form.destinations.map(d => `${d.place} (${d.province})`).join(' -> ');

      // บันทึกคำขอผ่าน API
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester: userProfile.name,
          requesterFaculty: userProfile.faculty,
          phone: cleanRequesterPhone,
          coordinatorName: finalCoordName,
          coordinatorPhone: finalCoordPhone,
          passengerCount: Number(form.passengerCount),
          passengerNames: form.passengerNames,
          requestedVehicleCount: Number(form.requestedVehicleCount),
          tripScope: form.tripScope,
          tripType: form.tripScope,
          purpose: form.purpose,
          purposeRaw: form.purpose,
          destinations: form.destinations,
          destination: primaryDest,
          pickupLocation: form.pickupLocation,
          dropoffLocation: finalDropoff,
          startDate: form.startDate,
          startTime: form.startTime,
          endDate: form.endDate,
          endTime: form.endTime,
          startAt: `${form.startDate}T${form.startTime}:00`,
          endAt: `${form.endDate}T${form.endTime}:00`,
          budgetSource: form.budgetSource,
          preferredFaculty: form.preferredFaculty,
          selectedVanIds: form.selectedVanIds,
          attachments: uploadedAttachments,
          requestTimestamp: requestTimestamp
        })
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        const assignedId = resData.booking?.id || `UPV-2569-${Math.floor(1000 + Math.random() * 9000)}`;
        setSuccessResult({
          bookingId: assignedId,
          requestTimestamp: requestTimestamp,
          vanCount: Number(form.requestedVehicleCount)
        });
      } else {
        alert(resData.error || "เกิดข้อผิดพลาดในการส่งคำขอ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // หน้าจอแสดงผลสำเร็จเมื่อส่งคำขอจอง
  if (successResult) {
    const formattedDate = new Date(successResult.requestTimestamp).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] animate-in fade-in zoom-in-95 duration-500 max-w-xl mx-auto px-4 py-8">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 relative shadow-sm">
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
          <Check size={40} strokeWidth={3} />
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">ยื่นคำขอจองรถตู้สำเร็จ!</h2>
        <p className="text-xs text-slate-500 mb-6 text-center">
          ระบบได้บันทึกคำขอของท่านตามลำดับ First-Come, First-Served (FCFS) เรียบร้อยแล้ว
        </p>

        {/* ข้อมูลสรุปคำขอ */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 space-y-3">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500">รหัสคำขอ (Booking ID)</span>
            <span className="text-sm font-black text-[#311171] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
              {successResult.bookingId}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500">วันเวลาที่ยื่นคำขอ (Timestamp)</span>
            <span className="text-xs font-bold text-slate-800">{formattedDate} น.</span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500">จำนวนรถที่ร้องขอ</span>
            <span className="text-xs font-black text-slate-800">{successResult.vanCount} คัน</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">สถานะเริ่มต้น</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              รอดำเนินการพิจารณา (Pending)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link 
            href="/bookings/tracking"
            className="flex-1 py-3 px-4 bg-[#311171] hover:bg-[#250b57] text-white font-bold rounded-xl text-xs text-center transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>ติดตามสถานะคำขอ</span>
            <ChevronRight size={14} />
          </Link>
          <Link 
            href="/user/calendar"
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs text-center transition-all"
          >
            กลับสู่หน้าปฏิทิน
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-10 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Header & Navigation */}
      <div className="flex items-center justify-between mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors border border-gray-200 shadow-2xs cursor-pointer"
        >
          <ChevronLeft size={16} />
          ย้อนกลับ
        </button>
        <Link
          href="/user/calendar"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#311171] hover:underline"
        >
          <Calendar size={14} />
          ดูตารางปฏิทินการใช้รถ
        </Link>
      </div>

      {/* Main Title & Standards Badge */}
      <div className="bg-gradient-to-r from-[#311171] via-[#431899] to-[#5521b5] rounded-3xl p-6 text-white shadow-md mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-purple-100 mb-2 border border-white/20">
            <ShieldCheck size={13} />
            ระบบจองรถตู้มหาวิทยาลัยพะเยา (16 ข้อกำหนดมาตรฐานกลาง)
          </div>
          <h1 className="text-2xl font-black tracking-tight">แบบฟอร์มขอใช้บริการรถตู้</h1>
          <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed">
            ระบบตรวจสอบความว่างตามช่วงเวลาที่ระบุ (Fixed Time Window) และจัดอันดับแนะนำรถพร้อมคนขับประจำ (Vehicle-Driver Pair) ตามเกณฑ์ภาระงานสะสม
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
          <Award size={180} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ========================================================================= */}
        {/* SECTION 1: ข้อมูลผู้ขอจอง, ผู้ประสานงาน และรายชื่อผู้โดยสาร (ข้อ 1) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="text-[#311171]" size={18} />
            <h2 className="text-sm font-black text-slate-800">1. ข้อมูลผู้ขอใช้บริการและผู้ประสานงาน</h2>
            <span className="text-[10px] text-slate-400 font-bold ml-auto">* จัดลำดับพิจารณาแบบ FCFS</span>
          </div>

          {/* ข้อมูลผู้ขอจอง (Auto-populated from system) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">ผู้ขอใช้บริการ</span>
              <span className="font-bold text-slate-800">{userProfile.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">สังกัดหน่วยงาน / คณะ</span>
              <span className="font-bold text-[#311171]">{userProfile.faculty}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">สถานะผู้ใช้งาน</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                {userProfile.position}
              </span>
            </div>
          </div>

          {/* เบอร์โทรผู้ขอจอง */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              เบอร์โทรศัพท์ผู้ขอใช้บริการ (10 หลัก) <span className="text-rose-500">*</span>
            </label>
            <input 
              type="tel"
              required
              maxLength={10}
              placeholder="เช่น 0812345678"
              value={form.requesterPhone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setForm(prev => ({
                  ...prev,
                  requesterPhone: val,
                  coordinatorPhone: isSamePersonCoordinator ? val : prev.coordinatorPhone
                }));
              }}
              className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-slate-50/50"
            />
          </div>

          {/* Checkbox: ผู้ประสานงานเป็นคนเดียวกับผู้ขอใช้บริการ */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 select-none">
              <input
                type="checkbox"
                checked={isSamePersonCoordinator}
                onChange={e => {
                  const checked = e.target.checked;
                  setIsSamePersonCoordinator(checked);
                  if (checked) {
                    setForm(prev => ({
                      ...prev,
                      coordinatorName: userProfile.name,
                      coordinatorPhone: prev.requesterPhone
                    }));
                  }
                }}
                className="w-4 h-4 rounded text-[#311171] focus:ring-[#311171] accent-[#311171] cursor-pointer"
              />
              <span>ผู้ประสานงานเป็นคนเดียวกับผู้ขอใช้บริการ</span>
              <span className="text-[11px] font-normal text-slate-500">(ใช้ข้อมูลเดียวกับผู้ขอจอง)</span>
            </label>

            {!isSamePersonCoordinator ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/70 animate-in fade-in slide-in-from-top-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-สกุล ผู้ประสานงานการเดินทาง <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น นายประสาน งานดี"
                    value={form.coordinatorName}
                    onChange={e => setForm({ ...form, coordinatorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ผู้ประสานงาน (10 หลัก) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="tel"
                    maxLength={10}
                    placeholder="เช่น 0898765432"
                    value={form.coordinatorPhone}
                    onChange={e => setForm({ ...form, coordinatorPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <Check size={13} className="text-emerald-600 shrink-0" />
                <span>ระบบบันทึกข้อมูลผู้ประสานงานให้ตรงกับผู้ขอใช้บริการเรียบร้อย ไม่ต้องกรอกซ้ำ</span>
              </div>
            )}
          </div>

          {/* รายชื่อผู้โดยสารทั้งหมด */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                รายชื่อผู้โดยสารทั้งหมด <span className="text-slate-400 font-normal">(ไม่บังคับ - สามารถแนบเอกสารโครงการในข้อ 6 แทนได้)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">ไม่รวมคนขับ</span>
            </div>
            <textarea 
              rows={2}
              placeholder="ระบุชื่อ-นามสกุล หรือแนบเป็นไฟล์เอกสารโครงการ/หนังสือขออนุมัติเดินทางด้านล่างในข้อ 6"
              value={form.passengerNames}
              onChange={e => setForm({ ...form, passengerNames: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-slate-50/50 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: วันและเวลาเดินทาง (Fixed Time Window) & ขอบเขต (ข้อ 2 & 5) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="text-[#311171]" size={18} />
            <h2 className="text-sm font-black text-slate-800">2. กำหนดการเดินทางและขอบเขตพื้นที่</h2>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold ml-auto">
              Fixed Time Window (ไม่เลื่อนเวลา)
            </span>
          </div>

          {/* ขอบเขตการเดินทาง (ข้อ 5: trip_scope มาตรฐาน) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              ขอบเขตการเดินทาง (Trip Scope) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                form.tripScope === 'ในจังหวัดพะเยา' 
                  ? 'border-[#311171] bg-purple-50/60 text-[#311171] ring-2 ring-[#311171]/20 shadow-2xs' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="tripScope" 
                    value="ในจังหวัดพะเยา" 
                    checked={form.tripScope === 'ในจังหวัดพะเยา'}
                    onChange={() => setForm(prev => ({ 
                      ...prev, 
                      tripScope: 'ในจังหวัดพะเยา',
                      destinations: prev.destinations.map(d => ({ ...d, province: 'พะเยา' }))
                    }))}
                    className="accent-[#311171] w-4 h-4"
                  />
                  <span>ภายในจังหวัด (พะเยา)</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500">ภารกิจในพื้นที่</span>
              </label>

              <label className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                form.tripScope === 'ต่างจังหวัด' 
                  ? 'border-[#311171] bg-purple-50/60 text-[#311171] ring-2 ring-[#311171]/20 shadow-2xs' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="tripScope" 
                    value="ต่างจังหวัด" 
                    checked={form.tripScope === 'ต่างจังหวัด'}
                    onChange={() => setForm({ ...form, tripScope: 'ต่างจังหวัด' })}
                    className="accent-[#311171] w-4 h-4"
                  />
                  <span>ภายนอกจังหวัด (ต่างจังหวัด)</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500">เดินทางข้ามจังหวัด</span>
              </label>
            </div>
          </div>

          {/* กำหนดการขาไปและขากลับ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                วันและเวลาเริ่มต้นเดินทาง (ขาไป) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <ThaiDatePicker 
                  value={form.startDate}
                  onChange={val => setForm({ ...form, startDate: val })}
                />
                <ThaiTimePicker 
                  value={form.startTime}
                  onChange={val => setForm({ ...form, startTime: val })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                วันและเวลาสิ้นสุดภารกิจ (ขากลับ) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <ThaiDatePicker 
                  value={form.endDate}
                  onChange={val => setForm({ ...form, endDate: val })}
                />
                <ThaiTimePicker 
                  value={form.endTime}
                  onChange={val => setForm({ ...form, endTime: val })}
                />
              </div>
            </div>
          </div>
          {/* Trip Duration & Multi-Day Cutoff Badge */}
          {(() => {
            const mStatus = checkMultiDayTrip(`${form.startDate}T${form.startTime}:00`, `${form.endDate}T${form.endTime}:00`);
            return (
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                  mStatus.isMultiDay 
                    ? 'bg-amber-50 text-amber-900 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}>
                  {mStatus.isMultiDay ? (
                    <>
                      <Calendar size={12} className="text-amber-700" />
                      <span>ทริปข้ามวัน ({mStatus.daysCount} วันปฏิบัติงาน - รอบละ 14 ชม. พัก 10 ชม. ตามจุดตัด 08:00 น.)</span>
                    </>
                  ) : (
                    <>
                      <Clock size={12} className="text-emerald-700" />
                      <span>ทริปวันเดียว (ไป - กลับ สิ้นสุดก่อน 08:00 น. วันถัดไป)</span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          <p className="text-[10px] text-slate-400 font-medium">
            * รองรับการเดินทางภายในวันเดียว, ข้ามเที่ยงคืน, ค้างคืน และทริปหลายวัน รถและคนขับจะถูกบล็อกคิวตลอดช่วงเวลาดังกล่าว
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: จำนวนผู้โดยสาร & จำนวนรถ (ข้อ 3 & 4) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="text-[#311171]" size={18} />
            <h2 className="text-sm font-black text-slate-800">3. จำนวนผู้โดยสารและจำนวนรถตู้ที่ต้องการ</h2>
            <span className="text-[10px] text-slate-400 font-bold ml-auto">* แยกจำนวนคนและจำนวนรถ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนผู้โดยสารรวมทั้งหมด (คน) <span className="text-rose-500">*</span>
              </label>
              <input 
                type="number" 
                min={0}
                required
                value={form.passengerCount === 0 || form.passengerCount ? form.passengerCount : ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setForm(prev => ({ ...prev, passengerCount: '' as unknown as number }));
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    const cleanNum = Math.max(0, num);
                    const autoVans = cleanNum > 11 ? Math.max(2, Math.ceil(cleanNum / 11)) : form.requestedVehicleCount;
                    setForm(prev => ({
                      ...prev,
                      passengerCount: cleanNum,
                      requestedVehicleCount: cleanNum > 11 ? Math.max(prev.requestedVehicleCount, autoVans) : prev.requestedVehicleCount
                    }));
                  }
                }}
                onBlur={() => {
                  if (!form.passengerCount || Number(form.passengerCount) < 1) {
                    setForm(prev => ({ ...prev, passengerCount: 1 }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-black text-slate-800 focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-slate-50/50"
              />
              {Number(form.passengerCount) > 11 ? (
                <span className="text-[10px] text-purple-700 font-bold block bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mt-1">
                  ผู้โดยสาร {form.passengerCount} คน (ระบบแนะนำ {Math.ceil(Number(form.passengerCount) / 11)} คันตามระเบียบ 11 ที่นั่ง/คัน)
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  จำนวนผู้โดยสารรวมทั้งภารกิจ (ไม่รวมคนขับ)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนรถตู้ที่ต้องการขอใช้ (คัน) <span className="text-rose-500">*</span>
              </label>
              <input 
                type="number" 
                min={0}
                max={5}
                required
                value={form.requestedVehicleCount === 0 || form.requestedVehicleCount ? form.requestedVehicleCount : ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setForm(prev => ({ ...prev, requestedVehicleCount: '' as unknown as number }));
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    setForm(prev => ({ ...prev, requestedVehicleCount: Math.max(0, num) }));
                  }
                }}
                onBlur={() => {
                  if (!form.requestedVehicleCount || Number(form.requestedVehicleCount) < 1) {
                    setForm(prev => ({ ...prev, requestedVehicleCount: 1 }));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-black text-[#311171] focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-purple-50/40"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                สามารถขอรถมากกว่า 1 คันได้ ระบบรองรับ Partial Fulfillment
              </span>
            </div>
          </div>

          {/* Capacity Warning Badge (ข้อ 3: Capacity เป็นคำเตือน ไม่ใช่ Hard Constraint) */}
          {rankingData?.capacityWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">คำเตือนด้านความจุผู้โดยสาร:</span> ผู้โดยสาร {form.passengerCount} คน อาจเกินความจุมาตรฐานของรถที่เลือก ({rankingData.totalCapacityOfAvailable} ที่นั่ง)
                <span className="block text-[10px] text-amber-700/80 mt-0.5">
                  ระบบอนุญาตให้ส่งคำขอได้ตามปกติ โดยผู้ดูแลระบบจะพิจารณาความเหมาะสมขั้นสุดท้าย
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: ปลายทางหลายแห่ง (Multi-destination) & จุดรับ-ส่ง (ข้อ 7, 8, 9) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="text-[#311171]" size={18} />
            <h2 className="text-sm font-black text-slate-800">4. เส้นทาง สถานที่ปลายทาง และจุดรับ-ส่ง</h2>
            <span className="text-[10px] text-slate-400 font-bold ml-auto">* รองรับปลายทางมากกว่า 1 แห่ง</span>
          </div>

          {/* จุดรับ และ จุดส่ง */}
          {/* จุดรับ และ จุดส่ง */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จุดรับผู้โดยสาร (Pickup Location) <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                required
                placeholder="เช่น หน้าอาคาร ICT, ลานจอดรถหน้ามหาวิทยาลัยพะเยา"
                value={form.pickupLocation}
                onChange={e => {
                  const val = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    pickupLocation: val,
                    dropoffLocation: isSamePickupDropoff ? val : prev.dropoffLocation
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-slate-50/50"
              />
            </div>

            {/* Checkbox: ส่งกลับที่จุดรับเดิม */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={isSamePickupDropoff}
                  onChange={e => {
                    const checked = e.target.checked;
                    setIsSamePickupDropoff(checked);
                    if (checked) {
                      setForm(prev => ({ ...prev, dropoffLocation: prev.pickupLocation }));
                    }
                  }}
                  className="w-4 h-4 rounded text-[#311171] focus:ring-[#311171] accent-[#311171] cursor-pointer"
                />
                <span>ส่งกลับที่จุดรับเดิม</span>
                <span className="text-[11px] font-normal text-slate-500 truncate">({form.pickupLocation || 'มหาวิทยาลัยพะเยา'})</span>
              </label>

              {!isSamePickupDropoff ? (
                <div className="mt-3 pt-3 border-t border-slate-200/70 animate-in fade-in slide-in-from-top-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จุดส่งผู้โดยสารขากลับ (Dropoff Location) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="เช่น มหาวิทยาลัยพะเยา, หรือส่งตามจุดรับ"
                    value={form.dropoffLocation}
                    onChange={e => setForm({ ...form, dropoffLocation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-white"
                  />
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-600 shrink-0" />
                  <span>ขากลับจะเดินทางมาส่ง ณ จุดรับเดิม ({form.pickupLocation || 'มหาวิทยาลัยพะเยา'})</span>
                </div>
              )}
            </div>
          </div>

          {/* รายการจุดหมายปลายทาง (Multi-destination with Province dropdown) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                สถานที่ปลายทางที่ต้องเดินทางผ่าน (เรียงลำดับการเดินทาง) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={addDestination}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#311171] hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>เพิ่มจุดหมาย</span>
              </button>
            </div>

            <div className="space-y-2">
              {form.destinations.map((dest, idx) => (
                <div key={dest.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 animate-in fade-in duration-200">
                  <span className="w-5 h-5 rounded-full bg-[#311171] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>

                  {/* ช่องกรอกสถานที่ */}
                  <input 
                    type="text"
                    required
                    placeholder={form.tripScope === 'ในจังหวัดพะเยา' 
                      ? "ระบุสถานที่ปลายทาง เช่น รพ.พะเยา, เทศบาลเมืองพะเยา, กว๊านพะเยา, รพ.สต.บ้านต๊ำ" 
                      : "ระบุสถานที่ปลายทาง เช่น ศูนย์ประชุมนานาชาติเชียงใหม่, มหาวิทยาลัยเชียงใหม่"}
                    value={dest.place}
                    onChange={e => updateDestination(dest.id, 'place', e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#311171]"
                  />

                  {/* ตัวเลือกจังหวัด (ล็อกเป็นพะเยาเมื่อเลือกในจังหวัด) */}
                  {form.tripScope === 'ในจังหวัดพะเยา' ? (
                    <div 
                      className="w-36 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-slate-100 flex items-center justify-between select-none cursor-not-allowed"
                      title="ขอบเขตการเดินทางอยู่ในจังหวัดพะเยา (หากต้องการไปต่างจังหวัด กรุณาเลือก 'ภายนอกจังหวัด' ด้านบน)"
                    >
                      <span className="truncate">พะเยา</span>
                      <span className="text-[10px] text-slate-500 font-semibold px-1 rounded bg-slate-200/70 shrink-0">ในเขต</span>
                    </div>
                  ) : (
                    <select
                      value={dest.province}
                      onChange={e => updateDestination(dest.id, 'province', e.target.value)}
                      className="w-36 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-[#311171] cursor-pointer"
                    >
                      {thaiProvinces.map(p => (
                        <option key={p.id} value={p.nameTh}>
                          {p.nameTh}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* ปุ่มลบ (ถ้ามีมากกว่า 1 แห่ง) */}
                  {form.destinations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDestination(dest.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="ลบจุดหมายนี้"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: การเลือกคณะ (Preference) & ผลการจัดอันดับรถ (ข้อ 10, 11, 12, 13, 14) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Compass className="text-[#311171]" size={18} />
            <h2 className="text-sm font-black text-slate-800">5. การจัดสรรรถและคนขับ (Vehicle-Driver Pair Optimization)</h2>
            <span className="text-[10px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold ml-auto">
              จัดอันดับตาม Workload
            </span>
          </div>

          {/* การเลือกคณะที่ต้องการใช้รถ (Preference - ข้อ 10) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ความประสงค์ในการเลือกคณะ (Preference) <span className="text-slate-400 font-normal">(ระบบค้นหารถทุกคณะหากคณะที่เลือกไม่ว่าง)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, preferredFaculty: 'all' })}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  form.preferredFaculty === 'all'
                    ? 'border-[#311171] bg-purple-50/60 text-[#311171] ring-2 ring-[#311171]/20 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <p className="text-[11px] font-black">ค้นหาจากทุกคณะ</p>
                <p className="text-[9px] text-slate-500 font-normal">ระบบคัดเลือกรถที่เหมาะสมที่สุดให้อัตโนมัติ</p>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, preferredFaculty: 'own' })}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                  form.preferredFaculty === 'own'
                    ? 'border-[#311171] bg-purple-50/60 text-[#311171] ring-2 ring-[#311171]/20 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <p className="text-[11px] font-black">รถประจำคณะตนเอง</p>
                <p className="text-[9px] text-slate-500 font-normal">{userProfile.faculty}</p>
              </button>

              <select
                value={form.preferredFaculty !== 'all' && form.preferredFaculty !== 'own' ? form.preferredFaculty : ''}
                onChange={e => {
                  if (e.target.value) setForm({ ...form, preferredFaculty: e.target.value });
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer ${
                  form.preferredFaculty !== 'all' && form.preferredFaculty !== 'own'
                    ? 'border-[#311171] bg-purple-50/60 text-[#311171] ring-2 ring-[#311171]/20'
                    : 'border-slate-200'
                }`}
              >
                <option value="">-- ระบุคณะที่ต้องการเป็นพิเศษ --</option>
                {facultiesList.map(f => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Model v5: Large Group Suggestion (> 11 passengers or multi-vehicle needed) */}
          {rankingData?.largeGroupSuggestion?.isNeeded && (
            <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50/60 to-purple-50 border border-purple-200/90 rounded-2xl shadow-2xs space-y-2.5 animate-in fade-in">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#311171] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Award size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#311171]">
                        ข้อเสนอแนะจัดชุดรถตู้สำหรับคณะใหญ่ (&gt; 11 ท่าน)
                      </span>
                      <span className="text-[10px] bg-purple-200 text-purple-950 font-bold px-2 py-0.5 rounded-full">
                        Model v5 Auto-Dispatch
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {rankingData.largeGroupSuggestion.message}
                    </p>
                  </div>
                </div>

                {rankingData.largeGroupSuggestion.suggestedVanIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const sug = rankingData.largeGroupSuggestion!;
                      setForm(prev => ({
                        ...prev,
                        requestedVehicleCount: Math.max(prev.requestedVehicleCount, sug.suggestedVehicles),
                        selectedVanIds: sug.suggestedVanIds
                      }));
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      rankingData.largeGroupSuggestion.suggestedVanIds.every(id => form.selectedVanIds.includes(id))
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-[#311171] hover:bg-[#250b57] text-white'
                    }`}
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>
                      {rankingData.largeGroupSuggestion.suggestedVanIds.every(id => form.selectedVanIds.includes(id))
                        ? 'เลือกชุด 2 คันนี้แล้ว'
                        : `เลือกชุด ${rankingData.largeGroupSuggestion.suggestedVehicles} คันนี้พร้อมกัน`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* แถบสรุปผลลัพธ์การค้นหา & Partial Fulfillment (ข้อ 4 & 14) */}
          {rankingData && (
            <div className={`p-3 rounded-xl border text-xs font-bold flex flex-wrap items-center justify-between gap-2 ${
              rankingData.isPartialFulfillment
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : rankingData.missingCount === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  rankingData.missingCount === 0 ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                }`} />
                <span>
                  ร้องขอ: <span className="font-black">{rankingData.requestedCount}</span> คัน • 
                  พร้อมให้บริการ: <span className="font-black">{rankingData.availableCount}</span> คัน
                  {rankingData.missingCount > 0 && (
                    <span className="text-rose-700 ml-1">
                      (ขาดอีก {rankingData.missingCount} คัน - Partial Fulfillment)
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[10px] font-normal opacity-80">
                {rankingData.isPartialFulfillment 
                  ? 'ระบบบันทึกคำขอไว้และจัดสรรรถที่หาได้ก่อน' 
                  : 'จัดอันดับตาม Vehicle-Driver Pair และภาระงานสะสม'}
              </span>
            </div>
          )}

          {/* รายการรถที่แนะนำ (Vehicle-Driver Pair Cards - ข้อ 12, 13, 14) */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700">
              ผลการคัดเลือกและจัดอันดับรถตู้พร้อมคนขับประจำ:
            </p>

            {isLoadingRanking ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold animate-pulse">
                กำลังตรวจสอบตารางความว่างและคำนวณภาระงาน...
              </div>
            ) : rankingData?.rankedAvailableVans && rankingData.rankedAvailableVans.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rankingData.rankedAvailableVans.map((van, vIdx) => {
                  const isAutoPicked = vIdx < form.requestedVehicleCount;
                  return (
                    <div 
                      key={van.id}
                      className={`p-3 rounded-xl border bg-white transition-all flex flex-col justify-between gap-2.5 shadow-2xs ${
                        isAutoPicked 
                          ? 'border-emerald-400 ring-2 ring-emerald-500/10 bg-emerald-50/20' 
                          : 'border-slate-200 opacity-90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#311171] text-[10px] font-black">
                              อันดับ #{van.rank}
                            </span>
                            <span className="font-black text-xs text-slate-800">{van.facultyName}</span>
                          </div>
                          <p className="text-[11px] font-bold text-[#311171] mt-1">{van.plate} ({van.capacity} ที่นั่ง)</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          ว่างตรงวัน
                        </span>
                      </div>

                      {/* ข้อมูลคนขับประจำรถ (Vehicle-Driver Pair - ข้อ 12) */}
                      <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                        {(() => {
                          const displayImg = (van.driverImage && van.driverImage.trim() !== '' && !van.driverImage.includes('unsplash.com'))
                            ? van.driverImage.trim()
                            : (van.vanImage && van.vanImage.trim() !== '' && !van.vanImage.includes('unsplash.com'))
                              ? van.vanImage.trim()
                              : null;

                          if (displayImg) {
                            return (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img 
                                src={displayImg} 
                                alt="driver" 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            );
                          }

                          return (
                            <div className="w-8 h-8 rounded-full bg-[#311171]/10 text-[#311171] flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                              {van.driverName ? van.driverName.trim().charAt(0) : <User size={14} />}
                            </div>
                          );
                        })()}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-800 truncate">คนขับ: {van.driverName}</p>
                          <p className="text-[10px] text-slate-500 font-medium">โทร: {van.driverPhone}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] text-slate-500 block">ภาระงานสะสม</span>
                          <span className="text-[10px] font-black text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded">
                            {van.workloadScore} ภารกิจ
                          </span>
                        </div>
                      </div>

                      {/* Driver Safety Badge & Duty Info (Model v5) */}
                      {van.safety && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-1.5 text-[9px]">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            van.safety.safetyStatus === 'SAFE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : van.safety.safetyStatus === 'WARNING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {van.safety.safetyBadgeText}
                          </span>
                          <span className="text-slate-400">
                            พัก {van.safety.restHours >= 99 ? '>24 ชม.' : `${van.safety.restHours} ชม.`} • วันนี้ {van.safety.dailyHours.toFixed(1)}/14 ชม.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 text-center">
                ไม่พบรถตู้ที่ว่างตรงกับช่วงวันและเวลาที่กำหนด กรุณาปรับเปลี่ยนเวลาหรือติดต่อผู้ดูแลระบบส่วนกลาง
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: วัตถุประสงค์ & แหล่งงบประมาณ & แนบเอกสาร (ข้อ 6) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="text-[#311171]" size={18} />
            <h2 className="text-sm font-black text-slate-800">6. วัตถุประสงค์การเดินทางและเอกสารแนบ</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              วัตถุประสงค์การเดินทาง (Purpose) <span className="text-rose-500">*</span>
            </label>
            <textarea 
              rows={2}
              required
              placeholder="ระบุวัตถุประสงค์ เช่น เพื่อนำนิสิตเข้าร่วมการแข่งขันโครงงานนวัตกรรมคอมพิวเตอร์..."
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all bg-slate-50/50 resize-none leading-relaxed"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              * ข้อมูลต้นฉบับจะถูกจัดเก็บในคอลัมน์ purpose_raw เพื่อรักษาข้อความจริงสำหรับการทำ Data Cleaning และวิเคราะห์ย้อนหลัง
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                แหล่งงบประมาณที่ใช้
              </label>
              <select
                value={form.budgetSource}
                onChange={e => setForm({ ...form, budgetSource: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50/50 focus:outline-none focus:border-[#311171] cursor-pointer"
              >
                <option value="งบประมาณคณะ">งบประมาณคณะ</option>
                <option value="งบประมาณโครงการวิจัย">งบประมาณโครงการวิจัย</option>
                <option value="งบประมาณมหาวิทยาลัย">งบประมาณมหาวิทยาลัย</option>
                <option value="งบประมาณหน่วยงานภายนอก">งบประมาณหน่วยงานภายนอก</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                แนบไฟล์คำสั่ง / บันทึกข้อความ / โครงการ
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 px-3 py-2 border border-dashed border-purple-300 rounded-xl bg-purple-50/40 hover:bg-purple-50 text-xs font-bold text-[#311171] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <UploadCloud size={16} />
                  <span>เลือกไฟล์เอกสาร (PDF, JPG, PNG)</span>
                  <input type="file" multiple onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* รายการไฟล์ที่แนบ */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map((file, i) => (
                <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 border border-slate-200">
                  <Paperclip size={12} className="text-slate-400" />
                  <span className="truncate max-w-[180px]">{file.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-rose-600 ml-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ปุ่ม Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#311171] via-[#3d158c] to-[#4c1ba6] hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึกคำขอและคำนวณคิวรถ...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>ยืนยันและยื่นคำขอจองรถตู้</span>
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            คำขอจะได้รับการประทับเวลา (request_timestamp) อัตโนมัติ และใช้เกณฑ์ First-Come, First-Served (FCFS) ในการพิจารณา
          </p>
        </div>

      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171]"></div>
        </div>
      }>
        <BookingFormContent />
      </Suspense>
    </AppShell>
  );
}
