"use server";

import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';
import { getAuthUser } from '@/app/actions/auth';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadImage(formData: FormData) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return { success: false, error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ' };
    }

    const file = formData.get('file') as File;
    if (!file || !(file instanceof File)) {
      return { success: false, error: 'No valid file provided' };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'ขนาดไฟล์ต้องไม่เกิน 5 MB' };
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { success: false, error: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP) เท่านั้น' };
    }

    // Validate file extension
    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { success: false, error: 'นามสกุลไฟล์ไม่ถูกต้อง' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}${ext}`;

    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'driver-logs');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file
    const path = join(uploadDir, filename);
    await writeFile(path, buffer);

    // Return the public URL
    return { success: true, url: `/uploads/driver-logs/${filename}` };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}
