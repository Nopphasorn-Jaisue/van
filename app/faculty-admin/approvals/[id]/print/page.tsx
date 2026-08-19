"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Date Formatter helper
const formatDate = (dateStr: string) => {
  if (!dateStr) return "...../...../.....";
  const d = new Date(dateStr);
  return `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear() + 543}`;
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return ".......";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
};

import { SystemBooking } from "@/lib/booking-system-types";

import { Suspense } from "react";

function PrintBookingFormContent() {
  const params = useParams();
  const id = params?.id as string;
  const [booking, setBooking] = useState<SystemBooking | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/bookings/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.booking) {
            setBooking(data.booking);
          }
        });
    }
  }, [id]);

  useEffect(() => {
    if (booking) {
      // Auto print when data is loaded
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [booking]);

  if (!booking) {
    return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans print:p-0 p-8">
      {/* A4 Container */}
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white print:w-full print:h-full print:shadow-none shadow-lg outline outline-1 outline-gray-200 p-12">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-[18px] font-bold mb-4">
            ใบขออนุญาตใช้รถยนต์ตู้คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ มหาวิทยาลัยพะเยา
          </h1>
          <div className="flex justify-center gap-12 text-[16px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-5 h-5 border-2 border-black flex items-center justify-center">
                {booking.tripType === "ในจังหวัดพะเยา" && "✓"}
              </div>
              ในจังหวัดพะเยา
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-5 h-5 border-2 border-black flex items-center justify-center">
                {booking.tripType === "ต่างจังหวัด" && "✓"}
              </div>
              ต่างจังหวัด
            </label>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2 border-2 border-black text-[14px] leading-relaxed">
          
          {/* Left Column */}
          <div className="border-r-2 border-black flex flex-col">
            
            {/* ส่วนที่ 1 */}
            <div className="p-4 border-b-2 border-black flex-1">
              <div className="font-bold mb-2">ส่วนที่ 1</div>
              <div className="flex gap-2 mb-2">
                <span>หมายเลขการจองจากระบบ</span>
                <span className="flex-1 border-b border-dotted border-black">{booking.id}</span>
              </div>
              <div className="flex gap-2 mb-2">
                <span>วันที่</span>
                <span className="w-12 border-b border-dotted border-black text-center">{new Date().getDate()}</span>
                <span>เดือน</span>
                <span className="w-24 border-b border-dotted border-black text-center">{new Date().toLocaleDateString('th-TH', { month: 'long' })}</span>
                <span>พ.ศ.</span>
                <span className="w-16 border-b border-dotted border-black text-center">{new Date().getFullYear() + 543}</span>
              </div>
              <div className="mb-2">
                เรียน คณบดีคณะเกษตรศาสตร์และทรัพยากรธรรมชาติ
              </div>
              <div className="flex gap-2 mb-2">
                <span>ด้วย</span>
                <span className="flex-1 border-b border-dotted border-black">{booking.requester}</span>
              </div>
              <div className="flex gap-2 mb-2">
                <span>มีความประสงค์ขออนุญาตใช้รถยนต์ตู้ไป</span>
                <span className="flex-1 border-b border-dotted border-black">{booking.destination}</span>
              </div>
              <div className="flex gap-2 mb-2">
                <span>เพื่อ</span>
                <span className="flex-1 border-b border-dotted border-black">{booking.purpose}</span>
              </div>
              <div className="flex gap-2 mb-2">
                <span>จำนวน</span>
                <span className="w-16 border-b border-dotted border-black text-center">{booking.assignedVanId ? '1' : ''}</span>
                <span>คัน คนนั่ง</span>
                <span className="w-16 border-b border-dotted border-black text-center">{booking.passengers}</span>
                <span>คน</span>
              </div>
              <div className="flex gap-2 mb-2">
                <span>ตั้งแต่วันที่</span>
                <span className="flex-1 border-b border-dotted border-black text-center">{formatDate(booking.startAt)}</span>
                <span>เวลา</span>
                <span className="w-20 border-b border-dotted border-black text-center">{formatTime(booking.startAt)}</span>
                <span>น.</span>
              </div>
              <div className="flex gap-2 mb-4">
                <span>ถึงวันที่</span>
                <span className="flex-1 border-b border-dotted border-black text-center">{formatDate(booking.endAt)}</span>
                <span>เวลา</span>
                <span className="w-20 border-b border-dotted border-black text-center">{formatTime(booking.endAt)}</span>
                <span>น.</span>
              </div>
            </div>

            {/* ค่าใช้จ่าย */}
            <div className="p-4 flex-1">
              <div className="font-bold underline mb-2">ภาระค่าใช้จ่ายที่เกี่ยวเนื่องกับการใช้รถ</div>
              <div className="mb-1">ค่าน้ำมัน</div>
              <div className="ml-4 space-y-1 mb-3">
                <label className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center">
                    {booking.budgetSource === "งบส่วนกลางของคณะ" && "✓"}
                  </div>
                  งบส่วนกลางของคณะ
                </label>
                <label className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center">
                    {booking.budgetSource === "งบประมาณโครงการ" && "✓"}
                  </div>
                  งบประมาณโครงการ
                </label>
                <label className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center">
                    {booking.budgetSource === "งบประมาณอื่นๆ" && "✓"}
                  </div>
                  งบประมาณอื่นๆ .....................................................
                </label>
              </div>

              <div className="mb-1">ค่าเบี้ยเลี้ยง</div>
              <div className="ml-4 grid grid-cols-2 gap-y-1 gap-x-2 mb-8">
                <label className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center"></div>
                  งบส่วนกลางของคณะ
                </label>
                <label className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center"></div>
                  เงินเพิ่มพิเศษพนักงานขับรถ
                </label>
                <label className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center"></div>
                  งบประมาณโครงการ
                </label>
                <label className="flex items-center gap-2 mt-1 col-span-2">
                  <div className="w-4 h-4 border border-black flex items-center justify-center"></div>
                  งบประมาณอื่นๆ .....................................................
                </label>
              </div>

              <div className="mt-8">
                <div className="flex gap-2 justify-end items-end mb-2">
                  <span>ลงชื่อ</span>
                  <span className="w-48 border-b border-dotted border-black"></span>
                </div>
                <div className="flex gap-2 justify-end mb-4">
                  <span>(</span>
                  <span className="w-48 border-b border-dotted border-black text-center">{booking.requester}</span>
                  <span>)</span>
                </div>
                <div className="text-center pr-16">ผู้ขออนุญาต</div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="flex flex-col">
            
            {/* ส่วนที่ 2 */}
            <div className="p-4 border-b-2 border-black flex-1">
              <div className="font-bold mb-2">ส่วนที่ 2</div>
              <div className="mb-2">
                เรียน คณบดีคณะเกษตรศาสตร์และทรัพยากรธรรมชาติ
              </div>
              <div className="ml-4 mb-2">หน่วยยานพาหนะ ได้จัดรถยนต์ตู้</div>
              
              <div className="space-y-3 ml-4 mb-8">
                <label className="flex items-start gap-2">
                  <div className="w-5 h-5 border-2 border-black shrink-0 mt-0.5 flex items-center justify-center">
                    {booking.assignedVanId ? "✓" : ""}
                  </div>
                  <div>
                    จัดรถยนต์ตู้ ทะเบียน {booking.assignedVanPlate || "....................................................."}<br/>
                    พนักงานขับรถ {booking.assignedDriverName || "....................................................."}
                  </div>
                </label>
                
                <label className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black shrink-0 flex items-center justify-center">
                    {booking.status === "REJECTED" ? "✓" : ""}
                  </div>
                  <span>ไม่สามารถจัดรถตู้ได้ เนื่องจาก....................................</span>
                </label>

                <label className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black shrink-0 flex items-center justify-center">
                    {booking.assignedVanId && booking.assignedVanId.includes("borrow") ? "✓" : ""}
                  </div>
                  <span>ขอยืมจาก......................................................................</span>
                </label>
              </div>

              <div className="mt-20">
                <div className="flex gap-2 justify-center items-end mb-2">
                  <span>ลงชื่อผู้ตรวจสอบ</span>
                  <span className="w-48 border-b border-dotted border-black"></span>
                </div>
                <div className="flex gap-2 justify-center">
                  <span>(</span>
                  <span className="w-48 border-b border-dotted border-black text-center">นายสมเกียรติ ยานยนต์</span>
                  <span>)</span>
                </div>
              </div>
            </div>

            {/* ส่วนที่ 4 */}
            <div className="p-4 flex-1">
              <div className="font-bold mb-2">ส่วนที่ 4 เรียน คณบดี เพื่อโปรดพิจารณา</div>
              
              <div className="space-y-3 ml-4 mb-16">
                <label className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black shrink-0 flex items-center justify-center">
                    {booking.status === "APPROVED" ? "✓" : ""}
                  </div>
                  <span>อนุญาต</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black shrink-0 flex items-center justify-center">
                    {booking.status === "REJECTED" ? "✓" : ""}
                  </div>
                  <span>ไม่สามารถจัดรถให้ได้</span>
                </label>
              </div>

              <div className="mt-8">
                <div className="flex justify-center mb-2">
                  <span className="w-64 border-b border-dotted border-black"></span>
                </div>
                <div className="flex justify-center mb-4">
                  <span className="w-64 border-b border-dotted border-black text-center"></span>
                </div>
                <div className="text-center">
                  คณบดีคณะเกษตรศาสตร์และทรัพยากรธรรมชาติ<br/>
                  มหาวิทยาลัยพะเยา
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-6 text-[12px] leading-relaxed">
          <div className="font-bold mb-1">รายละเอียดเพิ่มเติม หมายเหตุ ให้แนบสำเนาบันทึกข้อความขออนุมัติไปปฏิบัติงานด้วย</div>
          <ol className="list-decimal pl-4 space-y-1">
            <li>เมื่อเกิดความเสียหายขึ้น เป็นหน้าที่ของผู้ขออนุญาตใช้รถยนต์ตู้ ที่จะต้องติดตามดำเนินเรื่องและเสนอคณะเกษตรฯ ทราบโดยด่วน</li>
            <li>การเดินทางนอกเส้นทางที่ไปปฏิบัติงานโดยไม่มีเหตุอันควร ถ้าเกิดความเสียหายขึ้น ผู้ขออนุญาตใช้รถยนต์ตู้ต้องรับผิดชอบ</li>
            <li>เมื่อปฏิบัติงานเสร็จแล้วต้องรีบนำรถยนต์ตู้กลับโดยด่วน</li>
            <li>ส่งเอกสารการขอใช้รถยนต์ตู้ที่งานยานพาหนะ คณะเกษตรศาสตร์ ล่วงหน้าอย่างน้อย 3 วันทำการ</li>
            <li>กรณีการขอใช้ในการเดินทางที่ไม่ได้อยู่ในโครงการหรือไม่มีงบประมาณของคณะฯ รองรับ ให้ผู้ขอใช้รถเป็นผู้รับผิดชอบในการจ่ายค่าเบี้ยเลี้ยงแก่พนักงานขับรถ</li>
          </ol>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .min-h-screen {
            min-height: auto;
            background: white !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
          .print\\:h-full {
            height: 100% !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
            outline: none !important;
          }
          .w-\\[210mm\\] * {
            visibility: visible;
          }
          .w-\\[210mm\\] {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintBookingForm() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">กำลังโหลดแบบฟอร์ม...</div>}>
      <PrintBookingFormContent />
    </Suspense>
  );
}
