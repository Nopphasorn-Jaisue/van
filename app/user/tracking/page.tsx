import React from 'react';
import AppShell from '@/components/AppShell';
import { getAuthUser } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';
import { Clock, MapPin, Users, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function TrackingPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch pending and ongoing bookings for this user
  const activeBookings = await prisma.booking.findMany({
    where: {
      requesterId: Number(user.id),
      status: {
        in: ['WAITING_ADMIN', 'WAITING_EXEC', 'APPROVED']
      }
    },
    include: {
      targetFaculty: true,
      assignedDriver: {
        include: { user: true, assignedVan: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'WAITING_ADMIN': 
        return { label: 'รอแอดมินคณะอนุมัติ', color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'WAITING_EXEC': 
        return { label: 'รอคณบดีอนุมัติ', color: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'APPROVED': 
        return { label: 'อนุมัติแล้ว (รอดำเนินการ)', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      default: 
        return { label: 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1200px] w-full mx-auto animate-in fade-in flex-1 flex flex-col p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ติดตามสถานะการจอง</h1>
          <p className="text-sm text-gray-500 mt-1">คำขอจองรถตู้ที่กำลังดำเนินการของคุณ</p>
        </div>

        {activeBookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">ไม่มีคำขอที่กำลังดำเนินการ</h3>
            <p className="text-gray-500 mt-2 max-w-sm">คุณยังไม่มีคำขอจองรถตู้ที่อยู่ในระหว่างการรออนุมัติหรือเตรียมเดินทาง</p>
            <Link 
              href="/user/calendar" 
              className="mt-6 px-6 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white font-bold rounded-xl shadow-md transition-all"
            >
              ไปที่ปฏิทินเพื่อจองรถ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBookings.map((booking) => {
              const status = getStatusDisplay(booking.status);
              const departDate = new Date(booking.departureDate);
              const returnDate = new Date(booking.returnDate);
              const isCrossFaculty = booking.targetFacultyId !== user.facultyId;

              return (
                <div key={booking.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs font-bold text-gray-400">#{booking.id}</span>
                    </div>
                    <h3 className="font-black text-lg text-gray-900 line-clamp-1">{booking.objective}</h3>
                    {isCrossFaculty && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md">
                        <AlertCircle size={12} /> ยืมรถต่างคณะ ({booking.targetFaculty.nameTh})
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-0.5">ปลายทาง</p>
                        <p className="text-sm font-medium text-gray-900">{booking.destination}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-0.5">วันเดินทาง</p>
                        <p className="text-sm font-medium text-gray-900">
                          {departDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} เวลา {departDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </p>
                        {departDate.toDateString() !== returnDate.toDateString() && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            ถึง {returnDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} เวลา {returnDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-0.5">ผู้โดยสาร</p>
                        <p className="text-sm font-medium text-gray-900">{booking.passengersCount} ท่าน</p>
                      </div>
                    </div>
                  </div>

                  {booking.status === 'APPROVED' && booking.assignedDriver && (
                    <div className="p-4 bg-emerald-50 border-t border-emerald-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                        {booking.assignedDriver.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-800">คนขับ: {booking.assignedDriver.user.name}</p>
                        <p className="text-[10px] text-emerald-600">รถตู้: {booking.assignedDriver.assignedVan?.plate}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
