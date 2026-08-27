import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/app/actions/auth';
import { createAuditLog } from '@/app/actions/audit';

const FACULTY_CODE_MAP: Record<string, string> = {
  "คณะเทคโนโลยีสารสนเทศและการสื่อสาร": "ICT",
  "คณะวิทยาศาสตร์": "SCI",
  "คณะเภสัชฯ": "PHARM",
  "คณะเภสัชศาสตร์": "PHARM",
  "คณะแพทยศาสตร์": "MED",
  "คณะพยาบาลศาสตร์": "NUR",
  "คณะวิศวกรรมศาสตร์": "ENGR",
  "คณะเกษตรศาสตร์และทรัพยากรธรรมชาติ": "AGRI",
  "คณะนิติศาสตร์": "LAW",
  "คณะรัฐศาสตร์และสังคมศาสตร์": "POL",
  "คณะวิทยาการจัดการและสารสนเทศศาสตร์": "BCA",
  "คณะศิลปศาสตร์": "LIB",
  "คณะสถาปัตยกรรมศาสตร์และศิลปสร้างสรรค์": "ARCH",
  "คณะสาธารณสุขศาสตร์": "PH",
  "คณะทันตแพทยศาสตร์": "DENT",
  "วิทยาลัยการศึกษา": "EDU",
  "วิทยาลัยการจัดการ": "UPCM"
};

function getFacultyCode(name: string): string {
  if (FACULTY_CODE_MAP[name]) return FACULTY_CODE_MAP[name];
  for (const [k, v] of Object.entries(FACULTY_CODE_MAP)) {
    if (name.includes(k) || k.includes(name)) return v;
  }
  return name.replace(/^คณะ/, '').substring(0, 4).toUpperCase();
}

interface RawFacultyRow {
  id: number;
  name: string;
  adminName: string | null;
  adminEmail: string | null;
  totalVans: number | string;
  mainDrivers: number | string;
}

let cachedFaculties: { data: any[]; timestamp: number } | null = null;

export function invalidateFacultiesCache() {
  cachedFaculties = null;
}

export async function GET() {
  if (cachedFaculties && (Date.now() - cachedFaculties.timestamp < 30 * 1000)) {
    return NextResponse.json({ success: true, data: cachedFaculties.data });
  }

  try {
    const rawRows = await prisma.$queryRaw<RawFacultyRow[]>`
      SELECT 
        f.id,
        f.name_th AS name,
        u.name AS "adminName",
        u.email AS "adminEmail",
        (SELECT COUNT(*) FROM vans v WHERE v.faculty_id = f.id) AS "totalVans",
        (SELECT COUNT(*) FROM drivers d WHERE d.faculty_id = f.id) AS "mainDrivers"
      FROM faculties f
      LEFT JOIN users u ON u.faculty_id = f.id AND u.role = 'FACULTY_ADMIN'
      WHERE f.name_th != 'ศูนย์จัดการระบบส่วนกลาง'
      ORDER BY f.id ASC;
    `;

    const mapped = rawRows.map(f => ({
      id: Number(f.id),
      name: f.name,
      code: getFacultyCode(f.name),
      adminName: f.adminName || "ไม่มีข้อมูล",
      adminPhone: "-",
      adminTitle: "ผู้ดูแลระบบคณะ",
      adminEmail: f.adminEmail || "-",
      executiveName: "-",
      executiveTitle: "-",
      executivePhone: "-",
      executiveEmail: "-",
      totalVans: Number(f.totalVans || 0),
      mainDrivers: Number(f.mainDrivers || 0),
      subDrivers: 0,
      phone: "-",
      email: "-",
      address: "-",
      status: "ACTIVE" as const
    }));

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
