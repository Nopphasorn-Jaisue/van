"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import UpLogo from "@/components/UpLogo";

// ==========================================
// 🌟 ปรับปรุง: ใช้ระบบ RBAC (Role-Based Access Control)
// กำหนดสิทธิ์ให้ชัดเจนว่า Role ไหนเห็นเมนูไหนได้บ้าง
// ==========================================
const ALL_MENU_ITEMS = [
  { label: "หน้าภาพรวม", href:"/landing" }, // ไม่มี allowedRoles = เห็นทุกคน
  { label: "ตารางการใช้รถตู้", href: "/calendar" },
  { label: "ยื่นคำขอใช้รถตู้", href: "/bookings/new", allowedRoles: ["USER", "FACULTY_ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
  { label: "ติดตามสถานะคำขอ", href: "/bookings/tracking", allowedRoles: ["USER", "FACULTY_ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
  
  // เฉพาะแอดมินคณะ และ ซุปเปอร์แอดมิน
  { label: "จัดการรถตู้คณะ", href: "/faculty-admin", allowedRoles: ["FACULTY_ADMIN", "SUPER_ADMIN"] },
  
  // เฉพาะผู้บริหาร และ ซุปเปอร์แอดมิน (แอดมินคณะจะมองไม่เห็นเมนูนี้แล้วตามที่เราตกลงกัน)
  { label: "Approvals", href: "/executive/approvals", allowedRoles: ["EXECUTIVE", "SUPER_ADMIN"] },
  { label: "Reports", href: "/reports", allowedRoles: ["FACULTY_ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
  
  // สำหรับแอปคนขับ (ปกติคนขับจะใช้มือถือ แต่ใส่ไว้เพื่อทดสอบ)
  { label: "แดชบอร์ดคนขับ", href: "/driver/dashboard", allowedRoles: ["DRIVER", "SUPER_ADMIN"] },
  
  // เฉพาะซุปเปอร์แอดมินเท่านั้น
  { label: "ผู้ดูแลระบบ", href: "/super-admin", allowedRoles: ["SUPER_ADMIN"] },
];

export default function AppSidebar() {
  const pathname = usePathname();
  // 🌟 ปรับแก้: กำหนด Role เป็น 'FACULTY_ADMIN' ถาวรเพื่อการทดสอบ
  // และลบ useEffect ที่ดึงข้อมูล Role ซึ่งเป็นสาเหตุของการกระพริบ
  const [role, setRole] = useState("FACULTY_ADMIN");

  // ==========================================
  // 🌟 ปรับปรุง Logic การกรองเมนูให้รัดกุม 100%
  // ==========================================
  const visibleMenus = ALL_MENU_ITEMS.filter(menu => {
    // 1. ถ้าเมนูไหนไม่ได้ระบุ allowedRoles ถือว่าเป็นเมนูสาธารณะ (Public) ให้ผ่านเลย
    if (!menu.allowedRoles) return true;
    
    // 2. ตรวจสอบว่า Role ของผู้ใช้ปัจจุบัน อยู่ใน Array สิทธิ์ที่อนุญาตหรือไม่
    return menu.allowedRoles.includes(role);
  });

  return (
    <aside className="w-64 h-screen sticky top-0 flex-shrink-0 flex flex-col overflow-y-auto bg-purple-950 text-white shadow-lg">
      <div className="p-6 border-b border-purple-800">
        <div className="flex items-center gap-3">
          <UpLogo compact className="h-12 w-12" />
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-tight">Van Booking</h1>
            <p className="text-xs text-purple-300">มหาวิทยาลัยพะเยา</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleMenus.map((item) => {
          // ใช้เช็คว่า URL ปัจจุบันตรงกับเมนูนี้หรือไม่ เพื่อทำ Highlight
          const isActive = pathname.startsWith(item.href) && item.href !== "/"; 
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-white text-purple-950 shadow-sm border-l-4 border-purple-500" 
                  : "text-purple-100 hover:bg-purple-900 hover:text-white"
              }`}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useEffect, useState } from "react";

// // เมนูทั้งหมดในระบบ
// const ALL_MENU_ITEMS = [
//   { label: "หน้าแรก", href: "/landing" }, 
//   { label: "ปฏิทินการใช้งานรถตู้", href: "/calendar" },
//   { label: "ขอใช้รถตู้", href: "/bookings/new" },
//   { label: "ติดตามสถานะคำขอ", href: "/bookings/tracking" },
//   { label: "ผู้ดูแลรถตู้คณะ", href: "/faculty-admin", requiresAdmin: true },
//   { label: "การอนุมัติ", href: "/executive/approvals", requiresAdmin: true },
//   { label: "รายงาน", href: "/reports", requiresAdmin: true },
//   { label: "คนขับรถตู้", href: "/driver/dashboard" },
//   { label: "ผู้ดูแลระบบจัดการรถตู้", href: "/super-admin", requiresSuperAdmin: true },
// ];

// export default function AppSidebar() {
//   const pathname = usePathname();
//   const [role, setRole] = useState("USER");

//   useEffect(() => {
//     setRole(localStorage.getItem("mockRole") || "USER");
//   }, []);

//   // กรองเมนู: ถ้าไม่ใช่ Admin จะไม่เห็นเมนูที่มี requiresAdmin: true
//   const visibleMenus = ALL_MENU_ITEMS.filter(menu => {
//     if (menu.requiresAdmin) {
//       return role === "FACULTY_ADMIN" || role === "SUPER_ADMIN";
//     }
//     return true; // เมนูทั่วไปเห็นได้ทุกคน
//   });

//   return (
//     <aside className="w-64 h-screen sticky top-0 flex-shrink-0 flex flex-col overflow-y-auto bg-purple-950 text-white shadow-lg">
//       <div className="p-6 border-b border-purple-800">
//         <div className="flex items-center gap-3">
//           <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-purple-900 font-black text-xl">UP</div>
//           <div>
//             <h1 className="font-bold text-lg tracking-tight leading-tight">Van Booking</h1>
//             <p className="text-xs text-purple-300">มหาวิทยาลัยพะเยา</p>
//           </div>
//         </div>
//       </div>

//       <nav className="flex-1 p-4 space-y-1">
//         {visibleMenus.map((item) => {
//           const isActive = pathname.startsWith(item.href);
//           return (
//             <Link key={item.href} href={item.href}>
//               <div className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
//                 isActive ? "bg-white text-purple-950 shadow-sm" : "text-purple-100 hover:bg-purple-900 hover:text-white"
//               }`}>
//                 {item.label}
//               </div>
//             </Link>
//           );
//         })}
//       </nav>
//     </aside>
//   );
// }