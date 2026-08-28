import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import { setWallpaper, type WallpaperTarget } from '../../modules/expo-wallpaper';

import { downloadWallpaper } from '@/lib/local-wallpaper';

export function useApplyWallpaper(imageUrl: string) {
  const { t } = useLingui();
  const [error, setError] = useState<Error>();
  const [applyingTarget, setApplyingTarget] = useState<WallpaperTarget>();

  const applyWallpaper = useCallback(
    async (target: WallpaperTarget) => {
      setError(undefined);
      setApplyingTarget(target);

      try {
        const localUri = await downloadWallpaper(imageUrl);
        await setWallpaper(localUri, target);
      } catch (cause) {
        const nextError =
          cause instanceof Error
            ? cause
            : new Error(t`Could not apply the wallpaper. Try again later.`);
        setError(nextError);
        throw nextError;
      } finally {
        setApplyingTarget(undefined);
      }
    },
    [imageUrl, t],
  );

  return { applyingTarget, applyWallpaper, error };
}
