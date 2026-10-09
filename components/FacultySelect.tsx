"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Search, X, Check } from 'lucide-react';
import { facultiesList } from '@/Frontend/data/faculties';

interface FacultySelectProps {
  value: string;
  onChange: (facultyName: string) => void;
  className?: string;
  placeholder?: string;
  excludeFaculty?: string;
}

export default function FacultySelect({
  value,
  onChange,
  className = '',
  placeholder = 'เลือกยืมรถจากคณะอื่น',
  excludeFaculty = ''
}: FacultySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const availableFaculties = facultiesList.filter(f => !excludeFaculty || f.name !== excludeFaculty);

  const filteredFaculties = availableFaculties.filter(f => {
    if (!searchQuery.trim()) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const handleSelect = (facName: string) => {
    onChange(facName);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs text-left h-full ${
          value
            ? 'border-[#311171] bg-purple-50 text-[#311171] ring-2 ring-[#311171]/20'
            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <Building2 size={14} className="text-[#311171] shrink-0" />
          <span className="truncate">{value || placeholder}</span>
        </span>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#311171]' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-[150] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ค้นหาคณะ..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium outline-none focus:border-[#311171] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Faculty List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filteredFaculties.length > 0 ? (
              filteredFaculties.map(fac => {
                const isSelected = value === fac.name;
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => handleSelect(fac.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-purple-50 text-[#311171] font-black' 
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="truncate">{fac.name}</span>
                    {isSelected && <Check size={14} className="text-[#311171] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                ไม่พบคณะที่ค้นหา &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center">
            แสดง {filteredFaculties.length} จาก {availableFaculties.length} คณะ
          </div>

        </div>
      )}
    </div>
  );
}
