import { supabase } from '@/api/supabaseClient';

const BUCKET = 'estimate-photos';

// Anthropic rejects images with either dimension over 8000px (phone cameras
// routinely exceed this). Downscale before upload so both the AI call and
// storage/bandwidth stay reasonable. Non-image files pass through untouched.
const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 0.85;

async function resizeImageIfNeeded(file) {
  if (!file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      bitmap.close?.();
      return file;
    }
    const scale = MAX_DIMENSION / Math.max(width, height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    // If resizing fails for any reason, fall back to the original file
    // rather than blocking the upload.
    return file;
  }
}

export async function uploadFile({ file }) {
  const resized = await resizeImageIfNeeded(file);
  const ext = resized.name.includes('.') ? resized.name.split('.').pop() : 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, resized, { upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { file_url: data.publicUrl };
}
