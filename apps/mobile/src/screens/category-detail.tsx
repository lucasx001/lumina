import { Trans, useLingui } from '@lingui/react/macro';
import { RemoteImage } from '@/components/remote-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useWallpapers } from '@/hooks/use-wallpapers';
import { useTheme } from '@/hooks/use-theme';
import type { WallpaperListItem } from '@/lib/api';

export function CategoryDetailScreen() {
  const { t } = useLingui();
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const tileWidth = Math.max(1, (windowWidth - spacing.md * 2 - spacing.sm) / 2);
  const router = useRouter();
  const params = useLocalSearchParams<{ category: string }>();
  const categoryId = Array.isArray(params.category) ? params.category[0] : params.category;
  const categoriesQuery = useCategories();
  const wallpapers = useWallpapers({ categoryId }, 50);
  const category = categoriesQuery.categories.find((item) => item.id === categoryId);
  const error = categoriesQuery.error ?? wallpapers.error;
  const rows = chunkRows(wallpapers.wallpapers);
  const listHeader = (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          accessibilityLabel={t`Back to Home`}
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            alignItems: 'center',
            borderColor: theme.border,
            borderRadius: radius.full,
            borderWidth: 1,
            height: 48,
            justifyContent: 'center',
            opacity: pressed ? 0.72 : 1,
            width: 48,
          })}
        >
          <AppIcon color={theme.text} name="arrow-left" size={20} />
        </Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <ThemedText
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              fontFamily: theme.fontFamily,
              includeFontPadding: true,
              letterSpacing: 0,
              lineHeight: 42,
              paddingHorizontal: spacing.xs,
              textAlign: 'center',
              width: '100%',
            }}
            variant="title"
          >
            {category?.name ?? t`Wallpaper category`}
          </ThemedText>
          <ThemedText style={{ color: theme.mutedText }} variant="caption">
            <Trans>{wallpapers.wallpapers.length} wallpapers</Trans>
          </ThemedText>
        </View>
        <View style={{ width: 48 }} />
      </View>
      {error ? <ErrorState message={error} onRetry={() => void wallpapers.refetch()} /> : null}
      {wallpapers.isPending || categoriesQuery.isPending ? (
        <LoadingState label={t`Loading wallpapers…`} />
      ) : null}
      {!wallpapers.isPending && !wallpapers.error && !wallpapers.wallpapers.length ? (
        <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }} variant="body">
          <Trans>No wallpapers in this category yet.</Trans>
        </ThemedText>
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{ backgroundColor: theme.background, flex: 1 }}
      >
        <FlatList
          contentContainerStyle={{
            gap: spacing.sm,
            padding: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          data={rows}
          initialNumToRender={8}
          keyExtractor={(_, index) => `row-${index}`}
          ListFooterComponent={
            wallpapers.hasNextPage ? (
              <Pressable
                accessibilityRole="button"
                disabled={wallpapers.isFetchingNextPage}
                onPress={() => void wallpapers.fetchNextPage()}
                style={{ alignItems: 'center', padding: spacing.md }}
              >
                <ThemedText style={{ color: theme.primary }} variant="label">
                  {wallpapers.isFetchingNextPage ? t`Loading…` : t`Load more`}
                </ThemedText>
              </Pressable>
            ) : null
          }
          ListHeaderComponent={listHeader}
          maxToRenderPerBatch={8}
          onEndReached={() => {
            if (wallpapers.hasNextPage && !wallpapers.isFetchingNextPage) {
              void wallpapers.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.6}
          refreshControl={
            <RefreshControl
              onRefresh={() => void wallpapers.refetch()}
              refreshing={wallpapers.isRefetching}
              tintColor={theme.primary}
            />
          }
          removeClippedSubviews
          renderItem={({ item: row }) => (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {row.map((wallpaper, index) => (
                <View key={wallpaper.id} style={{ flex: 1 }}>
                  <WallpaperTile
                    width={tileWidth}
                    index={index}
                    onPress={() =>
                      router.push({
                        params: { category: categoryId, wallpaperId: wallpaper.id },
                        pathname: '/category/[category]/[wallpaperId]',
                      })
                    }
                    onRetryImage={() => void wallpapers.refetch()}
                    wallpaper={wallpaper}
                  />
                </View>
              ))}
              {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          )}
          windowSize={7}
        />
      </SafeAreaView>
    </>
  );
}

function WallpaperTile({
  onRetryImage,
  index,
  onPress,
  wallpaper,
  width,
}: {
  onRetryImage: () => void;
  index: number;
  onPress: () => void;
  wallpaper: WallpaperListItem;
  width: number;
}) {
  const { t } = useLingui();
  const theme = useTheme();
  const fallbackRatios = [0.68, 0.82, 0.61];
  const aspectRatio =
    wallpaper.width && wallpaper.height
      ? wallpaper.width / wallpaper.height
      : fallbackRatios[index % fallbackRatios.length];

  return (
    <Pressable
      accessibilityLabel={t`Open wallpaper preview`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.76 : 1 })}
    >
      {wallpaper.resultImageUrl ? (
        <RemoteImage
          onRetry={onRetryImage}
          accessibilityLabel={t`Generated wallpaper`}
          contentFit="cover"
          source={{ uri: wallpaper.resultImageUrl }}
          style={{ height: width / aspectRatio, borderRadius: radius.md, width }}
          transition={180}
        />
      ) : (
        <View
          style={{
            aspectRatio,
            backgroundColor: theme.muted,
            borderColor: theme.border,
            borderRadius: radius.md,
            borderWidth: 1,
            width: '100%',
          }}
        />
      )}
    </Pressable>
  );
}

function chunkRows(items: WallpaperListItem[]): WallpaperListItem[][] {
  const rows: WallpaperListItem[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }
  return rows;
}
