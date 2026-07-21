"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleAdminLogin = () => {
    // Mock login for admin
    router.push('/faculty-admin/dashboard');
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
        <div className="bg-gradient-to-b from-[#311171] to-[#4a1c99] p-10 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 p-3">
            <img src="/LOGO UP.png" alt="UP Logo" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">ระบบจองรถตู้</h1>
          <p className="text-white/90 font-medium text-sm">คณะเทคโนโลยีสารสนเทศและการสื่อสาร มหาวิทยาลัยพะเยา</p>
        </div>

        {/* Bottom Content - White */}
        <div className="bg-white/95 backdrop-blur-sm p-8">
          
          {/* Login Buttons */}
          <div className="space-y-4">


            <button 
              onClick={handleAdminLogin}
              className="w-full bg-[#4a1c99] hover:bg-[#311171] text-white font-bold text-[15px] py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              {/* Microsoft Icon simple mock */}
              <div className="grid grid-cols-2 gap-[2px] w-4 h-4">
                <div className="bg-[#f25022]"></div>
                <div className="bg-[#7fba00]"></div>
                <div className="bg-[#00a4ef]"></div>
                <div className="bg-[#ffb900]"></div>
              </div>
              Login with Microsoft 365 (แอดมิน)
            </button>

            <div className="flex items-center gap-4 py-1">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs font-bold text-gray-400">หรือ</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <button 
              onClick={() => router.push('/driver/dashboard')}
              className="w-full bg-[#e6f2ff] hover:bg-[#d0e7ff] text-[#005a9e] border border-[#005a9e]/20 font-bold text-[15px] py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              {/* Microsoft Icon simple mock */}
              <div className="grid grid-cols-2 gap-[2px] w-4 h-4">
                <div className="bg-[#f25022]"></div>
                <div className="bg-[#7fba00]"></div>
                <div className="bg-[#00a4ef]"></div>
                <div className="bg-[#ffb900]"></div>
              </div>
              Login with Microsoft 365 (คนขับรถตู้)
            </button>
          </div>
        </div>

        {/* Footer info inside card */}
        <div className="bg-gray-100/80 py-4 text-center">
          <p className="text-[12px] font-bold text-gray-500">ระบบยืนยันตัวตนผ่าน Microsoft OAuth 2.0</p>
        </div>

      </div>

      {/* Footer text outside card */}
      <div className="mt-6 text-white/80 text-[12px] font-medium tracking-wide">
        หากพบปัญหาเข้าสู่ระบบ กรุณาติดต่อผู้ดูแลระบบคณะ ICT
      </div>

    </div>
  );
}