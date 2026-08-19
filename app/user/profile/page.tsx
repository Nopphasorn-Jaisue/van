"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield } from "lucide-react";
import { getAuthUser } from "@/app/actions/auth";
import AppShell from "@/components/AppShell";

export default function UserProfile() {
  const [profileData, setProfileData] = useState({
    name: "กำลังโหลด...",
    email: "กำลังโหลด...",
    phone: "-", 
    department: "กำลังโหลด...",
    role: "USER"
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const dbUser = await getAuthUser();
        
        if (dbUser) {
          setProfileData(prev => ({
            ...prev,
            name: dbUser.name || "ไม่มีชื่อ",
            email: dbUser.email || "ไม่มีอีเมล",
            department: dbUser.faculty?.nameTh || "ไม่ระบุคณะ/สังกัด",
            role: dbUser.role,
          }));
        } else {
          // Fallback สำหรับโหมด Bypass / ทดสอบระบบ
          setProfileData(prev => ({
            ...prev,
            name: "ผู้ใช้งานทั่วไป (โหมดทดสอบ)",
            email: "user.test@up.ac.th",
            department: "คณะทั่วไป",
            role: "USER",
          }));
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 w-full animate-in fade-in flex-1">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">บัญชีผู้ใช้ (My Profile)</h1>
            <p className="text-sm text-gray-500 mt-1">ข้อมูลส่วนตัวของคุณ (เชื่อมต่อกับระบบ Microsoft 365)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-gray-100 flex items-center justify-center">
                  <User size={48} className="text-gray-400" />
                </div>
                <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
              </div>
              
              <h2 className="text-lg font-black text-gray-900 leading-tight">
                {isLoading ? "กำลังโหลด..." : profileData.name}
              </h2>
              <p className="text-xs font-bold text-[#311171] mt-1 bg-purple-50 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Shield size={12} /> {profileData.role === "USER" ? "ผู้ใช้งานทั่วไป" : profileData.role}
              </p>
              <p className="text-xs text-gray-500 mt-3">{profileData.department}</p>
            </div>
          </div>

          {/* Right Column: Content Area */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Profile Details */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900">ข้อมูลส่วนตัว (Read-only)</h3>
                  <p className="text-sm text-gray-500">ข้อมูลถูกซิงค์จากระบบ Microsoft 365 ไม่สามารถแก้ไขได้</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 ml-1">ชื่อ - นามสกุล</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      disabled
                      value={profileData.name}
                      className="pl-11 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 ml-1">อีเมล (Microsoft 365)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={profileData.email}
                      className="pl-11 pr-4 py-3 w-full border border-gray-200 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
