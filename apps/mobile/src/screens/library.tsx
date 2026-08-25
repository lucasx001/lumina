import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { ErrorState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { radius, spacing } from '@/constants/theme';
import { ApplySheet } from '@/features/apply/ApplySheet';
import { PresetManager } from '@/features/library/PresetManager';
import { WallpaperDetail } from '@/features/library/WallpaperDetail';
import { WallpaperGrid } from '@/features/library/WallpaperGrid';
import { LibraryFilters } from '@/features/library/library-filters';
import { useWallpapers } from '@/features/library/use-wallpapers';
import { useTheme } from '@/hooks/use-theme';
import { createTabBarStyle } from '@/navigation/tab-bar-options';
import { useLibraryStore } from '@/stores/library-store';

export function LibraryScreen() {
  const { t } = useLingui();
  const navigation = useNavigation();
  const router = useRouter();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const selectedWallpaper = useLibraryStore((state) => state.selectedWallpaper);
  const isApplySheetVisible = useLibraryStore((state) => state.isApplySheetVisible);
  const previewMode = useLibraryStore((state) => state.previewMode);
  const selectedCategory = useLibraryStore((state) => state.selectedCategory);
  const favoritesOnly = useLibraryStore((state) => state.favoritesOnly);
  const closeWallpaper = useLibraryStore((state) => state.closeWallpaper);
  const selectWallpaper = useLibraryStore((state) => state.selectWallpaper);
  const setApplySheetVisible = useLibraryStore((state) => state.setApplySheetVisible);
  const setPreviewMode = useLibraryStore((state) => state.setPreviewMode);
  const setSelectedCategory = useLibraryStore((state) => state.setSelectedCategory);
  const setFavoritesOnly = useLibraryStore((state) => state.setFavoritesOnly);
  const wallpapers = useWallpapers({ category: selectedCategory, favoritesOnly });
  const error = wallpapers.deviceIdError ?? wallpapers.error ?? wallpapers.favoriteError;
  const tabBarStyle = useMemo(() => createTabBarStyle(theme), [theme.border, theme.surface]);
  const categories = [
    ...new Set(
      wallpapers.wallpapers.flatMap((wallpaper) =>
        wallpaper.category ? [wallpaper.category] : [],
      ),
    ),
  ];
  const visibleWallpapers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return wallpapers.wallpapers;
    }

    return wallpapers.wallpapers.filter((wallpaper) =>
      [wallpaper.category, wallpaper.mode, wallpaper.quality]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [searchQuery, wallpapers.wallpapers]);

  useEffect(() => {
    const tabNavigation = navigation.getParent();
    navigation.setOptions({ headerShown: !selectedWallpaper });
    tabNavigation?.setOptions({
      tabBarStyle: selectedWallpaper ? { display: 'none' } : tabBarStyle,
    });

    return () => {
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation, selectedWallpaper, tabBarStyle]);

  if (selectedWallpaper) {
    return (
      <WallpaperDetail
        actionSlot={
          selectedWallpaper.resultImageUrl ? (
            <>
              <Button
                fullWidth
                icon="download"
                label={t`Apply, save, or share`}
                onPress={() => setApplySheetVisible(true)}
              />
              <ApplySheet
                imageUrl={selectedWallpaper.resultImageUrl}
                onDismiss={() => setApplySheetVisible(false)}
                visible={isApplySheetVisible}
              />
            </>
          ) : undefined
        }
        onClose={closeWallpaper}
        onModeChange={setPreviewMode}
        onToggleFavorite={() => wallpapers.toggleFavorite(selectedWallpaper)}
        previewMode={previewMode}
        wallpaper={selectedWallpaper}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {error ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={error.message} onRetry={() => void wallpapers.refetch()} />
        </View>
      ) : null}
      <WallpaperGrid
        header={
          <View style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.xs }}>
              <ThemedText variant="title">
                <Trans>Your wallpaper collection</Trans>
              </ThemedText>
              <ThemedText style={{ color: theme.mutedText }} variant="body">
                <Trans>Search, filter, preview, and apply everything you create.</Trans>
              </ThemedText>
            </View>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderCurve: 'continuous',
                borderRadius: radius.full,
                borderWidth: 1,
                flexDirection: 'row',
                gap: spacing.sm,
                minHeight: 52,
                paddingHorizontal: spacing.md,
              }}
            >
              <AppIcon color={theme.primary} name="search" />
              <TextInput
                accessibilityLabel={t`Search wallpapers`}
                onChangeText={setSearchQuery}
                placeholder={t`Search by category, mode, or quality`}
                placeholderTextColor={theme.mutedText}
                style={{
                  color: theme.text,
                  flex: 1,
                  fontFamily: theme.fontFamily,
                  fontSize: 15,
                  minHeight: 48,
                }}
                value={searchQuery}
              />
            </View>
            <LibraryFilters
              categories={categories}
              favoritesOnly={favoritesOnly}
              onCategoryChange={setSelectedCategory}
              onFavoritesOnlyChange={setFavoritesOnly}
              selectedCategory={selectedCategory}
            />
            <PresetManager />
          </View>
        }
        isLoading={
          wallpapers.isLoading || wallpapers.isFetchingNextPage || wallpapers.isPreparingDeviceId
        }
        isRefreshing={wallpapers.isRefetching && !wallpapers.isFetchingNextPage}
        items={visibleWallpapers}
        onCreate={() => router.navigate('/')}
        onEndReached={() => {
          if (wallpapers.hasNextPage && !wallpapers.isFetchingNextPage) {
            void wallpapers.fetchNextPage();
          }
        }}
        onRefresh={() => void wallpapers.refetch()}
        onSelect={(wallpaper) => {
          selectWallpaper(wallpaper);
        }}
        onToggleFavorite={wallpapers.toggleFavorite}
      />
    </View>
  );
}
