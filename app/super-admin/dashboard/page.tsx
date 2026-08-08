"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CarFront, MapPin, AlertCircle, Shield,
  FileText, Wrench, Users, FileSpreadsheet,
  ChevronRight, Send, X, CheckCircle2,
  Keyboard
} from 'lucide-react';

interface MaintenanceAlert {
  plate: string;
  faculty: string;
  type: string;
  issue: string;
  dueDate: string;
  urgency: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();

  // Modals state
  const [notifyModalAlert, setNotifyModalAlert] = useState<MaintenanceAlert | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Dashboard state
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [stats, setStats] = useState({
    totalVans: 0,
    totalFaculties: 0,
    activeMissions: 0,
    utilizationPercent: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/super-admin/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalVans: data.totalVans || 0,
            totalFaculties: data.totalFaculties || 0,
            activeMissions: data.activeMissions || 0,
            utilizationPercent: data.utilizationPercent || 0
          });
          setMaintenanceAlerts(data.maintenanceAlerts || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in h-full flex flex-col pb-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ----- Header Bar ----- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden shrink-0 min-h-[140px]">
        {/* Background Image Wrapper */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/login-background.png')] bg-cover bg-center opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-3 py-1 bg-purple-100 text-[#311171] rounded-full text-xs font-black tracking-wide">
              SUPER ADMIN SYSTEM
            </span>
            <span className="text-[11px] text-gray-500 font-bold">• สำนักงานอธิการบดี มหาวิทยาลัยพะเยา</span>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-black text-gray-900 flex items-center gap-3.5 tracking-tight">
            <div className="p-2.5 bg-[#311171] text-white rounded-[14px] shadow-md">
              <Shield size={26} strokeWidth={2.5} />
            </div>
            ศูนย์บัญชาการระบบยานพาหนะ (ภาพรวม)
          </h1>
          <p className="text-[13px] text-gray-500 mt-2 font-medium">
            กำกับดูแลรถทุกคณะ ติดตามการใช้งาน และสอดส่องสถานะซ่อมบำรุงยานพาหนะทั้งหมดภายในมหาวิทยาลัย
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button 
            onClick={() => router.push('/super-admin/users')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm rounded-2xl transition-all border border-gray-200 shadow-sm"
          >
            <Users size={18} />
            <span>จัดการผู้ใช้</span>
          </button>

          <button 
            onClick={() => router.push('/super-admin/faculties')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-md active:scale-95"
          >
            <FileSpreadsheet size={18} />
            <span>จัดการรายชื่อคณะและแอดมิน</span>
          </button>
        </div>
      </div>

      {/* ----- Top KPI Stat Cards (3 Columns) ----- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        
        {/* Card 1 */}
        <div 
          onClick={() => router.push('/super-admin/vans')}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-t-[5px] border-t-purple-600 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 flex items-center justify-center text-purple-700 rounded-[20px] group-hover:scale-105 transition-transform">
              <CarFront size={28} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-bold mb-0.5">รถทั้งหมดในระบบ</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-black text-gray-900 leading-none">{isLoading ? '-' : stats.totalVans}</span>
                <span className="text-[11px] font-bold text-gray-400">คัน ({isLoading ? '-' : stats.totalFaculties} คณะ)</span>
              </div>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-t-[5px] border-t-emerald-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100/80 flex items-center justify-center text-emerald-600 rounded-[20px]">
              <MapPin size={28} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-bold mb-0.5">กำลังปฏิบัติภารกิจวันนี้</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-black text-gray-900 leading-none">{isLoading ? '-' : stats.activeMissions}</span>
                <span className="text-[11px] font-bold text-gray-400">คัน ({isLoading ? '-' : stats.utilizationPercent}% Utilization)</span>
              </div>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-300" />
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-t-[5px] border-t-rose-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-100/80 flex items-center justify-center text-rose-600 rounded-[20px]">
              <AlertCircle size={28} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-bold mb-0.5">แจ้งเตือน พ.ร.บ. / ซ่อมบำรุง</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[28px] font-black text-gray-900 leading-none">{maintenanceAlerts.length}</span>
                <span className="text-[11px] font-bold text-gray-400">คัน (ต้องดำเนินการ)</span>
              </div>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-300" />
        </div>

      </div>

      {/* ----- Main Full-Width Section: แจ้งเตือนต่อ พ.ร.บ. / ซ่อมบำรุง ----- */}
      <div className="bg-transparent rounded-3xl overflow-hidden flex flex-col flex-1">
        
        {/* Section Header */}
        <div className="p-6 border-b border-transparent bg-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100/80 text-rose-600 rounded-[14px]">
              <Wrench size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">แจ้งเตือนต่อ พ.ร.บ. / ซ่อมบำรุง</h2>
              <p className="text-[13px] text-gray-500 font-medium mt-0.5">ระบบดึงข้อมูลวันต่อภาษีและเช็คระยะของรถทุกคณะโดยอัตโนมัติ</p>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-[12px] font-bold text-gray-500 border-b border-gray-100 sticky top-0 z-10">
                <th className="py-4 px-7 font-bold">รถตู้ / หน่วยงานที่สังกัด</th>
                <th className="py-4 px-7 font-bold">รายการที่ต้องจัดการ</th>
                <th className="py-4 px-7 font-bold">สถานะ (ความเร่งด่วน)</th>
                <th className="py-4 px-7 font-bold text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[13px] font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400 font-bold">กำลังดึงข้อมูล...</td>
                </tr>
              ) : maintenanceAlerts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400 font-bold">ไม่มีการแจ้งเตือนใดๆ ในขณะนี้</td>
                </tr>
              ) : maintenanceAlerts.map((alert, idx) => (
                <tr key={idx} className="hover:bg-gray-50/40 transition-colors group">
                  <td className="py-5 px-7 align-middle">
                    <div className="flex items-center gap-4">
                      <div className="w-[42px] h-[42px] bg-gray-100/80 rounded-[14px] flex items-center justify-center text-gray-500 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                        <CarFront size={20} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-[14px]">{alert.plate}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{alert.faculty}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-7 align-middle">
                    <div className="flex items-center gap-3">
                      {alert.type === 'TAX' && <FileText size={18} strokeWidth={2.5} className="text-amber-500 shrink-0" />}
                      {alert.type === 'MAINTENANCE' && <Wrench size={18} strokeWidth={2.5} className="text-rose-500 shrink-0" />}
                      {alert.type === 'INSURANCE' && <Shield size={18} strokeWidth={2.5} className="text-sky-500 shrink-0" />}
                      <span className="font-bold text-gray-700 text-[13px]">{alert.issue}</span>
                    </div>
                  </td>
                  <td className="py-5 px-7 align-middle">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold ${
                      alert.urgency === 'critical' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                        : alert.urgency === 'high' 
                        ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {alert.urgency === 'critical' && <AlertCircle size={14} strokeWidth={2.5} />}
                      {alert.dueDate}
                    </span>
                  </td>
                  <td className="py-5 px-7 align-middle text-right">
                    <button 
                      onClick={() => setNotifyModalAlert(alert)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-purple-50 text-[#311171] border border-purple-200 rounded-xl transition-all font-bold text-[12px] min-w-[140px]"
                    >
                      <Send size={14} strokeWidth={2.5} />
                      <span>แจ้งแอดมินคณะ</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom View All Link */}
        <div className="p-5 text-center bg-transparent shrink-0">
          <button 
            onClick={() => router.push('/super-admin/vans')}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 inline-flex items-center gap-2 transition-all shadow-xs"
          >
            <Keyboard size={14} />
            <span>ดูข้อมูลรถทั้งหมดในระบบ</span>
          </button>
        </div>

      </div>

      {/* ----- MODALS ----- */}

      {/* Modal: แจ้งเตือนแอดมินคณะ */}
      {notifyModalAlert && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">ส่งข้อความแจ้งเตือนแอดมินคณะ</h3>
              <button onClick={() => setNotifyModalAlert(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-gray-800">เป้าหมาย: แอดมิน{notifyModalAlert.faculty}</p>
              <p className="text-gray-600">เรื่อง: {notifyModalAlert.issue} (รถตู้ทะเบียน {notifyModalAlert.plate})</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">ข้อความแจ้งเตือนเพิ่มเติม:</label>
              <textarea 
                rows={3} 
                defaultValue={`เรียน แอดมิน${notifyModalAlert.faculty} กรุณาดำเนินการต่อภาษี/เข้าเช็คระยะรถตู้ ${notifyModalAlert.plate} ภายในกำหนดด้วยครับ`}
                className="w-full p-3 bg-white border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-[#311171]/20 outline-none"
              ></textarea>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setNotifyModalAlert(null)} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => {
                  setNotifyModalAlert(null);
                  showToast(`ส่งข้อความแจ้งเตือนไปยังแอดมิน ${notifyModalAlert.faculty} เรียบร้อยแล้ว`);
                }} 
                className="flex-1 bg-[#311171] hover:bg-[#230b54] text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-md"
              >
                <Send size={14} /> ส่งข้อความ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}