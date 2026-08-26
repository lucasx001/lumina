import type { NativeStackNavigationOptions } from 'expo-router';

export function createWallpaperOverlayOptions(): NativeStackNavigationOptions {
  return {
    animation: 'none',
    contentStyle: { backgroundColor: 'transparent' },
    gestureEnabled: false,
    headerShown: false,
    presentation: 'transparentModal',
  };
}
