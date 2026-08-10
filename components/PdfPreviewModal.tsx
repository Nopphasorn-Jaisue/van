import React from 'react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    startDate?: string;
    endDate?: string;
    vanType?: string;
    vanId?: string;
    bookingFaculty?: string;
    destination?: string;
    purpose?: string;
    passengers?: number;
    requester?: string;
    department?: string;
    dropoff?: string;
    budgetType?: string;
    [key: string]: unknown;
  };
}

export default function PdfPreviewModal({ isOpen, onClose, formData }: PdfPreviewModalProps) {
  if (!isOpen) return null;

  // ฟังก์ชันแปลงรูปแบบวันที่ให้สวยงาม (จำลอง)
  const formatDate = (dateString?: string) => {
    if (!dateString) return { date: "....", time: "...." };
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const start = formatDate(formData.startDate);
  const end = formatDate(formData.endDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[95vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        
        {/* Header ของ Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-gray-50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-gray-800">ตัวอย่างเอกสารขออนุญาตใช้รถยนต์</h3>
            <p className="text-xs text-gray-500">ตรวจสอบความถูกต้องก่อนกดยืนยัน (สามารถพิมพ์หรือเซฟเป็น PDF ได้ในภายหลัง)</p>
          </div>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600 transition"
          >
            ✕
          </button>
        </div>

        {/* พื้นที่แสดงเอกสาร (Scroll ได้ถ้ายาวไป) */}
        <div className="flex-1 overflow-y-auto bg-gray-200 p-4 md:p-8 flex justify-center">
          
          {/* กระดาษ A4 - ปรับให้ Responsive และมี max-width */}
          <div className="relative w-full max-w-[700px] h-fit shrink-0 bg-white shadow-md mx-auto" style={{ aspectRatio: '1 / 1.414' }}>
            
            {/* รูป Background ฟอร์มกระดาษ */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/form-template.jpg" 
              alt="Form Template" 
              className="absolute inset-0 h-full w-full object-contain object-top" 
            />

{/* --- ชั้นวางข้อความ (Overlay Layer) --- */}
            
            {/* ส่วนที่ 1: ด้วย [ชื่อ] ตำแหน่ง [ตำแหน่ง] */}
            <OverlayText top="19%" left="12%" text="นางสาวนฤมล จันทร์สว่าง" />
            <OverlayText top="19%" left="60%" text="เจ้าหน้าที่บริหารงานทั่วไป" />
            
            {/* มีความประสงค์ขออนุญาตใช้รถยนต์ตู้ไป [สถานที่] */}
            <OverlayText top="21.5%" left="40%" text={formData.dropoff || "............................................"} />
            
            {/* เพื่อ [วัตถุประสงค์] */}
            <OverlayText top="24%" left="10%" text={formData.purpose || "............................................"} />
            
            {/* จำนวน [X] คัน คนนั่ง [X] คน */}
            <OverlayText top="26.8%" left="15%" text="3" /> {/* จำนวนรถ */}
            <OverlayText top="26.8%" left="36%" text={`${formData.passengers || "..."}`} />
            
            {/* ตั้งแต่วันที่ และ ถึงวันที่ */}
            <OverlayText top="29.3%" left="22%" text={start.date} />
            <OverlayText top="29.3%" left="52%" text={`${start.time}`} />
            <OverlayText top="31.8%" left="22%" text={end.date} />
            <OverlayText top="31.8%" left="52%" text={`${end.time}`} />

            {/* ภาระค่าใช้จ่าย (Checkmarks) */}
            {/* หมายเหตุ: อาจจะต้องขยับ top/left อีกนิดหน่อยให้ตรงกล่องสี่เหลี่ยมเป๊ะๆ */}
            {formData.budgetType === "งบประมาณคณะ" && <CheckMark top="36.5%" left="22%" />}
            {formData.budgetType === "งบประมาณโครงการ" && <CheckMark top="36.5%" left="44%" />}
            {formData.budgetType === "งบประมาณงานวิจัย" && <CheckMark top="39.5%" left="6.5%" />}
            
          </div>
        </div>

        {/* Footer ของ Modal */}
        <div className="flex justify-end gap-3 border-t border-gray-100 p-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            ปิด
          </button>
          <button onClick={onClose} className="rounded-lg bg-purple-800 px-5 py-2 text-sm font-bold text-white hover:bg-purple-900 shadow-sm">
            ข้อมูลถูกต้อง (กลับไปส่งคำขอ)
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components สำหรับวางข้อความบนรูป ---
function OverlayText({ top, left, text }: { top: string; left: string; text: string }) {
  return (
    <div 
      className="absolute text-sm font-medium text-blue-800"
      style={{ top, left, transform: 'translateY(-50%)' }} // ขยับแกน Y ขึ้นครึ่งหนึ่งเพื่อให้ข้อความลอยตรงเส้นบรรทัดพอดี
    >
      {text}
    </div>
  );
}

function CheckMark({ top, left }: { top: string; left: string }) {
  return (
    <div className="absolute text-lg font-bold text-blue-800" style={{ top, left, transform: 'translate(-50%, -50%)' }}>
      ✓
    </div>
  );
}