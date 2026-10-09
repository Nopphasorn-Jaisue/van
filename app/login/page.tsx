"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setMockSession, getRoleByEmail } from '@/app/actions/auth';
import { Loader2, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingRole, setLoadingRole] = useState<'ADMIN' | 'DRIVER' | 'SUPER_ADMIN' | 'EXECUTIVE' | 'GUEST' | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get('error') ? 'การยืนยันตัวตนล้มเหลว กรุณาลองใหม่อีกครั้ง' : null
  );

    const handleMicrosoftLogin = (role: 'EXECUTIVE' | 'SUPER_ADMIN' | 'DRIVER' | 'ADMIN' | 'GUEST' = 'GUEST') => {
    setLoadingRole(role);
    window.location.href = `/api/auth/azure/login?role=${role}`;
  };

  const handleDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput || loadingRole !== null) return;
    setLoadingRole('GUEST');
    setErrorMessage(null);
    try {
      const trimmedEmail = emailInput.trim();
      const role = await getRoleByEmail(trimmedEmail);
      if (!role) {
        setErrorMessage('ไม่พบอีเมลนี้ในระบบฐานข้อมูล');
        setLoadingRole(null);
        return;
      }
      await setMockSession(role, trimmedEmail);
      
      if (role === 'SUPER_ADMIN') router.push('/super-admin/dashboard');
      else if (role === 'FACULTY_ADMIN') router.push('/faculty-admin/dashboard');
      else if (role === 'EXECUTIVE') router.push('/executive/dashboard');
      else if (role === 'DRIVER') router.push('/driver/dashboard');
      else if (role === 'USER') router.push('/user/calendar');
      else router.push('/user/calendar');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setLoadingRole(null);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative p-4"
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/login-background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Main Card */}
      <div className="w-full max-w-[500px] bg-white rounded-[24px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        {/* Top Header - Purple Gradient */}
        <div className="bg-gradient-to-b from-[#ffffff] to-[#ffffff] p-10 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="w-28 h-28 flex items-center justify-center">
            <img src="/LOGO UP.png" alt="UP Logo" className="w-full h-full object-contain" />
          </div>
          
          
        </div>

        {/* Bottom Content - White */}
        <div className="bg-white/95 backdrop-blur-sm p-8">
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 py-1">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs font-bold text-gray-400">เข้าสู่ระบบด้วยอีเมล</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <form onSubmit={handleDirectLogin} className="flex flex-col gap-2">
              <input 
                type="email" 
                placeholder="กรอกอีเมลของคุณ (เช่น test@up.ac.th)" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDirectLogin(e);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#311171] focus:border-transparent outline-none"
              />
              <button 
                type="submit"
                disabled={loadingRole !== null || !emailInput}
                className="w-full bg-[#311171] hover:bg-[#230b54] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-[14px] py-3 rounded-xl transition-all shadow-sm flex justify-center"
              >
                {loadingRole === 'GUEST' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="flex items-center gap-4 py-1 mt-4">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs font-bold text-gray-400">หรือเข้าสู่ระบบด้วยบัญชีมหาวิทยาลัย</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <button 
              disabled={loadingRole !== null}
              onClick={() => handleMicrosoftLogin('ADMIN')}
              className="w-full bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold text-[14px] py-3 shadow-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <div className="grid grid-cols-2 gap-[1px] w-3.5 h-3.5 shrink-0 opacity-60">
                <div className="bg-[#f25022]"></div>
                <div className="bg-[#7fba00]"></div>
                <div className="bg-[#00a4ef]"></div>
                <div className="bg-[#ffb900]"></div>
              </div>
              <span>Login with Microsoft 365 (@up.ac.th)</span>
            </button>

          </div>
        </div>

        {/* Footer info inside card */}
        <div className="bg-gray-100/80 py-3.5 text-center">
          <p className="text-[12px] font-bold text-gray-500">ระบบเข้าสู่ระบบด้วยอีเมลมหาวิทยาลัย & Microsoft 365</p>
        </div>

      </div>

      {/* Footer text outside card */}
      <div className="mt-6 text-white/80 text-[12px] font-medium tracking-wide">
        หากพบปัญหาเข้าสู่ระบบ กรุณาติดต่อผู้ดูแลระบบคณะ ICT
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#311171] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
