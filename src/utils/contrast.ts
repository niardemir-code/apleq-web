import { SharingPlatformEntity, SharingPlatformInfo } from '../types';

/**
 * Contrast and color utility functions.
 * Computes perceived luminance and contrast ratios based on W3C / WCAG formulas.
 */

// Helper to convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return { r: 99, g: 102, b: 241 }; // Indigo fallback
  }

  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculates relative luminance of an sRGB color (0 to 1)
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates high contrast text color for any background color.
 * Returns White (#FFFFFF) for dark backgrounds, Dark (#111827) for light backgrounds.
 */
export function getContrastTextColor(hexColor: string): string {
  const luminance = getLuminance(hexColor);
  return luminance < 0.45 ? '#FFFFFF' : '#111827';
}

/**
 * Default platforms matching Android SharingPlatforms.defaultList
 */
export const DEFAULT_SHARING_PLATFORMS: SharingPlatformEntity[] = [
  { id: 1, name: 'Price together', colorHex: '#6D28D9', displayOrder: 0 },
  { id: 2, name: 'Sharingful', colorHex: '#DB2777', displayOrder: 1 },
  { id: 3, name: 'Spliiit', colorHex: '#059669', displayOrder: 2 },
  { id: 4, name: 'Gamsgo', colorHex: '#D97706', displayOrder: 3 },
  { id: 5, name: 'Sharesub', colorHex: '#0284C7', displayOrder: 4 },
  { id: 6, name: 'Directo/Familia', colorHex: '#C2410C', displayOrder: 5 },
];

export function isPlatformMatch(candidate: string, target: string): boolean {
  const c = candidate.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (c === t) return true;

  // Together Price aliases
  const isCandidateTP = c === 'together price' || c === 'price together';
  const isTargetTP = t === 'together price' || t === 'price together';
  if (isCandidateTP && isTargetTP) return true;

  // Directo / Familia aliases
  const isCandidateDirecto = c.startsWith('directo') || c.startsWith('familia');
  const isTargetDirecto = t.startsWith('directo') || t.startsWith('familia');
  if (isCandidateDirecto && isTargetDirecto) return true;

  return false;
}

export function getSharingPlatformInfo(
  platformName: string,
  customPlatforms: SharingPlatformEntity[] = []
): SharingPlatformInfo {
  const trimmed = (platformName || '').trim();
  if (!trimmed) {
    return {
      name: 'General',
      color: '#64748B',
      baseColor: '#64748B',
      badgeBgColor: '#64748B',
      badgeTextColor: '#FFFFFF',
    };
  }

  // 1. Check custom active platforms first
  if (customPlatforms && customPlatforms.length > 0) {
    const match = customPlatforms.find(p => isPlatformMatch(p.name, trimmed));
    if (match) {
      const textColor = getContrastTextColor(match.colorHex);
      return {
        name: trimmed,
        color: match.colorHex,
        baseColor: match.colorHex,
        badgeBgColor: match.colorHex,
        badgeTextColor: textColor,
      };
    }
  }

  // 2. Check defaults
  const defaultMatch = DEFAULT_SHARING_PLATFORMS.find(p => isPlatformMatch(p.name, trimmed));
  if (defaultMatch) {
    const textColor = getContrastTextColor(defaultMatch.colorHex);
    return {
      name: trimmed,
      color: defaultMatch.colorHex,
      baseColor: defaultMatch.colorHex,
      badgeBgColor: defaultMatch.colorHex,
      badgeTextColor: textColor,
    };
  }

  // 3. Deterministic fallback palette from string hash
  const colors = [
    '#6366F1', '#8B5CF6', '#EC4899',
    '#059669', '#D97706', '#0284C7',
    '#06B6D4', '#84CC16', '#DC2626'
  ];
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseColor = colors[Math.abs(hash) % colors.length];
  const textColor = getContrastTextColor(baseColor);

  return {
    name: trimmed,
    color: baseColor,
    baseColor: baseColor,
    badgeBgColor: baseColor,
    badgeTextColor: textColor,
  };
}

/**
 * Returns dynamic contrast badge styles for any sharing platform or service hex color.
 */
export function getContrastBadgeStyle(hexColor?: string): {
  backgroundColor: string;
  color: string;
  borderColor: string;
  isDarkBg: boolean;
} {
  const bg = hexColor || '#4F46E5';
  const textColor = getContrastTextColor(bg);
  const isDarkBg = textColor === '#FFFFFF';

  return {
    backgroundColor: bg,
    color: textColor,
    borderColor: isDarkBg ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.15)',
    isDarkBg,
  };
}

