"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

// --- Mock Data ---
const MOCK_DRIVERS = [
  { id: "d1", name: "นายสมชาย ใจดี", phone: "081-234-5678", age: 45, isActive: true },
  { id: "d2", name: "นายบุญฤทธิ์ บัวบาน", phone: "093-324-6548", age: 50, isActive: true },
  { id: "d3", name: "นายวิชัย เกษียณแล้ว", phone: "089-999-9999", age: 61, isActive: false },
];

const MOCK_VANS = [
  { id: "v1", plate: "นข 4035 พะเยา", engine: "ดีเซล 2.8L", capacity: 12, isActive: true },
  { id: "v2", plate: "นข 1234 พะเยา", engine: "ดีเซล 3.0L", capacity: 10, isActive: true },
];

const MOCK_APPROVERS = [
  { id: "a1", name: "ผศ.ดร. ใจดี รักนิสิต", position: "คณบดีคณะวิศวกรรมศาสตร์", isActive: true },
  { id: "a2", name: "รศ.ดร. คนเก่า ย้ายไปแล้ว", position: "อดีตคณบดี", isActive: false },
];

export default function FacultySettingsPage() {
  const [activeTab, setActiveTab] = useState("drivers");

  return (
    <AppShell>
      <PageHeader
        title="ตั้งค่าและจัดการข้อมูลคณะ"
        description="จัดการข้อมูลพนักงานขับรถ รถตู้ ผู้มีอำนาจอนุมัติ และกฎเกณฑ์ของคณะวิศวกรรมศาสตร์"
      />

      {/* --- Tabs Navigation --- */}
      <div className="mt-6 flex overflow-x-auto border-b border-gray-200 bg-white px-2 pt-2 rounded-t-xl shadow-sm">
        <TabButton id="drivers" label="พนักงานขับรถ" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="vans" label="รถตู้ประจำคณะ" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="approvers" label="ผู้บริหาร (ผู้เซ็นอนุมัติ)" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton id="rules" label="ข้อกำหนดการยืมรถ" activeTab={activeTab} onClick={setActiveTab} />
      </div>

      {/* --- Tab Content --- */}
      <div className="rounded-b-xl border border-t-0 bg-white p-6 shadow-sm">
        
        {/* TAB 1: พนักงานขับรถ */}
        {activeTab === "drivers" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">รายชื่อพนักงานขับรถ</h2>
              <button className="rounded-lg bg-purple-800 px-4 py-2 text-sm font-bold text-white hover:bg-purple-900 shadow-sm">
                + เพิ่มพนักงานขับรถ
              </button>
            </div>
            <DataTable columns={["ชื่อ-นามสกุล", "อายุ", "เบอร์ติดต่อ", "สถานะ", "จัดการ"]}>
              {MOCK_DRIVERS.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{d.name}</td>
                  <td className="p-4 text-gray-600">{d.age} ปี</td>
                  <td className="p-4 text-gray-600">{d.phone}</td>
                  <td className="p-4"><StatusBadge isActive={d.isActive} activeText="ปฏิบัติงาน" inactiveText="ลาออก/เกษียณ" /></td>
                  <td className="p-4"><ActionButtons isActive={d.isActive} /></td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {/* TAB 2: รถตู้ */}
        {activeTab === "vans" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">ข้อมูลรถตู้ประจำคณะ</h2>
              <button className="rounded-lg bg-purple-800 px-4 py-2 text-sm font-bold text-white hover:bg-purple-900 shadow-sm">
                + เพิ่มรถตู้ใหม่
              </button>
            </div>
            <DataTable columns={["ป้ายทะเบียน", "สเปคเครื่องยนต์", "จำนวนที่นั่ง", "สถานะ", "จัดการ"]}>
              {MOCK_VANS.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-bold text-purple-900">{v.plate}</td>
                  <td className="p-4 text-gray-600">{v.engine}</td>
                  <td className="p-4 text-gray-600">{v.capacity} ที่นั่ง</td>
                  <td className="p-4"><StatusBadge isActive={v.isActive} activeText="พร้อมใช้งาน" inactiveText="ปลดระวาง" /></td>
                  <td className="p-4"><ActionButtons isActive={v.isActive} /></td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {/* TAB 3: ผู้บริหาร */}
        {activeTab === "approvers" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">ผู้มีอำนาจอนุมัติ (คณบดี / รักษาการ)</h2>
                <p className="text-sm text-gray-500 mt-1">ชื่อที่แสดงสถานะ "ดำรงตำแหน่ง" จะถูกนำไปพิมพ์ลงในเอกสาร PDF อัตโนมัติ</p>
              </div>
              <button className="rounded-lg bg-purple-800 px-4 py-2 text-sm font-bold text-white hover:bg-purple-900 shadow-sm">
                + เพิ่มผู้บริหารท่านใหม่
              </button>
            </div>
            <DataTable columns={["ชื่อ-นามสกุล", "ตำแหน่ง", "สถานะ", "จัดการ"]}>
              {MOCK_APPROVERS.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{a.name}</td>
                  <td className="p-4 text-gray-600">{a.position}</td>
                  <td className="p-4"><StatusBadge isActive={a.isActive} activeText="ดำรงตำแหน่ง" inactiveText="หมดวาระ" /></td>
                  <td className="p-4"><ActionButtons isActive={a.isActive} /></td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}

        {/* TAB 4: กฎและข้อกำหนด */}
        {activeTab === "rules" && (
          <div className="animate-in fade-in duration-300 max-w-2xl">
            <h2 className="mb-6 text-lg font-bold text-gray-800">ตั้งค่าเงื่อนไขการจองรถของคณะ</h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700">อนุญาตให้คณะอื่นยืมรถได้หรือไม่?</label>
                <select className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-purple-500">
                  <option>อนุญาต (เข้าสู่ระบบจับคู่ AI)</option>
                  <option>ไม่อนุญาต (สงวนสิทธิ์เฉพาะคนในคณะ)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">จองล่วงหน้าขั้นต่ำ (วัน)</label>
                  <input type="number" defaultValue={3} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">จองล่วงหน้าสูงสุด (วัน)</label>
                  <input type="number" defaultValue={30} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:border-purple-500" />
                </div>
              </div>
              <button className="mt-4 rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 shadow-sm">
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        )}
        
      </div>
    </AppShell>
  );
}

// --- Helper Components ---

function TabButton({ id, label, activeTab, onClick }: { id: string, label: string, activeTab: string, onClick: (id: string) => void }) {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
        isActive ? "border-purple-800 text-purple-800" : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function DataTable({ columns, children }: { columns: string[], children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            {columns.map(col => <th key={col} className="p-4 font-semibold">{col}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function StatusBadge({ isActive, activeText, inactiveText }: { isActive: boolean, activeText: string, inactiveText: string }) {
  return isActive ? (
    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">{activeText}</span>
  ) : (
    <span className="inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">{inactiveText}</span>
  );
}

function ActionButtons({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex gap-2">
      <button className="rounded border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">แก้ไข</button>
      <button className={`rounded px-3 py-1 text-xs font-medium text-white shadow-sm ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400 hover:bg-gray-500'}`}>
        {isActive ? 'ระงับใช้งาน' : 'กู้คืน'}
      </button>
    </div>
  );
}