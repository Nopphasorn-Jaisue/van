import React from 'react';
import { Loader2 } from 'lucide-react';

interface DashboardLoaderProps {
  text?: string;
  size?: 'large' | 'small';
}

export default function DashboardLoader({ text = "กำลังโหลดข้อมูลแดชบอร์ด...", size = 'large' }: DashboardLoaderProps) {
  const isLarge = size === 'large';
  
  return (
    <div className={`flex flex-col items-center justify-center w-full animate-in fade-in duration-500 ${isLarge ? 'min-h-[60vh]' : 'py-4'}`}>
      <div className={`relative flex items-center justify-center ${isLarge ? 'mb-6' : 'mb-3'}`}>
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-[#311171] blur-xl opacity-10 rounded-full scale-150 animate-pulse ${isLarge ? '' : 'hidden'}`}></div>
        {/* Spinner */}
        <Loader2 className={`${isLarge ? 'w-16 h-16' : 'w-8 h-8'} text-[#311171] animate-spin relative z-10`} strokeWidth={isLarge ? 3 : 2.5} />
      </div>
      <p className={`${isLarge ? 'text-lg' : 'text-sm'} font-black text-[#311171] tracking-wider animate-pulse`}>
        {text}
      </p>
    </div>
  );
}
