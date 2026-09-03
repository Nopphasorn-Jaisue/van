import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/app/actions/auth';
import { createAuditLog } from '@/app/actions/audit';

const FACULTY_INFO_MAP: Record<string, { code: string; phone: string; email: string; address: string; executiveTitle: string }> = {
  "คณะเทคโนโลยีสารสนเทศและการสื่อสาร": {
    code: "ICT",
    phone: "054-466-666 ต่อ 2261, 2300",
    email: "ict@up.ac.th",
    address: "อาคารเทคโนโลยีสารสนเทศและการสื่อสาร มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะ ICT"
  },
  "คณะวิทยาศาสตร์": {
    code: "SCI",
    phone: "054-466-666 ต่อ 1700",
    email: "science@up.ac.th",
    address: "อาคารปฏิบัติการวิทยาศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะวิทยาศาสตร์"
  },
  "คณะเภสัชฯ": {
    code: "PHARM",
    phone: "054-466-666 ต่อ 3188",
    email: "pharmacy@up.ac.th",
    address: "อาคารคณะเภสัชศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะเภสัชศาสตร์"
  },
  "คณะเภสัชศาสตร์": {
    code: "PHARM",
    phone: "054-466-666 ต่อ 3188",
    email: "pharmacy@up.ac.th",
    address: "อาคารคณะเภสัชศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะเภสัชศาสตร์"
  },
  "คณะแพทยศาสตร์": {
    code: "MED",
    phone: "054-466-666 ต่อ 3300",
    email: "medicine@up.ac.th",
    address: "อาคารคณะแพทยศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะแพทยศาสตร์"
  },
  "คณะพยาบาลศาสตร์": {
    code: "NUR",
    phone: "054-466-666 ต่อ 3200",
    email: "nurse@up.ac.th",
    address: "อาคารคณะพยาบาลศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะพยาบาลศาสตร์"
  },
  "คณะวิศวกรรมศาสตร์": {
    code: "ENGR",
    phone: "054-466-666 ต่อ 2100",
    email: "engineering@up.ac.th",
    address: "อาคารคณะวิศวกรรมศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะวิศวกรรมศาสตร์"
  },
  "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ": {
    code: "AGRI",
    phone: "054-466-666 ต่อ 3100",
    email: "agri@up.ac.th",
    address: "อาคารคณะเกษตรศาสตร์ฯ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะเกษตรศาสตร์ฯ"
  },
  "คณะนิติศาสตร์": {
    code: "LAW",
    phone: "054-466-666 ต่อ 1500",
    email: "law@up.ac.th",
    address: "อาคารคณะนิติศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะนิติศาสตร์"
  },
  "คณะรัฐศาสตร์และสังคมศาสตร์": {
    code: "POL",
    phone: "054-466-666 ต่อ 1600",
    email: "politics@up.ac.th",
    address: "อาคารคณะรัฐศาสตร์ฯ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะรัฐศาสตร์ฯ"
  },
  "คณะวิทยาการจัดการและสารสนเทศศาสตร์": {
    code: "BCA",
    phone: "054-466-666 ต่อ 1800",
    email: "bca@up.ac.th",
    address: "อาคารคณะวิทยาการจัดการฯ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะวิทยาการจัดการฯ"
  },
  "คณะศิลปศาสตร์": {
    code: "LIB",
    phone: "054-466-666 ต่อ 1900",
    email: "liberalarts@up.ac.th",
    address: "อาคารคณะศิลปศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะศิลปศาสตร์"
  },
  "คณะสถาปัตยกรรมศาสตร์และศิลปสร้างสรรค์": {
    code: "ARCH",
    phone: "054-466-666 ต่อ 3400",
    email: "architecture@up.ac.th",
    address: "อาคารคณะสถาปัตยกรรมศาสตร์ฯ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะสถาปัตยกรรมศาสตร์ฯ"
  },
  "คณะสาธารณสุขศาสตร์": {
    code: "PH",
    phone: "054-466-666 ต่อ 3500",
    email: "publichealth@up.ac.th",
    address: "อาคารคณะสาธารณสุขศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะสาธารณสุขศาสตร์"
  },
  "คณะทันตแพทยศาสตร์": {
    code: "DENT",
    phone: "054-466-666 ต่อ 3600",
    email: "dentistry@up.ac.th",
    address: "อาคารคณะทันตแพทยศาสตร์ มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร คณะทันตแพทยศาสตร์"
  },
  "วิทยาลัยการศึกษา": {
    code: "EDU",
    phone: "054-466-666 ต่อ 3700",
    email: "education@up.ac.th",
    address: "อาคารวิทยาลัยการศึกษา มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองผู้อำนวยการวิทยาลัยการศึกษา"
  },
  "วิทยาลัยการจัดการ": {
    code: "UPCM",
    phone: "02-655-3700",
    email: "upcm@up.ac.th",
    address: "วิทยาลัยการจัดการ กรุงเทพมหานคร",
    executiveTitle: "รองผู้อำนวยการวิทยาลัยการจัดการ"
  }
};

function getFacultyInfo(name: string) {
  if (FACULTY_INFO_MAP[name]) return FACULTY_INFO_MAP[name];
  for (const [k, v] of Object.entries(FACULTY_INFO_MAP)) {
    if (name.includes(k) || k.includes(name)) return v;
  }
  return {
    code: name.replace(/^คณะ/, '').substring(0, 4).toUpperCase(),
    phone: "054-466-666",
    email: "info@up.ac.th",
    address: "มหาวิทยาลัยพะเยา 19 ม.2 ต.แม่กา อ.เมือง จ.พะเยา 56000",
    executiveTitle: "รองคณบดีฝ่ายบริหาร"
  };
}

interface RawFacultyRow {
  id: number;
  name: string;
  adminName: string | null;
  adminEmail: string | null;
  execName: string | null;
  execEmail: string | null;
  totalVans: number | string;
  mainDrivers: number | string;
}

interface CachedFacultyItem {
  id: number;
  name: string;
  code?: string;
  adminName?: string;
  adminPhone?: string;
  adminTitle?: string;
  adminEmail?: string;
  executiveName?: string;
  executiveTitle?: string;
  executivePhone?: string;
  executiveEmail?: string;
  status?: string;
  vanCount?: number;
  driverCount?: number;
  phone?: string;
  email?: string;
  address?: string;
  [key: string]: unknown;
}
let cachedFaculties: { data: CachedFacultyItem[]; timestamp: number } | null = null;

export function invalidateFacultiesCache() {
  cachedFaculties = null;
}

export async function GET() {
  if (cachedFaculties && (Date.now() - cachedFaculties.timestamp < 30 * 1000)) {
    return NextResponse.json({ success: true, data: cachedFaculties.data });
  }

  try {
    const dbFaculties = await prisma.faculty.findMany({
      where: { nameTh: { not: 'ศูนย์จัดการระบบส่วนกลาง' } },
      include: {
        users: true,
        vans: true,
        drivers: {
          include: {
            user: true,
            assignedVan: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    const mapped = dbFaculties.map(f => {
      const info = getFacultyInfo(f.nameTh);
      const adminUser = f.users.find(u => u.role === 'FACULTY_ADMIN');
      const execUser = f.users.find(u => u.role === 'EXECUTIVE');
      
      const driversList = f.drivers.map(d => ({
        id: d.id,
        name: d.user?.name || 'พนักงานขับรถ',
        email: d.user?.email || '-',
        phone: d.phone || '-',
        type: (d.type === 'PRIMARY' ? 'คนขับหลัก' : 'คนขับเสริม') as string,
        status: d.isActive ? 'พร้อมปฏิบัติงาน' : 'ไม่พร้อม',
        assignedVanPlate: d.assignedVan?.plate || 'ไม่มีรถประจำ',
        avatar: d.user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
      }));

      const vansList = f.vans.map(v => ({
        id: v.id,
        plate: v.plate,
        name: v.name || 'Toyota Commuter',
        capacity: v.capacity || 12,
        status: v.isActive ? 'พร้อมใช้งาน' : 'ซ่อมบำรุง',
        image: v.image || null
      }));

      return {
        id: f.id,
        name: f.nameTh,
        code: info.code,
        adminName: adminUser?.name || "ยังไม่ระบุผู้ดูแล",
        adminPhone: info.phone,
        adminTitle: "ผู้ดูแลระบบคณะ (Faculty Admin)",
        adminEmail: adminUser?.email || info.email,
        executiveName: execUser?.name || "รองคณบดีฝ่ายบริหาร",
        executiveTitle: info.executiveTitle,
        executivePhone: info.phone,
        executiveEmail: execUser?.email || info.email,
        totalVans: f.vans.length,
        mainDrivers: f.drivers.filter(d => d.type === 'PRIMARY').length,
        subDrivers: f.drivers.filter(d => d.type !== 'PRIMARY').length,
        phone: info.phone,
        email: info.email,
        address: info.address,
        driversList,
        vansList,
        status: "ACTIVE" as const
      };
    });

    cachedFaculties = { data: mapped, timestamp: Date.now() };
    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error("GET /api/super-admin/faculties error:", error);
    if (cachedFaculties) {
      return NextResponse.json({ success: true, data: cachedFaculties.data });
    }
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการโหลดข้อมูลคณะ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized: คุณไม่มีสิทธิ์จัดการข้อมูลคณะ" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "กรุณาระบุชื่อคณะ" }, { status: 400 });
    }

    const newFaculty = await prisma.faculty.create({
      data: {
        nameTh: name.trim(),
        googleCalendarId: body.googleCalendarId || null
      }
    });

    cachedFaculties = null;

    await createAuditLog({
      action: `เพิ่มคณะใหม่`,
      target: `คณะ: ${newFaculty.nameTh}`,
      type: 'info',
      userId: typeof user.id === 'number' ? user.id : undefined
    });

    return NextResponse.json({ success: true, data: newFaculty });
  } catch (error) {
    console.error("POST /api/super-admin/faculties error:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการเพิ่มคณะ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized: คุณไม่มีสิทธิ์จัดการข้อมูลคณะ" }, { status: 403 });
    }

    const body = await request.json();
    const { id, adminUserId } = body;

    if (id && adminUserId) {
      const facultyId = Number(id);
      const targetUserId = Number(adminUserId);

      // Demote old admin
      await prisma.user.updateMany({
        where: { facultyId, role: 'FACULTY_ADMIN' },
        data: { role: 'USER' }
      });

      // Promote new admin
      await prisma.user.update({
        where: { id: targetUserId },
        data: { role: 'FACULTY_ADMIN', facultyId }
      });

      cachedFaculties = null;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/super-admin/faculties error:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัปเดตคณะ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: "Unauthorized: คุณไม่มีสิทธิ์ในการลบข้อมูลคณะ" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    if (!idParam) {
      return NextResponse.json({ success: false, error: "กรุณาระบุ ID ของคณะที่ต้องการลบ" }, { status: 400 });
    }

    const facultyId = parseInt(idParam, 10);
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        vans: true,
        drivers: true,
        users: true
      }
    });

    if (!faculty) {
      return NextResponse.json({ success: false, error: "ไม่พบคณะที่ต้องการลบ" }, { status: 404 });
    }

    if (faculty.vans.length > 0 || faculty.drivers.length > 0 || faculty.users.length > 0) {
      return NextResponse.json({
        success: false,
        error: "ไม่สามารถลบคณะได้ เนื่องจากมีข้อมูลรถประจำคณะ พนักงานขับรถ หรือผู้ใช้งานผูกอยู่ กรุณาลบข้อมูลที่เกี่ยวข้องก่อน"
      }, { status: 400 });
    }

    await prisma.faculty.delete({
      where: { id: facultyId }
    });

    cachedFaculties = null;

    await createAuditLog({
      action: `ลบข้อมูลคณะ`,
      target: `คณะ: ${faculty.nameTh}`,
      type: 'danger',
      userId: typeof user.id === 'number' ? user.id : undefined
    });

    return NextResponse.json({ success: true, message: "ลบคณะเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/super-admin/faculties error:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบคณะ" }, { status: 500 });
  }
}
