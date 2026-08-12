"use client";
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { User, Mail, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { getAuthUser } from '@/app/actions/auth';

interface ProfileUser {
  name: string;
  email: string;
  faculty: string;
  role: string;
  avatar: string;
}

export default function ExecutiveProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const dbUser = await getAuthUser();
        
        if (dbUser) {
          setUser({
            name: dbUser.name || "ไม่มีชื่อ",
            email: dbUser.email || "ไม่มีอีเมล",
            faculty: dbUser.faculty?.nameTh || "ไม่ระบุคณะ",
            role: dbUser.role === 'EXECUTIVE' ? "คณบดี (Executive)" : dbUser.role,
            avatar: dbUser.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
          });
        } else {
          // 🌟 FALLBACK สำหรับโหมด Bypass / ทดสอบระบบ
          setUser({
            name: "รศ.ดร. ฐิติรัตน์ เชี่ยวสุวรรณ (โหมดทดสอบ)",
            email: "thitirat.ch@up.ac.th",
            faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
            role: "คณบดี (Executive)",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  if (isLoading || !user) {
    return (
      <AppShell>
        <div className="flex h-full min-h-[50vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#311171]" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[800px] w-full mx-auto animate-in fade-in flex-1 flex flex-col min-h-0 pt-6">
        
        {/* Header */}
        <div className="mb-8 shrink-0">
          <h1 className="text-[26px] font-black text-gray-900 leading-tight mb-2 flex items-center gap-3">
            <div className="p-2.5 bg-[#311171] text-white rounded-[14px]">
              <User size={24} strokeWidth={2.5} />
            </div>
            บัญชีผู้ใช้
          </h1>
          <p className="text-sm text-gray-500">
            ดูรายละเอียดข้อมูลบัญชี อีเมล และสังกัดคณะของคุณ
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
          
          {/* Header Banner - Minimalist */}
          <div className="relative rounded-2xl bg-gray-50/50 border border-gray-100 overflow-hidden flex flex-col sm:flex-row items-center sm:items-start p-8 gap-6">
            
            {/* Avatar */}
            <div className="relative z-10 shrink-0">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-sm bg-white">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* User Info (Banner) */}
            <div className="relative z-10 flex-1 flex flex-col items-center sm:items-start pt-2">
              <h2 className="text-2xl sm:text-3xl font-black mb-3 text-gray-900 text-center sm:text-left tracking-tight">{user.name}</h2>
              <div className="inline-flex items-center gap-2 bg-[#311171]/10 text-[#311171] px-4 py-1.5 rounded-full border border-[#311171]/20 font-bold text-sm">
                <ShieldCheck size={16} />
                {user.role}
              </div>
            </div>

            {/* University Tag */}
            <div className="relative z-10 shrink-0 mt-2 sm:mt-0 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-bold text-blue-700">
              <ShieldCheck size={14} />
              ข้อมูลผูกกับบัญชีมหาวิทยาลัย
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 rounded-2xl bg-transparent p-2 border-transparent">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
              
              {/* Name */}
              <div className="flex-1 flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors rounded-t-xl md:rounded-tr-none md:rounded-l-xl">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 shrink-0 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                  <User size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-500 mb-0.5">ชื่อ - นามสกุล</p>
                  <p className="text-[16px] font-black text-gray-900">{user.name}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex-1 flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors md:rounded-r-xl">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 shrink-0 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                  <Mail size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-500 mb-0.5">อีเมลมหาวิทยาลัย</p>
                  <p className="text-[16px] font-black text-gray-900">{user.email}</p>
                </div>
              </div>

            </div>

            <div className="border-t border-gray-100">
              {/* Faculty */}
              <div className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors rounded-b-xl">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#5b2fb6] shrink-0 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gray-500 mb-0.5">สังกัดคณะ</p>
                  <p className="text-[16px] font-black text-[#401b8e]">{user.faculty}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
