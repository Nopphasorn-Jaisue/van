"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import ThaiDatePicker from "@/components/ThaiDatePicker";
import { Wrench, CheckCircle2, AlertCircle, Send, CarFront, Info, Plus, XCircle } from "lucide-react";
import { submitRepairNotification } from "@/app/actions/driver";


export default function DriverInspectionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [vanId, setVanId] = useState<number | null>(null);

  // Maintenance Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    vanId: '',
    date: '', // Initialize empty to avoid SSR hydration mismatch

    detail: '',
    amount: '',
    garage: ''
  });

  // สถานะของ Checklists
  const [checks, setChecks] = useState({
    tires: true,
    lights: true,
    oil: true,
    brakes: true,
    battery: true,
    cleanliness: true,
  });

  const [repairDetail, setRepairDetail] = useState("");
  const [needsRepair, setNeedsRepair] = useState(false);

  // เช็คว่ามีรายการไหนไม่ผ่านไหม
  useEffect(() => {
    const hasIssue = !Object.values(checks).every(Boolean);
    if (hasIssue && !needsRepair) {
      setNeedsRepair(true);
    } else if (!hasIssue && repairDetail.trim() === "") {
      setNeedsRepair(false);
    }
  }, [checks, repairDetail, needsRepair]);

  useEffect(() => {
    // Set initial date after mount to avoid hydration mismatch
    setMaintenanceForm(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0]
    }));

    // Fetch current driver
    fetch('/api/driver/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.driverData) {
          setDriverId(data.driverData.id);
          if (data.driverData.assignedVanId) {
            setVanId(data.driverData.assignedVanId);
            setMaintenanceForm(prev => ({
              ...prev,
              vanId: data.driverData.assignedVanId.toString()
            }));
          }
        }
      })
      .catch(err => console.error("Error fetching driver:", err));
  }, []);

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceForm.vanId || !maintenanceForm.amount || !maintenanceForm.detail) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...maintenanceForm,
          type: 'MAINTENANCE'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("บันทึกประวัติการซ่อมบำรุงเรียบร้อยแล้ว");
        setIsMaintenanceModalOpen(false);
        setMaintenanceForm(prev => ({
          ...prev,
          date: new Date().toISOString().split('T')[0],
          detail: '',
          amount: '',
          garage: ''
        }));
      } else {
        alert("เกิดข้อผิดพลาด: " + data.error);
      }
    } catch (err) {
      console.error("Maintenance save error:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsRepair && !repairDetail.trim()) {
      setError("โปรดระบุรายละเอียดปัญหาเพื่อแจ้งซ่อม");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (needsRepair) {
        if (!driverId || !vanId) {
          throw new Error("ไม่พบข้อมูลคนขับหรือรถตู้ประจำตัว โปรดติดต่อแอดมิน");
        }
        // ถ้ารถมีปัญหา ส่งแจ้งซ่อม
        const res = await submitRepairNotification(driverId, vanId, repairDetail);
        if (!res.success) {
          throw new Error(res.error || "เกิดข้อผิดพลาดในการส่งแจ้งซ่อม");
        }
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reset form
      setChecks({ tires: true, lights: true, oil: true, brakes: true, battery: true, cleanliness: true });
      setRepairDetail("");
      setNeedsRepair(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const CheckItem = ({ id, label, icon: Icon }: { id: keyof typeof checks, label: string, icon: React.ElementType }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-gray-100/80">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${checks[id] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {checks[id] ? <Icon size={20} /> : <XCircle size={20} />}
        </div>
        <span className="font-bold text-gray-700 text-sm">{label}</span>
      </div>
      <div className="flex gap-2">
        <button 
          type="button"
          onClick={() => setChecks(prev => ({ ...prev, [id]: true }))}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${checks[id] ? 'bg-green-600 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
        >
          ปกติ
        </button>
        <button 
          type="button"
          onClick={() => setChecks(prev => ({ ...prev, [id]: false }))}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!checks[id] ? 'bg-red-500 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
        >
          ผิดปกติ
        </button>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Wrench className="text-purple-400" size={28} />
              แจ้งซ่อมและตรวจสภาพรถ
            </h1>
            <p className="text-sm font-bold text-gray-500 mt-1">
              ตรวจสอบความพร้อมของรถก่อนออกเดินทาง หรือแจ้งซ่อมเมื่อพบปัญหา
            </p>
          </div>
          <button 
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="flex items-center gap-2 bg-[#582be8] hover:bg-[#4820c9] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            บันทึกประวัติการเข้าซ่อม
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm font-bold">
            <AlertCircle className="shrink-0" size={18} />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-start gap-3 text-sm font-bold">
            <CheckCircle2 className="shrink-0" size={18} />
            <p>ส่งข้อมูลการตรวจสภาพและแจ้งซ่อมเรียบร้อยแล้ว!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
            
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
              <CarFront className="text-[#311171]" size={20} />
              <h2 className="text-lg font-black text-gray-900">เช็คความพร้อมก่อนเดินทาง</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckItem id="tires" label="สภาพยาง / ลมยาง" icon={CheckCircle2} />
              <CheckItem id="lights" label="ระบบไฟส่องสว่าง / ไฟเลี้ยว" icon={CheckCircle2} />
              <CheckItem id="oil" label="ระดับน้ำมันเครื่อง / หม้อน้ำ" icon={CheckCircle2} />
              <CheckItem id="brakes" label="ระบบเบรก" icon={CheckCircle2} />
              <CheckItem id="battery" label="แบตเตอรี่ / สตาร์ทติดง่าย" icon={CheckCircle2} />
              <CheckItem id="cleanliness" label="ความสะอาดในห้องโดยสาร" icon={CheckCircle2} />
            </div>
            
          </div>

          {(needsRepair || !Object.values(checks).every(Boolean)) && (
            <div className="bg-white rounded-2xl p-6 border border-red-100 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={20} />
                <h2 className="text-lg font-black">พบปัญหาที่ต้องการแจ้งซ่อม</h2>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">รายละเอียดอาการ หรือปัญหาที่พบ</label>
                <textarea 
                  value={repairDetail}
                  onChange={(e) => setRepairDetail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-purple-400 focus:outline-none min-h-[120px]"
                  placeholder="เช่น ไฟหน้าขวาไม่ติด, แอร์ไม่เย็น, ยางหลังซ้ายซึม..."
                  required
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-xl flex items-start gap-3">
                <Info className="text-purple-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs font-bold text-purple-800 leading-relaxed">
                  ระบบจะส่งการแจ้งเตือนนี้ไปยังแอดมินคณะทันที เพื่อพิจารณาส่งซ่อมบำรุง
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-[#582be8] hover:bg-[#4820c9] text-white rounded-xl text-sm font-black flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <Send size={18} />
                  บันทึกการตรวจสภาพ {needsRepair && "และแจ้งซ่อม"}
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* Modal for Record New Repair Item */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#582be8]" /> บันทึกรายการใหม่
              </h2>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <form className="space-y-6" onSubmit={handleMaintenanceSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">วันที่ทำรายการ</label>
                    <ThaiDatePicker 
                      value={maintenanceForm.date}
                      onChange={(val) => setMaintenanceForm({...maintenanceForm, date: val})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">ประเภทรายการ</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="cursor-pointer">
                      <input type="radio" className="peer sr-only" checked readOnly />
                      <div className="rounded-xl border border-purple-600 bg-purple-50 text-purple-700 p-3.5 flex flex-col items-center justify-center gap-2 transition-all shadow-sm">
                        <Wrench className="w-5 h-5" />
                        <span className="text-xs font-bold">ซ่อมบำรุง</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">รายละเอียดรายการ</label>
                  <input 
                    type="text" 
                    required
                    value={maintenanceForm.detail}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, detail: e.target.value})}
                    placeholder="ระบุรายละเอียด เช่น เปลี่ยนถ่ายน้ำมันเครื่อง..." 
                    className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:ring-2 focus:ring-[#582be8] outline-none" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">จำนวนเงิน (บาท)</label>
                    <input 
                      type="number" 
                      required
                      value={maintenanceForm.amount}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, amount: e.target.value})}
                      placeholder="0.00" 
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm font-bold focus:ring-2 focus:ring-[#582be8] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">สถานที่ / อู่ / ตัวแทน</label>
                    <input 
                      type="text" 
                      value={maintenanceForm.garage}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, garage: e.target.value})}
                      placeholder="ชื่ออู่ซ่อมรถ..." 
                      className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:ring-2 focus:ring-[#582be8] outline-none" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition-colors">
                    ยกเลิก
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-[#582be8] hover:bg-[#4820c9] text-white rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
