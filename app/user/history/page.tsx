import AppShell from '@/components/AppShell';
import { getAuthUser } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';
import { Clock, CheckCircle2, XCircle, History } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function HistoryPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch past bookings (Rejected or Approved but passed return date)
  const allUserBookings = await prisma.booking.findMany({
    where: {
      requesterId: Number(user.id),
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

  const now = new Date();
  
  // Filter for history: REJECTED or (APPROVED and returnDate is in the past)
  const historyBookings = allUserBookings.filter(b => 
    b.status === 'REJECTED' || 
    (b.status === 'APPROVED' && new Date(b.returnDate) < now)
  );

  const getStatusDisplay = (booking: typeof allUserBookings[0]) => {
    if (booking.status === 'REJECTED') {
      return { label: 'ถูกปฏิเสธ', color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle size={16} /> };
    }
    if (booking.status === 'APPROVED' && new Date(booking.returnDate) < now) {
      return { label: 'เสร็จสิ้นการเดินทาง', color: 'bg-[#efeaff] text-[#311171] border-[#311171]/20', icon: <CheckCircle2 size={16} /> };
    }
    return { label: 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Clock size={16} /> };
  };

  return (
    <AppShell>
      <div className="max-w-[1200px] w-full mx-auto animate-in fade-in flex-1 flex flex-col p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ประวัติการจองรถตู้</h1>
          <p className="text-sm text-gray-500 mt-1">ประวัติการใช้งานรถตู้ที่ผ่านมาทั้งหมดของคุณ</p>
        </div>

        {historyBookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">ยังไม่มีประวัติการจอง</h3>
            <p className="text-gray-500 mt-2 max-w-sm">คุณยังไม่มีประวัติการจองรถตู้ที่เสร็จสิ้นแล้ว หรือถูกปฏิเสธ</p>
            <Link 
              href="/user/calendar" 
              className="mt-6 px-6 py-2.5 bg-[#311171] hover:bg-[#230b54] text-white font-bold rounded-xl shadow-md transition-all"
            >
              ไปที่ปฏิทินเพื่อจองรถ
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-5">รหัสคำขอ</th>
                    <th className="py-4 px-5">วันที่เดินทาง</th>
                    <th className="py-4 px-5">ปลายทาง</th>
                    <th className="py-4 px-5">สถานะ</th>
                    <th className="py-4 px-5 text-right">คนขับ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {historyBookings.map((booking) => {
                    const status = getStatusDisplay(booking);
                    const departDate = new Date(booking.departureDate);
                    
                    return (
                      <tr key={booking.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-4 px-5 font-bold text-gray-900 whitespace-nowrap">
                          #{booking.id}
                        </td>
                        <td className="py-4 px-5 text-gray-600 whitespace-nowrap">
                          {departDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-5 text-gray-800 font-medium max-w-[200px] truncate">
                          {booking.destination}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                          {booking.status === 'REJECTED' && booking.rejectReason && (
                            <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={booking.rejectReason}>
                              {booking.rejectReason}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          {booking.assignedDriver ? (
                            <div>
                              <p className="font-bold text-gray-900">{booking.assignedDriver.user.name}</p>
                              <p className="text-xs text-gray-500">{booking.assignedDriver.assignedVan?.plate}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
