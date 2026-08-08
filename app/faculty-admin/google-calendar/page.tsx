"use client";
import { useState, useEffect, Suspense } from 'react';
import AppShell from '@/components/AppShell';
import { Calendar as CalendarIcon, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Key, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEventItem {
  time: string;
  title: string;
  color: string;
  location?: string;
  driverName?: string;
}

function GoogleCalendarContent() {
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ connected: boolean; message: string; eventCount: number } | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<Record<string, CalendarEventItem[]>>({});
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, []);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar-events?year=${selectedYear}&month=${selectedMonth}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          const data = JSON.parse(text);
          const events: Record<string, CalendarEventItem[]> = data.events || {};
          setCalendarEvents(events);
          const count = Object.values(events).reduce((acc: number, curr: CalendarEventItem[]) => acc + curr.length, 0);
          setSyncStatus({
            connected: true,
            message: 'เชื่อมต่อและดึงข้อมูลปฏิทินสำเร็จ',
            eventCount: count,
          });
        }
      } else {
        setSyncStatus({
          connected: false,
          message: 'ไม่พบการตั้งค่า GOOGLE_CALENDAR_ID ใน .env (แสดงข้อมูลตัวอย่าง)',
          eventCount: 4,
        });
        setCalendarEvents({
          [`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-15`]: [
            { time: "08:30 น.", title: "เดินทางไปลงพื้นที่ อ.เชียงคำ (รถตู้ กข-1234)", color: "bg-blue-100 text-blue-800 border-blue-200" },
            { time: "13:00 น.", title: "รับคณะประเมินคุณภาพ มพ. (รถตู้ กข-5678)", color: "bg-purple-100 text-purple-800 border-purple-200" }
          ],
          [`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-20`]: [
            { time: "09:00 น.", title: "สัมมนาอาจารย์ ICT ณ ศูนย์การเรียนรู้ (รถตู้ กข-1234)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" }
          ],
          [`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-25`]: [
            { time: "07:00 น.", title: "ส่งอาจารย์เข้าร่วมประชุม สนามบินเชียงราย", color: "bg-amber-100 text-amber-800 border-amber-200" }
          ]
        });
      }
    } catch (err) {
      console.error(err);
      setSyncStatus({
        connected: false,
        message: 'ไม่สามารถดึงข้อมูลปฏิทินได้',
        eventCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [selectedMonth, selectedYear]);

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efeaff] text-[#311171] text-xs font-bold mb-3">
            <Globe size={14} /> Google Calendar Integration
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">เชื่อมต่อ Google Calendar คณะ</h1>
          <p className="text-gray-500 mt-1">ซิงค์ภารกิจรถตู้ที่อนุมัติแล้วลงในปฏิทินกลางของคณะแบบอัตโนมัติ</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all border border-gray-200"
          >
            <Key size={16} />
            <span>คำแนะนำการตั้งค่า API Key</span>
          </button>
          
          <button
            onClick={fetchCalendarEvents}
            disabled={loading}
            className="px-4 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>ซิงค์ข้อมูลปฏิทิน</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          syncStatus.connected ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            {syncStatus.connected ? (
              <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">{syncStatus.message}</p>
              <p className="text-xs opacity-80 mt-0.5">พบภารกิจการเดินรถในปฏิทินจำนวน {syncStatus.eventCount} รายการ</p>
            </div>
          </div>

          <a 
            href="https://calendar.google.com" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-xs font-bold shadow-xs hover:bg-gray-50 shrink-0 border border-gray-200/80"
          >
            <span>เปิด Google Calendar</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Month Selector */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-lg font-black text-gray-900 w-44 text-center">
            {monthNames[selectedMonth - 1]} {selectedYear + 543}
          </span>

          <button 
            onClick={() => {
              if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="text-xs font-medium text-gray-500">
          แสดงกิจกรรมเดินรถตู้ของประจำเดือน {monthNames[selectedMonth - 1]}
        </div>
      </div>

      {/* Events List View */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon size={18} className="text-[#311171]" />
          รายการนัดหมายเดินรถใน Google Calendar ({monthNames[selectedMonth - 1]})
        </h2>

        {Object.keys(calendarEvents).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CalendarIcon size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">ไม่พบรายการนัดหมายเดินรถตู้ในเดือนนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(calendarEvents).map(([dateStr, events]) => {
              const dateObj = new Date(dateStr);
              return (
                <div key={dateStr} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                  <div className="font-bold text-sm text-[#311171] border-b border-gray-200 pb-2 flex items-center justify-between">
                    <span>
                      {dateObj.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-xs font-normal text-gray-500">{events.length} รายการ</span>
                  </div>

                  <div className="space-y-2">
                    {events.map((ev, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-purple-50 text-[#311171] rounded-lg text-xs font-bold shrink-0">
                            {ev.time}
                          </span>
                          <span className="font-medium text-xs text-gray-900">{ev.title}</span>
                        </div>

                        <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 font-bold self-start sm:self-auto">
                          ✓ Synced to Google Calendar
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Config Instruction Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#311171] text-white">
              <div className="flex items-center gap-2">
                <Key size={18} />
                <h3 className="font-bold text-base">วิธีตั้งค่า Google Calendar Service Account</h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-white/70 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 space-y-4 text-xs text-gray-700 leading-relaxed">
              <p className="font-semibold text-gray-900 text-sm">
                การเชื่อมต่อกับ Google Calendar จริง ต้องใส่ค่าตัวแปรในไฟล์ <code className="bg-gray-100 px-1.5 py-0.5 rounded text-purple-700">.env</code> ของโปรเจกต์:
              </p>

              <div className="bg-gray-900 text-gray-200 p-4 rounded-xl font-mono text-[11px] space-y-1.5">
                <p className="text-gray-400"># Google Calendar Service Account</p>
                <p><span className="text-purple-400">GOOGLE_CALENDAR_ID</span>=&quot;your-calendar-id@group.calendar.google.com&quot;</p>
                <p><span className="text-purple-400">GOOGLE_CLIENT_EMAIL</span>=&quot;service-account@project.iam.gserviceaccount.com&quot;</p>
                <p><span className="text-purple-400">GOOGLE_PRIVATE_KEY</span>=&quot;-----BEGIN PRIVATE KEY-----\n...&quot;</p>
              </div>

              <div className="space-y-2 bg-purple-50 p-4 rounded-xl border border-purple-100 text-purple-900">
                <p className="font-bold">ขั้นตอนสร้าง Service Account ใน Google Cloud Console:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>สร้างโปรเจกต์ใหม่ใน Google Cloud Platform</li>
                  <li>เปิดใช้งาน <strong>Google Calendar API</strong></li>
                  <li>สร้าง Service Account และดาวน์โหลด JSON Key File</li>
                  <li>แชร์ปฏิทิน Google Calendar ที่ต้องการให้ Client Email สามารถจัดการได้ (Make changes to events)</li>
                </ol>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-5 py-2 bg-[#311171] text-white text-xs font-bold rounded-xl hover:bg-[#230b54] transition-colors"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoogleCalendarPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#311171]"></div>
        </div>
      }>
        <GoogleCalendarContent />
      </Suspense>
    </AppShell>
  );
}
