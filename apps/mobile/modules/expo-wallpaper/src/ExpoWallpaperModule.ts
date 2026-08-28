import { requireNativeModule } from 'expo';

import type { WallpaperTarget } from './ExpoWallpaper.types';

interface ExpoWallpaperNativeModule {
  setWallpaper(uri: string, target: WallpaperTarget): Promise<void>;
}

let nativeModule: ExpoWallpaperNativeModule | undefined;

function getNativeModule() {
  nativeModule ??= requireNativeModule<ExpoWallpaperNativeModule>('ExpoWallpaper');
  return nativeModule;
}

const wallpaperTargets = new Set<WallpaperTarget>(['home', 'lock', 'both']);

/**
 * Sets a local image as the Android home, lock, or both wallpapers.
 *
 * This requires a development or production build. Expo Go cannot load local native modules.
 */
export function setWallpaper(uri: string, target: WallpaperTarget): Promise<void> {
  if (uri.trim().length === 0) {
    throw new TypeError('A non-empty local image URI is required.');
  }

  if (!wallpaperTargets.has(target)) {
    throw new TypeError(`Unsupported wallpaper target: ${target}`);
  }

  return getNativeModule().setWallpaper(uri, target);
}

export default { setWallpaper };
