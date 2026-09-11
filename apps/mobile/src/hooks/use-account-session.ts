import { useAuth as useClerkAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Image } from 'expo-image';
import { clearWallpaperDownloads } from '@/lib/local-wallpaper';

import { useCreateStore } from '@/stores/create-store';
import { useGenerationStore } from '@/stores/generation-store';
import { useWallpaperPreviewStore } from '@/stores/wallpaper-preview-store';
import { changeAccountSession } from '@/lib/account-session';

export function useAccountSessionLifecycle(): void {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const queryClient = useQueryClient();
  const previousAccountId = useRef<string | null>('');
  const accountId = isLoaded && isSignedIn ? userId : null;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const previous = previousAccountId.current;
    changeAccountSession(accountId);
    if (previous !== accountId && Platform.OS !== 'web') {
      try {
        clearWallpaperDownloads();
      } catch (error) {
        console.warn('Could not clear wallpaper downloads', error);
      }
      void Image.clearMemoryCache().catch((error: unknown) =>
        console.warn('Could not clear wallpaper image cache', error),
      );
    }
    if (previous !== '' && previous !== accountId) {
      void queryClient.cancelQueries();
      queryClient.clear();
      useCreateStore.getState().reset();
      useGenerationStore.getState().reset('create');
      useGenerationStore.getState().reset('edit');
      useWallpaperPreviewStore.getState().reset();
    }

    previousAccountId.current = accountId;
    useGenerationStore.getState().setActiveAccount(accountId);
  }, [accountId, isLoaded, queryClient]);
}
