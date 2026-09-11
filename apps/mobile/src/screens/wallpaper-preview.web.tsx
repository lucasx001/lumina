import { useLingui } from '@lingui/react/macro';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ErrorState, LoadingState } from '@/components/feedback';
import { WallpaperDetail } from '@/components/wallpaper-detail';
import { ThemedText } from '@/components/themed-text';
import { useWallpaper } from '@/hooks/use-wallpaper';
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
          <ThemedText
            style={{ color: '#FFFFFF' }}
            variant="caption"
          >{t`Web cannot set system wallpaper. Open Lumina on Android to apply it, or save the image from your browser.`}</ThemedText>
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
