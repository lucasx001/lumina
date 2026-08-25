import { Platform } from 'react-native';

export const colors = {
  dark: {
    accent: '#DF1F5A',
    accentForeground: '#FFFFFF',
    background: '#131521',
    border: 'rgba(255, 255, 255, 0.12)',
    card: '#1B1D2A',
    error: '#FF6B81',
    muted: '#252736',
    mutedText: '#B7B7C2',
    overlay: 'rgba(7, 8, 15, 0.82)',
    primary: '#DF1F5A',
    primaryForeground: '#FFFFFF',
    ring: '#DF1F5A',
    surface: '#171925',
    text: '#F8F7FB',
  },
  light: {
    accent: '#D81B55',
    accentForeground: '#FFFFFF',
    background: '#FAF7F9',
    border: '#E8DDE3',
    card: '#FFFFFF',
    error: '#C9143F',
    muted: '#F4EAF0',
    mutedText: '#74666D',
    overlay: 'rgba(19, 21, 33, 0.56)',
    primary: '#D81B55',
    primaryForeground: '#FFFFFF',
    ring: '#D81B55',
    surface: '#FFF9FC',
    text: '#20171C',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const shadows = {
  card: '0 1px 2px rgba(33, 9, 20, 0.08)',
  raised: '0 12px 32px rgba(223, 31, 90, 0.18)',
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const appFontFamily = Platform.select({
  android: 'sans-serif',
  default: 'system-ui',
  ios: 'System',
  web: 'system-ui',
});

export type AppTheme = (typeof colors)[keyof typeof colors] & { fontFamily: string };
