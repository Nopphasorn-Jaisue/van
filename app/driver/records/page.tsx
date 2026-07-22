"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Camera, FileText, UploadCloud, MapPin, CheckCircle, Plus, X } from 'lucide-react';

export default function DriverRecords() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tripType, setTripType] = useState<'scheduled' | 'manual'>('scheduled');
  
  const [startMileage, setStartMileage] = useState("");
  const [endMileage, setEndMileage] = useState("");
  const [stopovers, setStopovers] = useState<{name: string, distance: string}[]>([{ name: "", distance: "" }]);

  const addStopover = () => {
    setStopovers([...stopovers, { name: "", distance: "" }]);
  };

  const updateStopoverName = (index: number, value: string) => {
    const newStopovers = [...stopovers];
    newStopovers[index].name = value;
    setStopovers(newStopovers);
  };
  
  const updateStopoverDistance = (index: number, value: string) => {
    const newStopovers = [...stopovers];
    newStopovers[index].distance = value;
    setStopovers(newStopovers);
  };

  const removeStopover = (index: number) => {
    const newStopovers = stopovers.filter((_, i) => i !== index);
    setStopovers(newStopovers);
  };

  useEffect(() => {
    const savedStart = localStorage.getItem('driver_start_mileage');
    const savedEnd = localStorage.getItem('driver_end_mileage');
    if (savedStart) setStartMileage(savedStart);
    if (savedEnd) setEndMileage(savedEnd);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">บันทึกข้อมูลสำเร็จ!</h2>
          <p className="text-gray-500 mb-8 text-center">ข้อมูลการเดินทางและบิลน้ำมันถูกส่งเข้าสู่ระบบส่วนกลางแล้ว</p>
          <button 
            onClick={() => {
              setSuccess(false);
              localStorage.removeItem('driver_start_mileage');
              localStorage.removeItem('driver_end_mileage');
              setStartMileage("");
              setEndMileage("");
              setStopovers([{ name: "", distance: "" }]);
            }}
            className="px-6 py-3 bg-[#311171] text-white font-bold rounded-xl shadow-sm hover:bg-[#250d55]"
          >
            บันทึกข้อมูลเพิ่มเติม
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">บันทึกการเดินทาง</h1>
          <p className="text-gray-500">กรอกเลขไมล์และแนบบิลค่าใช้จ่าย</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Trip Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
            <button
              type="button"
              onClick={() => setTripType('scheduled')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${tripType === 'scheduled' ? 'bg-white text-[#311171] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ภารกิจตามตาราง
            </button>
            <button
              type="button"
              onClick={() => setTripType('manual')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${tripType === 'manual' ? 'bg-white text-[#311171] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              บันทึกภารกิจเอง
            </button>
          </div>

          {/* Assigned Trip Display (Automatic or Manual Input) */}
          {tripType === 'scheduled' ? (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-0.5">ภารกิจประจำวันที่ 19 กรกฎาคม 2569</p>
                <p className="text-base font-black text-[#311171]">UPVAN-2569-0123</p>
                <p className="text-xs font-bold text-gray-600 mt-0.5">ศูนย์การเรียนรู้ จ.เชียงราย • เวลา 08:00 - 17:00 น.</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle size={20} className="text-green-500" />
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">วันที่เดินทาง</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all font-bold text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">รายละเอียด / สถานที่ปลายทาง</label>
                <input 
                  type="text" 
                  placeholder="เช่น ส่งเอกสารที่อาคารอธิการบดี" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all font-bold text-gray-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">เวลาเริ่มเดินทาง</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all font-bold text-gray-900"
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">เวลาสิ้นสุด</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all font-bold text-gray-900"
                    />
                 </div>
              </div>
            </div>
          )}

          {/* Mileage */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-[#311171] mb-2">
              <MapPin size={20} />
              <h2 className="font-black text-lg">บันทึกเลขไมล์รถ</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">เลขไมล์ก่อนเดินทาง</label>
                  <input 
                    type="number" 
                    placeholder="เช่น 120500" 
                    required
                    value={startMileage}
                    onChange={(e) => setStartMileage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all"
                  />
                </div>
                <label className="border-2 border-dashed border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors block">
                  <Camera size={20} className="text-gray-400 mb-1" />
                  <p className="text-[11px] font-bold text-gray-600">ถ่ายรูป (ก่อนเดินทาง)</p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" />
                </label>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">เลขไมล์หลังกลับมา</label>
                  <input 
                    type="number" 
                    placeholder="เช่น 120650" 
                    required
                    value={endMileage}
                    onChange={(e) => setEndMileage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all"
                  />
                </div>
                <label className="border-2 border-dashed border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors block">
                  <Camera size={20} className="text-gray-400 mb-1" />
                  <p className="text-[11px] font-bold text-gray-600">ถ่ายรูป (หลังกลับมา)</p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" />
                </label>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-500">สถานที่แวะระหว่างทาง (ถ้ามี)</label>
                <button 
                  type="button" 
                  onClick={addStopover}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#311171] bg-purple-50 px-2 py-1 rounded-md hover:bg-purple-100 transition-colors"
                >
                  <Plus size={12} /> เพิ่มสถานที่
                </button>
              </div>
              <div className="space-y-3">
                {stopovers.map((stopover, index) => (
                  <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-gray-500">สถานที่ที่ {index + 1}</span>
                      {stopovers.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeStopover(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute top-2.5 left-0 pl-2.5 flex items-start pointer-events-none text-gray-400">
                          <MapPin size={16} />
                        </div>
                        <input 
                          type="text"
                          value={stopover.name}
                          onChange={(e) => updateStopoverName(index, e.target.value)}
                          placeholder="ชื่อสถานที่"
                          className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all text-sm font-bold text-gray-900"
                        />
                      </div>
                      
                      <div className="w-[100px] relative">
                        <input 
                          type="number"
                          value={stopover.distance}
                          onChange={(e) => updateStopoverDistance(index, e.target.value)}
                          placeholder="ระยะทาง"
                          className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all text-sm font-bold text-gray-900"
                        />
                        <span className="absolute top-2.5 right-2.5 text-xs text-gray-400 font-bold">กม.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {startMileage && endMileage && Number(endMileage) >= Number(startMileage) && (
              <div className="mt-4 p-4 bg-violet-50/80 rounded-2xl border border-violet-100 flex flex-col gap-1 items-center justify-center text-center">
                <span className="text-xs font-bold text-violet-600">สรุประยะทางที่ขับทั้งหมด</span>
                <span className="text-2xl font-black text-[#311171]">{Number(endMileage) - Number(startMileage)} <span className="text-sm font-bold text-violet-700">กิโลเมตร</span></span>
              </div>
            )}
          </div>

          {/* Expenses Upload */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-[#311171] mb-2">
              <FileText size={20} />
              <h2 className="font-black text-lg">อัปโหลดบิลค่าใช้จ่าย</h2>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">ค่าน้ำมัน (บาท)</label>
              <input 
                type="number" 
                placeholder="ระบุจำนวนเงิน..." 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all"
              />
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors">
              <Camera size={32} className="text-gray-400 mb-3" />
              <p className="text-sm font-bold text-gray-700">ถ่ายรูปบิลน้ำมัน / ค่าทางด่วน</p>
              <p className="text-xs text-gray-500 mt-1">หรือเลือกจากคลังภาพ</p>
              <input type="file" className="hidden" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-[#311171] hover:bg-[#250d55] text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {isSubmitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <><UploadCloud size={20} /> ยืนยันการบันทึกข้อมูล</>
            )}
          </button>
        </form>

      </div>
    </AppShell>
  );
}
