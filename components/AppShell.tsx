"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, LogOut, CalendarDays, CarFront, FileSignature, Users, User, BarChart3, Clock, LayoutDashboard, Wrench,
  X, ShieldCheck, UserPlus, Bus, Calendar, Info, FileText, FilePlus, FileSpreadsheet
} from 'lucide-react';
import UpLogo from '@/components/UpLogo';
import { getNotifications, markNotificationAsRead } from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { Role } from '@prisma/client';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 🌟 ปรับแก้: กำหนดสิทธิ์ชั่วคราวโดยอิงจาก URL เพื่อความสะดวกในการทดสอบ
  let userRole = 'FACULTY_ADMIN';
  if (pathname?.startsWith('/driver')) userRole = 'DRIVER';
  else if (pathname?.startsWith('/super-admin')) userRole = 'SUPER_ADMIN';
  else if (pathname?.startsWith('/executive')) userRole = 'EXECUTIVE';
  else userRole = 'FACULTY_ADMIN'; 
  const [displayName] = useState('ผู้ใช้งานระบบ');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDutiesModal, setShowDutiesModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  type NotificationItem = {
    id: number;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      // Fetch based on current role (since user isn't logged in proper yet)
      const data = await getNotifications(userRole as Role);
      setNotifications(data);
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userRole]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: number) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="flex h-screen bg-[#f3f4f7] overflow-hidden">
      
      {/* 1. เรียกใช้งาน Sidebar พร้อมส่ง Role ไปควบคุมการเปิด/ปิดเมนู */}
      <Sidebar userRole={userRole} />

      {/* 2. พื้นที่ด้านขวา */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* แถบหัวบน (Top Navbar) */}
        <nav className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3 md:hidden">
            <UpLogo compact className="w-8 h-8" />
            <h1 className="font-bold text-gray-900">Van Booking</h1>
          </div>
          
          <div className="hidden md:flex items-center text-sm">
            <span className="font-bold text-[#311171]">
              {userRole === 'SUPER_ADMIN' ? `ผู้ดูแลระบบสูงสุด (${displayName})` :
               userRole === 'EXECUTIVE' ? 'รองคณบดีฝ่ายบริหาร' : 
               userRole === 'FACULTY_ADMIN' ? `แอดมินคณะ (${displayName})` :
               userRole === 'DRIVER' ? `พนักงานขับรถ (${displayName})` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {userRole === 'FACULTY_ADMIN' && (
              <button 
                onClick={() => setShowDutiesModal(true)}
                className="p-2 text-gray-500 hover:text-[#311171] hover:bg-purple-50 rounded-full transition-colors flex items-center gap-2"
                title="สิทธิ์และหน้าที่ของแอดมินคณะ"
              >
                <Info size={20} />
                <span className="hidden sm:inline text-sm font-bold">สิทธิ์และหน้าที่</span>
              </button>
            )}

            {/* 🔔 ปุ่มกระดิ่งแจ้งเตือน */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <span className="font-bold text-gray-800">การแจ้งเตือน</span>
                    <span className="text-xs text-purple-600 cursor-pointer hover:underline">อ่านทั้งหมด</span>
                  </div>
                  <ul className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? notifications.map((note) => (
                      <li 
                        key={note.id} 
                        onClick={() => {
                          if (note.type === 'duties') {
                            setShowDutiesModal(true);
                            setShowNotifications(false);
                          }
                          if (!note.isRead) handleMarkAsRead(note.id);
                        }}
                        className={`p-4 hover:bg-purple-50/50 cursor-pointer transition-colors ${note.isRead ? 'bg-white opacity-60' : 'bg-[#f4effc]'}`}
                      >
                        <p className="text-sm font-bold text-gray-800 leading-snug">{note.message}</p>
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <Clock size={12} /> {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: th })}
                        </p>
                      </li>
                    )) : (
                      <li className="p-6 text-center text-sm text-gray-400">ไม่มีการแจ้งเตือนใหม่</li>
                    )}
                  </ul>
                </div>
              )}
            </div>



            <button 
              onClick={() => {
                window.location.href = '/landing'; 
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors text-sm font-medium border border-gray-200"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </nav>

        {/* พื้นที่แสดงเนื้อหา */}
        <main className="flex-1 flex flex-col min-h-0 p-6 lg:p-8 bg-gray-50/50 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </main>

        {/* 📱 Mobile Bottom Navigation for Driver */}
        {userRole === 'DRIVER' && (
          <div className="md:hidden bg-white border-t border-gray-200 py-3 px-6 flex justify-around items-center shrink-0 z-30 shadow-lg">
            {[
              { icon: LayoutDashboard, label: "แดชบอร์ด", href: "/driver/dashboard" },
              { icon: CalendarDays, label: "ตารางงาน", href: "/driver/schedule" },
              { icon: FileSignature, label: "บันทึกการเดินทาง", href: "/driver/records" },
              { icon: FileSpreadsheet, label: "รายงานการใช้งานรถตู้", href: "/driver/report" },
              { icon: FileText, label: "รถและสัญญา", href: "/driver/contract" },
            ].map((item, idx) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    isActive ? 'text-[#311171] font-black scale-105' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'stroke-[2.5]' : ''} />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal สิทธิ์และหน้าที่ของแอดมินคณะ */}
      {showDutiesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 relative border border-gray-100">
            <button 
              onClick={() => setShowDutiesModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Info size={24} className="text-[#311171]" /> สิทธิ์และหน้าที่ของแอดมินคณะ
              </h2>
              <p className="text-sm text-gray-500 mt-1">บทบาทหน้าที่และความรับผิดชอบในการใช้งานระบบของคุณ</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#f0eaff] flex items-center justify-center text-[#311171] shrink-0">
                  <ShieldCheck size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">อนุมัติ/ปฏิเสธคำขอใช้รถของคณะ</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">พิจารณาคำขอให้เป็นไปตามระเบียบ สามารถกดดูรายละเอียดเอกสารแนบก่อนอนุมัติได้</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <UserPlus size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">มอบหมายรถและคนขับ</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">เลือกจัดสรรรถและคนขับที่เหมาะสมสำหรับแต่ละภารกิจ หลังจากอนุมัติคำขอแล้ว</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Bus size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">ตรวจสอบตารางรถซ้อนกัน</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">ป้องกันการจองรถในช่วงเวลาเดียวกัน ระบบจะแจ้งเตือนหากมีภารกิจซ้อนทับกัน</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#fff8e5] flex items-center justify-center text-[#C39B22] shrink-0">
                  <Wrench size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">อัปเดตสถานะรถพร้อมใช้ / ซ่อมบำรุง</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">กำหนดสถานะ และแจ้งซ่อมบำรุง เพื่อให้คนในคณะทราบว่ารถไม่พร้อมใช้งานชั่วคราว</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">จัดการข้อมูลติดต่อและข้อมูลคนขับ</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">อัปเดตข้อมูลให้เป็นปัจจุบัน เพื่อความสะดวกในการติดต่อประสานงาน</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">เชื่อมต่อ Google Calendar ของคณะ</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">ดูปฏิทินการเดินทางและภารกิจของคณะผ่าน Google Calendar โดยตรง</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowDutiesModal(false)}
                className="px-5 py-2.5 bg-[#311171] hover:bg-[#250d55] text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🛠️ SUB-COMPONENT: เมนูด้านซ้าย (Sidebar ฉบับแก้ไขสิทธิ์)
// ==========================================
function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname(); 

  // 🌟 โครงสร้างเมนูตาม Role ที่กำหนด
  const getMenuItemsByRole = (role: string) => {
    // 1. เมนูสำหรับแอดมินคณะ (Faculty Admin)
    if (role === "FACULTY_ADMIN") {
      return [
        { icon: LayoutDashboard, label: "แดชบอร์ดคณะ", href: "/faculty-admin/dashboard" },
        { icon: CalendarDays, label: "ตารางการใช้รถตู้", href: "/faculty-admin/calendar" },
        { icon: FileSignature, label: "คำขอที่ต้องอนุมัติ", href: "/faculty-admin/approvals" },
        { icon: CarFront, label: "จัดการรถประจำคณะ", href: "/faculty-admin/vans" },
        { icon: Wrench, label: "ซ่อมบำรุง & ภาษี", href: "/faculty-admin/maintenance" },
        { icon: Users, label: "จัดการคนขับ", href: "/faculty-admin/drivers" },
        { icon: FileSignature, label: "บันทึกการเดินทางคนขับประจำคณะ", href: "/faculty-admin/driver-records" },
        { icon: FilePlus, label: "เบิกค่าใช้จ่ายรายทริป", href: "/faculty-admin/trip-expenses" },
        { icon: BarChart3, label: "รายงานและสถิติ", href: "/faculty-admin/reports" },
        { icon: User, label: "บัญชีผู้ใช้", href: "/faculty-admin/profile" },
      ];
    }



    // 2. เมนูสำหรับคณบดี / ผู้บริหาร (EXECUTIVE)
    if (role === "EXECUTIVE") {
      return [
        { icon: LayoutDashboard, label: "แดชบอร์ดคณบดี", href: "/executive/approvals" },
        { icon: FileSignature, label: "การอนุมัติคำขอ", href: "/executive/approvals" },
        { icon: BarChart3, label: "รายงานผู้บริหาร", href: "/reports" },
      ];
    }

    // 3. เมนูสำหรับพนักงานขับรถ (DRIVER)
    if (role === "DRIVER") {
      return [
        { icon: LayoutDashboard, label: "แดชบอร์ดคนขับ", href: "/driver/dashboard" },
        { icon: CalendarDays, label: "ตารางงานของฉัน", href: "/driver/schedule" },
        { icon: FileSignature, label: "บันทึกการเดินทาง", href: "/driver/records" },
        { icon: FileSpreadsheet, label: "รายงานการใช้งานรถตู้", href: "/driver/report" },
        { icon: FileText, label: "ข้อมูลรถและสัญญา", href: "/driver/contract" },
      ];
    }

    if (role === "SUPER_ADMIN") {
      return [
        { icon: LayoutDashboard, label: "แดชบอร์ดส่วนกลาง", href: "/super-admin/dashboard" },
        { icon: Users, label: "จัดการผู้ใช้งานระบบ", href: "/super-admin/users" },
        { icon: Bus, label: "จัดการรถตู้ทั้งหมด", href: "/super-admin/vans" },
        { icon: CarFront, label: "จัดการคนขับ", href: "/super-admin/drivers" },
        { icon: FileSignature, label: "ประวัติการใช้งาน", href: "/super-admin/logs" },
        { icon: User, label: "บัญชีผู้ใช้", href: "/super-admin/profile" },
      ];
    }

    // Fallback: หากไม่มี Role ที่ตรงกัน ให้แสดงเมนูพื้นฐาน
    return [
      { icon: LayoutDashboard, label: "แดชบอร์ดคณะ", href: "/faculty-admin/dashboard" },
    ];
  };

  const visibleMenus = getMenuItemsByRole(userRole);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'FACULTY_ADMIN': return 'ผู้ดูแลคณะ';
      case 'DRIVER': return 'พนักงานขับรถ';
      case 'SUPER_ADMIN': return 'ผู้ดูแลระบบ';
      default: return 'ผู้ใช้งานทั่วไป';
    }
  };

  const userFaculty = userRole === 'SUPER_ADMIN' ? 'ศูนย์จัดการระบบส่วนกลาง' :
                      userRole === 'EXECUTIVE' ? 'สำนักงานคณบดี' :
                      userRole === 'DRIVER' ? 'ทีมพนักงานขับรถประจำคณะ' :
                      'คณะเทคโนโลยีสารสนเทศและการสื่อสาร';

  return (
    <aside className="w-64 bg-gradient-to-b from-[#2a0c63] via-[#2f0f6f] to-[#240a58] text-white hidden md:flex flex-col h-full shadow-xl z-20 shrink-0">
      <div className="p-5 border-b border-white/10">
        <div>
          <h1 className="font-black text-lg tracking-tight leading-tight">{userFaculty}</h1>
          <p className="text-xs text-purple-200">{getRoleDisplayName(userRole)}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <p className="text-[10px] font-bold text-green-300">ออนไลน์</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-1 overflow-y-auto px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {visibleMenus.map((item, idx) => {
          // ไฮไลท์แถบเมนูสีขาวเมื่อ URL เบราว์เซอร์ตรงกับเมนูนั้นๆ
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link 
              key={idx}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold mb-1 ${
                isActive 
                  ? 'bg-white text-[#311171] shadow-md border-l-4 border-green-400 font-black' 
                  : 'text-purple-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={`grid place-items-center h-8 w-8 rounded-lg ${isActive ? 'bg-[#efeaff]' : 'bg-white/10'}`}>
                <item.icon size={18} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-white/15 bg-white/5 p-4 text-xs text-purple-100">
        <p className="font-bold text-white mb-2">ติดต่อสอบถาม</p>
        <p>โทร 0 5446 6666 ต่อ 1234</p>
        <p className="mt-1">vanbooking@up.ac.th</p>
        <p className="mt-1">@vanbooking.up</p>
      </div>
    </aside>
  );
}


// "use client";
// import React, { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { 
//   Bell, LogOut, CalendarDays, CarFront, FileSignature, Users, BarChart3, UserCheck, Clock 
// } from 'lucide-react';

// export default function AppShell({ children }) {
//   const [userRole, setUserRole] = useState('USER'); 
//   const [showNotifications, setShowNotifications] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const savedRole = localStorage.getItem('mockRole') || 'USER';
//     setUserRole(savedRole);

//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowNotifications(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ข้อมูลแจ้งเตือนตาม Role
//   const getNotificationsByRole = (role: string) => {
//     switch (role) {
//       case 'USER':
//         return [{ id: 1, type: 'success', text: '✅ คำขอจองรถตู้ (UP-2567-0120) ของคุณได้รับการอนุมัติแล้ว', time: '10 นาทีที่แล้ว' }];
//       case 'FACULTY_ADMIN':
//         return [{ id: 1, type: 'info', text: '🆕 มีคำขอใหม่จาก ดร.สมเกียรติ (10 คน)', time: '5 นาทีที่แล้ว' }];
//       case 'EXECUTIVE':
//         return [{ id: 1, type: 'urgent', text: '🚨 ด่วน: คำขอเดินทางข้ามจังหวัดพรุ่งนี้ (รออนุมัติ)', time: '15 นาทีที่แล้ว' }];
//       default:
//         return [];
//     }
//   };

//   const notifications = getNotificationsByRole(userRole);
//   const unreadCount = notifications.length;

//   return (
//     <div className="flex h-screen bg-[#F8F9FA] font-sans overflow-hidden">
      
//       {/* 1. เรียกใช้งาน Sidebar พร้อมส่ง Role ไปให้ */}
//       <Sidebar userRole={userRole} />

//       {/* 2. พื้นที่ด้านขวา */}
//       <div className="flex-1 flex flex-col h-full overflow-hidden">
        
//         {/* แถบหัวบน (Top Navbar) */}
//         <nav className="bg-white px-6 py-3 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
//           <div className="flex items-center gap-3 md:hidden">
//             <div className="w-8 h-8 bg-[#311171] text-white rounded-lg flex items-center justify-center font-black">UP</div>
//             <h1 className="font-bold text-gray-900">Van Booking</h1>
//           </div>
          
//           <div className="hidden md:flex items-center text-sm">
//             <span className="mr-1">👋 ยินดีต้อนรับ,</span>
//             <span className="font-bold text-[#311171]">
//               {userRole === 'SUPER_ADMIN' ? 'ผู้ดูแลระบบสูงสุด (Super Admin)' :
//                userRole === 'EXECUTIVE' ? 'รองคณบดีฝ่ายบริหาร' : 
//                userRole === 'FACULTY_ADMIN' ? 'นายสมชาย (แอดมินคณะวิศวะ)' : 'อาจารย์ / บุคลากรทั่วไป'}
//             </span>
//           </div>

//           <div className="flex items-center gap-4">
//             {/* 🔔 ปุ่มกระดิ่งแจ้งเตือน */}
//             <div className="relative" ref={dropdownRef}>
//               <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors">
//                 <Bell size={20} />
//                 {unreadCount > 0 && (
//                   <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
//                     {unreadCount}
//                   </span>
//                 )}
//               </button>

//               {showNotifications && (
//                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
//                   <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
//                     <span className="font-bold text-gray-800">การแจ้งเตือน</span>
//                     <span className="text-xs text-purple-600 cursor-pointer hover:underline">อ่านทั้งหมด</span>
//                   </div>
//                   <ul className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
//                     {notifications.length > 0 ? notifications.map((note) => (
//                       <li key={note.id} className="p-4 hover:bg-purple-50/50 bg-white cursor-pointer transition-colors">
//                         <p className="text-sm font-bold text-gray-800 leading-snug">{note.text}</p>
//                         <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
//                           <Clock size={12} /> {note.time}
//                         </p>
//                       </li>
//                     )) : (
//                       <li className="p-6 text-center text-sm text-gray-400">ไม่มีการแจ้งเตือนใหม่</li>
//                     )}
//                   </ul>
//                 </div>
//               )}
//             </div>

//             <button 
//               onClick={() => {
//                 localStorage.removeItem('mockRole');
//                 window.location.href = '/landing'; // แก้ไขให้กลับไปหน้าแรกของคุณ
//               }}
//               className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors text-sm font-medium border border-gray-200"
//             >
//               <LogOut size={18} />
//               <span className="hidden sm:inline">ออกจากระบบ</span>
//             </button>
//           </div>
//         </nav>

//         {/* พื้นที่แสดงเนื้อหา */}
//         <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50/50">
//           {children}
//         </main>

//       </div>
//     </div>
//   );
// }

// // ==========================================
// // 🛠️ SUB-COMPONENT: เมนูด้านซ้าย (Sidebar) 
// // ==========================================
// function Sidebar({ userRole }: { userRole: string }) {
//   const pathname = usePathname(); 

//   // 🌟 นำ URL ที่ถูกต้องจาก AppSidebar ของคุณมาใช้งาน
//   const getMenuItems = () => {
//     if (userRole === 'USER') {
//       return [
//         { icon: CalendarDays, label: 'ปฏิทินการใช้งานรถตู้', href: '/calendar' },
//         { icon: CarFront, label: 'ขอใช้รถตู้', href: '/bookings/new' },
//         { icon: FileSignature, label: 'ติดตามสถานะคำขอ', href: '/bookings/tracking' },
//       ];
//     }
//     if (userRole === 'EXECUTIVE') {
//       return [
//         { icon: CalendarDays, label: 'ปฏิทินการใช้งานรถตู้', href: '/calendar' },
//         { icon: UserCheck, label: 'การอนุมัติ', href: '/executive/approvals' },
//         { icon: BarChart3, label: 'รายงาน', href: '/reports' },
//       ];
//     }
//     // สำหรับ FACULTY_ADMIN และ SUPER_ADMIN
//     return [
//       { icon: CalendarDays, label: 'ปฏิทินการใช้งานรถตู้', href: '/calendar' },
//       { icon: CarFront, label: 'ขอใช้รถตู้', href: '/bookings/new' },
//       // { icon: FileSignature, label: 'ติดตามสถานะคำขอ', href: '/bookings/tracking' },
//       { icon: Users, label: 'ผู้ดูแลรถตู้คณะ', href: '/faculty-admin' },
//       // { icon: UserCheck, label: 'การอนุมัติ', href: '/executive/approvals' },
//       { icon: BarChart3, label: 'รายงาน', href: '/reports' },
//     ];
//   };

//   const menuItems = getMenuItems();

//   return (
//     <aside className="w-64 bg-[#311171] text-white hidden md:flex flex-col h-full shadow-xl z-20">
//       <div className="h-20 flex items-center gap-3 px-6 bg-[#311171] border-b border-white/10">
//         <div className="w-10 h-10 bg-white text-[#311171] rounded-full flex items-center justify-center font-black text-lg shadow-md">
//           UP
//         </div>
//         <div>
//           <h1 className="font-bold text-lg leading-tight">Van Booking</h1>
//           <p className="text-[10px] text-purple-200">มหาวิทยาลัยพะเยา</p>
//         </div>
//       </div>

//       <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
//         {menuItems.map((item, idx) => {
//           // ใช้ startsWith เผื่อในกรณีที่มี sub-path เช่น /bookings/new/123
//           const isActive = pathname.startsWith(item.href);
//           return (
//             <Link 
//               key={idx}
//               href={item.href}
//               className={`w-full flex items-center gap-3 px-6 py-3.5 transition-colors text-sm font-bold ${
//                 isActive 
//                   ? 'bg-white text-[#311171] shadow-md border-l-4 border-purple-500' 
//                   : 'text-purple-100 hover:bg-white/10 hover:text-white'
//               }`}
//             >
//               <item.icon size={20} />
//               {item.label}
//             </Link>
//           );
//         })}
//       </nav>
//     </aside>
//   );
// }