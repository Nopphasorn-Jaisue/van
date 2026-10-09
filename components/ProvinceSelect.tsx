"use client";
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Search, X, Check } from 'lucide-react';
import { thaiProvinces } from '@/Frontend/data/provinces';

interface ProvinceSelectProps {
  value: string;
  onChange: (province: string) => void;
  className?: string;
}



export default function ProvinceSelect({ value, onChange, className = '' }: ProvinceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
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

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredProvinces = thaiProvinces.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return p.nameTh.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q);
  });

  const handleSelect = (provinceName: string) => {
    onChange(provinceName);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:border-[#311171] focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs cursor-pointer text-left"
      >
        <span className="flex items-center gap-1.5 truncate">
          <MapPin size={13} className="text-[#311171] shrink-0" />
          <span className="truncate">{value || 'เลือกจังหวัด'}</span>
        </span>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#311171]' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-[150] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ค้นหาจังหวัด..."
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



          {/* Province List (Scrollable) */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filteredProvinces.length > 0 ? (
              filteredProvinces.map(prov => {
                const isSelected = value === prov.nameTh;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleSelect(prov.nameTh)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-purple-50 text-[#311171] font-black' 
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{prov.nameTh}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({prov.nameEn})</span>
                    </div>
                    {isSelected && <Check size={14} className="text-[#311171] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                ไม่พบจังหวัดที่ค้นหา &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center">
            แสดง {filteredProvinces.length} จาก 77 จังหวัด
          </div>

        </div>
      )}
    </div>
  );
}
