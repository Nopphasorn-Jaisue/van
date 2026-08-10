"use client";
import AppShell from '@/components/AppShell';
import { User, Mail, Building2, ShieldCheck } from 'lucide-react';

export default function FacultyAdminProfilePage() {
  // Mock data for the current user
  const user = {
    name: "สมหญิง รักงาน",
    email: "somying@up.ac.th",
    faculty: "คณะเทคโนโลยีสารสนเทศและการสื่อสาร",
    role: "ผู้ดูแลระดับคณะ (Faculty Admin)",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
  };

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
          
          {/* Header Banner */}
          <div className="relative rounded-2xl bg-gradient-to-r from-[#5b2fb6] to-[#401b8e] overflow-hidden flex flex-col sm:flex-row items-center sm:items-start p-8 pb-10 gap-6">
            {/* Background Pattern (simulated temple/dots) */}
            <div className="absolute top-0 right-0 bottom-0 w-1/2 opacity-20 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)',
              backgroundSize: '20px 20px',
              backgroundPosition: 'top right'
            }} />
            
            {/* Avatar */}
            <div className="relative z-10 shrink-0">
              <div className="w-36 h-36 rounded-2xl overflow-hidden border-[5px] border-white/20 shadow-lg bg-white">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name & Role */}
            <div className="relative z-10 flex-1 flex flex-col items-center sm:items-start justify-center pt-2 sm:pt-6">
              <h2 className="text-[32px] sm:text-[40px] font-black text-white drop-shadow-md leading-none mb-4 text-center sm:text-left">
                {user.name}
              </h2>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#5b2fb6] shadow-md">
                <ShieldCheck size={18} className="text-[#5b2fb6]" />
                <span className="text-sm font-bold">{user.role}</span>
              </div>
            </div>
            
            {/* Disabled Edit Button (Replaced by Info text as requested) */}
            <div className="absolute top-6 right-6 z-10 hidden md:block">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white/80 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2">
                <ShieldCheck size={14} />
                ข้อมูลผูกกับบัญชีมหาวิทยาลัย
              </div>
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
