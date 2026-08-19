"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Phone, Search, Star, UserRound, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import type { SystemBooking } from "@/lib/booking-system-types";

type DriverRow = {
  id: string;
  name: string;
  phone: string;
  faculty: string;
  vanPlate: string;
  experienceYears: number;
  score: number;
  availability: "AVAILABLE" | "ON_TRIP" | "OFF_DUTY";
  unavailableReason?: string;
  assignedCount: number;
};

const availabilityMeta = {
  AVAILABLE: { label: "ว่าง", chip: "bg-green-100 text-green-700" },
  ON_TRIP: { label: "กำลังขับ", chip: "bg-amber-100 text-amber-700" },
  OFF_DUTY: { label: "ลาหยุด", chip: "bg-red-100 text-red-600" },
};

function formatDateShort(value: string) {
  return new Date(value).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DriverDispatchPage() {
  const [bookings, setBookings] = useState<SystemBooking[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  const loadData = async () => {
    const [bookingResponse, driverResponse] = await Promise.all([
      fetch("/api/bookings", { cache: "no-store" }),
      fetch("/api/drivers", { cache: "no-store" }),
    ]);

    const bookingData = await bookingResponse.json();
    const driverData = await driverResponse.json();

    const bookingRows = (bookingData.bookings || []).filter((b: SystemBooking) => !b.assignedDriverId && b.status !== "REJECTED");
    setBookings(bookingRows);
    setDrivers(driverData.drivers || []);

    if (bookingRows.length > 0 && !selectedBookingId) {
      setSelectedBookingId(bookingRows[0].id);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedBooking = useMemo(
    () => bookings.find((item) => item.id === selectedBookingId) || null,
    [bookings, selectedBookingId],
  );

  const filteredDrivers = useMemo(() => {
    let result = drivers;

    // Filter drivers to match the selected booking's faculty
    if (selectedBooking) {
      result = result.filter((driver) => driver.faculty === selectedBooking.requesterFaculty);
    }

    const term = searchText.trim().toLowerCase();
    if (!term) {
      return result;
    }

    return result.filter((driver) => {
      const text = [driver.name, driver.phone, driver.faculty, driver.vanPlate].join(" ").toLowerCase();
      return text.includes(term);
    });
  }, [drivers, searchText, selectedBooking]);

  const assignDriver = async () => {
    if (!selectedBooking || !selectedDriverId) {
      return;
    }

    await fetch(`/api/bookings/${selectedBooking.id}/assign-driver`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId: selectedDriverId }),
    });

    setSelectedDriverId("");
    await loadData();
  };

  return (
    <AppShell>
      <div className="max-w-[1500px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">เลือกคนขับรถตู้</h1>
          <p className="text-gray-500 mt-2">จับคู่คนขับที่พร้อมปฏิบัติงานกับคำขอที่รอแอดมินตรวจสอบ</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex-1 min-w-72 relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="ค้นหาชื่อคนขับ / เบอร์โทร / คณะ / ทะเบียน"
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#311171]"
                />
              </div>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700"
              >
                {bookings.length === 0 && <option value="">ไม่มีคำขอรอตรวจสอบ</option>}
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.id} - {booking.destination}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredDrivers.map((driver) => {
                const meta = availabilityMeta[driver.availability];
                const isSelected = selectedDriverId === driver.id;
                const disabled = driver.availability !== "AVAILABLE";

                return (
                  <article
                    key={driver.id}
                    className={`rounded-2xl border p-4 transition ${isSelected ? "border-[#311171] ring-2 ring-purple-100" : "border-gray-200"} ${disabled ? "opacity-70" : "hover:shadow-sm"}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserRound size={22} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{driver.name}</p>
                          <p className="text-xs text-gray-500">{driver.faculty}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.chip}`}>{meta.label}</span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                      <p className="flex items-center gap-2"><Phone size={14} /> {driver.phone}</p>
                      <p>รถประจำ: {driver.vanPlate}</p>
                      <p>ประสบการณ์ขับรถ {driver.experienceYears} ปี</p>
                      <p className="flex items-center gap-1">คะแนน <Star size={13} className="text-yellow-500" /> {driver.score.toFixed(1)}</p>
                      {driver.unavailableReason && <p className="text-xs text-red-500">สถานะ: {driver.unavailableReason}</p>}
                    </div>

                    <button
                      disabled={disabled}
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`w-full mt-4 rounded-xl py-2.5 font-bold text-sm transition ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : isSelected ? "bg-[#311171] text-white" : "border border-[#311171] text-[#311171] hover:bg-purple-50"}`}
                    >
                      {disabled ? "ไม่สามารถเลือกได้" : isSelected ? "เลือกแล้ว" : "เลือกคนขับ"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-fit sticky top-4">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-black text-gray-900">รายละเอียดคำขอที่เลือก</h2>
              <button className="text-gray-400"><X size={18} /></button>
            </div>

            {selectedBooking ? (
              <>
                <div className="mt-5 p-4 rounded-xl border bg-gray-50 space-y-2 text-sm">
                  <p className="font-black text-gray-900">{selectedBooking.id}</p>
                  <p className="text-gray-700">{selectedBooking.destination}</p>
                  <p className="text-gray-500">ผู้ยื่น: {selectedBooking.requester}</p>
                  <p className="text-gray-500">คณะ: {selectedBooking.requesterFaculty}</p>
                  <p className="text-gray-500">ผู้โดยสาร: {selectedBooking.passengers} คน</p>
                  <p className="text-gray-500 flex items-center gap-1"><CalendarDays size={14} /> {formatDateShort(selectedBooking.startAt)}</p>
                </div>

                <button
                  onClick={assignDriver}
                  disabled={!selectedDriverId}
                  className="mt-6 w-full rounded-xl bg-[#311171] text-white py-3 font-bold disabled:bg-gray-300"
                >
                  มอบหมายให้คำขอการจองนี้
                </button>
                <p className="text-xs text-gray-500 mt-3">เมื่อมอบหมายแล้ว สถานะจะเปลี่ยนเป็น &quot;รอผู้บริหารอนุมัติ&quot; โดยอัตโนมัติ</p>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-4">ยังไม่มีคำขอรอตรวจสอบ</p>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
