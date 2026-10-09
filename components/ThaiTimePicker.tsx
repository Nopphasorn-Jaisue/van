"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronUp, ChevronDown, Check } from 'lucide-react';

interface ThaiTimePickerProps {
  value: string; // HH:mm format
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  placement?: 'bottom' | 'top' | 'auto';
  align?: 'left' | 'right' | 'auto';
}

export default function ThaiTimePicker({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'เลือกเวลา',
  placement = 'bottom',
  align = 'right'
}: ThaiTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom'>(placement === 'top' ? 'top' : 'bottom');

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHour(h.padStart(2, '0'));
      setMinute(m.padStart(2, '0'));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (placement !== 'auto') {
      setActualPlacement(placement);
      return;
    }
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setActualPlacement('top');
      } else {
        setActualPlacement('bottom');
      }
    }
  }, [isOpen, placement]);

  const handleConfirm = () => {
    const finalH = formatNumber(hour || '08');
    const finalM = formatNumber(minute || '00');
    onChange(`${finalH}:${finalM}`);
    setIsOpen(false);
  };

  // Pad numbers properly
  const formatNumber = (num: string | number) => {
    const parsed = parseInt(String(num));
    if (isNaN(parsed)) return '00';
    return String(parsed).padStart(2, '0');
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setHour('');
      return;
    }
    let val = parseInt(raw);
    if (val > 23) val = 23;
    setHour(String(val).padStart(2, '0'));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setMinute('');
      return;
    }
    let val = parseInt(raw);
    if (val > 59) val = 59;
    setMinute(String(val).padStart(2, '0'));
  };

  const incrementHour = () => {
    setHour(prev => {
      const curr = parseInt(prev) || 0;
      return formatNumber((curr + 1) % 24);
    });
  };
  
  const decrementHour = () => {
    setHour(prev => {
      const curr = parseInt(prev) || 0;
      return formatNumber((curr - 1 + 24) % 24);
    });
  };

  const incrementMinute = () => {
    setMinute(prev => {
      const curr = parseInt(prev) || 0;
      return formatNumber((curr + 1) % 60);
    });
  };
  
  const decrementMinute = () => {
    setMinute(prev => {
      const curr = parseInt(prev) || 0;
      return formatNumber((curr - 1 + 60) % 60);
    });
  };

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#311171] focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all text-left shadow-2xs"
      >
        <span className={`text-xs font-bold ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value ? `${value} น.` : placeholder}
        </span>
        <Clock size={16} className={`shrink-0 transition-colors ${isOpen ? 'text-[#311171]' : 'text-slate-400'}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div 
          className={`absolute z-[150] w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-100 ${
            actualPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            
            {/* Hour Block */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">ชั่วโมง</span>
              <button 
                type="button" 
                onClick={incrementHour} 
                className="w-12 h-7 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-[#311171] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                title="เพิ่มชั่วโมง"
              >
                <ChevronUp size={16} />
              </button>
              <input 
                type="text" 
                maxLength={2}
                value={hour}
                onChange={handleHourChange}
                onBlur={() => setHour(formatNumber(hour || '08'))}
                className="w-14 h-10 text-center font-black text-xl text-[#311171] bg-purple-50/70 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-[#311171]/20 transition-all"
              />
              <button 
                type="button" 
                onClick={decrementHour} 
                className="w-12 h-7 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-[#311171] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                title="ลดชั่วโมง"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            
            <div className="font-black text-slate-300 text-2xl mt-4">:</div>

            {/* Minute Block */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">นาที</span>
              <button 
                type="button" 
                onClick={incrementMinute} 
                className="w-12 h-7 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-[#311171] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                title="เพิ่มนาที"
              >
                <ChevronUp size={16} />
              </button>
              <input 
                type="text" 
                maxLength={2}
                value={minute}
                onChange={handleMinuteChange}
                onBlur={() => setMinute(formatNumber(minute || '00'))}
                className="w-14 h-10 text-center font-black text-xl text-[#311171] bg-purple-50/70 border border-purple-200 rounded-xl outline-none focus:ring-2 focus:ring-[#311171]/20 transition-all"
              />
              <button 
                type="button" 
                onClick={decrementMinute} 
                className="w-12 h-7 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-[#311171] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                title="ลดนาที"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            
          </div>

          {/* Confirm Button */}
          <button 
            type="button"
            onClick={handleConfirm}
            className="w-full py-2.5 bg-[#311171] hover:bg-[#250d55] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check size={14} />
            <span>ตกลง ({hour || '08'}:{minute || '00'} น.)</span>
          </button>
        </div>
      )}
    </div>
  );
}
