import { useLingui } from '@lingui/react/macro';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { ErrorState, LoadingState } from '@/components/feedback';
import { Button } from '@/components/ui';
import { WallpaperDetail } from '@/components/wallpaper-detail';
import { ThemedText } from '@/components/themed-text';
import { useWallpaper } from '@/hooks/use-wallpaper';
import { getAccountSession, requireCurrentAccount } from '@/lib/account-session';
import { useWallpaperPreviewStore } from '@/stores/wallpaper-preview-store';

export function WallpaperPreviewScreen() {
  const { t } = useLingui();
  const router = useRouter();
  const params = useLocalSearchParams<{ category: string; wallpaperId: string }>();
  const wallpaperId = Array.isArray(params.wallpaperId)
    ? params.wallpaperId[0]
    : params.wallpaperId;
  const wallpaperQuery = useWallpaper(wallpaperId);
  const wallpaper = wallpaperQuery.wallpaper;
  const previewMode = useWallpaperPreviewStore((state) => state.previewMode);
  const setPreviewMode = useWallpaperPreviewStore((state) => state.setPreviewMode);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<Error>();

  async function downloadWallpaper(imageUrl: string) {
    const account = getAccountSession();
    setDownloadError(undefined);
    setIsDownloading(true);
    try {
      requireCurrentAccount(account);
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(t`Unable to download the wallpaper.`);
      const blob = await response.blob();
      requireCurrentAccount(account);
      const objectUrl = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = 'lumina-wallpaper.jpg';
        anchor.rel = 'noreferrer';
        anchor.click();
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (cause) {
      setDownloadError(
        cause instanceof Error ? cause : new Error(t`Unable to download the wallpaper.`),
      );
    } finally {
      setIsDownloading(false);
    }
  }

  if (wallpaperQuery.isLoading) {
    return <LoadingState label={t`Loading wallpaper…`} />;
  }
  if (wallpaperQuery.error || !wallpaper) {
    return <ErrorState message={t`Wallpaper unavailable`} onRetry={() => router.back()} />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WallpaperDetail
        actionSlot={
          wallpaper.resultImageUrl ? (
            <>
              <Button
                fullWidth
                icon="download"
                label={isDownloading ? t`Downloading…` : t`Download image`}
                loading={isDownloading}
                onPress={() => void downloadWallpaper(wallpaper.resultImageUrl ?? '')}
              />
              <ThemedText style={{ color: '#FFFFFF' }} variant="caption">
                {t`Web cannot set system wallpaper. Download the image, then apply it in system settings.`}
              </ThemedText>
              {downloadError ? (
                <ErrorState
                  message={downloadError}
                  onRetry={() => void downloadWallpaper(wallpaper.resultImageUrl ?? '')}
                />
              ) : null}
            </>
          ) : undefined
        }
        onClose={() => router.back()}
        onModeChange={setPreviewMode}
        onToggleFavorite={wallpaperQuery.toggleFavorite}
        isUpdatingFavorite={wallpaperQuery.isUpdatingFavorite}
        favoriteError={wallpaperQuery.favoriteError}
        onRetryImage={() => void wallpaperQuery.refetch()}
        previewMode={previewMode}
        wallpaper={wallpaper}
      />
    </>
  );
}
