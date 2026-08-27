"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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

  const supabase = createClient();

  const handleMicrosoftLogin = async (role: 'ADMIN' | 'DRIVER') => {
    setLoadingRole(role);
    setErrorMessage(null);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback?role=${role}`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email',
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Microsoft login error:', error);
        // Fallback for development/testing if OAuth is not fully set up in Supabase yet
        setErrorMessage('ไม่สามารถเชื่อมต่อ Microsoft 365 OAuth ได้ (สลับเป็นระบบทดลองเข้าสู่ระบบ)');
        setTimeout(() => {
          if (role === 'ADMIN') {
            router.push('/faculty-admin/dashboard');
          } else {
            router.push('/driver/dashboard');
          }
        }, 1200);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback redirect for testing
      if (role === 'ADMIN') {
        router.push('/faculty-admin/dashboard');
      } else {
        router.push('/driver/dashboard');
      }
    } finally {
      setLoadingRole(null);
    }
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
              <span className="text-xs font-bold text-gray-400">หรือทดสอบผ่าน OAuth</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <button 
              disabled={loadingRole !== null}
              onClick={async () => {
                setLoadingRole('ADMIN');
                try {
                  const redirectUrl = `${window.location.origin}/auth/callback?role=ADMIN`;
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: redirectUrl },
                  });
                } catch {
                  router.push('/faculty-admin/dashboard');
                } finally {
                  setLoadingRole(null);
                }
              }}
              className="w-full bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-700 font-bold text-[14px] py-3 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>ทดสอบเข้าสู่ระบบด้วย Google</span>
            </button>

            <button 
              disabled={loadingRole !== null}
              onClick={() => handleMicrosoftLogin('ADMIN')}
              className="w-full bg-gray-50 hover:bg-gray-100 active:scale-[0.99] border border-gray-200 text-gray-500 font-semibold text-[13px] py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <div className="grid grid-cols-2 gap-[1px] w-3.5 h-3.5 shrink-0 opacity-60">
                <div className="bg-[#f25022]"></div>
                <div className="bg-[#7fba00]"></div>
                <div className="bg-[#00a4ef]"></div>
                <div className="bg-[#ffb900]"></div>
              </div>
              <span>Login with Microsoft 365 (เปิดภายหลัง)</span>
            </button>

          </div>
        </div>

        {/* Footer info inside card */}
        <div className="bg-gray-100/80 py-3.5 text-center">
          <p className="text-[12px] font-bold text-gray-500">ระบบสลับการเข้าสู่ระบบแบบ Direct & Google OAuth</p>
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
