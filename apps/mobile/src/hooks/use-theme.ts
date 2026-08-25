import { appFontFamily, colors, type AppTheme } from '@/constants/theme';

export function useTheme(): AppTheme {
  return { ...colors.dark, fontFamily: appFontFamily };
}
