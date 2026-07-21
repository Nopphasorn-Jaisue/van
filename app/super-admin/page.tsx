"use client";
import React from 'react';
import { 
  Settings, CarFront, ShieldAlert, ArrowRightLeft, 
  Wrench, FileWarning, CheckCircle2, Building2, MapPin
} from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function SuperAdminDashboard() {
  // Mock Data: คำขอใช้รถส่วนกลาง หรือ ข้ามหน่วยงาน
  const centralRequests = [
    {
      id: "UP-C-6701",
      faculty: "คณะวิทยาศาสตร์",
      requester: "ดร.สมเกียรติ เรียนดี",
      destination: "กระทรวง อว. (กทม.)",
      date: "20-22 มิ.ย. 69 (ค้างคืน)",
      reason: "รถประจำคณะไม่ว่าง (ติดคิวอื่น)",
      status: "รอจัดสรรรถส่วนกลาง",
    },
    {
      id: "UP-C-6702",
      faculty: "กองกลาง (สำนักงานอธิการบดี)",
      requester: "นายใจเด็ด ยอดเยี่ยม",
      destination: "ศูนย์ราชการเชียงใหม่",
      date: "18 มิ.ย. 69",
      reason: "จองใช้รถส่วนกลาง",
      status: "รอจัดสรรรถส่วนกลาง",
    }
  ];

  // Mock Data: แจ้งเตือนซ่อมบำรุงและต่อภาษี (Compliance & Maintenance)
  const maintenanceAlerts = [
    {
      plate: "นข 1234 พะเยา",
      faculty: "คณะวิศวกรรมศาสตร์",
      type: "TAX",
      issue: "ภาษีและ พ.ร.บ. กำลังจะหมดอายุ",
      dueDate: "ในอีก 15 วัน",
      urgency: "high"
    },
    {
      plate: "นข 9999 พะเยา",
      faculty: "ส่วนกลาง (กองอาคารฯ)",
      type: "MAINTENANCE",
      issue: "ครบกำหนดเช็คระยะ 100,000 กม.",
      dueDate: "เกินกำหนด 250 กม.",
      urgency: "critical"
    },
    {
      plate: "นข 5555 พะเยา",
      faculty: "คณะแพทยศาสตร์",
      type: "INSURANCE",
      issue: "ประกันภัยชั้น 1 ครบกำหนดต่ออายุ",
      dueDate: "ในอีก 30 วัน",
      urgency: "medium"
    }
  ];

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto animate-in fade-in">
        
        {/* ----- Header ----- */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <ShieldAlert size={28} className="text-[#311171]" /> 
              ผู้ดูแลระบบสูงสุด (Super Admin)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ศูนย์บัญชาการยานพาหนะส่วนกลาง จัดการคำขอข้ามหน่วยงาน และตรวจสอบสถานะรถตู้ทั้งมหาวิทยาลัย
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <Building2 size={18} /> จัดการรายชื่อคณะและแอดมิน
          </button>
        </div>

        {/* ----- Global KPI Cards ----- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-2 bg-[#311171]"></div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-gray-500 font-bold">รถตู้ทั้งหมดในระบบ</p>
              <CarFront size={20} className="text-[#311171] opacity-50" />
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-4xl font-black text-gray-900">42</span>
              <span className="text-sm text-gray-500 font-medium pb-1">คัน (จาก 18 คณะ)</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-2 bg-green-500"></div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-gray-500 font-bold">กำลังใช้งานวันนี้</p>
              <MapPin size={20} className="text-green-500 opacity-50" />
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-4xl font-black text-gray-900">15</span>
              <span className="text-sm text-gray-500 font-medium pb-1">คัน (35% Utilization)</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-2 bg-blue-500"></div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-gray-500 font-bold">คำขอใช้รถส่วนกลาง</p>
              <ArrowRightLeft size={20} className="text-blue-500 opacity-50" />
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-4xl font-black text-gray-900">2</span>
              <span className="text-sm text-gray-500 font-medium pb-1">รายการ (รอจัดรถ)</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden bg-red-50/30">
            <div className="absolute right-0 top-0 h-full w-2 bg-red-500"></div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-red-600 font-bold">แจ้งเตือน พ.ร.บ./ซ่อมบำรุง</p>
              <FileWarning size={20} className="text-red-500 opacity-50" />
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-4xl font-black text-red-600">3</span>
              <span className="text-sm text-red-500 font-medium pb-1">คัน (ต้องดำเนินการ)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ==================== ฝั่งซ้าย: คำขอใช้รถส่วนกลาง ==================== */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><ArrowRightLeft size={20}/></div>
              <div>
                <h2 className="text-lg font-black text-gray-900">คำขอใช้รถส่วนกลาง (ข้ามหน่วยงาน)</h2>
                <p className="text-xs text-gray-500 mt-0.5">คณะที่รถไม่ว่าง หรือเบิกใช้รถจากกองอาคารฯ</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {centralRequests.map((req, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold text-gray-400 block mb-1">{req.id}</span>
                      <h3 className="font-bold text-gray-900">{req.faculty}</h3>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap">
                      {req.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                    <p className="text-gray-500"><span className="font-bold">ผู้ขอ:</span> {req.requester}</p>
                    <p className="text-gray-500"><span className="font-bold">วันที่:</span> {req.date}</p>
                    <p className="text-gray-500 col-span-2"><span className="font-bold">ปลายทาง:</span> {req.destination}</p>
                    <p className="text-red-500 col-span-2 text-xs font-bold bg-red-50 p-2 rounded border border-red-100">เหตุผล: {req.reason}</p>
                  </div>

                  <div className="flex gap-2 border-t border-gray-100 pt-3">
                    <button className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg transition-colors">
                      ดูรายละเอียด
                    </button>
                    <button className="flex-1 text-xs font-bold text-white bg-[#311171] hover:bg-[#250d55] py-2 rounded-lg transition-colors">
                      จัดสรรรถส่วนกลาง
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== ฝั่งขวา: แจ้งเตือนซ่อมบำรุงและกฎหมาย ==================== */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 bg-red-50/50 flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg"><Wrench size={20}/></div>
              <div>
                <h2 className="text-lg font-black text-gray-900">แจ้งเตือนต่อ พ.ร.บ. / ซ่อมบำรุง</h2>
                <p className="text-xs text-gray-500 mt-0.5">ระบบดึงข้อมูลจากรอบเช็คระยะและวันหมดอายุภาษีอัตโนมัติ</p>
              </div>
            </div>

            <div className="p-0">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3">รถตู้ / คณะ</th>
                    <th className="px-5 py-3">รายการที่ต้องจัดการ</th>
                    <th className="px-5 py-3 text-right">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {maintenanceAlerts.map((alert, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold text-gray-900 text-sm">{alert.plate}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{alert.faculty}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                          {alert.type === 'TAX' && <FileWarning size={14} className="text-orange-500"/>}
                          {alert.type === 'MAINTENANCE' && <Wrench size={14} className="text-red-500"/>}
                          {alert.type === 'INSURANCE' && <ShieldAlert size={14} className="text-blue-500"/>}
                          {alert.issue}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <span className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${
                          alert.urgency === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                          alert.urgency === 'high' ? 'bg-orange-100 text-orange-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.dueDate}
                        </span>
                        <div className="mt-2">
                          <button className="text-[10px] font-bold text-gray-500 hover:text-gray-900 underline">
                            แจ้งแอดมินคณะ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}