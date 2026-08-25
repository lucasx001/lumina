import { radius, spacing, type AppTheme } from '@/constants/theme';

export function createTabBarStyle(theme: AppTheme) {
  return {
    backgroundColor: theme.surface,
    borderTopColor: theme.border,
    height: 68,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  };
}

export function createTabBarItemStyle() {
  return { borderRadius: radius.md, marginHorizontal: spacing.xs };
}
