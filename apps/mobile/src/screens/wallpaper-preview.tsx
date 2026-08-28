import { useLingui } from '@lingui/react/macro';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { ErrorState, LoadingState } from '@/components/feedback';
import { Button } from '@/components/ui/button';
import { ApplySheet } from '@/features/apply/ApplySheet';
import { WallpaperDetail } from '@/features/wallpapers/wallpaper-detail';
import { useWallpapers } from '@/features/wallpapers/use-wallpapers';
import { useTheme } from '@/hooks/use-theme';
import { createTabBarStyle } from '@/navigation/tab-bar-options';
import { useWallpaperPreviewStore } from '@/stores/wallpaper-preview-store';

export function WallpaperPreviewScreen() {
  const { t } = useLingui();
  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ category: string; wallpaperId: string }>();
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const wallpaperId = Array.isArray(params.wallpaperId)
    ? params.wallpaperId[0]
    : params.wallpaperId;
  const wallpapers = useWallpapers({ category }, 50);
  const wallpaper = wallpapers.wallpapers.find((item) => item.id === wallpaperId);
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

  if (wallpapers.isLoading || wallpapers.isPreparingDeviceId) {
    return <LoadingState label={t`Loading wallpaper…`} />;
  }
  if (wallpapers.error || wallpapers.deviceIdError) {
    return (
      <ErrorState
        message={
          (wallpapers.error ?? wallpapers.deviceIdError)?.message ?? t`Wallpaper unavailable`
        }
        onRetry={() => void wallpapers.refetch()}
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
                imageUrl={wallpaper.resultImageUrl}
                onDismiss={() => setApplySheetVisible(false)}
                visible={isApplySheetVisible}
              />
            </>
          ) : undefined
        }
        onClose={() => router.back()}
        onModeChange={setPreviewMode}
        onToggleFavorite={() => wallpapers.toggleFavorite(wallpaper)}
        previewMode={previewMode}
        wallpaper={wallpaper}
      />
    </>
  );
}
