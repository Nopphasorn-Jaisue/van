"use client";
import React, { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Camera, FileText, UploadCloud, MapPin, CheckCircle, 
  Plus, Trash2, Car, AlertTriangle, X, ChevronRight, Receipt
} from 'lucide-react';
import { getAssignedBookings, submitDriverLog, createAdhocBooking } from '@/app/actions/driver';
import { uploadImage } from '@/app/actions/upload';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import ThaiTimePicker from '@/components/ThaiTimePicker';

export interface AssignedBooking {
  id: string;
  destination: string;
  departureDate: string | Date;
  returnDate: string | Date;
  objective: string;
  requester?: {
    name: string;
    faculty?: {
      nameTh: string;
    };
  };
  passengersCount?: number;
  driverLog?: unknown;
}

type ChecklistStatus = 'normal' | 'issue' | 'unchecked';

interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  remark: string;
}

const defaultChecklist: ChecklistItem[] = [
  { id: 'oil', label: 'ระดับน้ำมันเครื่อง', status: 'unchecked', remark: '' },
  { id: 'coolant', label: 'ระดับน้ำหล่อเย็น', status: 'unchecked', remark: '' },
  { id: 'tire', label: 'ลมยางและสภาพยาง', status: 'unchecked', remark: '' },
  { id: 'brake', label: 'ระบบเบรก', status: 'unchecked', remark: '' },
  { id: 'light', label: 'ไฟหน้าและไฟสัญญาณ', status: 'unchecked', remark: '' },
  { id: 'wiper', label: 'ที่ปัดน้ำฝน', status: 'unchecked', remark: '' },
  { id: 'clean', label: 'ความสะอาดภายในรถ', status: 'unchecked', remark: '' },
  { id: 'doc', label: 'เอกสารประจำรถ', status: 'unchecked', remark: '' },
  { id: 'emergency', label: 'อุปกรณ์ฉุกเฉิน', status: 'unchecked', remark: '' },
  { id: 'gps', label: 'GPS', status: 'unchecked', remark: '' },
];

export default function DriverRecords() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [assignedBookings, setAssignedBookings] = useState<AssignedBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [driverFaculty, setDriverFaculty] = useState("มหาวิทยาลัยพะเยา");
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isCreatingAdhoc, setIsCreatingAdhoc] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  const showNotification = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const [isAdhocModalOpen, setIsAdhocModalOpen] = useState(false);
  const [adhocForm, setAdhocForm] = useState({
    destination: '',
    date: '',
    startTime: '',
    endTime: '',
    pickup: '',
  });

  const handleCreateAdhoc = () => {
    setAdhocForm({
      destination: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      pickup: '',
    });
    setIsAdhocModalOpen(true);
  };

  const handleSaveAdhoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdhocModalOpen(false);
    setIsCreatingAdhoc(true);
    const res = await createAdhocBooking(1, adhocForm); // Mock driverId
    if (res.success && res.booking) {
      const newBooking = {
        id: res.booking.id,
        destination: res.booking.destination,
        departureDate: res.booking.departureDate,
        returnDate: res.booking.returnDate,
        objective: res.booking.objective,
        requester: { name: "คนขับ (นอกแผน)" }
      };
      setAssignedBookings(prev => [newBooking, ...prev]);
      setSelectedBookingId(newBooking.id);
      showNotification("สร้างรายการใช้รถนอกแผนสำเร็จ! กรุณากรอกข้อมูลการเดินทางด้านล่าง");
    } else {
      alert(res.error || "ไม่สามารถสร้างรายการได้");
    }
    setIsCreatingAdhoc(false);
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [startTrip, setStartTrip] = useState({
    date: "",
    time: "",
    mileage: "",
    location: "",
    checklist: JSON.parse(JSON.stringify(defaultChecklist)) as ChecklistItem[]
  });

  const [stopovers, setStopovers] = useState<{id: number, location: string, timeIn: string, timeOut: string, mileage: string, remark: string}[]>([]);

  const [endTrip, setEndTrip] = useState({
    date: "",
    time: "",
    mileage: "",
    location: "มหาวิทยาลัยพะเยา",
    checklist: JSON.parse(JSON.stringify(defaultChecklist)) as ChecklistItem[],
    fuelCost: "",
    fuelLiters: "",
    issues: "ไม่มีปัญหา",
    isConfirmed: false
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [startImageFile, setStartImageFile] = useState<File | null>(null);
  const [startImagePreview, setStartImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStartImageFile(file);
      setStartImagePreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    async function loadBookings() {
      setIsLoadingBookings(true);
      const res = await getAssignedBookings(1); // Mock driverId
      if (res.success && res.bookings) {
        const available = res.bookings.filter((b: AssignedBooking) => !b.driverLog);
        setAssignedBookings(available);
        if (available.length > 0) {
          setSelectedBookingId(available[0].id);
        }
        if (res.driverFacultyName) {
          setDriverFaculty(res.driverFacultyName);
          setEndTrip(s => ({ ...s, location: res.driverFacultyName }));
        }
        if (res.latestMileage !== null && res.latestMileage !== undefined) {
          const mileageStr = res.latestMileage.toString();
          setStartTrip(s => ({ ...s, mileage: mileageStr }));
        }
      }
      setIsLoadingBookings(false);
    }
    loadBookings();
    
    // Init date
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];
    setStartTrip(s => ({ ...s, date: isoDate, time: "08:00" }));
    setEndTrip(s => ({ ...s, date: isoDate, time: "17:00" }));
  }, []);

  const selectedBooking = assignedBookings.find(b => b.id === selectedBookingId);

  useEffect(() => {
    if (selectedBooking) {
      const deptDate = new Date(selectedBooking.departureDate);
      const retDate = new Date(selectedBooking.returnDate);
      
      const formatTime = (d: Date) => {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };
      
      const isAdhoc = selectedBooking.id.includes("UP-ADHOC") || selectedBooking.requester?.name === "คนขับ (นอกแผน)";
      const pickupLocation = isAdhoc 
        ? driverFaculty 
        : (selectedBooking.requester?.faculty?.nameTh || "มหาวิทยาลัยพะเยา");

      setStartTrip(s => ({
        ...s,
        date: deptDate.toISOString().split('T')[0],
        time: formatTime(deptDate),
        location: pickupLocation
      }));
      
      setEndTrip(s => ({
        ...s,
        date: retDate.toISOString().split('T')[0],
        time: formatTime(retDate)
      }));

      // Pre-fill the destination in step 2
      setStopovers([
        {
          id: Date.now(),
          location: selectedBooking.destination,
          timeIn: "",
          timeOut: "",
          mileage: "",
          remark: ""
        }
      ]);
    }
  }, [selectedBooking]);

  // Calculations
  const startMileageNum = Number(startTrip.mileage) || 0;
  const endMileageNum = Number(endTrip.mileage) || 0;
  const totalDistance = endMileageNum > startMileageNum ? endMileageNum - startMileageNum : 0;

  const handleSaveDraft = () => {
    showNotification("บันทึกข้อมูลร่างเรียบร้อยแล้ว คุณสามารถกลับมาทำต่อได้ภายหลัง", "success");
  };

  const handleNextToStep2 = () => {
    if (!startTrip.date || !startTrip.time || !startTrip.location || !startTrip.mileage) {
      showNotification("กรุณากรอกข้อมูล 'เริ่มเดินทาง' ให้ครบถ้วน", "warning");
      return;
    }
    setCurrentStep(2);
  };

  const handleNextToStep3 = () => {
    for (let i = 0; i < stopovers.length; i++) {
      const stop = stopovers[i];
      if (!stop.location || !stop.timeIn || !stop.timeOut) {
        showNotification(`กรุณากรอกข้อมูลจุดแวะพักที่ ${i + 1} ให้ครบถ้วน`, "warning");
        return;
      }
    }
    setCurrentStep(3);
  };

  // Calculate Time spent
  let timeSpent = "";
  if (startTrip.time && endTrip.time) {
    const [h1, m1] = startTrip.time.split(":").map(Number);
    const [h2, m2] = endTrip.time.split(":").map(Number);
    let diffMins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMins < 0) diffMins += 24 * 60; // assumed next day
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    timeSpent = `${hrs} ชม. ${mins} นาที`;
  }

  // Validations
  const missingFields = [];
  if (!startTrip.mileage) missingFields.push("เลขไมล์เริ่มต้น");
  if (!endTrip.mileage) missingFields.push("เลขไมล์สิ้นสุด");
  if (!endTrip.isConfirmed) missingFields.push("รับรองข้อมูล");

  const canSubmit = missingFields.length === 0;

  const handleSubmit = async () => {
    if (!selectedBookingId) return;
    setShowConfirmModal(false);
    setIsSubmitting(true);
    
    const mockLegs = [
      {
        id: "start",
        deptDate: startTrip.date,
        deptTime: startTrip.time,
        passenger: selectedBooking?.requester?.name || "",
        destination: startTrip.location,
        startMileage: startTrip.mileage,
        returnDate: endTrip.date,
        returnTime: endTrip.time,
        endMileage: endTrip.mileage,
        driverStatus: "มีลายเซ็น",
        remark: endTrip.issues,
      }
    ];

    let imgStartUrl = undefined;
    if (startImageFile) {
      const formData = new FormData();
      formData.append('file', startImageFile);
      const uploadRes = await uploadImage(formData);
      if (uploadRes.success) {
        imgStartUrl = uploadRes.url;
      }
    }

    const data = {
      mileageStart: startTrip.mileage,
      mileageEnd: endTrip.mileage,
      totalDistance: totalDistance,
      fuelRemark: `Fuel: ${endTrip.fuelCost} THB, ${endTrip.fuelLiters} L`,
      imgStartUrl,
      legs: mockLegs
    };

    const res = await submitDriverLog(selectedBookingId, 1, data);
    setIsSubmitting(false);
    
    if (res.success) {
      setSuccess(true);
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };



  if (success) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in p-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-md">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">บันทึกสมุดการใช้รถเรียบร้อย!</h2>
          <p className="text-gray-500 mb-6 text-center text-sm">
            ระยะทางรวม {totalDistance.toLocaleString("th-TH")} กม. ถูกส่งเข้าสู่ระบบแล้ว
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#311171] text-white font-bold text-xs rounded-xl shadow-sm hover:bg-[#250d55]"
          >
            บันทึกวันใหม่
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white px-4 py-3 rounded-full shadow-xl border border-gray-100 flex items-center gap-3">
            <div className={`p-1.5 rounded-full ${toastType === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
              {toastType === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            </div>
            <span className="text-sm font-bold text-gray-700">{toastMessage}</span>
          </div>
        </div>
      )}
      <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 pb-32">
        
        {/* Sticky Fixed Top Header Section */}
        <div className="sticky -top-6 lg:-top-8 z-20 bg-[#f3f4f7]/95 backdrop-blur-md pt-8 lg:pt-10 pb-4 space-y-3 border-b border-gray-200/80 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 shadow-xs">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#311171]" /> สมุดบันทึกการเดินทาง
            </h1>
            <button
              onClick={handleCreateAdhoc}
              disabled={isCreatingAdhoc}
              className={`px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-orange-200 transition-colors ${isCreatingAdhoc ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus size={14} /> ใช้รถนอกแผน
            </button>
          </div>

          {isLoadingBookings ? (
            <div className="bg-white/90 p-4 rounded-xl border border-purple-200 text-center text-sm font-bold text-gray-500 animate-pulse">กำลังโหลดทริป...</div>
          ) : assignedBookings.length === 0 ? (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-center text-sm font-bold text-orange-700">ไม่มีทริปที่ต้องบันทึกในขณะนี้</div>
          ) : (
            <select 
              value={selectedBookingId} 
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 shadow-sm rounded-xl font-bold text-[#311171] text-sm outline-none focus:ring-2 focus:ring-[#311171]/20 appearance-none"
            >
              {assignedBookings.map((b: AssignedBooking) => (
                <option key={b.id} value={b.id}>
                  {b.id} - {b.destination}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Booking Details Card */}
        {selectedBooking && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mx-1">
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-gray-700">{selectedBooking.id}</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">อนุมัติแล้ว</span>
            </div>
            <div className="p-4 text-xs space-y-2.5">
              <div className="flex gap-2">
                <span className="text-gray-400 font-bold w-14 shrink-0">รถตู้:</span>
                <span className="font-black text-gray-900">นข 1234 พะเยา</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 font-bold w-14 shrink-0">ผู้ขับรถ:</span>
                <div>
                  <span className="font-black text-[#311171]">นายสมชาย ใจดี</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">คนขับประจำคณะ</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 font-bold w-14 shrink-0">เส้นทาง:</span>
                <span className="font-bold text-gray-900">{startTrip.location || 'ระบุจุดเริ่มต้น'} → {selectedBooking.destination}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 font-bold w-14 shrink-0">เวลา:</span>
                <span className="font-bold text-gray-900">
                  {new Date(selectedBooking.departureDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(selectedBooking.returnDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. (ตามแผน)
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 font-bold w-14 shrink-0">ผู้โดยสาร:</span>
                <span className="font-bold text-gray-900">{selectedBooking.passengersCount} คน</span>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation */}
        <div className="flex justify-between items-center my-6 px-4">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div 
                onClick={() => setCurrentStep(step as 1|2|3)}
                className={`flex flex-col items-center gap-1.5 cursor-pointer transition-colors ${currentStep === step ? 'text-[#311171]' : currentStep > step ? 'text-emerald-500' : 'text-gray-300'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${currentStep === step ? 'border-[#311171] bg-purple-50 scale-110' : currentStep > step ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-gray-50'}`}>
                  {currentStep > step ? <CheckCircle size={16} /> : step}
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${currentStep === step ? 'text-gray-900' : ''}`}>
                  {step === 1 ? 'เริ่มเดินทาง' : step === 2 ? 'จุดหมาย/ระหว่างทาง' : 'สิ้นสุด'}
                </span>
              </div>
              {step < 3 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full ${currentStep > step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Start Trip */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 px-1">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-black text-sm text-[#311171] flex items-center gap-2 border-b border-gray-100 pb-2">
                <Car size={16} /> ข้อมูลออกเดินทาง
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">วันที่ออกจริง</label>
                  <ThaiDatePicker 
                    value={startTrip.date} 
                    onChange={val => setStartTrip({...startTrip, date: val})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">เวลาออกจริง</label>
                  <ThaiTimePicker 
                    value={startTrip.time} 
                    onChange={val => setStartTrip({...startTrip, time: val})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">จุดเริ่มต้น</label>
                <input type="text" value={startTrip.location} onChange={e => setStartTrip({...startTrip, location: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">เลขไมล์เริ่มต้น (กม.)</label>
                <div className="flex gap-2">
                  <input type="number" value={startTrip.mileage} onChange={e => setStartTrip({...startTrip, mileage: e.target.value})} placeholder="เช่น 97750" className="flex-1 p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm font-black text-[#311171] outline-none" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-4 font-bold rounded-xl text-xs transition-colors shrink-0 border shadow-sm ${
                      startImageFile ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {startImageFile ? <CheckCircle size={16} /> : <Camera size={16} />}
                    {startImageFile ? 'ถ่ายแล้ว' : 'แนบรูป'}
                  </button>
                </div>
                {startImagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={startImagePreview} alt="Preview" className="h-20 w-auto rounded-lg border border-gray-200 object-cover" />
                    <button 
                      onClick={() => { setStartImageFile(null); setStartImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow-sm border border-gray-200 p-0.5 hover:bg-red-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleSaveDraft} className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm">บันทึกร่าง</button>
              <button onClick={handleNextToStep2} className="flex-1 py-3.5 bg-[#311171] text-white font-bold rounded-xl text-sm hover:bg-[#250d55] transition-colors shadow-sm flex items-center justify-center gap-1">ต่อไป <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 2: Stopovers */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 px-1">
            {stopovers.length === 0 ? (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center text-orange-600">
                <MapPin size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">ยังไม่มีจุดหมายปลายทางหรือจุดแวะพัก</p>
                <p className="text-xs mt-1 opacity-80">หากขับตรงไปยังที่หมาย สามารถกดข้ามหน้านี้ได้เลย</p>
              </div>
            ) : (
              stopovers.map((stop, idx) => (
                <div key={stop.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3 relative">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="font-black text-sm text-[#311171]">จุดหมาย/แวะที่ {idx + 1}</span>
                    <button onClick={() => setStopovers(stopovers.filter(s => s.id !== stop.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">สถานที่</label>
                    <input type="text" value={stop.location} onChange={e => {
                      const newStops = [...stopovers];
                      newStops[idx].location = e.target.value;
                      setStopovers(newStops);
                    }} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none" />
                  </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">เวลาถึง</label>
                        <ThaiTimePicker 
                          value={stop.timeIn} 
                          onChange={val => {
                            const newStops = [...stopovers];
                            newStops[idx].timeIn = val;
                            setStopovers(newStops);
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">เวลาออก</label>
                        <ThaiTimePicker 
                          value={stop.timeOut} 
                          onChange={val => {
                            const newStops = [...stopovers];
                            newStops[idx].timeOut = val;
                            setStopovers(newStops);
                          }} 
                        />
                      </div>
                    </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">หมายเหตุ</label>
                    <input type="text" value={stop.remark} onChange={e => {
                      const newStops = [...stopovers];
                      newStops[idx].remark = e.target.value;
                      setStopovers(newStops);
                    }} placeholder="เช่น แวะทานข้าว" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none" />
                  </div>
                </div>
              ))
            )}

            <button 
              onClick={() => setStopovers([...stopovers, { id: Date.now(), location: "", timeIn: "", timeOut: "", mileage: "", remark: "" }])}
              className="w-full py-3 bg-purple-50 border border-purple-200 border-dashed text-[#311171] font-bold rounded-xl text-sm flex justify-center items-center gap-2 hover:bg-purple-100 transition-colors"
            >
              <Plus size={16} /> เพิ่มจุดหมาย/แวะพัก
            </button>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setCurrentStep(1)} className="w-20 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors text-center shadow-sm">กลับ</button>
              <button onClick={handleNextToStep3} className="flex-1 py-3.5 bg-[#311171] text-white font-bold rounded-xl text-sm hover:bg-[#250d55] transition-colors shadow-sm flex items-center justify-center gap-1">ต่อไป <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Step 3: End Trip */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 px-1">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-black text-sm text-emerald-600 flex items-center gap-2 border-b border-gray-100 pb-2">
                <CheckCircle size={16} /> ข้อมูลสิ้นสุดการเดินทาง
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">วันที่กลับจริง</label>
                  <ThaiDatePicker 
                    value={endTrip.date} 
                    onChange={val => setEndTrip({...endTrip, date: val})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">เวลากลับจริง</label>
                  <ThaiTimePicker 
                    value={endTrip.time} 
                    onChange={val => setEndTrip({...endTrip, time: val})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">จุดสิ้นสุดการเดินทาง</label>
                <input type="text" value={endTrip.location} onChange={e => setEndTrip({...endTrip, location: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">เลขไมล์สิ้นสุด (กม.)</label>
                <div className="flex gap-2">
                  <input type="number" value={endTrip.mileage} onChange={e => setEndTrip({...endTrip, mileage: e.target.value})} placeholder="เช่น 97928" className="flex-1 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-black text-emerald-700 outline-none" />
                  <button className="flex items-center gap-1.5 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors shrink-0 border border-gray-200 shadow-sm">
                    <Camera size={16} /> แนบรูป
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
              <h3 className="font-black text-sm text-gray-700 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Receipt size={16} /> บันทึกปัญหา / ค่าใช้จ่ายอื่น
              </h3>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">ปัญหาระหว่างเดินทาง</label>
                <select value={endTrip.issues} onChange={e => setEndTrip({...endTrip, issues: e.target.value})} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none">
                  <option>ไม่มีปัญหา</option>
                  <option>รถขัดข้อง</option>
                  <option>อุบัติเหตุ</option>
                  <option>เส้นทางมีปัญหา</option>
                  <option>ผู้โดยสารมีเหตุฉุกเฉิน</option>
                  <option>อื่นๆ</option>
                </select>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-gradient-to-br from-[#311171] to-[#1e0a45] text-white p-5 rounded-3xl shadow-md">
              <h3 className="text-sm font-black text-purple-200 mb-3 border-b border-white/10 pb-2">สรุปการเดินทาง</h3>
              
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-purple-100 opacity-80">เลขไมล์เริ่มต้น</span>
                <span className="text-sm font-mono font-bold">{startMileageNum > 0 ? startMileageNum.toLocaleString() : "-"} กม.</span>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-purple-100 opacity-80">เลขไมล์สิ้นสุด</span>
                <span className="text-sm font-mono font-bold">{endMileageNum > 0 ? endMileageNum.toLocaleString() : "-"} กม.</span>
              </div>
              
              <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/20">
                <div>
                  <div className="text-xs text-purple-200 font-bold mb-1">ระยะทางรวม</div>
                  {totalDistance > 0 ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-emerald-400">{totalDistance.toLocaleString()}</span>
                      <span className="text-xs text-emerald-200 font-bold">กม.</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-orange-300 font-medium py-1">รอกรอกเลขไมล์สิ้นสุดเพื่อคำนวณระยะทาง</div>
                  )}
                </div>
                {timeSpent && totalDistance > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] text-purple-200 mb-0.5">เวลาที่ใช้</div>
                    <div className="text-xs font-bold">{timeSpent}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Footer */}
        {currentStep === 3 && (
          <div className="px-1 mt-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200">
                <input 
                  type="checkbox" 
                  checked={endTrip.isConfirmed} 
                  onChange={e => setEndTrip({...endTrip, isConfirmed: e.target.checked})}
                  className="w-4 h-4 rounded text-[#311171] focus:ring-[#311171]" 
                />
                <span className="text-xs font-bold text-gray-700">ข้าพเจ้ายืนยันว่าข้อมูลการเดินทางและเลขไมล์ถูกต้อง</span>
              </label>

              {(!canSubmit && showValidationErrors) && (
                <div className="bg-red-50 text-red-600 text-[10px] p-2.5 rounded-lg border border-red-100 flex items-start gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">ยังส่งบันทึกไม่ได้ กรุณากรอกข้อมูลต่อไปนี้: </span>
                    {missingFields.join(", ")}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setCurrentStep(2)} className="px-4 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors shrink-0 shadow-sm">
                  กลับ
                </button>
                <button 
                  onClick={() => {
                    if (!canSubmit) {
                      setShowValidationErrors(true);
                    } else {
                      setShowValidationErrors(false);
                      setShowConfirmModal(true);
                    }
                  }}
                  className="flex-1 py-3.5 bg-[#311171] text-white font-black rounded-xl text-sm hover:bg-[#250d55] transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <UploadCloud size={18} /> ยืนยันและส่งสมุดบันทึก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="bg-[#311171] p-4 text-white flex justify-between items-center">
                <h3 className="font-black flex items-center gap-2 text-sm">
                  <CheckCircle size={18} /> ยืนยันการส่งสมุดบันทึก
                </h3>
                <button onClick={() => setShowConfirmModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2 text-xs font-medium text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between"><span className="text-gray-500">รายการ:</span> <span className="font-bold">{selectedBooking?.id}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">รถ:</span> <span className="font-bold">นข 1234 พะเยา</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">เวลาออกจริง:</span> <span className="font-bold">{startTrip.time} น.</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">เวลากลับจริง:</span> <span className="font-bold">{endTrip.time} น.</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-200"><span className="text-gray-500 font-bold">ระยะทางรวม:</span> <span className="font-black text-emerald-600 text-sm">{totalDistance} กม.</span></div>
                </div>
                
                <p className="text-[11px] text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg">
                  หลังจากส่งแล้วจะไม่สามารถแก้ไขข้อมูลได้โดยตรง
                </p>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors">
                    กลับไปตรวจสอบ
                  </button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-emerald-500 text-white font-black rounded-xl text-xs hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-1">
                    {isSubmitting ? "กำลังส่ง..." : "ยืนยันและส่ง"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Adhoc Form Modal */}
        {isAdhocModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh]">
              <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0 rounded-t-3xl">
                <h2 className="text-xl font-black text-gray-900">เพิ่มการใช้รถนอกแผน</h2>
                <button 
                  onClick={() => setIsAdhocModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveAdhoc} className="p-6 overflow-y-visible space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">สถานที่ไป (ปลายทาง)</label>
                  <input 
                    type="text" 
                    required
                    value={adhocForm.destination}
                    onChange={e => setAdhocForm({...adhocForm, destination: e.target.value})}
                    placeholder="เช่น เซ็นทรัลพะเยา" 
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#311171]/20" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">สถานที่รับ (จุดเริ่มต้น)</label>
                  <input 
                    type="text" 
                    required
                    value={adhocForm.pickup}
                    onChange={e => setAdhocForm({...adhocForm, pickup: e.target.value})}
                    placeholder="เช่น หน้าคณะไอที" 
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#311171]/20" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">วันที่</label>
                  <ThaiDatePicker 
                    value={adhocForm.date}
                    onChange={val => setAdhocForm({...adhocForm, date: val})}
                    disabled={true}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">เวลาเริ่ม</label>
                    <ThaiTimePicker 
                      value={adhocForm.startTime}
                      onChange={val => setAdhocForm({...adhocForm, startTime: val})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">เวลาสิ้นสุด</label>
                    <ThaiTimePicker 
                      value={adhocForm.endTime}
                      onChange={val => setAdhocForm({...adhocForm, endTime: val})}
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAdhocModalOpen(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-[#311171] hover:bg-[#2a0c63] text-white text-sm font-bold rounded-xl transition-colors shadow-md"
                  >
                    บันทึก
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
