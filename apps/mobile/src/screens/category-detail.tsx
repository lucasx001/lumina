import { Trans, useLingui } from '@lingui/react/macro';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, LoadingState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { useWallpapers } from '@/hooks/use-wallpapers';
import { useTheme } from '@/hooks/use-theme';
import type { WallpaperListItem } from '@/lib/api';

export function CategoryDetailScreen() {
  const { t } = useLingui();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category: string }>();
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const wallpapers = useWallpapers({ category }, 50);
  const error = wallpapers.deviceIdError ?? wallpapers.error;
  const columns = splitColumns(wallpapers.wallpapers);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{ backgroundColor: theme.background, flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            gap: spacing.md,
            padding: spacing.md,
            paddingBottom: spacing.xxl,
          }}
          contentInsetAdjustmentBehavior="automatic"
        >
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
              <ThemedText numberOfLines={1} variant="title">
                {category}
              </ThemedText>
              <ThemedText style={{ color: theme.mutedText }} variant="caption">
                <Trans>{wallpapers.wallpapers.length} wallpapers</Trans>
              </ThemedText>
            </View>
            <View style={{ width: 48 }} />
          </View>

          {error ? (
            <ErrorState message={error.message} onRetry={() => void wallpapers.refetch()} />
          ) : null}
          {wallpapers.isLoading || wallpapers.isPreparingDeviceId ? (
            <LoadingState label={t`Loading wallpapers…`} />
          ) : null}
          <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm }}>
            {columns.map((items, columnIndex) => (
              <View key={columnIndex} style={{ flex: 1, gap: spacing.sm }}>
                {items.map((wallpaper, itemIndex) => (
                  <WallpaperTile
                    index={itemIndex + columnIndex}
                    key={wallpaper.id}
                    onPress={() =>
                      router.push({
                        params: { category, wallpaperId: wallpaper.id },
                        pathname: '/category/[category]/[wallpaperId]',
                      })
                    }
                    wallpaper={wallpaper}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function WallpaperTile({
  index,
  onPress,
  wallpaper,
}: {
  index: number;
  onPress: () => void;
  wallpaper: WallpaperListItem;
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
        <Image
          accessibilityLabel={t`Generated wallpaper`}
          contentFit="cover"
          source={{ uri: wallpaper.resultImageUrl }}
          style={{ aspectRatio, borderRadius: radius.md, width: '100%' }}
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

function splitColumns(items: WallpaperListItem[]): [WallpaperListItem[], WallpaperListItem[]] {
  return items.reduce<[WallpaperListItem[], WallpaperListItem[]]>(
    (columns, item, index) => {
      columns[index % 2].push(item);
      return columns;
    },
    [[], []],
  );
}
