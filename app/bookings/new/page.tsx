"use client";
import React, { useState, useEffect, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { 
  MapPin, Users, FileText, Send, 
  Paperclip, UploadCloud, X,
  CheckCircle, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import ThaiTimePicker from '@/components/ThaiTimePicker';

interface AvailableVan {
  id: string;
  vanName: string;
  plate: string;
  facultyName?: string;
}

// Component that uses useSearchParams must be wrapped in Suspense
function BookingFormContent() {
  const searchParams = useSearchParams();
  const prefilledDate = searchParams?.get('date');
  const prefilledVanId = searchParams?.get('vanId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    vanId: prefilledVanId || "",
    destination: "",
    startDate: prefilledDate || "",
    startTime: "",
    endDate: prefilledDate || "",
    endTime: "",
    purpose: "",
    passengers: "",
    passengerNames: "",
    phone: "",
    budgetSource: "",
    tripType: "ในจังหวัดพะเยา",
  });

  const [availableVans, setAvailableVans] = useState<AvailableVan[]>([]);

  useEffect(() => {
    fetch('/api/vans')
      .then(res => res.json())
      .then(data => {
        if (data.vans) setAvailableVans(data.vans);
      })
      .catch(err => console.error("Error fetching vans:", err));
  }, []);

  const [attachments, setAttachments] = useState<File[]>([]);

  // จำลองข้อมูลผู้จอง
  const userProfile = {
    name: "ดร.สมเกียรติ เรียนดี",
    position: "อาจารย์ประจำหลักสูตร",
    faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    email: "somkiat.re@up.ac.th"
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester: userProfile.name,
          requesterFaculty: userProfile.faculty,
          destination: form.destination,
          purpose: form.purpose,
          passengers: form.passengers,
          passengerNames: form.passengerNames,
          phone: form.phone,
          startAt: `${form.startDate}T${form.startTime}:00`,
          endAt: `${form.endDate}T${form.endTime}:00`,
          tripType: form.tripType,
          budgetSource: form.budgetSource
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        alert("Failed to submit booking");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
          <Check size={48} strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">ยื่นคำขอสำเร็จ!</h2>
        <p className="text-gray-500 mb-8 text-center max-w-sm leading-relaxed">
          ระบบได้ส่งคำขอจองรถตู้ของท่านไปยังส่วนกลางแล้ว กรุณารอการตรวจสอบและอนุมัติจากผู้ดูแลระบบ
        </p>
        <Link 
          href="/bookings/tracking"
          className="px-8 py-4 bg-gradient-to-r from-[#311171] to-[#4a1c99] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          ติดตามสถานะคำขอ <ChevronRight size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-4">
      
      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors border border-gray-200 shadow-sm"
        >
          <ChevronLeft size={16} />
          ย้อนกลับ
        </button>
        <Link
          href="/faculty-admin/calendar"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors border border-gray-200 shadow-sm"
        >
          ดูตารางการใช้รถ
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Header Area */}
      <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#efeaff] text-[#311171] text-xs font-bold mb-2">
          <FileText size={12} /> ฟอร์มคำขอจองรถตู้ส่วนกลาง
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-1">ยื่นคำขอจองรถตู้</h1>
        <p className="text-xs text-gray-500">กรุณากรอกรายละเอียดการเดินทาง เพื่อให้ระบบบันทึกคำขอและนำไปจัดสรรคิวรถ</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 items-start">
        
        {/* Left Column */}
        <div className="space-y-4">
          {/* Section 1: User Info (Auto-filled) */}
        <div className="bg-gradient-to-br from-[#f8f6fc] to-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#311171]/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150"></div>
          
          <div className="flex items-center gap-3 text-[#311171] mb-4 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Users size={16} />
            </div>
            <h2 className="text-lg font-black">ข้อมูลผู้ขอใช้รถ</h2>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle size={10}/> Auto-filled</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
            <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/40">
              <p className="text-[10px] font-bold text-gray-400 mb-0.5">ชื่อ-นามสกุล / ตำแหน่ง</p>
              <p className="text-sm font-bold text-gray-900">{userProfile.name} <span className="text-gray-500 font-normal">({userProfile.position})</span></p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/40">
              <p className="text-[10px] font-bold text-gray-400 mb-0.5">หน่วยงานต้นสังกัด</p>
              <p className="text-sm font-bold text-gray-900">{userProfile.faculty}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Trip Details */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20">
          <div className="flex items-center gap-3 text-[#311171] mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#efeaff] flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <h2 className="text-lg font-black">รายละเอียดการเดินทาง</h2>
          </div>

          <div className="space-y-3">
            {/* Option: Own Faculty Van vs Borrow Cross-Faculty Van */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ประเภทการใช้รถตู้</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, vanId: "", budgetSource: "งบประมาณคณะ" })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    form.vanId === "" || form.vanId === "v-ict"
                      ? "bg-[#311171] text-white border-[#311171] shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>รถตู้ประจำคณะตนเอง</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, vanId: "borrow" })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    form.vanId === "borrow" || (form.vanId && form.vanId !== "v-ict")
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>ยืมรถตู้ต่างคณะ</span>
                </button>
              </div>

              {form.vanId === "borrow" || (form.vanId && form.vanId !== "" && form.vanId !== "v-ict") ? (
                <div className="space-y-3 p-3.5 bg-red-50/80 rounded-xl border border-red-200 animate-in fade-in">
                  <div className="flex items-start gap-2 text-red-600 text-xs font-bold leading-relaxed">
                    <span className="text-sm mt-0.5">⚠️</span>
                    <span>
                      หน่วยงานอื่นไม่อนุญาตให้จองใช้รถตู้เกิน 3 วัน<br/>
                      เดินทาง จองล่วงหน้าได้ไม่เกิน 10 วันจากวัน<br/>
                      ปัจจุบัน และไม่อนุมัติจองรถข้ามเดือน
                    </span>
                  </div>
                  <label className="block text-xs font-bold text-gray-700 mt-2 mb-1">เลือกคณะเจ้าของรถตู้ที่ต้องการยืม:</label>
                  <select 
                    value={form.vanId === "borrow" ? "" : form.vanId}
                    onChange={e => setForm({...form, vanId: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs font-bold text-gray-800"
                  >
                    <option value="">-- เลือกคณะและรถตู้ที่ต้องการยืม --</option>
                    {availableVans.map(van => (
                      <option key={van.id} value={van.id}>
                        {van.vanName} ({van.plate}) - คณะ: {van.facultyName || 'ส่วนกลาง'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">เลือกรถตู้ประจำคณะ <span className="text-gray-400 font-normal">(ระบบเลือกให้สอดคล้องกับคิวว่าง)</span></label>
                  <select 
                    value={form.vanId}
                    onChange={e => setForm({...form, vanId: e.target.value})}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#311171]/10 focus:border-[#311171] outline-none transition-all text-xs font-medium"
                  >
                    <option value="">-- รถตู้ประจำคณะ (จัดสรรอัตโนมัติ) --</option>
                    {availableVans.map(van => (
                      <option key={van.id} value={van.id}>
                        {van.vanName} ({van.plate})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">เขตพื้นที่เดินทาง</label>
                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="tripType" 
                      value="ในจังหวัดพะเยา" 
                      checked={form.tripType === "ในจังหวัดพะเยา"}
                      onChange={(e) => setForm({...form, tripType: e.target.value})}
                      className="w-4 h-4 text-[#311171] focus:ring-[#311171] border-gray-300"
                    />
                    ในจังหวัดพะเยา
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="tripType" 
                      value="ต่างจังหวัด" 
                      checked={form.tripType === "ต่างจังหวัด"}
                      onChange={(e) => setForm({...form, tripType: e.target.value})}
                      className="w-4 h-4 text-[#311171] focus:ring-[#311171] border-gray-300"
                    />
                    ต่างจังหวัด
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">สถานที่ปลายทาง <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={form.destination}
                onChange={e => setForm({...form, destination: e.target.value})}
                placeholder="เช่น ศูนย์ประชุมนานาชาติ" 
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#311171]/10 focus:border-[#311171] outline-none transition-all text-sm font-medium"
              />
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">กำหนดการขาไป <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <ThaiDatePicker 
                    value={form.startDate}
                    onChange={val => setForm({...form, startDate: val})}
                  />
                  <ThaiTimePicker 
                    value={form.startTime}
                    onChange={val => setForm({...form, startTime: val})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">กำหนดการขากลับ <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  <ThaiDatePicker 
                    value={form.endDate}
                    onChange={val => setForm({...form, endDate: val})}
                  />
                  <ThaiTimePicker 
                    value={form.endTime}
                    onChange={val => setForm({...form, endTime: val})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">วัตถุประสงค์การเดินทาง <span className="text-red-500">*</span></label>
              <textarea 
                rows={1} 
                required
                value={form.purpose}
                onChange={e => setForm({...form, purpose: e.target.value})}
                placeholder="เช่น นำนิสิตไปศึกษาดูงานนอกสถานที่..." 
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#311171]/10 focus:border-[#311171] outline-none transition-all text-sm font-medium resize-none"
              />
            </div>
          </div>
        </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Section 3: Passengers & Budget */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20">
          <div className="flex items-center gap-3 text-[#311171] mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#efeaff] flex items-center justify-center">
              <Users size={16} />
            </div>
            <h2 className="text-lg font-black">ผู้โดยสารและงบประมาณ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">จำนวนผู้โดยสารทั้งหมด (คน) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="1"
                required
                value={form.passengers}
                onChange={e => setForm({...form, passengers: e.target.value})}
                placeholder="ระบุจำนวนคน" 
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#311171]/10 focus:border-[#311171] outline-none transition-all text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">แหล่งงบประมาณในการเดินทาง</label>
              <select 
                value={form.budgetSource}
                onChange={e => setForm({...form, budgetSource: e.target.value})}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#311171]/10 focus:border-[#311171] outline-none transition-all text-sm font-medium appearance-none"
              >
                <option value="">เลือกแหล่งงบประมาณ...</option>
                <option value="งบส่วนกลางของคณะ">งบส่วนกลางของคณะ</option>
                <option value="งบประมาณโครงการ">งบประมาณโครงการ</option>
                <option value="งบประมาณอื่นๆ">งบประมาณอื่นๆ</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อ-สกุล ผู้โดยสารทั้งหมด <span className="text-red-500">*</span></label>
            <textarea 
              rows={2}
              required
              value={form.passengerNames}
              onChange={e => setForm({...form, passengerNames: e.target.value})}
              placeholder="เช่น 1. นาย ก (อาจารย์), 2. นางสาว ข (นิสิต)..." 
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#311171]/10 focus:border-[#311171] outline-none transition-all text-sm font-medium resize-none"
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-700 mb-1">เบอร์โทรศัพท์สำหรับติดต่อ <span className="text-red-500">*</span></label>
            <input 
              type="tel"
              required
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="08X-XXX-XXXX" 
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-[#311171]/10 focus:border-[#311171] outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Section 4: Attachments */}
        {/* Section 4: Attachments */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20">
          <div className="flex items-center gap-3 text-[#311171] mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#efeaff] flex items-center justify-center">
              <Paperclip size={16} />
            </div>
            <h2 className="text-lg font-black">เอกสารแนบ (ทางเลือก)</h2>
          </div>
          
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100/50 transition-colors group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#311171]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#311171] mb-2 group-hover:scale-110 transition-transform relative z-10">
              <UploadCloud size={16} />
            </div>
            <p className="text-[11px] font-bold text-gray-900 relative z-10">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
            <p className="text-[10px] text-gray-500 mt-1 relative z-10">รองรับไฟล์ PDF, JPG, PNG ขนาดไม่เกิน 5MB</p>
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
            />
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm"><FileText size={12} className="text-[#311171]" /></div>
                    <span className="text-xs font-bold text-gray-700 truncate">{file.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFile(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#311171] to-[#4a1c99] hover:from-[#250d55] hover:to-[#3b157a] text-white font-black text-base rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
            ) : (
              <><Send size={22} /> ยืนยันการส่งคำขอ</>
            )}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171]"></div></div>}>
        <BookingFormContent />
      </Suspense>
    </AppShell>
  );
}