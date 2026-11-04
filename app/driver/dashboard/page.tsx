"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Clock, Phone, AlertTriangle, CheckCircle, Gauge, X, FileText, 
  CalendarDays, Loader2, ChevronRight, CarFront, FileSpreadsheet,
  ShieldCheck, ShieldAlert, Navigation, Play, CheckSquare, 
  Siren, ExternalLink, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { 
  getDriverDashboardData, 
  quickStartTrip, 
  quickFinishTrip, 
  submitDriverDailyInspection, 
  submitDriverEmergencyReport
} from '@/app/actions/driver';
import type {
  DriverSafetyDutyInfo,
  DailyInspectionRecord,
  DailyInspectionItemStatus
} from '@/lib/driver-types';
import { requestAvailabilityChange } from '@/app/actions/driver-availability';
import { AvailabilityStatus } from '@prisma/client';

type DestinationItem = {
  place: string;
  province?: string;
};

type Trip = {
  id: string;
  destination: string;
  departureDate: string | Date;
  returnDate: string | Date;
  passengersCount?: number;
  requester?: { name: string; phone?: string };
  targetFaculty?: { nameTh: string };
  driverLog?: {
    id?: number;
    mileageStart?: number;
    mileageEnd?: number;
    totalDistance?: number;
    fuelRemark?: string | null;
  } | Record<string, unknown> | null;
  coordinatorName?: string;
  coordinatorPhone?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  destinations?: DestinationItem[];
  multiDayInfo?: {
    isMultiDay: boolean;
    durationDays: number;
    label: string;
  };
  time?: string;
  tripStatus?: string;
};

type RawCalendarEvent = {
  id?: string | number;
  vanId?: string;
  facultyId?: string | number;
  phone?: string;
  date?: string;
  returnDate?: string;
  time?: string;
  destination?: string;
  purpose?: string;
  passengers?: number | string;
  requester?: string;
  bookingFaculty?: string;
  status?: string;
  coordinatorName?: string;
  coordinatorPhone?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  destinations?: DestinationItem[];
};

export default function DriverDashboard() {
  const [driverId, setDriverId] = useState<number>(1);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState('');

  // Pre-trip Inspection Modal State
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<DailyInspectionItemStatus>({
    tires: true,
    fuel: true,
    lights: true,
    brakes: true,
    cleanliness: true
  });
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);

  // Emergency Assist Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyIssue, setEmergencyIssue] = useState('รถเสีย / สตาร์ทไม่ติด');
  const [emergencyDetail, setEmergencyDetail] = useState('');
  const [emergencyLocation, setEmergencyLocation] = useState('');
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);

  // Quick Start Trip Modal State
  const [showStartTripModal, setShowStartTripModal] = useState(false);
  const [startMileageInput, setStartMileageInput] = useState('');
  const [isSubmittingStartTrip, setIsSubmittingStartTrip] = useState(false);

  // Quick Finish Trip Modal State
  const [showFinishTripModal, setShowFinishTripModal] = useState(false);
  const [finishMileageInput, setFinishMileageInput] = useState('');
  const [finishFuelRemark, setFinishFuelRemark] = useState('');
  const [isSubmittingFinishTrip, setIsSubmittingFinishTrip] = useState(false);

  useEffect(() => {
    setAvailabilityDate(new Date().toISOString().split('T')[0]);
  }, []);

  const [availabilityType, setAvailabilityType] = useState<AvailabilityStatus>('SICK_LEAVE');
  const [availabilityDetail, setAvailabilityDetail] = useState('');
  const [isSubmittingAvailability, setIsSubmittingAvailability] = useState(false);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');

  const showNotification = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  const [dashboardData, setDashboardData] = useState<{
    driver?: { name: string; faculty: string; vanPlate: string; id?: number };
    todaysTrip?: Trip | null;
    upcomingTrips?: Trip[];
    stats?: { totalTrips: number; totalDistance: number };
    safety?: DriverSafetyDutyInfo;
    todayInspection?: DailyInspectionRecord | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const meRes = await fetch('/api/driver/me');
      const meData = await meRes.json();
      let currentId = 1;
      if (meData.success && meData.driverData && meData.driverData.id) {
        currentId = meData.driverData.id;
        setDriverId(currentId);
        localStorage.setItem('current_driver_id', currentId.toString());
      }

      const res = await getDriverDashboardData(currentId);

      let calTodaysTrip: Trip | null = null;
      let calTotalTrips = 0;

      try {
        const calRes = await fetch('/api/calendar-events');
        if (calRes.ok) {
          const calData = await calRes.json();
          if (calData && calData.rawEvents && Array.isArray(calData.rawEvents)) {
            const actualVanId = meData.driverData?.assignedVanId || meData.driverData?.facultyVanId;
            const driverVanIdStr = String(actualVanId || '');
            const driverLegacyVanId = meData.driverData?.legacyVanId;
            
            const activeEvents = calData.rawEvents.filter((e: RawCalendarEvent) => {
              if (e.status === 'rejected' || e.status === 'cancelled') return false;
              if (e.id && String(e.id).startsWith('bk-')) return false;
              
              const eventVanId = String(e.vanId);
              const driverVanIdFormatted = `van-${driverVanIdStr.padStart(3, '0')}`;
              
              const eventFacultyId = String(e.facultyId);
              const driverFacultyId = String(meData.driverData?.facultyId || '');
              
              const isVanMatch = eventVanId === driverVanIdStr || eventVanId === driverLegacyVanId || eventVanId === driverVanIdFormatted;
              
              const isFacultyMatch = eventFacultyId === driverFacultyId 
                                  || (eventFacultyId === 'ict' && driverLegacyVanId === 'v-ict')
                                  || (eventFacultyId === 'pharm' && driverLegacyVanId === 'v-pharm')
                                  || (eventFacultyId === 'sci' && driverLegacyVanId === 'v-sci')
                                  || (eventFacultyId === 'agr' && driverLegacyVanId === 'v-agri')
                                  || (eventFacultyId === 'ener' && driverLegacyVanId === 'v-seen')
                                  || (eventFacultyId === 'eng' && driverLegacyVanId === 'v-eng');

              return isVanMatch || isFacultyMatch;
            });
            
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            const thisMonthEvents = activeEvents.filter((e: RawCalendarEvent) => {
              const sDate = e.date ? String(e.date).slice(0, 7) : '';
              return sDate === currentYearMonth;
            });

            calTotalTrips = thisMonthEvents.length;

            const foundToday = activeEvents.find((e: RawCalendarEvent) => {
              const sDate = e.date ? String(e.date).slice(0, 10) : '';
              const rDate = e.returnDate ? String(e.returnDate).slice(0, 10) : sDate;
              return todayStr >= sDate && todayStr <= rDate;
            });

            if (foundToday) {
              calTodaysTrip = {
                id: String(foundToday.id || 'UP-TODAY'),
                destination: foundToday.destination || 'ไม่ระบุสถานที่',
                departureDate: foundToday.date ? (foundToday.date.includes('T') ? foundToday.date : `${foundToday.date}T08:30:00`) : new Date().toISOString(),
                returnDate: foundToday.returnDate ? (foundToday.returnDate.includes('T') ? foundToday.returnDate : `${foundToday.returnDate}T16:30:00`) : new Date().toISOString(),
                passengersCount: Number(foundToday.passengers || 1),
                requester: { name: foundToday.requester || 'ผู้ขอใช้บริการ', phone: foundToday.phone || '-' },
                targetFaculty: { nameTh: foundToday.bookingFaculty || 'คณะเทคโนโลยีสารสนเทศและการสื่อสาร' },
                coordinatorName: foundToday.coordinatorName || foundToday.requester,
                coordinatorPhone: foundToday.coordinatorPhone || foundToday.phone,
                pickupLocation: foundToday.pickupLocation || 'มหาวิทยาลัยพะเยา',
                dropoffLocation: foundToday.dropoffLocation || 'มหาวิทยาลัยพะเยา',
                destinations: foundToday.destinations || [{ place: foundToday.destination || 'ไม่ระบุสถานที่', province: 'พะเยา' }],
                tripStatus: foundToday.status || 'approved'
              };
            }
          }
        }
      } catch (calErr) {
        console.warn("Failed to load calendar events for driver dashboard:", calErr);
      }

      if (res && res.success && res.data) {
        const mergedData = {
          ...res.data,
          todaysTrip: res.data.todaysTrip || calTodaysTrip,
          stats: {
            ...res.data.stats,
            totalTrips: res.data.stats?.totalTrips || calTotalTrips,
            totalDistance: res.data.stats?.totalDistance || 0
          }
        };
        setDashboardData(mergedData);
      } else {
        setDashboardData({
          todaysTrip: calTodaysTrip,
          stats: { totalTrips: calTotalTrips, totalDistance: 0 }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleAvailabilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availabilityType !== 'READY' && !availabilityDetail.trim()) {
      showNotification("กรุณาระบุรายละเอียดเพิ่มเติม/เหตุผล", "warning");
      return;
    }
    setIsSubmittingAvailability(true);
    
    try {
      const res = await requestAvailabilityChange(
        driverId,
        new Date(availabilityDate),
        availabilityType,
        availabilityDetail
      );
      if (res.success) {
        showNotification("ส่งข้อมูลเปลี่ยนสถานะเรียบร้อยแล้ว", "success");
        setShowAvailabilityModal(false);
        setAvailabilityDetail('');
        loadDashboard();
      } else {
        showNotification("เกิดข้อผิดพลาด: " + res.error, "warning");
      }
    } catch (err) {
      console.error(err);
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ", "warning");
    } finally {
      setIsSubmittingAvailability(false);
    }
  };

  // Quick Start Trip Handler
  const handleStartTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardData?.todaysTrip?.id) return;
    const mileageNum = parseInt(startMileageInput, 10);
    if (isNaN(mileageNum) || mileageNum <= 0) {
      showNotification("กรุณาระบุเลขไมล์เริ่มต้นเป็นตัวเลขที่ถูกต้อง", "warning");
      return;
    }

    setIsSubmittingStartTrip(true);
    try {
      const res = await quickStartTrip(dashboardData.todaysTrip.id, driverId, mileageNum);
      if (res.success) {
        showNotification("บันทึกเริ่มออกเดินทางเรียบร้อยแล้ว", "success");
        setShowStartTripModal(false);
        setStartMileageInput('');
        await loadDashboard();
      } else {
        showNotification("บันทึกไม่สำเร็จ: " + (res.error || "เกิดข้อผิดพลาด"), "warning");
      }
    } catch (err) {
      console.error(err);
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ", "warning");
    } finally {
      setIsSubmittingStartTrip(false);
    }
  };

  // Quick Finish Trip Handler
  const handleFinishTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardData?.todaysTrip?.id) return;
    const mileageNum = parseInt(finishMileageInput, 10);
    if (isNaN(mileageNum) || mileageNum <= 0) {
      showNotification("กรุณาระบุเลขไมล์สิ้นสุดเป็นตัวเลขที่ถูกต้อง", "warning");
      return;
    }

    const currentLog = dashboardData.todaysTrip.driverLog as { mileageStart?: number } | undefined;
    const startMileage = currentLog?.mileageStart || 0;
    if (startMileage > 0 && mileageNum < startMileage) {
      showNotification(`เลขไมล์สิ้นสุด (${mileageNum}) ต้องไม่น้อยกว่าเลขไมล์เริ่มต้น (${startMileage})`, "warning");
      return;
    }

    setIsSubmittingFinishTrip(true);
    try {
      const res = await quickFinishTrip(
        dashboardData.todaysTrip.id, 
        driverId, 
        mileageNum, 
        undefined, 
        finishFuelRemark.trim() || undefined,
        startMileage
      );
      if (res.success) {
        showNotification("บันทึกสิ้นสุดภารกิจและปิดงานเรียบร้อยแล้ว", "success");
        setShowFinishTripModal(false);
        setFinishMileageInput('');
        setFinishFuelRemark('');
        await loadDashboard();
      } else {
        showNotification("บันทึกไม่สำเร็จ: " + (res.error || "เกิดข้อผิดพลาด"), "warning");
      }
    } catch (err) {
      console.error(err);
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ", "warning");
    } finally {
      setIsSubmittingFinishTrip(false);
    }
  };

  // Daily Inspection Submit Handler
  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vanPlate = dashboardData?.driver?.vanPlate || "รถประจำตำแหน่ง";
    setIsSubmittingInspection(true);
    try {
      const res = await submitDriverDailyInspection(
        driverId,
        vanPlate,
        inspectionItems,
        inspectionNotes.trim() || undefined
      );
      if (res.success) {
        showNotification("บันทึกผลการตรวจเช็กรถประจำวันเรียบร้อยแล้ว", "success");
        setShowInspectionModal(false);
        await loadDashboard();
      } else {
        showNotification("เกิดข้อผิดพลาด: " + (res.error || "ไม่สามารถบันทึกได้"), "warning");
      }
    } catch (err) {
      console.error(err);
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ", "warning");
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  // Emergency Incident Submit Handler
  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyDetail.trim()) {
      showNotification("กรุณาระบุรายละเอียดเหตุฉุกเฉิน", "warning");
      return;
    }

    setIsSubmittingEmergency(true);
    try {
      const res = await submitDriverEmergencyReport(
        driverId,
        dashboardData?.todaysTrip?.id,
        emergencyIssue,
        emergencyDetail.trim(),
        emergencyLocation.trim() || undefined
      );
      if (res.success) {
        showNotification("ส่งแจ้งเหตุฉุกเฉินไปยังศูนย์ยานพาหนะเรียบร้อยแล้ว", "success");
        setEmergencyDetail('');
        setEmergencyLocation('');
      } else {
        showNotification("ส่งข้อมูลไม่สำเร็จ: " + (res.error || "โปรดโทรติดต่อโดยตรง"), "warning");
      }
    } catch (err) {
      console.error(err);
      showNotification("เกิดข้อผิดพลาด กรุณากดโทรด่วนติดต่อศูนย์ทันที", "warning");
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayLabel = (dateString: string | Date) => {
    const d = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dZero = new Date(d);
    dZero.setHours(0,0,0,0);

    if (dZero.getTime() === tomorrow.getTime()) return "พรุ่งนี้";
    
    const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    return days[d.getDay()];
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="w-full h-[60vh] flex flex-col items-center justify-center text-purple-600 space-y-4">
          <Loader2 size={40} className="animate-spin" />
          <p className="font-bold text-sm">กำลังโหลดข้อมูลแดชบอร์ด...</p>
        </div>
      </AppShell>
    );
  }

  const { driver, todaysTrip, upcomingTrips, stats, safety, todayInspection } = dashboardData || {};

  // Status computation for Today's Trip
  const isTripFinished = Boolean(
    todaysTrip?.driverLog && 
    (todaysTrip.driverLog as { mileageEnd?: number }).mileageEnd &&
    (todaysTrip.driverLog as { mileageEnd?: number }).mileageEnd! > 0 &&
    (todaysTrip.driverLog as { totalDistance?: number }).totalDistance! > 0
  ) || todaysTrip?.tripStatus === 'completed';

  const isTripOngoing = Boolean(
    (todaysTrip?.driverLog && !isTripFinished) || 
    todaysTrip?.tripStatus === 'ongoing'
  );

  const cleanPhone = (todaysTrip?.coordinatorPhone || todaysTrip?.requester?.phone || '').replace(/[^0-9]/g, '');

  return (
    <AppShell>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white px-4 py-3 rounded-full shadow-xl border border-gray-100 flex items-center gap-3">
            <div className={`p-1.5 rounded-full ${toastType === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
              {toastType === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            </div>
            <span className="text-sm font-bold text-gray-700">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20 relative">
        
        {/* Sticky Fixed Top Header Section */}
        <div className="sticky -top-6 lg:-top-8 z-20 bg-[#f3f4f7]/95 backdrop-blur-md pt-8 lg:pt-10 pb-3 border-b border-gray-200/80 -mt-6 lg:-mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">คุณ {driver?.name?.split(' ')[0] || "คนขับ"}</h1>
            <p className="text-gray-500 font-bold text-xs mt-0.5">คนขับ {driver?.faculty || ""} • ทะเบียน {driver?.vanPlate || "รถตู้คณะ"}</p>
          </div>
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Siren size={15} className="animate-pulse" />
            ฉุกเฉิน / ขอความช่วยเหลือ
          </button>
        </div>

        {/* Model v5 Safety & Duty Gauge Card */}
        {safety && (
          <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${safety.safetyStatus === 'SAFE' ? 'bg-emerald-100 text-emerald-700' : safety.safetyStatus === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  {safety.safetyStatus === 'SAFE' ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-gray-900">เกณฑ์ความปลอดภัยชั่วโมงขับขี่ (Model v5)</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">มาตรฐานความปลอดภัย</span>
                  </div>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">{safety.safetyBadgeText}</p>
                </div>
              </div>

              {/* Pre-trip inspection quick badge */}
              <button
                onClick={() => setShowInspectionModal(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  todayInspection?.passed 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <CheckSquare size={14} />
                {todayInspection?.passed ? "ตรวจเช็กรถแล้ว (ผ่าน 5/5)" : "ตรวจเช็กรถก่อนออกเดินทาง"}
              </button>
            </div>

            {/* 3 Metric Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {/* Daily Duty Hours */}
              <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500">ชั่วโมงปฏิบัติงานวันนี้</span>
                  <span className="text-xs font-black text-gray-900">{safety.todayDutyHours} / 14 ชม.</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden my-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${safety.todayDutyHours >= 14 ? 'bg-rose-500' : safety.todayDutyHours >= 12 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (safety.todayDutyHours / 14) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-gray-500">
                  {safety.dailyHoursRemaining > 0 ? `เหลือเวลาขับได้อีก ${safety.dailyHoursRemaining} ชม.` : "ถึงขีดจำกัดชั่วโมงวันนี้แล้ว"}
                </p>
              </div>

              {/* Rest Hours */}
              <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500">เวลาพักผ่อนก่อนเริ่มงาน</span>
                  <span className={`text-xs font-black ${safety.isRestSufficient ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {safety.restHours >= 99 ? 'เกิน 24 ชม.' : `${safety.restHours} ชม.`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden my-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${safety.isRestSufficient ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, (Math.min(safety.restHours, 10) / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-gray-500">
                  {safety.isRestSufficient ? "พักผ่อนครบตามเกณฑ์ (ขั้นต่ำ 10 ชม.)" : "เสี่ยงเหนื่อยล้า พักไม่ถึงเกณฑ์ 10 ชม."}
                </p>
              </div>

              {/* 7-Day Rolling Duty */}
              <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500">สะสม 7 วันย้อนหลัง</span>
                  <span className="text-xs font-black text-gray-900">{safety.weeklyDutyHours} / 72 ชม.</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden my-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${safety.weeklyDutyHours >= 72 ? 'bg-rose-500' : safety.weeklyDutyHours >= 60 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (safety.weeklyDutyHours / 72) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-gray-500">
                  {safety.weeklyHoursRemaining > 0 ? `เหลือสะสมได้อีก ${safety.weeklyHoursRemaining} ชม.` : "เกินเกณฑ์ 72 ชม./สัปดาห์"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards (4 กล่องสไตล์ Faculty Admin) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {/* Card 1 - จำนวนทริปจบงานเดือนนี้ */}
          <Link
            href="/driver/schedule"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#311171]/20 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#311171] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#311171]/30">
                <CarFront size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">ทริปจบงานเดือนนี้</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">{stats?.totalTrips || 0} ทริป</span>
                </div>
                <p className="text-xs font-bold text-purple-600 mt-0.5">กดจบงานในเดือนนี้</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-[#311171] transition-colors" />
          </Link>

          {/* Card 2 - ระยะทางรวม */}
          <Link
            href="/driver/usage-report"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-green-200">
                <Gauge size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">ระยะทางขับขี่รวม</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900">{stats?.totalDistance || 0} กม.</span>
                </div>
                <p className="text-xs font-bold text-green-600 mt-0.5">คำนวณจากสมุดบันทึก</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-green-500 transition-colors" />
          </Link>

          {/* Card 3 - สมุดบันทึกรถ */}
          <Link 
            href="/driver/records"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#C39B22]/30 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#C39B22] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#C39B22]/30">
                <FileText size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">สมุดบันทึกรถ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-gray-900">บันทึกเดินทาง</span>
                </div>
                <p className="text-xs font-bold text-amber-600 mt-0.5">เปิดบันทึกเข้า-ออก</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-[#C39B22] transition-colors" />
          </Link>

          {/* Card 4 - รายงานการใช้งานรถตู้ */}
          <Link 
            href="/driver/usage-report"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-blue-200">
                <FileSpreadsheet size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">รายงานการใช้งานรถตู้</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-gray-900">สรุปรายงาน</span>
                </div>
                <p className="text-xs font-bold text-blue-600 mt-0.5">ดูบันทึกและสถิติรายเดือน</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
          </Link>
        </div>

        {/* Today's Trip Card - Enhanced Mobile-First */}
        {todaysTrip ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header banner */}
            <div className="bg-[#311171] p-5 text-white">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isTripFinished 
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' 
                      : isTripOngoing 
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30 animate-pulse'
                      : 'bg-white/20 text-white'
                  }`}>
                    {isTripFinished ? 'เสร็จสิ้นภารกิจ' : isTripOngoing ? 'กำลังเดินทาง' : 'รอออกเดินทาง'}
                  </span>

                  {todaysTrip.multiDayInfo?.isMultiDay && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                      ภารกิจข้ามวัน ({todaysTrip.multiDayInfo.durationDays} วัน)
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold opacity-80">{todaysTrip.id}</span>
              </div>
              
              <h2 className="text-xl font-black mb-1">{todaysTrip.destination}</h2>
              <div className="flex items-center gap-1.5 text-purple-100 text-sm">
                <Clock size={16} /> {todaysTrip.time || `${formatTime(todaysTrip.departureDate)} - ${formatTime(todaysTrip.returnDate)} น.`}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Route Itinerary Breakdown */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Navigation size={14} className="text-purple-600" /> แผนการเดินทางและจุดหมาย
                </p>
                <div className="space-y-2 pl-2 border-l-2 border-purple-200 ml-1.5">
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 -ml-[13px] ring-4 ring-white" />
                    <div>
                      <span className="text-[11px] font-bold text-gray-400">จุดรับ:</span>
                      <p className="text-xs font-bold text-gray-800">{todaysTrip.pickupLocation || "มหาวิทยาลัยพะเยา"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#311171] mt-1 shrink-0 -ml-[13px] ring-4 ring-white" />
                    <div>
                      <span className="text-[11px] font-bold text-gray-400">จุดหมายปลายทาง:</span>
                      <p className="text-xs font-black text-[#311171]">{todaysTrip.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0 -ml-[13px] ring-4 ring-white" />
                    <div>
                      <span className="text-[11px] font-bold text-gray-400">จุดส่งกลับ:</span>
                      <p className="text-xs font-bold text-gray-800">{todaysTrip.dropoffLocation || "มหาวิทยาลัยพะเยา"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coordinator Information & 1-Click Dial */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                    <Phone size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800">ผู้ประสานงาน / ผู้จอง ({todaysTrip.passengersCount || 1} คน)</span>
                    <p className="text-sm font-black text-gray-900">{todaysTrip.coordinatorName || todaysTrip.requester?.name || "ไม่ระบุชื่อ"}</p>
                    <p className="text-xs font-bold text-gray-600">{todaysTrip.targetFaculty?.nameTh}</p>
                  </div>
                </div>

                {cleanPhone ? (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    <Phone size={15} /> โทรด่วน: {todaysTrip.coordinatorPhone || todaysTrip.requester?.phone}
                  </a>
                ) : (
                  <span className="text-xs font-bold text-gray-400">ไม่มีเบอร์โทร</span>
                )}
              </div>

              {/* Vehicle & Log info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-bold block mb-0.5">รถตู้ที่ใช้</span>
                  <span className="font-black text-gray-900">{driver?.vanPlate || "ไม่ระบุ"}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 font-bold block mb-0.5">เลขไมล์เริ่มต้น</span>
                  <span className="font-black text-gray-900">
                    {(todaysTrip.driverLog as { mileageStart?: number })?.mileageStart ? `${(todaysTrip.driverLog as { mileageStart?: number }).mileageStart} กม.` : "ยังไม่ได้บันทึก"}
                  </span>
                </div>
              </div>

              {/* Action Workflow Buttons */}
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2.5">
                {!isTripOngoing && !isTripFinished && (
                  <button
                    onClick={() => {
                      setStartMileageInput('');
                      setShowStartTripModal(true);
                    }}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200 text-base cursor-pointer"
                  >
                    <Play size={20} fill="currentColor" /> บันทึกเริ่มออกเดินทาง (Start Trip)
                  </button>
                )}

                {isTripOngoing && !isTripFinished && (
                  <button
                    onClick={() => {
                      const curStart = (todaysTrip.driverLog as { mileageStart?: number })?.mileageStart || 0;
                      setFinishMileageInput(curStart > 0 ? String(curStart + 10) : '');
                      setShowFinishTripModal(true);
                    }}
                    className="w-full py-4 bg-[#311171] hover:bg-[#250d55] text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-200 text-base cursor-pointer"
                  >
                    <CheckCircle size={20} /> บันทึกสิ้นสุดงาน / ปิดงาน (Finish Trip)
                  </button>
                )}

                {isTripFinished && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-black">
                      <CheckCircle size={18} className="text-emerald-600" />
                      ปิดงานสำเร็จแล้ว (ระยะทางรวม: {(todaysTrip.driverLog as { totalDistance?: number })?.totalDistance || 0} กม.)
                    </div>
                    <Link
                      href={`/driver/records?bookingId=${todaysTrip.id}`}
                      className="text-emerald-700 font-black hover:underline flex items-center gap-1"
                    >
                      ดูเล่มบันทึก <ExternalLink size={12} />
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <Link 
                    href={`/driver/records?bookingId=${todaysTrip.id}`}
                    className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-[#311171] font-black rounded-xl flex items-center justify-center gap-2 transition-colors text-xs"
                  >
                    <FileText size={16} /> บันทึกสมุดเดินทาง (Form 4 ฉบับเต็ม)
                  </Link>

                  <button 
                    onClick={() => setShowAvailabilityModal(true)}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer"
                  >
                    <AlertTriangle size={16} className="text-amber-500" /> แจ้งสถานะความพร้อม / ลางาน
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <CheckCircle size={32} />
            </div>
            <h3 className="font-black text-gray-900 text-lg mb-2">ไม่มีงานในวันนี้</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">คุณว่างในวันนี้ พักผ่อนให้เต็มที่ครับ</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
              <button 
                onClick={() => setShowInspectionModal(true)}
                className="py-3 px-4 bg-purple-50 hover:bg-purple-100 text-[#311171] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer"
              >
                <CheckSquare size={16} /> ตรวจเช็กรถประจำวัน
              </button>
              <button 
                onClick={() => setShowAvailabilityModal(true)}
                className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer"
              >
                <AlertTriangle size={16} /> แจ้งปัญหาฉุกเฉิน / ลาพัก
              </button>
            </div>
          </div>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips && upcomingTrips.length > 0 && (
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-600" /> งานที่กำลังจะมาถึง
            </h3>
            <div className="space-y-3">
              {upcomingTrips.slice(0, 3).map((trip: Trip, idx: number) => (
                <div key={trip.id} className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-4 items-center ${idx > 0 ? 'opacity-75' : ''}`}>
                  <div className={`${idx === 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'} rounded-xl p-2.5 flex flex-col items-center justify-center min-w-[3.5rem]`}>
                    <span className="text-xs font-bold">{getDayLabel(trip.departureDate)}</span>
                    <span className="text-lg font-black">{new Date(trip.departureDate).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-gray-900 text-sm truncate">{trip.destination}</h4>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mt-1">
                      <Clock size={12} /> {formatTime(trip.departureDate)} - {formatTime(trip.returnDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal 1: Quick Start Trip Modal */}
        {showStartTripModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">บันทึกเริ่มออกเดินทาง</h3>
                    <p className="text-xs font-bold text-gray-500">กรอกเลขไมล์หน้าปัดรถยนต์ตอนเริ่มงาน</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowStartTripModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <form onSubmit={handleStartTripSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">เลขไมล์เริ่มต้น (กม.) *</label>
                  <input
                    type="number"
                    value={startMileageInput}
                    onChange={(e) => setStartMileageInput(e.target.value)}
                    placeholder="เช่น 125400"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-lg text-gray-900 outline-none focus:border-emerald-500"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] font-bold text-gray-400 mt-1">ดูจากหน้าปัดรถตู้ก่อนหมุนกุญแจสตาร์ท</p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingStartTrip}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-200"
                  >
                    {isSubmittingStartTrip ? (
                      <span className="animate-pulse flex items-center gap-2"><RefreshCw size={18} className="animate-spin" /> กำลังบันทึก...</span>
                    ) : (
                      <>ยืนยันเริ่มออกเดินทาง</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Quick Finish Trip Modal */}
        {showFinishTripModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-[#311171]">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">บันทึกสิ้นสุดงาน / ปิดงาน</h3>
                    <p className="text-xs font-bold text-gray-500">กรอกเลขไมล์เมื่อส่งผู้โดยสารเรียบร้อย</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFinishTripModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <form onSubmit={handleFinishTripSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-500">เลขไมล์สิ้นสุด (กม.) *</label>
                    {(todaysTrip?.driverLog as { mileageStart?: number } | undefined)?.mileageStart && (
                      <span className="text-[11px] font-bold text-purple-700">
                        ไมล์เริ่ม: {(todaysTrip?.driverLog as { mileageStart?: number } | undefined)?.mileageStart} กม.
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={finishMileageInput}
                    onChange={(e) => setFinishMileageInput(e.target.value)}
                    placeholder="เช่น 125580"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-black text-lg text-gray-900 outline-none focus:border-[#311171]"
                    required
                    autoFocus
                  />
                  {finishMileageInput && (todaysTrip?.driverLog as { mileageStart?: number } | undefined)?.mileageStart && (
                    <p className="text-xs font-black text-emerald-600 mt-1">
                      ระยะทางทริปนี้: {Math.max(0, parseInt(finishMileageInput, 10) - ((todaysTrip?.driverLog as { mileageStart?: number } | undefined)?.mileageStart || 0))} กม.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">หมายเหตุค่าน้ำมัน / ค่าทางด่วน (ถ้ามี)</label>
                  <input
                    type="text"
                    value={finishFuelRemark}
                    onChange={(e) => setFinishFuelRemark(e.target.value)}
                    placeholder="เช่น เติมน้ำมัน 800 บาท, ค่าผ่านทาง 120 บาท"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-900 outline-none focus:border-[#311171]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingFinishTrip}
                    className="w-full py-4 bg-[#311171] hover:bg-[#250d55] text-white font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-200"
                  >
                    {isSubmittingFinishTrip ? (
                      <span className="animate-pulse flex items-center gap-2"><RefreshCw size={18} className="animate-spin" /> กำลังปิดงาน...</span>
                    ) : (
                      <>ยืนยันปิดงานภารกิจ</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Pre-Trip Daily Checklist Modal */}
        {showInspectionModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-[#311171]">
                    <CheckSquare size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">ตรวจเช็กรถประจำวัน</h3>
                    <p className="text-xs font-bold text-gray-500">5 รายการสำคัญก่อนออกปฏิบัติงาน</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInspectionModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-400">ทำเครื่องหมายรายการที่ผ่าน</span>
                <button
                  type="button"
                  onClick={() => setInspectionItems({ tires: true, fuel: true, lights: true, brakes: true, cleanliness: true })}
                  className="text-xs font-black text-purple-700 hover:underline cursor-pointer"
                >
                  เลือกผ่านทุกรายการ
                </button>
              </div>

              <form onSubmit={handleInspectionSubmit} className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-purple-50/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={inspectionItems.tires}
                    onChange={(e) => setInspectionItems({ ...inspectionItems, tires: e.target.checked })}
                    className="w-5 h-5 rounded text-[#311171] focus:ring-[#311171]"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">1. ลมยางและสภาพยางทั้ง 4 ล้อ</p>
                    <p className="text-[11px] font-bold text-gray-400">แรงดันลมยางและดอกยางพร้อมใช้งาน</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-purple-50/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={inspectionItems.fuel}
                    onChange={(e) => setInspectionItems({ ...inspectionItems, fuel: e.target.checked })}
                    className="w-5 h-5 rounded text-[#311171] focus:ring-[#311171]"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">2. ระดับน้ำมันเชื้อเพลิง</p>
                    <p className="text-[11px] font-bold text-gray-400">เพียงพอต่อการเดินทาง (อย่างน้อยครึ่งถัง)</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-purple-50/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={inspectionItems.lights}
                    onChange={(e) => setInspectionItems({ ...inspectionItems, lights: e.target.checked })}
                    className="w-5 h-5 rounded text-[#311171] focus:ring-[#311171]"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">3. ไฟหน้า ไฟท้าย ไฟเลี้ยว และไฟเบรก</p>
                    <p className="text-[11px] font-bold text-gray-400">ระบบไฟส่องสว่างติดครบทุกดวง</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-purple-50/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={inspectionItems.brakes}
                    onChange={(e) => setInspectionItems({ ...inspectionItems, brakes: e.target.checked })}
                    className="w-5 h-5 rounded text-[#311171] focus:ring-[#311171]"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">4. ระบบเบรกและระดับน้ำมันเบรก</p>
                    <p className="text-[11px] font-bold text-gray-400">แป้นเบรกหน่วงปกติ ไม่รั่วซึม</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-purple-50/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={inspectionItems.cleanliness}
                    onChange={(e) => setInspectionItems({ ...inspectionItems, cleanliness: e.target.checked })}
                    className="w-5 h-5 rounded text-[#311171] focus:ring-[#311171]"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-900">5. ความสะอาดและอุปกรณ์ฉุกเฉิน</p>
                    <p className="text-[11px] font-bold text-gray-400">ป้ายเตือนสามเหลี่ยม แม่แรง และถังดับเพลิง</p>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">บันทึกเพิ่มเติม (ถ้ามี)</label>
                  <input
                    type="text"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="เช่น ลมยางล้อหลังขวาเติมเพิ่ม 35 psi"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingInspection}
                    className="w-full py-3.5 bg-[#311171] hover:bg-[#250d55] text-white font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {isSubmittingInspection ? (
                      <span className="animate-pulse">กำลังบันทึก...</span>
                    ) : (
                      <>บันทึกผลการตรวจเช็กรถ</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 4: Emergency Assistance Modal */}
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                    <Siren size={26} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">ขอความช่วยเหลือฉุกเฉิน</h3>
                    <p className="text-xs font-bold text-gray-500">โทรด่วนหรือส่งแจ้งเหตุรถเสีย</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              {/* Instant Call List */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-bold text-gray-400">เบอร์โทรฉุกเฉิน (กดโทรได้ทันที)</p>
                
                <a
                  href="tel:054466666,1064"
                  className="p-3 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 flex items-center justify-between transition-colors text-red-800"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone size={18} className="text-red-600" />
                    <div>
                      <p className="text-xs font-black">ศูนย์ยานพาหนะ มพ. (ส่วนกลาง)</p>
                      <p className="text-[11px] font-bold text-red-600">054-466666 ต่อ 1064</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-red-600 text-white px-2.5 py-1 rounded-lg">โทร</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:1669"
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-between transition-colors text-gray-800"
                  >
                    <div>
                      <p className="text-xs font-black">กู้ภัย / รถพยาบาล</p>
                      <p className="text-[11px] font-bold text-gray-500">โทร 1669</p>
                    </div>
                    <Phone size={16} className="text-red-600" />
                  </a>

                  <a
                    href="tel:1193"
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-between transition-colors text-gray-800"
                  >
                    <div>
                      <p className="text-xs font-black">ตำรวจทางหลวง</p>
                      <p className="text-[11px] font-bold text-gray-500">โทร 1193</p>
                    </div>
                    <Phone size={16} className="text-blue-600" />
                  </a>
                </div>
              </div>

              {/* Incident Form */}
              <form onSubmit={handleEmergencySubmit} className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400">ส่งแจ้งเหตุฉุกเฉินเข้าระบบส่วนกลาง</p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ประเภทเหตุฉุกเฉิน</label>
                  <select
                    value={emergencyIssue}
                    onChange={(e) => setEmergencyIssue(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none"
                  >
                    <option value="รถเสีย / สตาร์ทไม่ติด">รถเสีย / สตาร์ทไม่ติด</option>
                    <option value="ยางแบน / ยางแตก">ยางแบน / ยางแตก</option>
                    <option value="เกิดอุบัติเหตุบนท้องถนน">เกิดอุบัติเหตุบนท้องถนน</option>
                    <option value="เครื่องยนต์ร้อนจัด / หม้อน้ำแห้ง">เครื่องยนต์ร้อนจัด / หม้อน้ำแห้ง</option>
                    <option value="น้ำมันหมดฉุกเฉิน">น้ำมันหมดฉุกเฉิน</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ตำแหน่งปัจจุบัน / จุดเกิดเหตุ</label>
                  <input
                    type="text"
                    value={emergencyLocation}
                    onChange={(e) => setEmergencyLocation(e.target.value)}
                    placeholder="เช่น ทล. 1 หลัก กม. ที่ 820 หน้าปั๊ม ปตท."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียดปัญหา *</label>
                  <textarea
                    value={emergencyDetail}
                    onChange={(e) => setEmergencyDetail(e.target.value)}
                    placeholder="ระบุอาการรถ หรือสภาพเหตุการณ์..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 resize-none h-18 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEmergency}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs"
                >
                  {isSubmittingEmergency ? "กำลังส่งแจ้งเหตุ..." : "ส่งรายงานแจ้งเหตุฉุกเฉิน"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal 5: Availability Modal */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">เปลี่ยนสถานะความพร้อม</h3>
                    <p className="text-sm font-bold text-gray-500">แจ้งลางาน หรือ แจ้งความพร้อม</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAvailabilityModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">วันที่ต้องการแจ้ง</label>
                  <input
                    type="date"
                    value={availabilityDate}
                    onChange={(e) => setAvailabilityDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-900 outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">ระบุสถานะ</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('READY')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        availabilityType === 'READY' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      พร้อมปฏิบัติงาน
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('SUBSTITUTE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        availabilityType === 'SUBSTITUTE' 
                          ? 'bg-amber-50 border-amber-200 text-amber-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ปฏิบัติงานแทน
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('SICK_LEAVE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        availabilityType === 'SICK_LEAVE' 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ลาป่วย
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailabilityType('PERSONAL_LEAVE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        availabilityType === 'PERSONAL_LEAVE' 
                          ? 'bg-red-50 border-red-200 text-red-600' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ลากิจ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={availabilityDetail}
                    onChange={(e) => setAvailabilityDetail(e.target.value)}
                    placeholder="ระบุเหตุผล เช่น ไปหาหมอ, ธุระส่วนตัว..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium text-sm text-gray-900 resize-none h-24"
                    required={availabilityType !== 'READY'}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingAvailability}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingAvailability ? (
                      <span className="animate-pulse">กำลังส่งข้อมูล...</span>
                    ) : (
                      <>ยืนยันการแจ้งปัญหา</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
