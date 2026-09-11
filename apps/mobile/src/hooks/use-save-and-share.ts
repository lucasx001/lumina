import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

import { withLocalWallpaper } from '@/lib/local-wallpaper';
import { getAccountSession, requireCurrentAccount } from '@/lib/account-session';

export type SaveAndShareAction = 'save' | 'share' | undefined;

export function useSaveAndShare(imageUrl: string) {
  const { t } = useLingui();
  const [error, setError] = useState<Error>();
  const [activeAction, setActiveAction] = useState<SaveAndShareAction>();

  const saveWallpaper = useCallback(async () => {
    setError(undefined);
    setActiveAction('save');

    try {
      const account = getAccountSession();
      requireCurrentAccount(account);
      const permission = await requestPermissionsAsync(true, ['photo']);
      requireCurrentAccount(account);
      if (permission.status !== 'granted') {
        throw new Error(t`Photo library permission is required to save wallpapers.`);
      }

      await withLocalWallpaper(imageUrl, (localUri) => Asset.create(localUri));
    } catch (cause) {
      const nextError =
        cause instanceof Error
          ? cause
          : new Error(t`Could not save the wallpaper. Try again later.`);
      setError(nextError);
      throw nextError;
    } finally {
      setActiveAction(undefined);
    }
  }, [imageUrl, t]);

  const shareWallpaper = useCallback(async () => {
    setError(undefined);
    setActiveAction('share');

    try {
      const account = getAccountSession();
      requireCurrentAccount(account);
      if (!(await isAvailableAsync())) {
        throw new Error(t`Sharing is unavailable on this device.`);
      }

      requireCurrentAccount(account);
      await withLocalWallpaper(imageUrl, (localUri) => shareAsync(localUri));
    } catch (cause) {
      const nextError =
        cause instanceof Error
          ? cause
          : new Error(t`Could not share the wallpaper. Try again later.`);
      setError(nextError);
      throw nextError;
    } finally {
      setActiveAction(undefined);
    }
  }, [imageUrl, t]);

  return { activeAction, error, saveWallpaper, shareWallpaper };
}
