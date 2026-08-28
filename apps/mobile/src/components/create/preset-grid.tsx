import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui';
import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getPresets } from '@/lib/api';

type PresetGridProps = {
  onSelect: (presetId: string) => void;
  selectedPresetId?: string;
};

export function PresetGrid({ onSelect, selectedPresetId }: PresetGridProps) {
  const { t } = useLingui();
  const presetsQuery = useQuery({ queryFn: getPresets, queryKey: ['presets'] });
  const theme = useTheme();
  const builtInPresetCopy: Partial<Record<string, { category: string; name: string }>> = {
    preset_builtin_abstract: {
      category: t`Abstract art`,
      name: t`Abstract`,
    },
    preset_builtin_anime: {
      category: t`Anime art`,
      name: t`Anime`,
    },
    preset_builtin_cinematic: {
      category: t`Cinematic art`,
      name: t`Cinematic`,
    },
    preset_builtin_cyberpunk: {
      category: t`Cyberpunk art`,
      name: t`Cyberpunk`,
    },
    preset_builtin_editorial: {
      category: t`Editorial art`,
      name: t`Editorial`,
    },
    preset_builtin_minimal: {
      category: t`Minimal art`,
      name: t`Minimal`,
    },
    preset_builtin_nature: {
      category: t`Nature art`,
      name: t`Nature`,
    },
  };
  const presets =
    presetsQuery.data?.presets.map((preset) => ({
      ...preset,
      category: builtInPresetCopy[preset.id]?.category ?? preset.category,
      name: builtInPresetCopy[preset.id]?.name ?? preset.name,
    })) ?? [];
  const renderPreset = useCallback(
    ({ item: preset }: { item: (typeof presets)[number] }) => {
      const selected = preset.id === selectedPresetId;

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => onSelect(preset.id)}
          style={({ pressed }) => ({
            backgroundColor: theme.card,
            borderColor: selected ? theme.primary : theme.border,
            borderCurve: 'continuous',
            borderRadius: radius.md,
            borderWidth: selected ? 2 : 1,
            boxShadow: selected ? shadows.raised : shadows.card,
            gap: spacing.sm,
            minHeight: 184,
            opacity: pressed ? 0.88 : 1,
            overflow: 'hidden',
            padding: spacing.sm,
            transform: [{ scale: pressed ? 0.985 : 1 }],
            width: 172,
          })}
          testID={`preset-${preset.id}`}
        >
          {preset.coverImageUrl ? (
            <Image
              accessibilityLabel={t`${preset.name} preset cover`}
              contentFit="cover"
              source={preset.coverImageUrl}
              style={{ borderRadius: radius.sm, height: 112, width: '100%' }}
            />
          ) : (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: theme.muted,
                borderRadius: radius.sm,
                height: 112,
                justifyContent: 'center',
              }}
            >
              <AppIcon color={theme.mutedText} name="sparkles" size={24} />
            </View>
          )}
          {selected ? (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: theme.primary,
                borderRadius: radius.full,
                height: 28,
                justifyContent: 'center',
                position: 'absolute',
                right: spacing.md,
                top: spacing.md,
                width: 28,
              }}
            >
              <AppIcon color={theme.primaryForeground} name="check" size={15} />
            </View>
          ) : null}
          <ThemedText numberOfLines={1} variant="body">
            {preset.name}
          </ThemedText>
          <ThemedText numberOfLines={1} style={{ color: theme.mutedText }} variant="caption">
            {preset.category}
          </ThemedText>
        </Pressable>
      );
    },
    [onSelect, presets, selectedPresetId, t, theme],
  );

  return (
    <View style={{ gap: spacing.md }}>
      <ThemedText variant="subtitle">
        <Trans>Choose a preset</Trans>
      </ThemedText>
      {presetsQuery.isPending ? (
        <LoadingState label={t`Loading presets…`} />
      ) : presetsQuery.isError ? (
        <ErrorState
          message={presetsQuery.error.message}
          onRetry={() => void presetsQuery.refetch()}
        />
      ) : (
        <FlatList
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.sm }}
          data={presets}
          horizontal
          keyExtractor={(preset) => preset.id}
          renderItem={renderPreset}
        />
      )}
    </View>
  );
}
