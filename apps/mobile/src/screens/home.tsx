import { Trans, useLingui } from '@lingui/react/macro';
import { RemoteImage } from '@/components/remote-image';
import { GenerationTasks } from '@/components/generation-tasks';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { ErrorState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';

export function HomeScreen() {
  const { t } = useLingui();
  const router = useRouter();
  const theme = useTheme();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.categories;
  const error = categoriesQuery.error;

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
          onRefresh={() => void categoriesQuery.refetch()}
          refreshing={categoriesQuery.isRefetching}
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

      {error && !categoriesQuery.isFetching ? (
        <ErrorState message={error} onRetry={() => void categoriesQuery.refetch()} />
      ) : null}
      <GenerationTasks />
      {categoriesQuery.isLoading && !categories.length ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
          <ActivityIndicator color={theme.primary} size="large" />
          <ThemedText style={{ color: theme.mutedText }} variant="caption">
            {t`Loading categories…`}
          </ThemedText>
        </View>
      ) : null}
      {!error && !categoriesQuery.isLoading && !categories.length ? (
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
                onRetryImage={() => void categoriesQuery.refetch()}
                category={category}
                key={category.name}
                onPress={() =>
                  router.push({
                    params: { category: category.id },
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

function CategoryCard({
  onRetryImage,
  category,
  onPress,
}: {
  onRetryImage: () => void;
  category: { count: number; coverImageUrls: string[]; id: string; name: string };
  onPress: () => void;
}) {
  const { t } = useLingui();
  const theme = useTheme();
  const previews = category.coverImageUrls.slice(0, 2);

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
          previews[index] ? (
            <RemoteImage
              onRetry={onRetryImage}
              accessibilityLabel={t`Wallpaper preview`}
              contentFit="cover"
              key={previews[index]}
              source={{ uri: previews[index] }}
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
          <Trans>{category.count} wallpapers</Trans>
        </ThemedText>
      </View>
    </Pressable>
  );
}
