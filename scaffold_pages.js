/* eslint-disable */
const fs = require('fs');
const path = require('path');

const pages = [
  { path: 'calendar', title: 'ตารางการใช้รถตู้', subtitle: 'ดูและจัดการตารางการใช้รถตู้ของคณะ' },
  { path: 'approvals', title: 'คำขอที่ต้องอนุมัติ', subtitle: 'รายการคำขอใช้รถตู้ที่รอการอนุมัติ' },
  { path: 'vans', title: 'จัดการรถประจำคณะ', subtitle: 'เพิ่ม ลบ และแก้ไขข้อมูลรถตู้ประจำคณะ' },
  { path: 'drivers', title: 'จัดการคนขับ', subtitle: 'จัดการข้อมูลพนักงานขับรถของคณะ' },
  { path: 'maintenance', title: 'จัดการซ่อมบำรุง', subtitle: 'บันทึกและติดตามประวัติการซ่อมบำรุงรถตู้' },
  { path: 'google-calendar', title: 'ปฏิทินคณะ / Google', subtitle: 'เชื่อมต่อและดูข้อมูลปฏิทิน Google Calendar' },
  { path: 'reports', title: 'รายงานและสถิติ', subtitle: 'ดูสถิติการใช้งานและสรุปรายงานต่างๆ' },
  { path: 'contact', title: 'ข้อมูลติดต่อคณะ', subtitle: 'จัดการข้อมูลการติดต่อของคณะ' }
];

const basePath = 'c:\\Users\\User\\Downloads\\vans 1\\vans\\my-vans\\app\\faculty-admin';

pages.forEach(page => {
  const dir = path.join(basePath, page.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = `"use client";
import React from 'react';
import AppShell from '@/components/AppShell';

export default function Page() {
  return (
    <AppShell>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[calc(100vh-120px)] flex flex-col">
        <h2 className="text-xl font-black text-gray-900 mb-2">${page.title}</h2>
        <p className="text-sm text-gray-500 mb-6">${page.subtitle}</p>
        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-8">
           <p className="text-gray-400 font-medium">เนื้อหา${page.title}จะแสดงที่นี่..</p>
        </div>
      </div>
    </AppShell>
  );
}
`;

  fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf8');
});

// Handle dashboard move
const dashboardDir = path.join(basePath, 'dashboard');
if (!fs.existsSync(dashboardDir)) {
  fs.mkdirSync(dashboardDir, { recursive: true });
}

const oldDashboardFile = path.join(basePath, 'page.tsx');
const newDashboardFile = path.join(dashboardDir, 'page.tsx');

if (fs.existsSync(oldDashboardFile)) {
  const content = fs.readFileSync(oldDashboardFile, 'utf8');
  if (content.includes('FacultyAdminDashboard')) {
      fs.renameSync(oldDashboardFile, newDashboardFile);
  }
}

// Create redirect in /faculty-admin
const redirectContent = `import { redirect } from 'next/navigation';

export default function FacultyAdminRedirect() {
  redirect('/faculty-admin/dashboard');
}
`;
fs.writeFileSync(oldDashboardFile, redirectContent, 'utf8');

console.log('Successfully created all pages!');
