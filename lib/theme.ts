export const COLORS = {
  // Backgrounds
  surface0: '#0F1A0A',       // deep soil — darkest bg
  surface1: '#1A2E10',       // forest floor — card base
  surface2: '#243D16',       // canopy — elevated card
  surface3: '#2D4D1E',       // hover/pressed

  // Greens
  vineGreen:    '#2D6A1F',   // primary action, CTA
  freshGrowth:  '#5BAA2E',   // highlights, active
  springLeaf:   '#8BC34A',   // success, healthy params
  limeAccent:   '#A5D65A',   // bright tip highlights

  // Warm
  sunflower:    '#FFA000',   // warnings, harvest
  peachBloom:   '#FFAB76',   // fruit tree accent
  bloomRed:     '#E53935',   // danger, pest alerts
  lavenderMist: '#B39DDB',   // herb/flower accent

  // Glass
  dewGlass:         'rgba(139,195,74,0.10)',
  dewBorder:        'rgba(139,195,74,0.22)',
  dewBorderBright:  'rgba(139,195,74,0.40)',

  // Text
  white:        '#FFFFFF',
  petalCream:   '#FFF8E1',
  textPrimary:  '#FFFFFF',
  textMuted:    'rgba(255,255,255,0.50)',
  textDisabled: 'rgba(255,255,255,0.25)',

  // Earth
  earthBrown: '#5D4037',
  barkMid:    '#8D6E63',

  // Soil
  soilDark: '#3E2723',
} as const;

export const GRADIENTS = {
  header:  ['#1A2E10', '#0F1A0A'] as const,
  card:    ['#1A2E10', '#243D16'] as const,
  cta:     ['#5BAA2E', '#2D6A1F'] as const,
  harvest: ['#FFA000', '#E65100'] as const,
  danger:  ['#E53935', '#B71C1C'] as const,
};

export const GLASS = {
  card: {
    backgroundColor: 'rgba(26,46,16,0.75)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(139,195,74,0.22)',
  },
  cardElevated: {
    backgroundColor: 'rgba(36,61,22,0.80)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(139,195,74,0.35)',
  },
};

export const RADIUS = { sm: 10, md: 16, lg: 20, xl: 28, pill: 999 };
export const SPACING = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 };

export function geniusScoreColor(score: number | null): string {
  if (score === null) return COLORS.textMuted;
  if (score >= 90) return COLORS.springLeaf;
  if (score >= 70) return COLORS.freshGrowth;
  if (score >= 50) return COLORS.sunflower;
  return COLORS.bloomRed;
}
