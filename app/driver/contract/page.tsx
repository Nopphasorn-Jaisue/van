"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { CarFront, Calendar, ShieldCheck, Clock, FileText, AlertCircle } from 'lucide-react';

export default function DriverContract() {
  // Mock Data
  const driverData = {
    name: "นายสมชาย ใจดี",
    vanAssigned: "รถตู้คณะเกษตร 01",
    plate: "นข 1234 พะเยา",
    contractStart: "2022-05-10", // Example date
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateExpiry = (startDate: string, years: number) => {
    const start = new Date(startDate);
    start.setFullYear(start.getFullYear() + years);
    return start;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const expiryDate = calculateExpiry(driverData.contractStart, 5);
  
  const getDaysRemaining = (expiryDate: Date) => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysRemaining(expiryDate);
  const isWarning = daysLeft <= 180;
  const isExpired = daysLeft <= 0;

  if (!mounted) return null; // Avoid Next.js hydration mismatch with Date

  return (
    <AppShell>
      <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20 max-w-2xl mx-auto mt-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">ข้อมูลรถและสัญญา</h1>
          <p className="text-gray-500">รายละเอียดรถตู้ประจำตัว และระยะเวลาสัญญา 5 ปี</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#311171]/10 text-[#311171] rounded-2xl flex items-center justify-center shrink-0">
              <CarFront size={32} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-500 mb-1">รถตู้ประจำตัว</h2>
              <p className="text-xl font-black text-gray-900">{driverData.plate}</p>
              <p className="text-sm font-medium text-[#311171]">{driverData.vanAssigned}</p>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full mb-6"></div>

          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#311171]" /> ข้อมูลสัญญา (วาระ 5 ปี)
          </h3>

          <div className={`p-5 rounded-2xl border ${isExpired ? 'bg-red-50 border-red-100' : isWarning ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">สถานะสัญญาปัจจุบัน</p>
                {isExpired ? (
                  <span className="text-sm font-bold text-red-600 flex items-center gap-1.5"><AlertCircle size={16}/> หมดสัญญาแล้ว</span>
                ) : isWarning ? (
                  <span className="text-sm font-bold text-orange-600 flex items-center gap-1.5"><AlertCircle size={16}/> ใกล้หมดสัญญา</span>
                ) : (
                  <span className="text-sm font-bold text-blue-600 flex items-center gap-1.5"><ShieldCheck size={16}/> สัญญาปกติ</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">เวลาคงเหลือ</p>
                <p className={`font-black text-lg ${isExpired ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-blue-600'}`}>
                  {daysLeft > 0 ? `${daysLeft} วัน` : 'หมดอายุ'}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100/50 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={14} /> วันที่เริ่มสัญญา</span>
                <span className="font-bold text-gray-900">{formatDate(new Date(driverData.contractStart))}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1.5"><Clock size={14} /> วันที่หมดสัญญา</span>
                <span className={`font-bold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>{formatDate(expiryDate)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs text-gray-500 leading-relaxed">
            <span className="font-bold text-gray-700">หมายเหตุ:</span> หากสัญญาใกล้หมดอายุ (เหลือน้อยกว่า 6 เดือน) กรุณาติดต่อแอดมินคณะเพื่อดำเนินการต่อสัญญาและแจ้งเปลี่ยนรถตู้ประจำคณะตามระเบียบ
          </div>

        </div>
      </div>
    </AppShell>
  );
}
