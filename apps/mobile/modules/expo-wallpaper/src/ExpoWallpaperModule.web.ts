import type { WallpaperTarget } from './ExpoWallpaper.types';

// ExpoWallpaperModule is not available on the web platform.
export function setWallpaper(_uri: string, _target: WallpaperTarget): Promise<void> {
  return Promise.reject(new Error('Setting system wallpapers is only available on Android.'));
}

export default { setWallpaper };
