import { Trans, useLingui } from '@lingui/react/macro';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { ErrorState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui/app-icon';
import { radius, spacing } from '@/constants/theme';
import { useWallpapers } from '@/features/library/use-wallpapers';
import { useTheme } from '@/hooks/use-theme';
import type { WallpaperListItem } from '@/lib/api';

type WallpaperCategory = { items: WallpaperListItem[]; name: string };

export function HomeScreen() {
  const { t } = useLingui();
  const router = useRouter();
  const theme = useTheme();
  const wallpapers = useWallpapers({}, 50);
  const categories = useMemo(() => groupWallpapers(wallpapers.wallpapers), [wallpapers.wallpapers]);
  const error = wallpapers.deviceIdError ?? wallpapers.error ?? wallpapers.favoriteError;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: categories.length ? undefined : 1,
        gap: spacing.lg,
        padding: spacing.md,
        paddingBottom: spacing.xxl,
      }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          onRefresh={() => void wallpapers.refetch()}
          refreshing={wallpapers.isRefetching}
          tintColor={theme.primary}
        />
      }
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <ThemedText style={{ color: theme.primary }} variant="label">
            <Trans>Your wallpaper space</Trans>
          </ThemedText>
          <ThemedText variant="title">
            <Trans>Ideas, carefully kept.</Trans>
          </ThemedText>
        </View>
        {categories.length ? (
          <Pressable
            accessibilityLabel={t`Create wallpaper`}
            accessibilityRole="button"
            onPress={() => router.push('/create-wallpaper')}
            style={({ pressed }) => ({
              alignItems: 'center',
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: radius.full,
              borderWidth: 1,
              height: 48,
              justifyContent: 'center',
              opacity: pressed ? 0.75 : 1,
              width: 48,
            })}
          >
            <AppIcon color={theme.primary} name="plus" size={22} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <ErrorState message={error.message} onRetry={() => void wallpapers.refetch()} />
      ) : null}
      {!error && !categories.length ? (
        <HomeEmptyState onCreate={() => router.push('/create-wallpaper')} />
      ) : null}
      {categories.length ? (
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              alignItems: 'flex-end',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <ThemedText variant="subtitle">
              <Trans>My categories</Trans>
            </ThemedText>
            <ThemedText style={{ color: theme.mutedText }} variant="caption">
              <Trans>{categories.length} categories</Trans>
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {categories.map((category) => (
              <CategoryCard
                category={category}
                key={category.name}
                onPress={() =>
                  router.push({
                    params: { category: category.name },
                    pathname: '/category/[category]',
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function HomeEmptyState({ onCreate }: { onCreate: () => void }) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: 'center', flex: 1, gap: spacing.lg, justifyContent: 'center' }}>
      <View
        style={{
          backgroundColor: theme.muted,
          borderColor: theme.border,
          borderRadius: radius.xl,
          borderWidth: 1,
          height: 190,
          overflow: 'hidden',
          transform: [{ rotate: '-3deg' }],
          width: 154,
        }}
      >
        <View
          style={{
            borderColor: 'rgba(32, 25, 20, 0.18)',
            borderRadius: radius.full,
            borderWidth: 1,
            height: 112,
            left: 23,
            position: 'absolute',
            top: 34,
            width: 94,
          }}
        />
        <View
          style={{
            backgroundColor: 'rgba(155, 91, 50, 0.18)',
            borderRadius: radius.full,
            bottom: 22,
            height: 54,
            position: 'absolute',
            right: 18,
            width: 54,
          }}
        />
      </View>
      <View style={{ alignItems: 'center', gap: spacing.sm, maxWidth: 300 }}>
        <ThemedText style={{ textAlign: 'center' }} variant="title">
          <Trans>Start with an idea you cannot quite explain.</Trans>
        </ThemedText>
        <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }} variant="body">
          <Trans>Tell Lumina a color, a mood, or a moment. We will shape it for this screen.</Trans>
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onCreate}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderRadius: radius.md,
          borderWidth: 1,
          flexDirection: 'row',
          gap: spacing.sm,
          minHeight: 50,
          opacity: pressed ? 0.76 : 1,
          paddingHorizontal: spacing.lg,
        })}
        testID="home-empty-create"
      >
        <AppIcon color={theme.primary} name="plus" />
        <ThemedText variant="label">
          <Trans>Create your first wallpaper</Trans>
        </ThemedText>
      </Pressable>
    </View>
  );
}

function CategoryCard({ category, onPress }: { category: WallpaperCategory; onPress: () => void }) {
  const { t } = useLingui();
  const theme = useTheme();
  const previews = category.items.filter((item) => item.resultImageUrl).slice(0, 2);

  return (
    <Pressable
      accessibilityLabel={t`Open ${category.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderRadius: radius.md,
        borderWidth: 1,
        minWidth: 150,
        opacity: pressed ? 0.78 : 1,
        overflow: 'hidden',
        transform: [{ scale: pressed ? 0.985 : 1 }],
        width: '48.5%',
      })}
    >
      <View style={{ backgroundColor: theme.muted, flexDirection: 'row', gap: 2, height: 132 }}>
        {[0, 1].map((index) =>
          previews[index]?.resultImageUrl ? (
            <Image
              accessibilityLabel={t`Wallpaper preview`}
              contentFit="cover"
              key={previews[index].id}
              source={{ uri: previews[index].resultImageUrl }}
              style={{ flex: 1 }}
            />
          ) : (
            <View
              key={index}
              style={{
                backgroundColor: index ? 'rgba(155, 91, 50, 0.22)' : theme.muted,
                flex: 1,
              }}
            />
          ),
        )}
      </View>
      <View style={{ gap: 3, padding: spacing.sm + 4 }}>
        <ThemedText numberOfLines={1} variant="subtitle">
          {category.name}
        </ThemedText>
        <ThemedText style={{ color: theme.mutedText }} variant="caption">
          <Trans>{category.items.length} wallpapers</Trans>
        </ThemedText>
      </View>
    </Pressable>
  );
}

function groupWallpapers(items: WallpaperListItem[]): WallpaperCategory[] {
  const groups = new Map<string, WallpaperListItem[]>();
  for (const item of items) {
    const name = item.category;
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }

  return [...groups.entries()].map(([name, groupedItems]) => ({ items: groupedItems, name }));
}
