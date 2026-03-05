/**
 * GardenGenius - Scan Logger
 *
 * Logs scan results to Supabase for research and improvement purposes.
 * All data is associated with an anonymous device ID — no personal
 * information (name, email, account) is collected or required.
 *
 * PRIVACY NOTE: Scan data (lawn photos, diagnosis results, GPS coords, and
 * weather conditions) may be used for research and product improvement per
 * the GardenGenius Privacy Policy. No personally identifiable information is
 * stored. Users can request deletion of their data by device ID.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { uploadScanPhoto } from './storage';

const DEVICE_ID_KEY = '@gardengenius_device_id';

/**
 * Get or create a persistent anonymous device ID.
 * Stored in AsyncStorage so it survives app restarts.
 */
async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    // Generate a simple UUID-like ID
    const newId =
      'device_' +
      Math.random().toString(36).substring(2, 10) +
      '_' +
      Date.now().toString(36);

    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch {
    // Fallback: ephemeral ID (won't persist, but won't crash)
    return 'device_' + Math.random().toString(36).substring(2, 18);
  }
}

export interface ScanLogData {
  /** Local URI of the captured image */
  imageUri: string;
  /** AI diagnosis fields */
  problem: string;
  severity: string;
  confidence: number;
  description: string;
  treatment: string;
  timing: string;
  /** Raw AI response object */
  rawResponse?: unknown;
  /** GPS coordinates from expo-location */
  latitude?: number;
  longitude?: number;
  /** Weather data if available */
  zipCode?: string;
  grassType?: string;
  soilTemp?: number;
  uvIndex?: number;
}

/**
 * Log a completed scan to Supabase.
 *
 * Fire-and-forget: this function does NOT await or throw.
 * Call it after a successful AI diagnosis — it runs in the background
 * and catches all errors silently so the UI is never blocked or broken.
 */
export function logScan(data: ScanLogData): void {
  // Intentionally not awaited — background fire-and-forget
  _logScanAsync(data).catch(() => {
    // Silent failure — logging should never impact the user experience
  });
}

async function _logScanAsync(data: ScanLogData): Promise<void> {
  const deviceId = await getOrCreateDeviceId();

  // Upload photo to storage (non-blocking — continue even if it fails)
  const imageUrl = await uploadScanPhoto(data.imageUri, deviceId);

  const { error } = await supabase.from('scans').insert({
    device_id: deviceId,
    image_url: imageUrl,
    problem: data.problem,
    severity: data.severity,
    confidence: data.confidence,
    description: data.description,
    treatment: data.treatment,
    timing: data.timing,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    zip_code: data.zipCode ?? null,
    grass_type: data.grassType ?? null,
    soil_temp: data.soilTemp ?? null,
    uv_index: data.uvIndex ?? null,
    raw_response: data.rawResponse ?? null,
  });

  if (error) {
    console.warn('[GardenGenius] Scan log error:', error.message);
  }
}
