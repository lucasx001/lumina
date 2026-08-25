import type { NativeStackNavigationOptions } from 'expo-router';

import type { AppTheme } from '@/constants/theme';

export function createTabStackScreenOptions(theme: AppTheme): NativeStackNavigationOptions {
  return {
    contentStyle: { backgroundColor: theme.background },
    headerBackButtonDisplayMode: 'minimal',
    headerShadowVisible: false,
    headerShown: true,
    headerStyle: { backgroundColor: theme.background },
    headerTintColor: theme.primary,
    headerTitleAlign: 'center',
    headerTitleStyle: { color: theme.text, fontFamily: theme.fontFamily, fontWeight: '600' },
  };
}
