import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import { getAuthUser } from '@/lib/auth-util';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'
];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนอัปโหลดเอกสาร' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('type') as string) || 'general'; // 'vans' | 'drivers' | 'documents' | 'attachments' | 'general'

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'ไม่พบไฟล์ที่ถูกต้อง' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'ขนาดไฟล์ต้องไม่เกิน 25 MB' }, { status: 400 });
    }

    const DANGEROUS_EXTENSIONS = ['.html', '.htm', '.svg', '.exe', '.bat', '.sh', '.js', '.jsx', '.ts', '.tsx', '.php', '.py', '.cmd', '.vbs', '.scr'];
    const ext = extname(file.name).toLowerCase();

    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: 'ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้เพื่อความปลอดภัยของระบบ' }, { status: 400 });
    }

    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'รองรับเฉพาะไฟล์เอกสาร (PDF, Word, Excel) และรูปภาพ (JPG, PNG, WebP) เท่านั้น' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize subfolder name
    const subDir = category === 'vans' ? 'vans' 
      : category === 'drivers' ? 'drivers' 
      : (category === 'documents' || category === 'attachments') ? 'documents' 
      : 'general';
    const uploadDir = join(process.cwd(), 'public', 'uploads', subDir);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${subDir}/${uniqueName}`;
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: ext
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: (error as Error)?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' }, { status: 500 });
  }
}
