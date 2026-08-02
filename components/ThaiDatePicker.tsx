"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface ThaiDatePickerProps {
  value: string; // ISO format: YYYY-MM-DD
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function ThaiDatePicker({ value, onChange, className = '', placeholder = 'เลือกวันที่', disabled = false }: ThaiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2024);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state if value changes externally or on mount
  useEffect(() => {
    const d = value ? new Date(value) : new Date();
    if (!isNaN(d.getTime())) {
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  }, [value]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    // Format to YYYY-MM-DD (local time)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${date}`);
    setIsOpen(false);
  };

  // Generate calendar grid
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Formatting display value
  const displayValue = value ? (() => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return placeholder;
    return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
  })() : placeholder;

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 border border-gray-200 rounded-xl transition-colors ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-80' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
      >
        <span className={`text-xs font-bold ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayValue}
        </span>
        <CalendarIcon size={16} className="text-gray-500 shrink-0" />
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 top-full left-0 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="font-bold text-sm text-[#311171]">
              {THAI_MONTHS[currentMonth]} {currentYear + 543}
            </div>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {THAI_DAYS_SHORT.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map(blank => (
              <div key={`blank-${blank}`} className="p-2" />
            ))}
            {days.map(day => {
              const isSelected = value && 
                new Date(value).getDate() === day && 
                new Date(value).getMonth() === currentMonth && 
                new Date(value).getFullYear() === currentYear;
                
              const isToday = new Date().getDate() === day && 
                new Date().getMonth() === currentMonth && 
                new Date().getFullYear() === currentYear;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold mx-auto transition-colors
                    ${isSelected 
                      ? 'bg-[#311171] text-white shadow-sm' 
                      : isToday
                        ? 'bg-purple-100 text-[#311171]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
          
          {/* Footer (Today button) */}
          <div className="mt-3 pt-3 border-t border-gray-100 text-center">
            <button 
              onClick={() => {
                const now = new Date();
                setCurrentMonth(now.getMonth());
                setCurrentYear(now.getFullYear());
                handleDateClick(now.getDate());
              }}
              className="text-xs font-bold text-[#311171] hover:text-[#250d55] transition-colors"
            >
              เลือกวันนี้
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
