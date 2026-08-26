import { useLingui } from '@lingui/react/macro';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ErrorState, LoadingState } from '@/components/feedback';
import { WallpaperDetail } from '@/features/library/WallpaperDetail';
import { useWallpapers } from '@/features/library/use-wallpapers';
import { useLibraryStore } from '@/stores/library-store';

export function WallpaperPreviewScreen() {
  const { t } = useLingui();
  const router = useRouter();
  const params = useLocalSearchParams<{ category: string; wallpaperId: string }>();
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const wallpaperId = Array.isArray(params.wallpaperId)
    ? params.wallpaperId[0]
    : params.wallpaperId;
  const wallpapers = useWallpapers({ category }, 50);
  const wallpaper = wallpapers.wallpapers.find((item) => item.id === wallpaperId);
  const previewMode = useLibraryStore((state) => state.previewMode);
  const setPreviewMode = useLibraryStore((state) => state.setPreviewMode);

  if (wallpapers.isLoading || wallpapers.isPreparingDeviceId) {
    return <LoadingState label={t`Loading wallpaper…`} />;
  }
  if (wallpapers.error || wallpapers.deviceIdError || !wallpaper) {
    return <ErrorState message={t`Wallpaper unavailable`} onRetry={() => router.back()} />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WallpaperDetail
        onClose={() => router.back()}
        onModeChange={setPreviewMode}
        onToggleFavorite={() => wallpapers.toggleFavorite(wallpaper)}
        previewMode={previewMode}
        wallpaper={wallpaper}
      />
    </>
  );
}
