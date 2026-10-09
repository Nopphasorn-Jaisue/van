"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { 
  ChevronLeft, ChevronRight, Search, Loader2,
  Edit, X, Check, AlertCircle, MapPin, Calendar, Clock, Gauge, CheckCircle,
  Camera, Eye, Trash2
} from 'lucide-react';
import { getAllFacultyBookingsWithLogs, updateDriverLog } from '@/app/actions/driver';
import { uploadImage } from '@/app/actions/upload';

interface ReportRow {
  id: string | number;
  seq: number;
  deptDate: string;
  deptTime: string;
  user: string;
  destination: string;
  startMileage: number | string;
  returnDate: string;
  returnTime: string;
  endMileage: number | string;
  totalDistance: number;
  driverName: string;
  remark: string;
  assignedDriverId?: number;
  rawDeptMonth?: string;
  rawDeptYear?: string;
  rawDeptDateIso: string;
  rawDeptTimeIso: string;
  rawReturnDateIso: string;
  rawReturnTimeIso: string;
  rawStartMileageNum: number;
  rawEndMileageNum: number;
  rawDestination: string;
  rawRemark: string;
  rawPassenger: string;
  imgStartUrl?: string | null;
  imgEndUrl?: string | null;
}

interface TripLegItem {
  id?: number | string;
  deptDate?: string | null;
  deptTime?: string | null;
  passenger?: string | null;
  destination?: string | null;
  startMileage?: string | null;
  returnDate?: string | null;
  returnTime?: string | null;
  endMileage?: string | null;
  remark?: string | null;
}

interface DriverLogItem {
  id?: number;
  mileageStart?: number | string | null;
  mileageEnd?: number | string | null;
  totalDistance?: number | null;
  fuelRemark?: string | null;
  imgStartUrl?: string | null;
  imgEndUrl?: string | null;
  tripLegs?: TripLegItem[];
}

interface BookingItem {
  id: string | number;
  departureDate: string | Date;
  returnDate: string | Date;
  destination: string;
  assignedDriverId?: number;
  requester?: {
    name?: string | null;
  } | null;
  driverLog?: DriverLogItem | null;
  assignedDriver?: {
    user?: {
      name?: string | null;
    } | null;
  } | null;
}

function parseToDateInput(val: string | Date | null | undefined): string {
  if (!val) return "";
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseToTimeInput(val: string | Date | null | undefined, fallback: string = "08:00"): string {
  if (!val) return fallback;
  if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) {
    return val;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return fallback;
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

export default function DriverUsageReportPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [driverName, setDriverName] = useState("พนักงานขับรถ");
  const [driverId, setDriverId] = useState<number | null>(null);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal State
  const [editingRow, setEditingRow] = useState<ReportRow | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    destination: '',
    deptDate: '',
    deptTime: '',
    returnDate: '',
    returnTime: '',
    startMileage: '',
    endMileage: '',
    remark: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Photos State
  const [startPhotoFile, setStartPhotoFile] = useState<File | null>(null);
  const [startPhotoPreview, setStartPhotoPreview] = useState<string | null>(null);
  const [endPhotoFile, setEndPhotoFile] = useState<File | null>(null);
  const [endPhotoPreview, setEndPhotoPreview] = useState<string | null>(null);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  const startFileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    setSelectedMonth("ทั้งหมด");
    setSelectedYear("ทั้งหมด");

    // Fetch current driver
    fetch('/api/driver/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.driverData) {
          setDriverId(data.driverData.id);
          if (data.driverData.user?.name) {
            setDriverName(data.driverData.user.name);
          }
        }
      })
      .catch(err => console.error("Error fetching driver:", err));
  }, []);

  const loadData = useCallback(async () => {
    if (!driverId) return;
    setIsLoading(true);
    try {
      const bookingsRes = await getAllFacultyBookingsWithLogs();
      if (bookingsRes.success && Array.isArray(bookingsRes.bookings)) {
        const loggedBookings = (bookingsRes.bookings as BookingItem[]).filter(
          (b): b is BookingItem & { driverLog: DriverLogItem } => Boolean(b.driverLog) && (!b.assignedDriverId || b.assignedDriverId === driverId)
        );
        
        if (loggedBookings.length > 0) {
          const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
          const mapped: ReportRow[] = loggedBookings.map((b, index) => {
            const log = b.driverLog;
            const tripLeg = log?.tripLegs?.[0];

            const deptD = tripLeg?.deptDate 
              ? new Date(`${tripLeg.deptDate}T${tripLeg.deptTime || '08:00'}:00`) 
              : (b.departureDate ? new Date(b.departureDate) : null);
            const retD = tripLeg?.returnDate 
              ? new Date(`${tripLeg.returnDate}T${tripLeg.returnTime || '17:00'}:00`) 
              : (b.returnDate ? new Date(b.returnDate) : null);

            const isValidDept = deptD && !isNaN(deptD.getTime());
            const isValidRet = retD && !isNaN(retD.getTime());
            const rawDeptMonth = isValidDept ? thaiMonths[deptD.getMonth()] : "";
            const rawDeptYear = isValidDept ? (deptD.getFullYear() + 543).toString() : "";

            const rawDeptDateIso = tripLeg?.deptDate || parseToDateInput(b.departureDate);
            const rawDeptTimeIso = tripLeg?.deptTime || parseToTimeInput(b.departureDate, "08:00");
            const rawReturnDateIso = tripLeg?.returnDate || parseToDateInput(b.returnDate);
            const rawReturnTimeIso = tripLeg?.returnTime || parseToTimeInput(b.returnDate, "17:00");

            const startMileageVal = tripLeg?.startMileage != null 
              ? Number(tripLeg.startMileage) 
              : (log?.mileageStart != null ? Number(log.mileageStart) : 0);
            const endMileageVal = tripLeg?.endMileage != null 
              ? Number(tripLeg.endMileage) 
              : (log?.mileageEnd != null ? Number(log.mileageEnd) : 0);

            const totalDistVal = log?.totalDistance != null 
              ? Number(log.totalDistance) 
              : Math.max(0, endMileageVal - startMileageVal);

            const destinationVal = tripLeg?.destination || b.destination || "-";
            const passengerVal = tripLeg?.passenger || b.requester?.name || "ผู้ใช้บริการ";
            const remarkVal = tripLeg?.remark || log?.fuelRemark || "-";

            return {
              id: b.id,
              seq: index + 1,
              deptDate: isValidDept ? deptD.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : "-",
              deptTime: isValidDept ? deptD.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "-",
              user: passengerVal,
              destination: destinationVal,
              startMileage: startMileageVal > 0 ? startMileageVal.toLocaleString() : "-",
              returnDate: isValidRet ? retD.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : "-",
              returnTime: isValidRet ? retD.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "-",
              endMileage: endMileageVal > 0 ? endMileageVal.toLocaleString() : "-",
              totalDistance: totalDistVal,
              driverName: b.assignedDriver?.user?.name || driverName || "-",
              remark: remarkVal,
              assignedDriverId: b.assignedDriverId,
              rawDeptMonth,
              rawDeptYear,
              rawDeptDateIso,
              rawDeptTimeIso,
              rawReturnDateIso,
              rawReturnTimeIso,
              rawStartMileageNum: startMileageVal,
              rawEndMileageNum: endMileageVal,
              rawDestination: destinationVal,
              rawRemark: remarkVal === "-" ? "" : remarkVal,
              rawPassenger: passengerVal,
              imgStartUrl: log?.imgStartUrl,
              imgEndUrl: log?.imgEndUrl
            };
          });

          setReportRows(mapped);
        } else {
          setReportRows([]);
        }
      } else {
        setReportRows([]);
      }
    } catch (err) {
      console.error("Error loading report data:", err);
      setReportRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [driverId, driverName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEditModal = (row: ReportRow) => {
    setEditingRow(row);
    setEditFormData({
      destination: row.rawDestination !== "-" ? row.rawDestination : "",
      deptDate: row.rawDeptDateIso,
      deptTime: row.rawDeptTimeIso,
      returnDate: row.rawReturnDateIso,
      returnTime: row.rawReturnTimeIso,
      startMileage: String(row.rawStartMileageNum || ""),
      endMileage: String(row.rawEndMileageNum || ""),
      remark: row.rawRemark
    });
    setStartPhotoFile(null);
    setStartPhotoPreview(row.imgStartUrl || null);
    setEndPhotoFile(null);
    setEndPhotoPreview(row.imgEndUrl || null);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsEditModalOpen(false);
    setEditingRow(null);
  };

  const handleStartPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStartPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setStartPhotoPreview(previewUrl);
    }
  };

  const handleRemoveStartPhoto = () => {
    setStartPhotoFile(null);
    setStartPhotoPreview(null);
    if (startFileInputRef.current) startFileInputRef.current.value = "";
  };

  const handleEndPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEndPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setEndPhotoPreview(previewUrl);
    }
  };

  const handleRemoveEndPhoto = () => {
    setEndPhotoFile(null);
    setEndPhotoPreview(null);
    if (endFileInputRef.current) endFileInputRef.current.value = "";
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingRow || !driverId) return;

    const startNum = Number(editFormData.startMileage);
    const endNum = Number(editFormData.endMileage);

    if (isNaN(startNum) || isNaN(endNum)) {
      showToast("กรุณากรอกเลขไมล์เริ่มต้นและสิ้นสุดเป็นตัวเลข", "error");
      return;
    }

    if (endNum < startNum) {
      showToast("เลขไมล์สิ้นสุดต้องไม่น้อยกว่าเลขไมล์เริ่มต้น", "error");
      return;
    }

    setIsSaving(true);
    try {
      let finalImgStartUrl: string | undefined = editingRow.imgStartUrl || undefined;
      let finalImgEndUrl: string | undefined = editingRow.imgEndUrl || undefined;

      // Upload start photo if a new file is chosen
      if (startPhotoFile) {
        const formData = new FormData();
        formData.append('file', startPhotoFile);
        const uploadRes = await uploadImage(formData);
        if (uploadRes.success && uploadRes.url) {
          finalImgStartUrl = uploadRes.url;
        } else {
          showToast(uploadRes.error || "ไม่สามารถอัปโหลดรูปออกรถได้", "error");
          setIsSaving(false);
          return;
        }
      } else if (!startPhotoPreview) {
        finalImgStartUrl = undefined;
      }

      // Upload end photo if a new file is chosen
      if (endPhotoFile) {
        const formData = new FormData();
        formData.append('file', endPhotoFile);
        const uploadRes = await uploadImage(formData);
        if (uploadRes.success && uploadRes.url) {
          finalImgEndUrl = uploadRes.url;
        } else {
          showToast(uploadRes.error || "ไม่สามารถอัปโหลดรูปรถกลับได้", "error");
          setIsSaving(false);
          return;
        }
      } else if (!endPhotoPreview) {
        finalImgEndUrl = undefined;
      }

      const totalDist = endNum - startNum;
      const tripLegs = [
        {
          deptDate: editFormData.deptDate,
          deptTime: editFormData.deptTime,
          passenger: editingRow.rawPassenger || editingRow.user,
          destination: editFormData.destination || editingRow.destination,
          startMileage: String(startNum),
          returnDate: editFormData.returnDate,
          returnTime: editFormData.returnTime,
          endMileage: String(endNum),
          remark: editFormData.remark
        }
      ];

      const data = {
        mileageStart: startNum,
        mileageEnd: endNum,
        totalDistance: totalDist,
        fuelRemark: editFormData.remark,
        imgStartUrl: finalImgStartUrl,
        imgEndUrl: finalImgEndUrl,
        legs: tripLegs
      };

      const res = await updateDriverLog(String(editingRow.id), driverId, data);
      if (res.success) {
        showToast("แก้ไขข้อมูลการเดินทางเรียบร้อยแล้ว", "success");
        setIsEditModalOpen(false);
        setEditingRow(null);
        await loadData();
      } else {
        showToast(res.error || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล", "error");
      }
    } catch (err) {
      console.error("Error updating driver log:", err);
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const liveStartMileage = Number(editFormData.startMileage) || 0;
  const liveEndMileage = Number(editFormData.endMileage) || 0;
  const liveTotalDistance = Math.max(0, liveEndMileage - liveStartMileage);

  const filteredRows = reportRows.filter(r => {
    const matchesSearch = 
      (r.user?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (r.destination?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesMonth = selectedMonth === "ทั้งหมด" || !selectedMonth || r.rawDeptMonth === selectedMonth;
    const matchesYear = selectedYear === "ทั้งหมด" || !selectedYear || r.rawDeptYear === selectedYear;

    return matchesSearch && matchesMonth && matchesYear;
  });

  return (
    <AppShell>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white px-4 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
            <div className={`p-1.5 rounded-full ${toastMessage.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {toastMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </div>
            <span className="text-sm font-bold text-gray-800">{toastMessage.text}</span>
          </div>
        </div>
      )}

      <div className="w-full flex-1 flex flex-col space-y-4 animate-in fade-in">
        
        {/* Section Header: Filters */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="ทั้งหมด">ทุกเดือน</option>
              <option value="มกราคม">มกราคม</option>
              <option value="กุมภาพันธ์">กุมภาพันธ์</option>
              <option value="มีนาคม">มีนาคม</option>
              <option value="เมษายน">เมษายน</option>
              <option value="พฤษภาคม">พฤษภาคม</option>
              <option value="มิถุนายน">มิถุนายน</option>
              <option value="กรกฎาคม">กรกฎาคม</option>
              <option value="สิงหาคม">สิงหาคม</option>
              <option value="กันยายน">กันยายน</option>
              <option value="ตุลาคม">ตุลาคม</option>
              <option value="พฤศจิกายน">พฤศจิกายน</option>
              <option value="ธันวาคม">ธันวาคม</option>
            </select>

            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="ทั้งหมด">ทุกปี</option>
              <option value="2567">2567</option>
              <option value="2568">2568</option>
              <option value="2569">2569</option>
              <option value="2570">2570</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-[40%]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามผู้ใช้รถ หรือ สถานที่ไป..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col justify-between min-h-[360px]">
          <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <table className="w-full min-w-[980px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50/90 text-gray-700 font-bold border-b border-gray-200 divide-x divide-gray-200">
                  <th rowSpan={2} className="py-3 px-3 text-center w-12 bg-gray-50">
                    ลำดับที่
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center bg-gray-50">
                    วันออกเดินทาง
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[140px] bg-gray-50">
                    ผู้ใช้รถ
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[160px] bg-gray-50">
                    สถานที่ไป
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[110px] bg-gray-50">
                    ระยะกม./ไมล์<br/>เมื่อออกรถ
                  </th>
                  <th colSpan={2} className="py-2 px-3 text-center bg-gray-50">
                    กลับถึงสำนักงาน
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[110px] bg-gray-50">
                    ระยะกม./ไมล์<br/>เมื่อรถกลับ
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[100px] bg-gray-50">
                    รวมระยะทาง<br/>กม./ไมล์
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[120px] bg-gray-50">
                    พนักงาน<br/>ขับรถ
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[80px] bg-gray-50">
                    หมายเหตุ
                  </th>
                  <th rowSpan={2} className="py-3 px-3 text-center min-w-[80px] bg-gray-50 sticky right-0 z-10 shadow-xs">
                    จัดการ
                  </th>
                </tr>
                <tr className="bg-gray-50/90 text-gray-600 font-bold border-b border-gray-200 divide-x divide-gray-200">
                  <th className="py-2 px-3 text-center w-24">วันที่</th>
                  <th className="py-2 px-3 text-center w-16">เวลา</th>
                  <th className="py-2 px-3 text-center w-24">วันที่</th>
                  <th className="py-2 px-3 text-center w-16">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-indigo-600 font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={20} className="animate-spin text-indigo-600" />
                        <span>กำลังโหลดข้อมูลการเดินทาง...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-purple-50/30 transition-colors divide-x divide-gray-100">
                      <td className="py-3.5 px-3 text-center font-bold text-gray-500">
                        {row.seq}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-gray-800">
                        {row.deptDate}
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-600">
                        {row.deptTime}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {row.user}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {row.destination}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-indigo-600">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{row.startMileage}</span>
                          {row.imgStartUrl && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl(row.imgStartUrl!); }}
                              className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="ดูรูปเลขไมล์เมื่อออกรถ"
                            >
                              <Camera size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-gray-800">
                        {row.returnDate}
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-600">
                        {row.returnTime}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-indigo-600">
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{row.endMileage}</span>
                          {row.imgEndUrl && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setViewingPhotoUrl(row.imgEndUrl!); }}
                              className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="ดูรูปเลขไมล์เมื่อรถกลับ"
                            >
                              <Camera size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-green-50 text-green-700 font-black text-xs">
                          {row.totalDistance}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-800 font-medium">
                        {row.driverName}
                      </td>
                      <td className="py-3.5 px-3 text-center text-gray-400">
                        {row.remark}
                      </td>
                      <td className="py-3.5 px-3 text-center sticky right-0 bg-white/95 backdrop-blur-xs shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(row)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/60 shadow-2xs transition-colors"
                          title="แก้ไขบันทึกรายการนี้"
                        >
                          <Edit size={13} />
                          <span>แก้ไข</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-gray-400 font-bold">
                      ไม่พบข้อมูลการเดินทาง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Scroll Indicator */}
          <div className="py-2.5 px-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] font-bold text-gray-400">
            <ChevronLeft size={14} />
            <span>เลื่อนตารางซ้าย-ขวา เพื่อดูข้อมูลทั้งหมด</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Signature Section Below Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end text-center">
            {/* Left Signature: Driver */}
            <div className="space-y-2 flex flex-col items-center">
              <p className="text-xs font-bold text-gray-800">{driverName}</p>
              <div className="w-48 border-b border-gray-300 pt-2"></div>
              <p className="text-xs font-bold text-gray-500 pt-1">
                พนักงานขับรถ (ผู้บันทึก)
              </p>
            </div>

            {/* Right Signature: General Affairs Officer */}
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-48 border-b border-gray-300 pt-6"></div>
              <p className="text-xs font-bold text-gray-500 pt-1">
                เจ้าหน้าที่บริหารงานทั่วไป (ผู้ตรวจทาน)
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 4-Corner Rectangular Edit Modal Box */}
      {isEditModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50/50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#311171] text-white flex items-center justify-center shadow-xs">
                  <Edit size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">แก้ไขข้อมูลการเดินทาง</h3>
                  <p className="text-xs font-semibold text-gray-500">ลำดับที่ {editingRow.seq} ({editingRow.user})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                {/* สถานที่ไป */}
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#311171]" />
                    สถานที่ไป
                  </label>
                  <input
                    type="text"
                    value={editFormData.destination}
                    onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="ระบุสถานที่ไป..."
                    required
                  />
                </div>

                {/* วัน-เวลาออกเดินทาง */}
                <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                  <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-600" />
                    วัน-เวลาออกเดินทาง
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">วันที่ออก</label>
                      <input
                        type="date"
                        value={editFormData.deptDate}
                        onChange={(e) => setEditFormData({ ...editFormData, deptDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">เวลาออก</label>
                      <input
                        type="time"
                        value={editFormData.deptTime}
                        onChange={(e) => setEditFormData({ ...editFormData, deptTime: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* วัน-เวลากลับถึงสำนักงาน */}
                <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                  <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-600" />
                    วัน-เวลากลับถึงสำนักงาน
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">วันที่กลับ</label>
                      <input
                        type="date"
                        value={editFormData.returnDate}
                        onChange={(e) => setEditFormData({ ...editFormData, returnDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">เวลากลับ</label>
                      <input
                        type="time"
                        value={editFormData.returnTime}
                        onChange={(e) => setEditFormData({ ...editFormData, returnTime: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* เลขไมล์เมื่อออกรถ และ เลขไมล์เมื่อรถกลับ */}
                <div className="bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100 space-y-3">
                  <div className="text-xs font-bold text-[#311171] flex items-center gap-1.5">
                    <Gauge size={14} />
                    ข้อมูลระยะทางและเลขไมล์ (กม./ไมล์)
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">เลขไมล์เมื่อออกรถ</label>
                      <input
                        type="number"
                        value={editFormData.startMileage}
                        onChange={(e) => setEditFormData({ ...editFormData, startMileage: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">เลขไมล์เมื่อรถกลับ</label>
                      <input
                        type="number"
                        value={editFormData.endMileage}
                        onChange={(e) => setEditFormData({ ...editFormData, endMileage: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  {/* รวมระยะทางที่คำนวณอัตโนมัติ */}
                  <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-purple-100 shadow-2xs">
                    <span className="text-xs font-bold text-gray-600">รวมระยะทางคำนวณ:</span>
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {liveTotalDistance.toLocaleString()} กม./ไมล์
                    </span>
                  </div>

                  {liveEndMileage > 0 && liveStartMileage > 0 && liveEndMileage < liveStartMileage && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      <AlertCircle size={14} />
                      <span>คำเตือน: เลขไมล์เมื่อรถกลับต้องมากกว่าหรือเท่ากับเลขไมล์เมื่อออกรถ</span>
                    </div>
                  )}
                </div>

                {/* รูปถ่ายหลักฐานเลขไมล์ (กล้อง และ แนบไฟล์) */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera size={14} className="text-[#311171]" />
                      รูปถ่ายหลักฐานเลขไมล์ (ถ่ายจากกล้อง หรือ แนบรูป)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* รูปเลขไมล์เมื่อออกรถ */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-gray-700">รูปไมล์เมื่อออกรถ</label>
                        {startPhotoPreview && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">มีรูปภาพ</span>
                        )}
                      </div>

                      {startPhotoPreview ? (
                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-28 flex items-center justify-center">
                          <img 
                            src={startPhotoPreview} 
                            alt="เลขไมล์เมื่อออกรถ" 
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={() => setViewingPhotoUrl(startPhotoPreview)}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingPhotoUrl(startPhotoPreview)}
                              className="p-1.5 bg-white/90 text-gray-700 rounded-lg hover:bg-white text-xs font-bold shadow-xs"
                              title="ดูรูปขนาดเต็ม"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => startFileInputRef.current?.click()}
                              className="p-1.5 bg-white/90 text-indigo-700 rounded-lg hover:bg-white text-xs font-bold shadow-xs"
                              title="เปลี่ยนรูป"
                            >
                              <Camera size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveStartPhoto}
                              className="p-1.5 bg-white/90 text-rose-600 rounded-lg hover:bg-white text-xs font-bold shadow-xs"
                              title="ลบรูป"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startFileInputRef.current?.click()}
                          className="w-full h-28 border-2 border-dashed border-gray-200 hover:border-[#311171]/40 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#311171] hover:bg-purple-50/20 transition-all"
                        >
                          <Camera size={22} className="text-gray-400" />
                          <span className="text-[11px] font-bold">ถ่ายรูป / แนบรูปออกรถ</span>
                        </button>
                      )}

                      <input
                        ref={startFileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleStartPhotoChange}
                      />
                    </div>

                    {/* รูปเลขไมล์เมื่อรถกลับ */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-gray-700">รูปไมล์เมื่อรถกลับ</label>
                        {endPhotoPreview && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">มีรูปภาพ</span>
                        )}
                      </div>

                      {endPhotoPreview ? (
                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-28 flex items-center justify-center">
                          <img 
                            src={endPhotoPreview} 
                            alt="เลขไมล์เมื่อรถกลับ" 
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={() => setViewingPhotoUrl(endPhotoPreview)}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingPhotoUrl(endPhotoPreview)}
                              className="p-1.5 bg-white/90 text-gray-700 rounded-lg hover:bg-white text-xs font-bold shadow-xs"
                              title="ดูรูปขนาดเต็ม"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => endFileInputRef.current?.click()}
                              className="p-1.5 bg-white/90 text-indigo-700 rounded-lg hover:bg-white text-xs font-bold shadow-xs"
                              title="เปลี่ยนรูป"
                            >
                              <Camera size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveEndPhoto}
                              className="p-1.5 bg-white/90 text-rose-600 rounded-lg hover:bg-white text-xs font-bold shadow-xs"
                              title="ลบรูป"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => endFileInputRef.current?.click()}
                          className="w-full h-28 border-2 border-dashed border-gray-200 hover:border-[#311171]/40 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#311171] hover:bg-purple-50/20 transition-all"
                        >
                          <Camera size={22} className="text-gray-400" />
                          <span className="text-[11px] font-bold">ถ่ายรูป / แนบรูปรถกลับ</span>
                        </button>
                      )}

                      <input
                        ref={endFileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleEndPhotoChange}
                      />
                    </div>
                  </div>
                </div>

                {/* หมายเหตุ */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    หมายเหตุ / การเติมน้ำมัน
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.remark}
                    onChange={(e) => setEditFormData({ ...editFormData, remark: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="ระบุหมายเหตุหรือข้อมูลน้ำมัน (ถ้ามี)..."
                  />
                </div>

              </div>

              {/* Action Button: Save */}
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-[#311171] hover:bg-[#250d55] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>บันทึก</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Lightbox Modal for Full-Size Image Preview */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2 my-auto">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Camera size={15} className="text-[#311171]" /> รูปภาพหลักฐานเลขไมล์
              </span>
              <button
                type="button"
                onClick={() => setViewingPhotoUrl(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-hidden bg-gray-950 rounded-2xl">
              <img
                src={viewingPhotoUrl}
                alt="หลักฐานเลขไมล์"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
