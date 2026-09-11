import { useLingui } from '@lingui/react/macro';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { ErrorState, LoadingState } from '@/components/feedback';
import { Button } from '@/components/ui';
import { ApplySheet } from '@/components/apply';
import { WallpaperDetail } from '@/components/wallpaper-detail';
import { useWallpaper } from '@/hooks/use-wallpaper';
import { useTheme } from '@/hooks/use-theme';
import { createTabBarStyle } from '@/navigation/tab-bar-options';
import { useWallpaperPreviewStore } from '@/stores/wallpaper-preview-store';

export function WallpaperPreviewScreen() {
  const { t } = useLingui();
  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ category: string; wallpaperId: string }>();
  const wallpaperId = Array.isArray(params.wallpaperId)
    ? params.wallpaperId[0]
    : params.wallpaperId;
  const wallpaperQuery = useWallpaper(wallpaperId);
  const wallpaper = wallpaperQuery.wallpaper;
  const previewMode = useWallpaperPreviewStore((state) => state.previewMode);
  const isApplySheetVisible = useWallpaperPreviewStore((state) => state.isApplySheetVisible);
  const setApplySheetVisible = useWallpaperPreviewStore((state) => state.setApplySheetVisible);
  const setPreviewMode = useWallpaperPreviewStore((state) => state.setPreviewMode);
  const tabBarStyle = useMemo(
    () => createTabBarStyle(theme),
    [theme.border, theme.fontFamily, theme.surface],
  );

  useEffect(() => {
    const tabNavigation = navigation.getParent();
    tabNavigation?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => tabNavigation?.setOptions({ tabBarStyle });
  }, [navigation, tabBarStyle]);

  if (wallpaperQuery.isLoading) {
    return <LoadingState label={t`Loading wallpaper…`} />;
  }
  if (wallpaperQuery.error) {
    return (
      <ErrorState
        message={wallpaperQuery.error.message}
        onRetry={() => void wallpaperQuery.refetch()}
      />
    );
  }
  if (!wallpaper) {
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
                label={t`Apply, save, or share`}
                onPress={() => setApplySheetVisible(true)}
              />
              <ApplySheet
                onRetryImage={() => void wallpaperQuery.refetch()}
                imageUrl={wallpaper.resultImageUrl}
                onDismiss={() => setApplySheetVisible(false)}
                visible={isApplySheetVisible}
              />
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
