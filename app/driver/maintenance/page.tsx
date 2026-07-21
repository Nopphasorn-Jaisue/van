"use client";
import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { Wrench, CheckCircle, AlertTriangle, Camera, Send } from 'lucide-react';

export default function DriverMaintenance() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reportType, setReportType] = useState<"checklist" | "issue">("checklist");

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
          <h2 className="text-2xl font-black text-gray-900 mb-2">ส่งข้อมูลสำเร็จ!</h2>
          <p className="text-gray-500 mb-8 text-center">ข้อมูลการตรวจเช็คสภาพรถถูกบันทึกลงระบบแล้ว</p>
          <button 
            onClick={() => setSuccess(false)}
            className="px-6 py-3 bg-[#311171] text-white font-bold rounded-xl shadow-sm hover:bg-[#250d55]"
          >
            กลับสู่หน้าหลัก
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
          <h1 className="text-2xl font-black text-gray-900">แจ้งซ่อม/ตรวจสภาพ</h1>
          <p className="text-gray-500">รายงานสภาพรถประจำวัน หรือแจ้งเหตุขัดข้อง</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setReportType("checklist")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              reportType === "checklist" ? "bg-white text-[#311171] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckCircle size={16} /> ตรวจเช็คประจำวัน
          </button>
          <button 
            onClick={() => setReportType("issue")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              reportType === "issue" ? "bg-red-50 text-red-600 shadow-sm" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <AlertTriangle size={16} /> แจ้งปัญหา/ส่งซ่อม
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Assigned Van Display (Automatic) */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 mb-0.5">รถตู้ประจำตัว (อัปเดตอัตโนมัติ)</p>
              <p className="text-base font-black text-[#311171]">ทะเบียน ขข 9988 พะเยา</p>
              <p className="text-xs text-gray-500 mt-0.5">รถตู้คณะวิทยาศาสตร์</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle size={20} className="text-green-500" />
            </div>
          </div>

          {reportType === "checklist" ? (
            /* Checklist Form */
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 text-[#311171] mb-4">
                <Wrench size={20} />
                <h2 className="font-black text-lg">รายการตรวจเช็คก่อนออกรถ</h2>
              </div>
              
              {[
                "ระดับน้ำมันเครื่องอยู่ในเกณฑ์ปกติ",
                "ลมยางและสภาพยางรถยนต์",
                "ระบบไฟส่องสว่าง ไฟเลี้ยว ไฟเบรก",
                "ระบบเบรกและน้ำมันเบรก",
                "แบตเตอรี่และระบบสตาร์ท",
                "สภาพความสะอาดภายในห้องโดยสาร"
              ].map((item, idx) => (
                <label key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-colors">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-[#311171] rounded focus:ring-[#311171]" />
                  <span className="text-sm text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          ) : (
            /* Issue Report Form */
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4 border-l-4 border-l-red-500">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle size={20} />
                <h2 className="font-black text-lg">รายละเอียดปัญหา</h2>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">หัวข้อปัญหา / อาการเบื้องต้น</label>
                <input 
                  type="text" 
                  placeholder="เช่น แอร์ไม่เย็น, ยางแบน..." 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">รายละเอียดเพิ่มเติม</label>
                <textarea 
                  rows={4}
                  placeholder="อธิบายอาการเพิ่มเติม..." 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors mt-2">
                <Camera size={32} className="text-gray-400 mb-3" />
                <p className="text-sm font-bold text-gray-700">ถ่ายรูปจุดที่มีปัญหา (ถ้ามี)</p>
                <input type="file" className="hidden" />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-4 font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-white ${
              reportType === "checklist" ? "bg-[#311171] hover:bg-[#250d55]" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <><Send size={20} /> ยืนยันการส่งข้อมูล</>
            )}
          </button>
        </form>

      </div>
    </AppShell>
  );
}
