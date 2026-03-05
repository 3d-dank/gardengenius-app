/**
 * LawnGenius - Supabase Storage helpers
 *
 * SETUP REQUIRED:
 * Before using this module, create the "scan-photos" bucket in Supabase:
 *   1. Go to https://supabase.com/dashboard/project/jdwmimhnrfsvgafxdcph/storage/buckets
 *   2. Click "New bucket"
 *   3. Name: scan-photos
 *   4. Public: false  (images are accessed via signed URLs or service role)
 *   5. Click "Create bucket"
 */

import { supabase } from './supabase';

/**
 * Upload a scan photo to the "scan-photos" Supabase Storage bucket.
 * Photos are organized by deviceId for easy per-device queries.
 *
 * @param imageUri  Local file URI from camera/picker (file:// or content://)
 * @param deviceId  Anonymous device identifier used as folder name
 * @returns Public URL of the uploaded photo, or null on failure
 */
export async function uploadScanPhoto(
  imageUri: string,
  deviceId: string,
): Promise<string | null> {
  try {
    // Fetch the image as a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Build a unique file path: deviceId/timestamp.jpg
    const timestamp = Date.now();
    const filePath = `${deviceId}/${timestamp}.jpg`;

    const { error } = await supabase.storage
      .from('scan-photos')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.warn('[LawnGenius] Storage upload error:', error.message);
      return null;
    }

    // Return the public URL (works if bucket has public access or RLS allows it)
    const { data } = supabase.storage
      .from('scan-photos')
      .getPublicUrl(filePath);

    return data.publicUrl ?? null;
  } catch (err) {
    console.warn('[LawnGenius] Failed to upload scan photo:', err);
    return null;
  }
}
