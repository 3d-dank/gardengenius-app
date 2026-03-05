/**
 * GardenGenius Premium Design System — 2026 Edition
 * Warm garden tones, glassmorphism, dynamic health colors
 */

import { Platform, ViewStyle, TextStyle } from 'react-native';

// ─── Color Palette ───────────────────────────────────────────────────────────

export const COLORS = {
  // Primary palette — deep garden greens + warm earth tones
  forestDark: '#1A3D0F',      // primary dark bg
  forestMid: '#2D6A1F',       // garden green
  forestBright: '#4A8C30',    // fresh growth
  limeAccent: '#8BC34A',      // action / highlight (fresh growth)
  earthWarm: '#A0522D',       // rich soil brown
  harvestGold: '#FFA000',     // harvest gold
  skyBlue: '#87CEEB',         // secondary

  // Dynamic health colors
  healthCritical: '#DC2626',    // deep red
  healthStressed: '#F59E0B',    // amber/orange
  healthFair: '#EAB308',        // yellow
  healthGood: '#4ADE80',        // vibrant green

  // Neutrals (dark theme, warm-shifted)
  surface0: '#0F2008',          // darkest bg — deep garden night
  surface1: '#1A3010',          // card base
  surface2: '#213818',          // elevated card
  surface3: '#2A4A20',          // hover / pressed
  border: 'rgba(139,195,74,0.15)',   // subtle green border
  borderBright: 'rgba(139,195,74,0.3)',
  white: '#FFFFFF',
  white70: 'rgba(255,255,255,0.70)',
  white50: 'rgba(255,255,255,0.50)',
  white20: 'rgba(255,255,255,0.20)',
  white10: 'rgba(255,255,255,0.10)',
  white05: 'rgba(255,255,255,0.05)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.45)',
  textDisabled: 'rgba(255,255,255,0.25)',

  // Aliases kept for compat
  premiumGold: '#FFA000',
  skyBlueAlt: '#87CEEB',
};

// ─── Gradients ───────────────────────────────────────────────────────────────

export const GRADIENTS = {
  background: ['#0F2008', '#1A3010', '#1E3812'] as const,
  header: ['#0F2008', '#2D6A1F', '#3A7A28'] as const,
  card: ['rgba(26,61,15,0.9)', 'rgba(15,32,8,0.95)'] as const,
  lime: ['#8BC34A', '#6A9E2F'] as const,
  limeVibrant: ['#A5D660', '#8BC34A'] as const,
  gold: ['#FFA000', '#E08C00'] as const,
  earth: ['#A0522D', '#7A3A1A'] as const,
  healthGood: ['#4ADE80', '#22C55E'] as const,
  healthStressed: ['#F59E0B', '#D97706'] as const,
  healthCritical: ['#DC2626', '#B91C1C'] as const,
  scanOverlay: ['rgba(15,32,8,0.0)', 'rgba(15,32,8,0.8)'] as const,
};

// ─── Health Score Helpers ─────────────────────────────────────────────────────

export function getHealthColor(score: number | null): string {
  if (score === null) return COLORS.textMuted;
  if (score >= 70) return COLORS.healthGood;
  if (score >= 40) return COLORS.healthStressed;
  return COLORS.healthCritical;
}

export function getHealthGradient(score: number | null): readonly [string, string] {
  if (score === null) return ['#374151', '#1F2937'];
  if (score >= 70) return GRADIENTS.healthGood;
  if (score >= 40) return GRADIENTS.healthStressed;
  return GRADIENTS.healthCritical;
}

export function getHealthLabel(score: number | null): string {
  if (score === null) return 'No Data';
  if (score >= 80) return 'Thriving';
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Struggling';
  return 'Critical';
}

export function getSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    None: COLORS.healthGood,
    Low: '#86EFAC',
    Medium: COLORS.healthStressed,
    High: COLORS.healthCritical,
  };
  return map[severity] ?? COLORS.textMuted;
}

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Border Radii ─────────────────────────────────────────────────────────────

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 100,
};

// ─── Typography ───────────────────────────────────────────────────────────────

const fontFamily = {
  heading: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  body: Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

export const TYPOGRAPHY: Record<string, TextStyle> = {
  heroNumber: {
    fontSize: 64,
    fontWeight: '800' as const,
    fontFamily: fontFamily.heading,
    letterSpacing: -2,
    lineHeight: 68,
  },
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    fontFamily: fontFamily.heading,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  h2: {
    fontSize: 26,
    fontWeight: '700' as const,
    fontFamily: fontFamily.heading,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: fontFamily.heading,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600' as const,
    fontFamily: fontFamily.heading,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    fontFamily: fontFamily.body,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    fontFamily: fontFamily.body,
    lineHeight: 19,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    fontFamily: fontFamily.body,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: fontFamily.body,
    lineHeight: 17,
  },
};

// ─── Glassmorphism Styles ─────────────────────────────────────────────────────

export const GLASS: Record<string, ViewStyle> = {
  card: {
    backgroundColor: 'rgba(26,61,15,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(139,195,74,0.18)',
    borderRadius: RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  cardLight: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  pill: {
    backgroundColor: 'rgba(139,195,74,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,195,74,0.25)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metric: {
    backgroundColor: 'rgba(26,61,15,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(139,195,74,0.15)',
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ─── Neomorphism / Button Styles ──────────────────────────────────────────────

export const NEO: Record<string, ViewStyle> = {
  buttonPrimary: {
    shadowColor: COLORS.limeAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: RADIUS.pill,
  },
  buttonSecondary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: RADIUS.xxl,
  },
};
