import { appFontFamily, colors, displayFontFamily, type AppTheme } from '@/constants/theme';

export function useTheme(): AppTheme {
  return { ...colors.light, displayFontFamily, fontFamily: appFontFamily };
}
