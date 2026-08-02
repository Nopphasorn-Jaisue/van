"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface ThaiTimePickerProps {
  value: string; // HH:mm format
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export default function ThaiTimePicker({ value, onChange, className = '', placeholder = 'เลือกเวลา' }: ThaiTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHour(h);
      setMinute(m);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirm = () => {
    onChange(`${hour}:${minute}`);
    setIsOpen(false);
  };

  // Pad numbers properly
  const formatNumber = (num: string | number) => {
    return String(num).padStart(2, '0');
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;
    if (val > 23) val = 23;
    if (val < 0) val = 0;
    setHour(formatNumber(val));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) return;
    if (val > 59) val = 59;
    if (val < 0) val = 0;
    setMinute(formatNumber(val));
  };

  const incrementHour = () => {
    setHour(prev => formatNumber((parseInt(prev) + 1) % 24));
  };
  
  const decrementHour = () => {
    setHour(prev => formatNumber((parseInt(prev) - 1 + 24) % 24));
  };

  const incrementMinute = () => {
    setMinute(prev => formatNumber((parseInt(prev) + 1) % 60));
  };
  
  const decrementMinute = () => {
    setMinute(prev => formatNumber((parseInt(prev) - 1 + 60) % 60));
  };

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <span className={`text-xs font-bold ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {value ? `${value} น.` : placeholder}
        </span>
        <Clock size={16} className="text-gray-500 shrink-0" />
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mb-1 bottom-full left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-in fade-in zoom-in-95 duration-100">
          
          <div className="flex items-center justify-center gap-3 mb-4">
            
            {/* Hour Block */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 mb-1">ชั่วโมง</span>
              <button type="button" onClick={decrementHour} className="w-10 h-6 bg-gray-50 rounded text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold">^</button>
              <input 
                type="text" 
                value={hour}
                onChange={handleHourChange}
                onBlur={() => setHour(formatNumber(hour))}
                className="w-12 h-10 text-center font-black text-lg text-[#311171] bg-purple-50 border border-purple-100 rounded-lg outline-none focus:ring-2 focus:ring-[#311171]"
              />
              <button type="button" onClick={incrementHour} className="w-10 h-6 bg-gray-50 rounded text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold rotate-180">^</button>
            </div>
            
            <div className="font-black text-gray-300 text-xl mt-4">:</div>

            {/* Minute Block */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 mb-1">นาที</span>
              <button type="button" onClick={decrementMinute} className="w-10 h-6 bg-gray-50 rounded text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold">^</button>
              <input 
                type="text" 
                value={minute}
                onChange={handleMinuteChange}
                onBlur={() => setMinute(formatNumber(minute))}
                className="w-12 h-10 text-center font-black text-lg text-[#311171] bg-purple-50 border border-purple-100 rounded-lg outline-none focus:ring-2 focus:ring-[#311171]"
              />
              <button type="button" onClick={incrementMinute} className="w-10 h-6 bg-gray-50 rounded text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold rotate-180">^</button>
            </div>
            
          </div>

          <button 
            type="button"
            onClick={handleConfirm}
            className="w-full py-2 bg-[#311171] text-white rounded-lg text-xs font-bold hover:bg-[#250d55] transition-colors shadow-sm"
          >
            ตกลง
          </button>
        </div>
      )}
    </div>
  );
}
