import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';

const isProd = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

export async function uploadImage(
  file: File,
  prefix: string = 'post'
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${prefix}-${nanoid()}.${ext}`;

  // Production: use Vercel Blob
  if (isProd && isVercel) {
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
    });
    return blob.url;
  }

  // Development: use local filesystem
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const filepath = join(uploadsDir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}

export function validateImage(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 1 * 1024 * 1024; // 1MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 5MB.' };
  }

  return { valid: true };
}
