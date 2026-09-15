import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { SystemConfig } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';
import { standardError } from '@/lib/authGuard';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const config = await SystemConfig.findOne().lean();

  // If setup is already completed, require authenticated Developer or Owner
  if (config?.setupCompleted) {
    const user = await getSessionUser();
    if (!user || (!user.isDeveloper && !user.isOwner)) {
      return standardError('AUTH_FORBIDDEN', 'Authentication required to upload assets after setup completion', 403);
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const assetType = (formData.get('assetType') as string) || 'branding';

    if (!file || typeof file.arrayBuffer !== 'function') {
      return standardError('FILE_MISSING', 'No valid image file uploaded', 400);
    }

    // 1. File size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return standardError('FILE_TOO_LARGE', 'Asset size exceeds maximum 5MB limit', 400);
    }

    // 2. MIME type check
    const mime = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return standardError(
        'INVALID_MIME_TYPE',
        'Invalid asset type. Supported formats: PNG, JPG/JPEG, WebP, SVG, ICO.',
        400
      );
    }

    // 3. Extension check
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return standardError(
        'INVALID_FILE_EXTENSION',
        'File extension must match a supported image format (.png, .jpg, .webp, .svg, .ico)',
        400
      );
    }

    // 4. Save to public/uploads/branding
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'branding');
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeBase = file.name
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const safeName = `${Date.now()}_${assetType}_${safeBase}${ext}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/branding/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: safeName,
      size: file.size,
      mimeType: mime,
      assetType,
    });
  } catch (err: any) {
    return standardError('UPLOAD_ERROR', err.message || 'Failed to upload asset', 500);
  }
}
