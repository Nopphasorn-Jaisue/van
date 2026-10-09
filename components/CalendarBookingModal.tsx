"use client";
import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, Calendar, Clock, X, MapPin, Globe, Users, User, Phone,
  AlertCircle, Plus, Trash2, Send, Check,
  Car, Building2, FileText, ArrowRight,
  Info, ChevronUp, ChevronDown,
  Paperclip, UploadCloud, ExternalLink, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import ThaiDatePicker from '@/components/ThaiDatePicker';
import ThaiTimePicker from '@/components/ThaiTimePicker';
import ProvinceSelect from '@/components/ProvinceSelect';
import FacultySelect from '@/components/FacultySelect';
import { OptimizationRecommendationResult } from '@/Backend/services/van-ranking';

export interface SelectedVanItem {
  id: string;
  vanId: string;
  facultyName?: string;
  isBorrow?: boolean;
  plate?: string;
  driverName?: string;
  phone?: string;
  driverImage?: string;
  vanImage?: string;
}

export interface CalendarModalEvent {
  id?: string | number;
  vanId?: string;
  facultyId?: string;
  date?: Date | string;
  returnDate?: Date | string;
  time?: string;
  destination?: string;
  purpose?: string;
  passengers?: number;
  status?: string;
  bookingFaculty?: string;
  requester?: string;
  phone?: string;
  department?: string;
  tripType?: "ในจังหวัดพะเยา" | "ต่างจังหวัด" | string;
  selectedVans?: SelectedVanItem[];
  assignedVans?: SelectedVanItem[];
  coordinatorName?: string;
  coordinatorPhone?: string;
  passengerNames?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  destinations?: { id: string; place: string; province: string }[];
  attachments?: AttachmentItem[];
  [key: string]: unknown;
}

export interface AttachmentItem {
  id?: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface CalendarBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  editingEvent?: CalendarModalEvent | null;
  currentUser?: { name: string; faculty: string; phone?: string; role?: string } | null;
  initialDate?: string;
  existingBookings?: CalendarModalEvent[];
}

// ฟังก์ชันจัดรูปแบบเบอร์โทรศัพท์ให้อ่านง่าย (Phone Number Masking เช่น 081-234-5678)
const formatPhoneNumber = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

// ฟังก์ชันจัดรูปแบบวันที่ภาษาไทยทางการแบบสั้น (เช่น 15 ก.ย. 2569)
const formatThaiDateShort = (dateVal: string | Date | undefined | null) => {
  if (!dateVal) return '-';
  try {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch {
    return String(dateVal);
  }
};

// ฟังก์ชันจัดรูปแบบวันที่ภาษาไทยทางการแบบเต็ม (เช่น 15 กันยายน พ.ศ. 2569)
const formatThaiDateLong = (dateVal: string | Date | undefined | null) => {
  if (!dateVal) return '-';
  try {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const monthsLong = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${d.getDate()} ${monthsLong[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  } catch {
    return String(dateVal);
  }
};



export default function CalendarBookingModal({
  isOpen,
  onClose,
  onSaveSuccess,
  editingEvent,
  currentUser,
  initialDate,
  existingBookings = []
}: CalendarBookingModalProps) {
  const d = new Date();
  const defaultDateStr = initialDate || `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const userFac = currentUser?.faculty || "คณะเทคโนโลยีสารสนเทศและการสื่อสาร";

  // Form State
  const [form, setForm] = useState({
    // 1. ผู้ขอ & ผู้ประสานงาน
    requester: "",
    requesterPhone: "",
    coordinatorName: "",
    coordinatorPhone: "",
    passengerNames: "",
    bookingFaculty: userFac,

    // 2. วันและเวลาเดินทาง
    startDate: defaultDateStr,
    startTime: "08:30",
    endDate: defaultDateStr,
    endTime: "16:30",

    // 3 & 4. ผู้โดยสารและจำนวนรถ
    passengerCount: 1,
    requestedVehicleCount: 1,

    // 5. ขอบเขต
    tripScope: "ในจังหวัดพะเยา" as "ในจังหวัดพะเยา" | "ต่างจังหวัด",

    // 6. วัตถุประสงค์
    purpose: "",
    budgetSource: "งบประมาณคณะ",

    // 7 & 8. ปลายทางหลายแห่ง & จังหวัด
    destinations: [
      { id: "dest-1", place: "", province: "พะเยา" }
    ],

    // 9. จุดรับและจุดส่ง
    pickupLocation: "มหาวิทยาลัยพะเยา",
    dropoffLocation: "",

    // 10. Preference คณะ
    preferredFaculty: "all",
    selectedVanIds: [] as string[]
  });

  const [rankingData, setRankingData] = useState<OptimizationRecommendationResult | null>(null);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File Attachments State
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Check if current editing event is part of a fleet or borrowed booking
  const isEditingFleet = Boolean(
    editingEvent && (
      (editingEvent.assignedVans && editingEvent.assignedVans.length > 1) ||
      (editingEvent.assignedVans && editingEvent.assignedVans.some(v => v.isBorrow)) ||
      editingEvent.status === 'pending_cross_faculty' ||
      (typeof editingEvent.statusText === 'string' && editingEvent.statusText.includes('ยืม')) ||
      (typeof editingEvent.purpose === 'string' && editingEvent.purpose.includes('คันที่ '))
    )
  );

  // คำนวณระยะเวลาเดินทางแบบไดนามิก (Trip Duration Summary)
  const getTripDurationText = () => {
    if (!form.startDate || !form.endDate) return '';
    try {
      const s = new Date(`${form.startDate}T${form.startTime || '08:30'}:00`);
      const e = new Date(`${form.endDate}T${form.endTime || '16:30'}:00`);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return '';

      const diffMs = e.getTime() - s.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (form.startDate === form.endDate) {
        if (diffMins === 0) return `ระยะเวลาประมาณ ${diffHrs} ชั่วโมง (${form.startTime} - ${form.endTime} น.)`;
        return `ระยะเวลาประมาณ ${diffHrs} ชม. ${diffMins} นาที (${form.startTime} - ${form.endTime} น.)`;
      }

      const sDay = new Date(form.startDate);
      const eDay = new Date(form.endDate);
      const days = Math.round((eDay.getTime() - sDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const nights = Math.max(1, days - 1);
      return `ระยะเวลา ${days} วัน ${nights} คืน (รวมประมาณ ${diffHrs} ชั่วโมง)`;
    } catch {
      return '';
    }
  };

  // Initialize or reset form when modal opens or editingEvent changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingEvent) {
      let sDate = defaultDateStr;
      let eDate = defaultDateStr;
      if (editingEvent.date) {
        const sd = editingEvent.date instanceof Date ? editingEvent.date : new Date(editingEvent.date);
        if (!isNaN(sd.getTime())) {
          sDate = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
        }
      }
      if (editingEvent.returnDate) {
        const ed = editingEvent.returnDate instanceof Date ? editingEvent.returnDate : new Date(editingEvent.returnDate);
        if (!isNaN(ed.getTime())) {
          eDate = `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`;
        }
      } else {
        eDate = sDate;
      }

      let sTime = "08:30";
      let eTime = "16:30";
      if (editingEvent.time) {
        const cleaned = editingEvent.time.replace(/น\./g, '').trim();
        const parts = cleaned.split('-').map(s => s.trim());
        if (parts[0]) sTime = parts[0];
        if (parts[1]) eTime = parts[1];
      }

      const existingDests = editingEvent.destinations && editingEvent.destinations.length > 0 
        ? editingEvent.destinations 
        : [{ id: "dest-1", place: editingEvent.destination || "", province: "พะเยา" }];

      const initialSelectedVanIds = editingEvent.assignedVans?.map(v => v.vanId) || 
        (editingEvent.vanId ? [editingEvent.vanId] : []);

      setForm({
        requester: editingEvent.requester || currentUser?.name || "",
        requesterPhone: formatPhoneNumber(editingEvent.phone || currentUser?.phone || ""),
        coordinatorName: editingEvent.coordinatorName || "",
        coordinatorPhone: formatPhoneNumber(editingEvent.coordinatorPhone || ""),
        passengerNames: editingEvent.passengerNames || "",
        bookingFaculty: editingEvent.bookingFaculty || userFac,
        startDate: sDate,
        startTime: sTime,
        endDate: eDate,
        endTime: eTime,
        passengerCount: Number(editingEvent.passengers || 1),
        requestedVehicleCount: Math.max(1, initialSelectedVanIds.length),
        tripScope: (editingEvent.tripType === "ต่างจังหวัด" ? "ต่างจังหวัด" : "ในจังหวัดพะเยา") as "ในจังหวัดพะเยา" | "ต่างจังหวัด",
        purpose: editingEvent.purpose || "",
        budgetSource: "งบประมาณคณะ",
        destinations: existingDests,
        pickupLocation: editingEvent.pickupLocation || "มหาวิทยาลัยพะเยา",
        dropoffLocation: editingEvent.dropoffLocation || "",
        preferredFaculty: "all",
        selectedVanIds: initialSelectedVanIds
      });
      setAttachments((editingEvent.attachments as AttachmentItem[]) || []);
    } else {
      // New booking modal
      setAttachments([]);
      setForm({
        requester: currentUser?.name || "",
        requesterPhone: formatPhoneNumber(currentUser?.phone || ""),
        coordinatorName: "",
        coordinatorPhone: "",
        passengerNames: "",
        bookingFaculty: userFac,
        startDate: defaultDateStr,
        startTime: "08:30",
        endDate: defaultDateStr,
        endTime: "16:30",
        passengerCount: 1,
        requestedVehicleCount: 1,
        tripScope: "ในจังหวัดพะเยา",
        purpose: "",
        budgetSource: "งบประมาณคณะ",
        destinations: [{ id: `dest-${Date.now()}`, place: "", province: "พะเยา" }],
        pickupLocation: "มหาวิทยาลัยพะเยา",
        dropoffLocation: "",
        preferredFaculty: "all",
        selectedVanIds: []
      });
      setAttachments([]);
    }
    setFormError(null);
  }, [isOpen, editingEvent, currentUser, defaultDateStr, userFac]);

  // File Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    setUploadError(null);

    const fileList = Array.from(files);
    const newItems: AttachmentItem[] = [];

    for (const file of fileList) {
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`ไฟล์ ${file.name} มีขนาดเกิน 25 MB`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'documents');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            newItems.push({
              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: data.fileName || file.name,
              url: data.url,
              size: data.fileSize || file.size,
              type: data.fileType || file.type
            });
            continue;
          }
        }
      } catch (uploadErr) {
        console.warn("Upload API error, falling back to base64 data url:", uploadErr);
      }

      // Fallback to Base64 Data URL if server upload endpoint fails or offline
      try {
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newItems.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url: base64Url,
          size: file.size,
          type: file.type
        });
      } catch (err) {
        console.error("FileReader fallback error:", err);
      }
    }

    if (newItems.length > 0) {
      setAttachments(prev => [...prev, ...newItems]);
    }

    setIsUploadingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileBadge = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return { label: 'PDF', bg: 'bg-rose-500 text-white', iconColor: 'text-rose-500' };
    }
    if (ext === 'doc' || ext === 'docx') {
      return { label: 'DOC', bg: 'bg-blue-600 text-white', iconColor: 'text-blue-600' };
    }
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
      return { label: 'XLS', bg: 'bg-emerald-600 text-white', iconColor: 'text-emerald-600' };
    }
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      return { label: 'IMG', bg: 'bg-purple-600 text-white', iconColor: 'text-purple-600' };
    }
    return { label: ext?.toUpperCase() || 'FILE', bg: 'bg-slate-600 text-white', iconColor: 'text-slate-600' };
  };

  // Run Optimization & Ranking when date/time or parameters change (debounced 350ms to save DB Egress bandwidth)
  useEffect(() => {
    if (!isOpen || !form.startDate || !form.startTime || !form.endDate || !form.endTime) return;

    // Skip query if same-day times are invalid (start time >= end time)
    if (form.startDate === form.endDate && form.startTime >= form.endTime) {
      return;
    }

    const startIso = `${form.startDate}T${form.startTime}:00`;
    const endIso = `${form.endDate}T${form.endTime}:00`;

    setIsLoadingRanking(true);
    const debounceTimer = setTimeout(() => {
      fetch('/api/vans/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAt: startIso,
          endAt: endIso,
          requestedCount: form.requestedVehicleCount,
          passengerCount: form.passengerCount,
          preferredFaculty: form.preferredFaculty === 'own' ? userFac : form.preferredFaculty,
          userFaculty: userFac
        })
      })
        .then(res => res.json())
        .then(data => {
          const resObj = (data.result || data) as OptimizationRecommendationResult;
          if (resObj && resObj.rankedAvailableVans) {
            setRankingData(resObj);
            // Auto select the top available vans if none selected or if count changed
            const availableVans = resObj.rankedAvailableVans || [];
            const topIds = availableVans.slice(0, form.requestedVehicleCount).map((v: { id: string }) => v.id);
            setForm(prev => {
              if (prev.selectedVanIds.length === 0 || prev.selectedVanIds.length !== prev.requestedVehicleCount) {
                return { ...prev, selectedVanIds: topIds };
              }
              return prev;
            });
          }
        })
        .catch(err => console.error("Error fetching ranking:", err))
        .finally(() => setIsLoadingRanking(false));
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [isOpen, form.startDate, form.startTime, form.endDate, form.endTime, form.requestedVehicleCount, form.passengerCount, form.preferredFaculty, userFac]);

  // Destination helpers
  const addDestination = () => {
    setForm(prev => ({
      ...prev,
      destinations: [
        ...prev.destinations,
        { id: `dest-${Date.now()}-${prev.destinations.length + 1}`, place: '', province: 'พะเยา' }
      ]
    }));
  };

  const removeDestination = (id: string) => {
    if (form.destinations.length <= 1) return;
    setForm(prev => ({
      ...prev,
      destinations: prev.destinations.filter(d => d.id !== id)
    }));
  };

  const moveDestination = (index: number, direction: 'up' | 'down') => {
    setForm(prev => {
      const nextDests = [...prev.destinations];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= nextDests.length) return prev;
      const temp = nextDests[index];
      nextDests[index] = nextDests[targetIndex];
      nextDests[targetIndex] = temp;
      return { ...prev, destinations: nextDests };
    });
  };

  const updateDestination = (id: string, field: 'place' | 'province', val: string) => {
    setForm(prev => ({
      ...prev,
      destinations: prev.destinations.map(d => d.id === id ? { ...d, [field]: val } : d)
    }));
  };



  const toggleVanSelection = (vanId: string) => {
    setForm(prev => {
      if (prev.selectedVanIds.includes(vanId)) {
        if (isEditingFleet) {
          const v = rankingData?.rankedAvailableVans.find(item => item.id === vanId) || rankingData?.allVansStatus?.find(item => item.id === vanId);
          const isBorrow = v ? v.facultyName !== userFac : false;
          if (isBorrow || prev.selectedVanIds.length > 1) {
            Swal.fire({
              icon: 'warning',
              title: 'ข้อกำหนดการยกเลิก/ลบรถที่ยืม',
              html: `<div class="text-xs text-slate-600 text-left space-y-2">
                <p>คำขอนี้เป็นขบวนรถหรือมีการยืมรถจากคณะอื่น</p>
                <p>ตามระเบียบ <b>ไม่สามารถลบเฉพาะรถที่ยืมออกได้</b> หากต้องการยกเลิกการยืมรถ <b>จะต้องลบรายการจองทั้งขบวนออกทั้งหมด</b> แล้วทำการยื่นคำขอจองใหม่อีกครั้ง</p>
              </div>`,
              confirmButtonText: 'รับทราบ',
              confirmButtonColor: '#311171'
            });
            return prev;
          }
        }
        return {
          ...prev,
          selectedVanIds: prev.selectedVanIds.filter(id => id !== vanId)
        };
      } else {
        if (prev.selectedVanIds.length >= prev.requestedVehicleCount) {
          const next = [...prev.selectedVanIds.slice(1), vanId];
          return { ...prev, selectedVanIds: next };
        }
        return {
          ...prev,
          selectedVanIds: [...prev.selectedVanIds, vanId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Same-day time validation
    if (form.startDate === form.endDate && form.startTime >= form.endTime) {
      setFormError("เวลาสิ้นสุดการเดินทางต้องอยู่หลังเวลาเริ่มต้น (ในวันเดียวกัน)");
      setIsSubmitting(false);
      return;
    }

    // Validation
    const cleanRequesterPhone = (form.requesterPhone || '').replace(/\D/g, '');
    if (!form.requester.trim()) {
      setFormError("กรุณากรอกชื่อผู้ขอใช้บริการ");
      setIsSubmitting(false);
      return;
    }
    if (cleanRequesterPhone.length !== 10 || !cleanRequesterPhone.startsWith('0')) {
      setFormError("กรุณากรอกเบอร์โทรศัพท์ผู้ขอใช้บริการให้ถูกต้อง (10 หลัก ขึ้นต้นด้วย 0)");
      setIsSubmitting(false);
      return;
    }

    if (form.coordinatorPhone) {
      const cleanCoordPhone = form.coordinatorPhone.replace(/\D/g, '');
      if (cleanCoordPhone.length !== 10 || !cleanCoordPhone.startsWith('0')) {
        setFormError("เบอร์โทรศัพท์ผู้ประสานงานต้องมี 10 หลักและขึ้นต้นด้วย 0");
        setIsSubmitting(false);
        return;
      }
    }

    const filledDestinations = form.destinations.filter(d => d.place.trim());
    if (filledDestinations.length === 0) {
      setFormError("กรุณาระบุสถานที่ปลายทางอย่างน้อย 1 แห่ง");
      setIsSubmitting(false);
      return;
    }

    if (!form.purpose.trim()) {
      setFormError("กรุณาระบุวัตถุประสงค์การเดินทาง");
      setIsSubmitting(false);
      return;
    }

    const combinedDestination = filledDestinations.map(d => `${d.place} (${d.province})`).join(', ');
    const combinedTime = `${form.startTime} - ${form.endTime} น.`;

    // Overlap conflict checking
    const parseTimeStr = (t: string) => {
      const parts = t.replace(/น\./g, '').split('-').map(s => s.trim());
      return { start: parts[0] || '08:30', end: parts[1] || '16:30' };
    };

    const newStart = form.startTime;
    const newEnd = form.endTime;

    for (const vId of form.selectedVanIds) {
      const conflict = existingBookings.find(b => {
        if (editingEvent?.id && b.id === editingEvent.id) return false;
        if (b.status === 'rejected' || b.status === 'cancelled') return false;
        if (b.vanId !== vId) return false;

        const bStartDate = b.date instanceof Date ? b.date.toISOString().slice(0, 10) : String(b.date).slice(0, 10);
        const bEndDate = b.returnDate ? (b.returnDate instanceof Date ? b.returnDate.toISOString().slice(0, 10) : String(b.returnDate).slice(0, 10)) : bStartDate;

        const targetStart = form.startDate;
        const targetEnd = form.endDate;

        const isDateOverlap = targetStart <= bEndDate && targetEnd >= bStartDate;
        if (!isDateOverlap) return false;

        const bTime = parseTimeStr(b.time || '');
        return (newStart < bTime.end) && (newEnd > bTime.start);
      });

      if (conflict) {
        const targetVan = rankingData?.rankedAvailableVans.find(v => v.id === vId) || rankingData?.allVansStatus?.find(v => v.id === vId);
        const vanLabel = targetVan ? `${targetVan.vanName} (${targetVan.plate})` : 'รถตู้ที่เลือก';
        const dateText = conflict.returnDate && String(conflict.returnDate) !== String(conflict.date)
          ? `${formatThaiDateLong(conflict.date)} ถึง ${formatThaiDateLong(conflict.returnDate)}`
          : formatThaiDateLong(conflict.date);

        const result = await Swal.fire({
          icon: 'warning',
          title: 'แจ้งเตือนคิวจองซ้ำซ้อน',
          html: `<div class="text-left text-xs space-y-1">
            <p><b>${vanLabel}</b> มีคิวจองในช่วงเวลาเดียวกันแล้ว:</p>
            <p>• วันที่: ${dateText}</p>
            <p>• เวลา: ${conflict.time}</p>
            <p>• ผู้ขอ: ${conflict.requester || '-'}</p>
            <p>• ปลายทาง: ${conflict.destination}</p>
            <p class="pt-2 font-bold text-amber-700">คุณต้องการยืนยันบันทึกการจองนี้ต่อไปหรือไม่?</p>
          </div>`,
          showCancelButton: true,
          confirmButtonText: 'ยืนยันบันทึกต่อไป',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#311171'
        });

        if (!result.isConfirmed) {
          setIsSubmitting(false);
          return;
        }
        break;
      }
    }

    // Prepare assigned vans payload
    const primaryVanId = form.selectedVanIds[0] || "3";
    const primaryVan = rankingData?.rankedAvailableVans.find(v => v.id === primaryVanId) || rankingData?.allVansStatus?.find(v => v.id === primaryVanId);

    const assignedVansList: SelectedVanItem[] = form.selectedVanIds.map((vId, idx) => {
      const v = rankingData?.rankedAvailableVans.find(item => item.id === vId) || rankingData?.allVansStatus?.find(item => item.id === vId);
      const isBorrow = v ? v.facultyName !== userFac : false;
      return {
        id: `van-${Date.now()}-${idx + 1}`,
        vanId: vId,
        facultyName: v ? v.facultyName : userFac,
        isBorrow: isBorrow,
        plate: v ? v.plate : '',
        driverName: v ? v.driverName : '',
        phone: v ? v.driverPhone : '',
        driverImage: v ? v.driverImage : '',
        vanImage: v ? v.vanImage : ''
      };
    });

    const isCrossFaculty = assignedVansList.some(v => v.isBorrow);
    const now = new Date();
    const timestampStr = now.toISOString();
    const currentYearBE = now.getFullYear() + 543;
    const generatedBookingId = `UPV-${currentYearBE}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const payload = {
      id: editingEvent?.id || undefined,
      booking_id: generatedBookingId,
      request_timestamp: timestampStr,
      vanId: primaryVanId,
      facultyId: primaryVan ? primaryVan.facultyId : "ict",
      bookingFaculty: userFac,
      destination: combinedDestination,
      destinations: filledDestinations,
      purpose: form.purpose.trim(),
      purpose_raw: form.purpose.trim(),
      purposeDetail: form.purpose.trim(),
      routeDetail: `${form.pickupLocation} ไปยัง ${combinedDestination}`,
      date: form.startDate,
      returnDate: form.endDate,
      time: combinedTime,
      passengers: Number(form.passengerCount || 1),
      passenger_count: Number(form.passengerCount || 1),
      requested_vehicle_count: Number(form.requestedVehicleCount || 1),
      requester: form.requester.trim(),
      phone: cleanRequesterPhone,
      coordinator_name: form.coordinatorName.trim(),
      coordinator_phone: form.coordinatorPhone.trim(),
      passenger_names: form.passengerNames.trim(),
      pickup_location: form.pickupLocation.trim(),
      dropoff_location: form.dropoffLocation.trim(),
      department: "สำนักงานคณบดี",
      tripType: form.tripScope,
      trip_scope: form.tripScope,
      status: isCrossFaculty ? "pending_cross_faculty" : "pending",
      statusText: isCrossFaculty ? "รอการยืนยันจากคณะเจ้าของรถ" : "รอดำเนินการ (รอคณบดีอนุมัติ)",
      statusTime: "บันทึกในระบบ",
      assignedVans: assignedVansList,
      selectedVans: assignedVansList,
      attachments: attachments
    };

    try {
      const res = await fetch('/api/calendar-events', {
        method: editingEvent?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "เกิดข้อผิดพลาดในการบันทึกตาราง");
      }

      await Swal.fire({
        icon: 'success',
        title: editingEvent?.id ? 'แก้ไขข้อมูลสำเร็จ' : 'บันทึกคำขอจองสำเร็จ',
        html: `<div class="text-xs text-slate-600 space-y-1">
          <p><b>รหัสคำขอ:</b> ${generatedBookingId}</p>
          <p><b>ประทับเวลา (FCFS):</b> ${new Date(timestampStr).toLocaleString('th-TH')}</p>
          <p><b>จำนวนรถ:</b> ${form.requestedVehicleCount} คัน (บันทึกเข้าระบบเรียบร้อย)</p>
        </div>`,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#311171'
      });

      onSaveSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Save calendar error:", err);
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      setFormError(msg);
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถบันทึกได้',
        text: msg,
        confirmButtonColor: '#311171'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isSameDayTrip = form.startDate === form.endDate;
  const durationText = getTripDurationText();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[26px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#21094f] via-[#2f0f6e] to-[#43169c] text-white flex items-center justify-between shrink-0 shadow-md border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0">
              <CalendarDays size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/15 text-purple-100">
                  Van Booking Dispatch
                </span>
                <span className="text-[11px] text-purple-200 font-medium">
                  {userFac}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5">
                {editingEvent?.id ? 'แก้ไขตารางการจองรถตู้' : 'เพิ่มตารางการจองรถตู้'}
              </h2>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* Error Banner */}
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-bold animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* SECTION 1: กำหนดการและช่วงเวลาเดินทาง */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#311171] flex items-center justify-center">
                  <Calendar size={15} />
                </div>
                <span>1. กำหนดการและช่วงเวลาเดินทาง</span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {durationText && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#311171] border border-purple-200 shadow-2xs">
                    <Clock size={12} className="text-[#311171]" />
                    <span>{durationText}</span>
                  </div>
                )}
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs transition-colors bg-white text-slate-700 border-slate-200">
                  {isSameDayTrip ? (
                    <>
                      <Clock size={12} className="text-[#311171]" />
                      <span>ทริปวันเดียว (ไป - กลับ)</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={12} className="text-[#311171]" />
                      <span>ทริปข้ามคืน / เดินทางหลายวัน</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* ขาไป */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ArrowRight size={13} className="text-emerald-600" />
                    กำหนดการขาไป (วันที่ และ เวลาเริ่มต้น)
                  </span>
                  <span className="text-rose-500 font-black">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <ThaiDatePicker 
                    value={form.startDate}
                    onChange={val => setForm(prev => {
                      const nextEnd = prev.endDate < val ? val : prev.endDate;
                      return { ...prev, startDate: val, endDate: nextEnd };
                    })}
                  />
                  <ThaiTimePicker 
                    value={form.startTime}
                    onChange={val => setForm(prev => {
                      let nextEndTime = prev.endTime;
                      if (prev.startDate === prev.endDate && nextEndTime <= val) {
                        const [sH, sM] = val.split(':').map(Number);
                        const autoH = Math.min(23, (sH || 8) + 2);
                        nextEndTime = `${String(autoH).padStart(2, '0')}:${String(sM || 0).padStart(2, '0')}`;
                      }
                      return { ...prev, startTime: val, endTime: nextEndTime };
                    })}
                  />
                </div>
              </div>

              {/* ขากลับ */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
                <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <ArrowRight size={13} className="text-amber-600 rotate-180" />
                    กำหนดการขากลับ (วันที่ และ เวลาสิ้นสุด)
                  </span>
                  <span className="text-rose-500 font-black">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <ThaiDatePicker 
                    value={form.endDate}
                    onChange={val => setForm(prev => ({
                      ...prev,
                      endDate: val < prev.startDate ? prev.startDate : val
                    }))}
                  />
                  <ThaiTimePicker 
                    value={form.endTime}
                    onChange={val => setForm(prev => ({ ...prev, endTime: val }))}
                  />
                </div>
              </div>
            </div>

            {/* Same-day Time Error Banner */}
            {form.startDate === form.endDate && form.startTime >= form.endTime && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-bold animate-in fade-in">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <div>
                  <span>เวลาขากลับต้องอยู่หลังเวลาขาไป:</span>
                  <span className="font-normal text-rose-600 ml-1">
                    (ขาไป {form.startTime} น. ขากลับควรตั้งเป็นเวลาหลังจากนี้)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: ข้อมูลผู้ขอใช้บริการ & ผู้ประสานงาน */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#311171] flex items-center justify-center">
                  <User size={15} />
                </div>
                <span>2. ข้อมูลผู้ขอใช้บริการและผู้ประสานงาน</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Building2 size={12} className="text-slate-400" />
                สังกัด: {userFac}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อผู้ขอใช้บริการ <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <User size={14} />
                  </span>
                  <input 
                    required
                    type="text"
                    value={form.requester}
                    onChange={e => setForm({ ...form, requester: e.target.value })}
                    placeholder="เช่น ผศ.ดร.สมชาย ใจดี"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800 outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ผู้ขอ (10 หลัก) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Phone size={14} />
                  </span>
                  <input 
                    required
                    type="tel"
                    maxLength={12}
                    value={form.requesterPhone}
                    onChange={e => setForm({ ...form, requesterPhone: formatPhoneNumber(e.target.value) })}
                    placeholder="เช่น 081-234-5678"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800 outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อผู้ประสานงานประจำทริป <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <User size={14} />
                  </span>
                  <input 
                    type="text"
                    value={form.coordinatorName}
                    onChange={e => setForm({ ...form, coordinatorName: e.target.value })}
                    placeholder="เช่น นายประสาน งานดี"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบอร์โทรผู้ประสานงาน (10 หลัก) <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <Phone size={14} />
                  </span>
                  <input 
                    type="tel"
                    maxLength={12}
                    value={form.coordinatorPhone}
                    onChange={e => setForm({ ...form, coordinatorPhone: formatPhoneNumber(e.target.value) })}
                    placeholder="เช่น 089-876-5432"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รายชื่อผู้โดยสารและตำแหน่ง <span className="text-slate-400 font-normal">(ไม่รวมคนขับ)</span>
              </label>
              <textarea 
                rows={2}
                value={form.passengerNames}
                onChange={e => setForm({ ...form, passengerNames: e.target.value })}
                placeholder="เช่น 1. ดร.สมศักดิ์ (อาจารย์) 2. นายกิตติ (นิสิต) 3. น.ส.วิภา (เจ้าหน้าที่)..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs resize-none"
              />
            </div>
          </div>

          {/* SECTION 3: เส้นทาง จุดรับ-ส่ง และสถานที่ปลายทาง */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#311171] flex items-center justify-center">
                  <MapPin size={15} />
                </div>
                <span>3. เส้นทางและสถานที่ปลายทาง</span>
              </div>
            </div>

            {/* ขอบเขตการเดินทาง */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ขอบเขตการเดินทาง</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tripScope: 'ในจังหวัดพะเยา' })}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    form.tripScope === 'ในจังหวัดพะเยา'
                      ? 'bg-[#311171] text-white border-[#311171] ring-2 ring-[#311171]/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MapPin size={15} className={form.tripScope === 'ในจังหวัดพะเยา' ? 'text-white' : 'text-[#311171]'} />
                  <span>ในจังหวัดพะเยา</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tripScope: 'ต่างจังหวัด' })}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    form.tripScope === 'ต่างจังหวัด'
                      ? 'bg-[#311171] text-white border-[#311171] ring-2 ring-[#311171]/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Globe size={15} className={form.tripScope === 'ต่างจังหวัด' ? 'text-white' : 'text-[#311171]'} />
                  <span>ต่างจังหวัด (ภายนอกจังหวัด)</span>
                </button>
              </div>
            </div>

            {/* จุดรับ & จุดส่ง */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จุดรับผู้โดยสาร <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <MapPin size={14} />
                  </span>
                  <input 
                    required
                    type="text"
                    value={form.pickupLocation}
                    onChange={e => setForm({ ...form, pickupLocation: e.target.value })}
                    placeholder="เช่น มหาวิทยาลัยพะเยา, หน้าอาคาร ICT"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จุดส่งผู้โดยสาร <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400">
                    <MapPin size={14} />
                  </span>
                  <input 
                    type="text"
                    value={form.dropoffLocation}
                    onChange={e => setForm({ ...form, dropoffLocation: e.target.value })}
                    placeholder="เช่น มหาวิทยาลัยพะเยา"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* ปลายทางหลายแห่ง + 77 จังหวัด (Searchable Dropdown) */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    สถานที่ปลายทาง (ระบุได้หลายแห่ง) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 block">สามารถพิมพ์ค้นหาจังหวัดได้ในกล่องตัวเลือก</span>
                </div>
                <button
                  type="button"
                  onClick={addDestination}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#311171] hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                >
                  <Plus size={13} />
                  <span>เพิ่มจุดหมาย</span>
                </button>
              </div>



              <div className="space-y-2.5">
                {form.destinations.map((dest, idx) => (
                  <div key={dest.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                    <span className="w-6 h-6 rounded-lg bg-[#311171] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input 
                      required
                      type="text"
                      placeholder="ระบุสถานที่ปลายทาง เช่น ศูนย์ประชุมนานาชาติเชียงใหม่"
                      value={dest.place}
                      onChange={e => updateDestination(dest.id, 'place', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 outline-none focus:border-[#311171] transition-colors"
                    />
                    
                    {/* Searchable Province Dropdown */}
                    <ProvinceSelect
                      value={dest.province}
                      onChange={newProvince => {
                        updateDestination(dest.id, 'province', newProvince);
                        if (newProvince !== 'พะเยา' && form.tripScope === 'ในจังหวัดพะเยา') {
                          setForm(prev => ({ ...prev, tripScope: 'ต่างจังหวัด' }));
                        }
                      }}
                      className="w-44 shrink-0"
                    />

                    {form.destinations.length > 1 && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveDestination(idx, 'up')}
                          className="p-1 text-slate-400 hover:text-[#311171] disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="เลื่อนลำดับขึ้น"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === form.destinations.length - 1}
                          onClick={() => moveDestination(idx, 'down')}
                          className="p-1 text-slate-400 hover:text-[#311171] disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="เลื่อนลำดับลง"
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDestination(dest.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-0.5"
                          title="ลบจุดหมายนี้"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: วัตถุประสงค์และการเลือกรถตู้ */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#311171] flex items-center justify-center">
                  <Car size={15} />
                </div>
                <span>4. รายละเอียดภารกิจและการจัดสรรรถตู้</span>
              </div>
              <span className="text-[11px] font-bold text-[#311171] bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                คนขับประจำรถ
              </span>
            </div>

            {/* วัตถุประสงค์ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วัตถุประสงค์การเดินทาง <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">
                  <FileText size={14} />
                </span>
                <input 
                  required
                  type="text"
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  placeholder="เช่น เข้าร่วมการแข่งขันโครงงานวิชาการ, นำนิสิตศึกษาดูงานนอกสถานที่..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium text-slate-800 outline-none focus:border-[#311171] focus:ring-2 focus:ring-[#311171]/10 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* ผู้โดยสาร & จำนวนรถ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users size={14} className="text-[#311171]" />
                  <span>จำนวนผู้โดยสารรวม (คน) <span className="text-rose-500">*</span></span>
                </label>
                <input 
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={form.passengerCount}
                  onChange={e => setForm({ ...form, passengerCount: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800 outline-none focus:border-[#311171] transition-all"
                />
                <span className="text-[10px] text-slate-400 block">
                  จำนวนผู้โดยสารรวมทั้งหมดของภารกิจ ไม่รวมคนขับ
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Car size={14} className="text-[#311171]" />
                  <span>จำนวนรถตู้ที่ต้องการ (คัน) <span className="text-rose-500">*</span></span>
                </label>
                <input 
                  type="number"
                  min={1}
                  max={5}
                  required
                  value={form.requestedVehicleCount}
                  onChange={e => setForm({ ...form, requestedVehicleCount: Math.max(1, Number(e.target.value)) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-black text-[#311171] outline-none focus:border-[#311171] transition-all"
                />
                <span className="text-[10px] text-slate-400 block">
                  ระบุจำนวนรถที่ต้องการ รองรับการขอหลายคัน
                </span>
              </div>
            </div>

            {/* Capacity Warning Banner */}
            {rankingData?.capacityWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">คำเตือนด้านความจุ:</span> ผู้โดยสาร {form.passengerCount} คน อาจเกินความจุมาตรฐานของรถที่เลือก ({rankingData.totalCapacityOfAvailable} ที่นั่ง)
                  <span className="block text-[10px] text-amber-700/80 mt-0.5">
                    ระบบอนุญาตให้บันทึกคำขอได้ โดยผู้ดูแลระบบจะเป็นผู้ตัดสินใจขั้นสุดท้าย
                  </span>
                </div>
              </div>
            )}

            {/* Preference การเลือกคณะ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ความประสงค์ในการเลือกคณะ</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, preferredFaculty: 'all' })}
                  className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer shadow-2xs ${
                    form.preferredFaculty === 'all'
                      ? 'border-[#311171] bg-purple-50 text-[#311171] ring-2 ring-[#311171]/20 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <p className="font-black text-xs flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#311171]" />
                    ค้นหาจากทุกคณะ
                  </p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">ระบบคัดเลือกรถที่เหมาะสมที่สุด</p>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, preferredFaculty: 'own' })}
                  className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer shadow-2xs ${
                    form.preferredFaculty === 'own'
                      ? 'border-[#311171] bg-purple-50 text-[#311171] ring-2 ring-[#311171]/20 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <p className="font-black text-xs flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#311171]" />
                    รถประจำคณะตนเอง
                  </p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">{userFac}</p>
                </button>

                {/* Searchable Faculty Dropdown */}
                <FacultySelect
                  value={form.preferredFaculty !== 'all' && form.preferredFaculty !== 'own' ? form.preferredFaculty : ''}
                  onChange={facName => {
                    setForm(prev => ({ ...prev, preferredFaculty: facName }));
                  }}
                  excludeFaculty={userFac}
                  placeholder="เลือกยืมรถจากคณะอื่น"
                />
              </div>
            </div>

            {/* Warning banner for editing fleet / borrowed requests */}
            {editingEvent && isEditingFleet && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950">ข้อกำหนดการปรับเปลี่ยนรถในขบวน/คำขอยืมรถ:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    คำขอนี้เป็นขบวนรถหรือมีการยืมรถจากคณะอื่น หากท่านต้องการยกเลิกหรือลบรถที่ยืมคณะอื่นออกไป ตามระเบียบจะไม่สามารถลบออกเฉพาะคันได้ <b>การลบ 1 คันจะต้องลบรายการจองทั้งขบวนออกทั้งหมด</b> และทำการยื่นคำขอจองใหม่อีกครั้ง
                  </p>
                </div>
              </div>
            )}

            {/* Partial Fulfillment Summary */}
            {rankingData && (
              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200/80 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Info size={15} className="text-[#311171] shrink-0" />
                  <div>
                    <span className="text-xs font-black text-[#311171]">ผลการค้นหารถที่พร้อมให้บริการ:</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      ขอทั้งหมด <b>{form.requestedVehicleCount}</b> คัน • พบพร้อมให้บริการ <b>{rankingData.availableCount}</b> คัน
                      {rankingData.missingCount > 0 && (
                        <span className="text-amber-700 font-bold ml-1.5">
                          (ยังขาดอีก {rankingData.missingCount} คัน)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  เลือกแล้ว {form.selectedVanIds.length} จาก {form.requestedVehicleCount} คัน
                </span>
              </div>
            )}

            {/* Recommended Vans Cards (ไม่แตะต้องเรื่องที่นั่งตามข้อยกเว้นข้อที่ 5) */}
            {isLoadingRanking ? (
              <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-[#311171] border-t-transparent rounded-full animate-spin mx-auto" />
                <span className="text-xs font-medium">กำลังตรวจสอบคิวว่างและจัดอันดับภาระงาน...</span>
              </div>
            ) : rankingData && rankingData.rankedAvailableVans.length > 0 ? (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {rankingData.rankedAvailableVans.map(van => {
                  const isSelected = form.selectedVanIds.includes(van.id);
                  return (
                    <div 
                      key={van.id}
                      onClick={() => toggleVanSelection(van.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                        isSelected
                          ? 'border-[#311171] bg-purple-50/90 ring-2 ring-[#311171]/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected ? 'bg-[#311171] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{van.rank}
                        </div>
                        
                        {/* Driver / Van avatar or icon */}
                        {(() => {
                          const displayImg = (van.driverImage && van.driverImage.trim() !== '' && !van.driverImage.includes('unsplash.com'))
                            ? van.driverImage.trim()
                            : (van.vanImage && van.vanImage.trim() !== '' && !van.vanImage.includes('unsplash.com'))
                              ? van.vanImage.trim()
                              : null;

                          if (displayImg) {
                            return (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={displayImg} 
                                alt={van.driverName || "driver"} 
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs bg-slate-50 ring-1 ring-purple-100" 
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (van.vanImage && target.src !== van.vanImage) {
                                    target.src = van.vanImage;
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                            );
                          }

                          return (
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                              <User size={16} />
                            </div>
                          );
                        })()}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-slate-900 truncate">{van.facultyName}</span>
                            <span className="text-[11px] text-[#311171] font-bold px-1.5 py-0.5 rounded bg-purple-100/60 shrink-0">
                              {van.plate}
                            </span>
                            {van.facultyName !== userFac ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                                ขอยืมรถจากคณะอื่น
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100/70 text-[#311171] shrink-0">
                                รถประจำคณะ
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            คนขับ: {van.driverName} • โทร: {van.driverPhone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">ภาระงาน</span>
                          <span className="text-[11px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                            {van.workloadScore} งาน
                          </span>
                        </div>
                        
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#311171] text-white shadow-2xs' : 'border border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>ไม่พบรถตู้ที่ว่างตรงกับช่วงวันและเวลาที่กำหนด กรุณาปรับเปลี่ยนเวลาหรือติดต่อผู้ดูแลระบบส่วนกลาง</span>
              </div>
            )}
          </div>

          {/* SECTION 5: เอกสารประกอบและไฟล์แนบคำขอ (Attachments) */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#311171] flex items-center justify-center">
                  <Paperclip size={15} />
                </div>
                <span>5. เอกสารประกอบและไฟล์แนบคำขอ</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                {attachments.length > 0 ? `แนบแล้ว ${attachments.length} ไฟล์` : 'ไม่บังคับ (Optional)'}
              </span>
            </div>

            {/* Upload Zone */}
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-purple-200 hover:border-[#311171] transition-all group">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="modal-file-upload"
              />
              <label 
                htmlFor="modal-file-upload"
                className="flex flex-col items-center justify-center cursor-pointer py-3 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#311171] flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-[#311171] group-hover:text-white transition-all shadow-xs">
                  {isUploadingFile ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <UploadCloud size={24} />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800 mb-0.5">
                  {isUploadingFile ? 'กำลังประมวลผลและอัปโหลดไฟล์...' : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
                </p>
                <p className="text-[11px] text-slate-400">
                  รองรับเอกสารคำสั่ง, บันทึกข้อความ, โครงการ (PDF, Word, Excel, รูปภาพ) ไฟล์ละไม่เกิน 25 MB
                </p>
              </label>

              {uploadError && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText size={14} className="text-[#311171]" />
                  <span>รายการไฟล์ที่แนบไว้ ({attachments.length} ไฟล์):</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att, idx) => {
                    const badge = getFileBadge(att.name);
                    return (
                      <div 
                        key={att.id || idx}
                        className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2.5 group hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-8 h-8 rounded-lg font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <div className="min-w-0 flex-1">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-slate-800 hover:text-[#311171] truncate block hover:underline"
                              title={att.name}
                            >
                              {att.name}
                            </a>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {formatFileSize(att.size)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-[#311171] hover:bg-purple-50 rounded-lg transition-colors"
                            title="เปิดดูไฟล์"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบไฟล์นี้"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* แถบสรุปภาพรวมการจองก่อนกดยืนยัน (Quick Review Summary Bar) */}
          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#311171] flex items-center gap-1">
                <Calendar size={13} />
                <span>{form.startDate === form.endDate ? formatThaiDateShort(form.startDate) : `${formatThaiDateShort(form.startDate)} - ${formatThaiDateShort(form.endDate)}`}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Clock size={13} className="text-slate-500" />
                <span>{form.startTime} - {form.endTime} น.</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <MapPin size={13} className="text-slate-500" />
                <span className="truncate max-w-[220px]">
                  {form.destinations.find(d => d.place.trim())?.place || 'ยังไม่ระบุปลายทาง'}
                  {form.destinations.filter(d => d.place.trim()).length > 1 ? ` (+${form.destinations.filter(d => d.place.trim()).length - 1} จุด)` : ''}
                </span>
              </span>
              {attachments.length > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-[#311171] flex items-center gap-1">
                    <Paperclip size={13} />
                    <span>แนบ {attachments.length} ไฟล์</span>
                  </span>
                </>
              )}
            </div>
            <span className="font-bold text-[#311171] bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs">
              ผู้โดยสาร {form.passengerCount} คน • รถ {form.selectedVanIds.length}/{form.requestedVehicleCount} คัน
            </span>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Car size={15} className="text-[#311171]" />
              เลือกรถแล้ว {form.selectedVanIds.length} จาก {form.requestedVehicleCount} คัน
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                ยกเลิก
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-[#311171] to-[#4c1ba6] hover:from-[#250d55] hover:to-[#3e1488] text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer text-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>{editingEvent?.id ? 'บันทึกการแก้ไข' : 'บันทึกตารางการจอง'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
