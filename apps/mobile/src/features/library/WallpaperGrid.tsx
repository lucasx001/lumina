import { Trans, useLingui } from '@lingui/react/macro';
import { memo, useCallback, type ReactElement } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';

import { EmptyState, Skeleton } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WallpaperListItem } from '@/lib/api';

type WallpaperGridProps = {
  header?: ReactElement;
  isLoading: boolean;
  isRefreshing: boolean;
  items: WallpaperListItem[];
  onCreate: () => void;
  onEndReached: () => void;
  onRefresh: () => void;
  onSelect: (wallpaper: WallpaperListItem) => void;
  onToggleFavorite?: (wallpaper: WallpaperListItem) => void;
};

export function WallpaperGrid({
  header,
  isLoading,
  isRefreshing,
  items,
  onCreate,
  onEndReached,
  onRefresh,
  onSelect,
  onToggleFavorite = () => {},
}: WallpaperGridProps) {
  const { t } = useLingui();
  const theme = useTheme();
  const renderItem = useCallback(
    ({ item }: { item: WallpaperListItem }) => (
      <WallpaperGridItem
        item={item}
        onPress={() => onSelect(item)}
        onToggleFavorite={() => onToggleFavorite(item)}
      />
    ),
    [onSelect, onToggleFavorite],
  );

  return (
    <FlatList
      columnWrapperStyle={items.length > 0 ? { gap: spacing.sm } : undefined}
      contentContainerStyle={{ gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xxl }}
      contentInsetAdjustmentBehavior="automatic"
      data={items}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        isLoading ? (
          <View
            style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md }}
            testID="wallpaper-skeleton"
          >
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Skeleton height={220} />
              <Skeleton width="60%" />
            </View>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Skeleton height={220} />
              <Skeleton width="60%" />
            </View>
          </View>
        ) : (
          <EmptyState
            actionLabel={t`Create wallpaper`}
            actionTestId="create-wallpaper-button"
            description={t`Create a wallpaper and it will be saved here automatically.`}
            onAction={onCreate}
            title={t`No wallpapers yet`}
          />
        )
      }
      ListFooterComponent={
        items.length > 0 ? (
          <View style={{ alignItems: 'center', minHeight: 28 }}>
            {isLoading ? <ActivityIndicator color={theme.primary} /> : null}
          </View>
        ) : null
      }
      ListHeaderComponent={header}
      numColumns={2}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      renderItem={renderItem}
      testID="wallpaper-grid"
    />
  );
}

const WallpaperGridItem = memo(function WallpaperGridItem({
  item,
  onPress,
  onToggleFavorite,
}: {
  item: WallpaperListItem;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const { i18n, t } = useLingui();
  const theme = useTheme();
  const imageUri = item.resultImageUrl;

  return (
    <Pressable
      accessibilityLabel={t`View wallpaper details`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        gap: spacing.sm,
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
      testID={`wallpaper-grid-item-${item.id}`}
    >
      <View
        style={{
          aspectRatio: 0.56,
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderCurve: 'continuous',
          borderRadius: radius.md,
          borderWidth: 1,
          boxShadow: shadows.card,
          overflow: 'hidden',
        }}
      >
        {imageUri ? (
          <Image
            alt={t`Generated wallpaper`}
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: imageUri }}
            style={{ height: '100%', width: '100%' }}
            transition={120}
          />
        ) : (
          <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 12 }}>
            <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }} variant="caption">
              <Trans>Result unavailable</Trans>
            </ThemedText>
          </View>
        )}
        <Pressable
          accessibilityLabel={
            item.favorite ? t`Remove wallpaper from favorites` : t`Add wallpaper to favorites`
          }
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: item.favorite ? theme.primary : theme.overlay,
            borderRadius: radius.full,
            height: 44,
            justifyContent: 'center',
            opacity: pressed ? 0.72 : 1,
            position: 'absolute',
            right: spacing.sm,
            top: spacing.sm,
            width: 44,
          })}
          testID={`favorite-wallpaper-${item.id}`}
        >
          <AppIcon
            color={item.favorite ? theme.primaryForeground : '#FFFFFF'}
            name={item.favorite ? 'favorite-filled' : 'favorite'}
            size={18}
          />
        </Pressable>
      </View>
      <ThemedText numberOfLines={1} variant="body">
        {item.category ?? t`Uncategorized`}
      </ThemedText>
      <ThemedText numberOfLines={1} style={{ color: theme.mutedText }} variant="caption">
        {item.quality === 'draft' ? t`Preview` : t`HD`} ·{' '}
        {formatDate(item.createdAt, i18n.locale, t`Generated`)}
      </ThemedText>
    </Pressable>
  );
});

function formatDate(createdAt: string, locale: string, fallback: string): string {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString(locale);
}
