import { Platform } from 'react-native';

export const colors = {
  dark: {
    accent: '#C9824D',
    accentForeground: '#FFFFFF',
    background: '#211A16',
    border: '#4A3B31',
    card: '#2A211C',
    error: '#E06B67',
    muted: '#372B24',
    mutedText: '#C5B7AA',
    overlay: 'rgba(20, 14, 10, 0.78)',
    primary: '#C9824D',
    primaryForeground: '#FFFFFF',
    ring: '#C9824D',
    surface: '#261E19',
    text: '#FFF9F1',
  },
  light: {
    accent: '#9B5B32',
    accentForeground: '#FFFFFF',
    background: '#FBF6EE',
    border: '#DED2C3',
    card: '#FFFDF8',
    error: '#B33A3A',
    muted: '#F1E3CF',
    mutedText: '#7A6D63',
    overlay: 'rgba(32, 25, 20, 0.48)',
    primary: '#9B5B32',
    primaryForeground: '#FFFFFF',
    ring: '#9B5B32',
    surface: '#FFFDF8',
    text: '#201914',
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
  sm: 10,
  md: 16,
  lg: 24,
  xl: 24,
  full: 999,
} as const;

export const shadows = {
  card: '0 0 0 1px rgba(222, 210, 195, 0.45)',
  raised: '0 20px 52px rgba(32, 25, 20, 0.12)',
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const appFontFamily = Platform.select({
  android: 'sans-serif',
  default: 'Segoe UI',
  ios: 'System',
  web: 'Avenir Next',
});

export const displayFontFamily = Platform.select({
  android: 'serif',
  default: 'Georgia',
  ios: 'Georgia',
  web: 'Georgia',
});

export type AppTheme = (typeof colors)[keyof typeof colors] & {
  displayFontFamily: string;
  fontFamily: string;
};
