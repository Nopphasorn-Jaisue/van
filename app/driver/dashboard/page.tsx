"use client";
import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Clock, Users, Phone, Navigation, AlertTriangle, CheckCircle, Gauge, X, Camera, MapPin, Plus } from 'lucide-react';

export default function DriverDashboard() {
  const [tripStatus, setTripStatus] = useState<"pending" | "started" | "completed">("pending");
  
  // Modal states
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [startMileage, setStartMileage] = useState("");
  const [endMileage, setEndMileage] = useState("");
  const [stopovers, setStopovers] = useState<{name: string, distance: string}[]>([{ name: "", distance: "" }]);

  const addStopover = () => {
    setStopovers([...stopovers, { name: "", distance: "" }]);
  };

  const updateStopoverName = (index: number, value: string) => {
    const newStopovers = [...stopovers];
    newStopovers[index].name = value;
    setStopovers(newStopovers);
  };
  
  const updateStopoverDistance = (index: number, value: string) => {
    const newStopovers = [...stopovers];
    newStopovers[index].distance = value;
    setStopovers(newStopovers);
  };

  const removeStopover = (index: number) => {
    const newStopovers = stopovers.filter((_, i) => i !== index);
    setStopovers(newStopovers);
  };

  // Mock data for today's trip
  const todaysTrip = {
    id: "UPVAN-2569-0123",
    destination: "ศูนย์การเรียนรู้ จ.เชียงราย",
    time: "08:00 - 17:00",
    requester: "ดร.สมเกียรติ เรียนดี",
    faculty: "คณะวิศวกรรมศาสตร์",
    role: "อาจารย์ประจำภาควิชาวิศวกรรมคอมพิวเตอร์",
    phone: "081-234-5678",
    passengers: 10,
    van: "นข 1234 พะเยา"
  };

  useEffect(() => {
    const savedStart = localStorage.getItem('driver_start_mileage');
    const savedEnd = localStorage.getItem('driver_end_mileage');
    const savedStopovers = localStorage.getItem('driver_stopovers');
    if (savedStart) setStartMileage(savedStart);
    if (savedEnd) {
      setEndMileage(savedEnd);
      if (savedStopovers) {
        try {
          const parsed = JSON.parse(savedStopovers);
          if (Array.isArray(parsed)) {
            if (typeof parsed[0] === 'string') {
              setStopovers(parsed.map(s => ({ name: s, distance: "" })));
            } else {
              setStopovers(parsed);
            }
          }
        } catch (e) {
          setStopovers([{ name: savedStopovers, distance: "" }]);
        }
      }
      setTripStatus("completed");
    } else if (savedStart) {
      setTripStatus("started");
    }
  }, []);

  const handleStartTrip = () => {
    if (!startMileage) {
      alert("กรุณากรอกเลขไมล์ก่อนเริ่มเดินทาง");
      return;
    }
    localStorage.setItem('driver_start_mileage', startMileage);
    setTripStatus("started");
    setShowStartModal(false);
  };

  const handleCompleteTrip = () => {
    if (!endMileage) {
      alert("กรุณากรอกเลขไมล์เมื่อถึงที่หมาย");
      return;
    }
    localStorage.setItem('driver_end_mileage', endMileage);
    localStorage.setItem('driver_stopovers', JSON.stringify(stopovers.filter(s => s.name.trim() !== "")));
    // In a real app, you would validate that endMileage > startMileage
    setTripStatus("completed");
    setShowEndModal(false);
  };

  return (
    <AppShell>
      <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20 relative">
        
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">คุณ สมชาย</h1>
          <p className="text-gray-500 font-bold mt-1">คนขับ คณะวิทยาศาสตร์</p>
          <p className="text-sm text-gray-400 mt-0.5">นี่คือภารกิจของคุณในวันนี้</p>
        </div>

        {/* Today's Trip Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#311171] p-5 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold">
                  {tripStatus === "pending" ? "รอออกเดินทาง" : tripStatus === "started" ? "กำลังเดินทาง" : "เสร็จสิ้น"}
                </span>
              </div>
              <span className="text-xs font-bold opacity-80">{todaysTrip.id}</span>
            </div>
            
            <h2 className="text-xl font-black mb-1">{todaysTrip.destination}</h2>
            <div className="flex items-center gap-1.5 text-purple-100 text-sm">
              <Clock size={16} /> {todaysTrip.time}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-[#311171]">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">ผู้จอง ({todaysTrip.passengers} คน)</p>
                <p className="text-sm font-black text-[#311171] mt-0.5">{todaysTrip.requester}</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{todaysTrip.faculty}</p>
                <p className="text-[11px] text-gray-500">{todaysTrip.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">เบอร์ติดต่อ</p>
                <p className="text-sm font-bold text-gray-900">{todaysTrip.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Gauge size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">รถตู้ที่ใช้</p>
                <p className="text-sm font-bold text-gray-900">{todaysTrip.van}</p>
              </div>
            </div>
            
            {/* Display logged mileage if available */}
            {tripStatus !== "pending" && startMileage && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex justify-between items-center">
                <div className="text-xs font-bold text-gray-500">เลขไมล์เริ่มต้น</div>
                <div className="text-sm font-black text-gray-900">{startMileage} กม.</div>
              </div>
            )}
            {tripStatus === "completed" && endMileage && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex justify-between items-center">
                <div className="text-xs font-bold text-gray-500">เลขไมล์สิ้นสุด</div>
                <div className="text-sm font-black text-[#311171]">{endMileage} กม.</div>
              </div>
            )}
            
            {tripStatus === "completed" && stopovers.filter(s => s.name.trim() !== "").length > 0 && (
              <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                  <MapPin size={14} /> สถานที่แวะเพิ่มเติม
                </div>
                <div className="flex flex-col gap-1.5">
                  {stopovers.filter(s => s.name.trim() !== "").map((stopover, index) => (
                    <div key={index} className="text-sm font-bold text-gray-900 flex justify-between items-start gap-2">
                      <div className="flex items-start gap-1.5">
                        <span className="text-orange-400 mt-0.5">•</span> {stopover.name}
                      </div>
                      {stopover.distance && (
                        <div className="text-xs text-gray-500 whitespace-nowrap bg-white px-2 py-0.5 rounded-md border border-orange-100">
                          {stopover.distance} กม.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
              {tripStatus === "pending" && (
                <button 
                  onClick={() => setShowStartModal(true)}
                  className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Navigation size={20} /> เริ่มออกเดินทาง
                </button>
              )}

              {tripStatus === "started" && (
                <button 
                  onClick={() => setShowEndModal(true)}
                  className="w-full py-3.5 bg-[#311171] hover:bg-[#250d55] text-white font-black rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle size={20} /> ถึงที่หมายแล้ว
                </button>
              )}

              {tripStatus === "completed" && (
                <div className="w-full py-3.5 bg-gray-100 text-gray-400 font-black rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> ภารกิจเสร็จสิ้น
                </div>
              )}

              <button className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                <AlertTriangle size={18} /> แจ้งปัญหาฉุกเฉิน
              </button>
            </div>
          </div>
        </div>

        {/* Start Trip Modal */}
        {showStartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="bg-green-500 p-4 text-white flex justify-between items-center">
                <h3 className="font-black flex items-center gap-2">
                  <Navigation size={18} /> ยืนยันการออกเดินทาง
                </h3>
                <button onClick={() => setShowStartModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">กรุณาบันทึกเลขไมล์ปัจจุบันของรถตู้ <b>{todaysTrip.van}</b> ก่อนเริ่มเดินทาง</p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">เลขไมล์เริ่มต้น (กม.)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Gauge size={18} />
                    </div>
                    <input 
                      type="number" 
                      value={startMileage}
                      onChange={(e) => setStartMileage(e.target.value)}
                      placeholder="เช่น 125000"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-bold text-gray-900"
                    />
                  </div>
                </div>
                
                <label className="border-2 border-dashed border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors block mt-2">
                  <Camera size={20} className="text-gray-400 mb-1" />
                  <p className="text-[11px] font-bold text-gray-600">ถ่ายรูปหน้าปัด (ก่อนเดินทาง)</p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" />
                </label>
                <button 
                  onClick={handleStartTrip}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl transition-colors mt-2"
                >
                  ยืนยันและเริ่มเดินทาง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End Trip Modal */}
        {showEndModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="bg-[#311171] p-4 text-white flex justify-between items-center">
                <h3 className="font-black flex items-center gap-2">
                  <CheckCircle size={18} /> ถึงที่หมายแล้ว
                </h3>
                <button onClick={() => setShowEndModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">กรุณาบันทึกเลขไมล์เมื่อถึงที่หมาย <b>{todaysTrip.destination}</b></p>
                <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-100">
                  <span className="text-xs font-bold text-gray-500">เลขไมล์เริ่มต้นที่บันทึกไว้:</span>
                  <span className="font-black text-gray-900">{startMileage} กม.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">เลขไมล์สิ้นสุด (กม.)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Gauge size={18} />
                    </div>
                    <input 
                      type="number" 
                      value={endMileage}
                      onChange={(e) => setEndMileage(e.target.value)}
                      placeholder="เช่น 125150"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#311171] focus:border-transparent font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-500">สถานที่แวะเพิ่มเติม (ถ้ามี)</label>
                    <button 
                      type="button" 
                      onClick={addStopover}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#311171] bg-purple-50 px-2 py-1 rounded-md hover:bg-purple-100 transition-colors"
                    >
                      <Plus size={12} /> เพิ่มสถานที่
                    </button>
                  </div>
                  <div className="space-y-3">
                    {stopovers.map((stopover, index) => (
                      <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] font-bold text-gray-500">สถานที่ที่ {index + 1}</span>
                          {stopovers.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => removeStopover(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <div className="absolute top-2.5 left-0 pl-2.5 flex items-start pointer-events-none text-gray-400">
                              <MapPin size={16} />
                            </div>
                            <input 
                              type="text"
                              value={stopover.name}
                              onChange={(e) => updateStopoverName(index, e.target.value)}
                              placeholder="ชื่อสถานที่"
                              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all text-sm font-bold text-gray-900"
                            />
                          </div>
                          
                          <div className="w-[90px] relative">
                            <input 
                              type="number"
                              value={stopover.distance}
                              onChange={(e) => updateStopoverDistance(index, e.target.value)}
                              placeholder="ระยะทาง"
                              className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#311171]/20 outline-none transition-all text-sm font-bold text-gray-900"
                            />
                            <span className="absolute top-2.5 right-2 text-xs text-gray-400 font-bold">กม.</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {startMileage && endMileage && Number(endMileage) >= Number(startMileage) && (
                  <div className="bg-purple-50 p-3 rounded-xl flex justify-between items-center border border-purple-100">
                    <span className="text-xs font-bold text-purple-700">ระยะทางที่ขับทั้งหมด:</span>
                    <span className="font-black text-purple-900">{Number(endMileage) - Number(startMileage)} กม.</span>
                  </div>
                )}
                
                <label className="border-2 border-dashed border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors block mt-2">
                  <Camera size={20} className="text-gray-400 mb-1" />
                  <p className="text-[11px] font-bold text-gray-600">ถ่ายรูปหน้าปัด (หลังกลับมา)</p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" />
                </label>
                <button 
                  onClick={handleCompleteTrip}
                  className="w-full py-3 bg-[#311171] hover:bg-[#250d55] text-white font-black rounded-xl transition-colors mt-2"
                >
                  บันทึกและจบภารกิจ
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
