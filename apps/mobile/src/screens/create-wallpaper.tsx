import { Trans, useLingui } from '@lingui/react/macro';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { AppIcon } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import {
  ChipsSelector,
  GenerateButton,
  IdeaInput,
  PresetGrid,
  QualitySelector,
  ResultView,
  type CreateChipField,
} from '@/components/create';
import { useGenerate } from '@/hooks/use-generate';
import { useTheme } from '@/hooks/use-theme';
import { useDeviceSize } from '@/lib/useDeviceSize';
import { useCreateStore } from '@/stores/create-store';

export function CreateWallpaperScreen({ onClose }: { onClose: () => void }) {
  const { t } = useLingui();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const deviceSize = useDeviceSize();
  const category = useCreateStore((state) => state.category);
  const chipValues = useCreateStore((state) => state.chipValues);
  const idea = useCreateStore((state) => state.idea);
  const presetId = useCreateStore((state) => state.presetId);
  const quality = useCreateStore((state) => state.quality);
  const setCategory = useCreateStore((state) => state.setCategory);
  const setChip = useCreateStore((state) => state.setChip);
  const setIdea = useCreateStore((state) => state.setIdea);
  const setPresetId = useCreateStore((state) => state.setPresetId);
  const setQuality = useCreateStore((state) => state.setQuality);
  const generation = useGenerate();
  const trimmedCategory = category.trim();
  const trimmedIdea = idea.trim();
  const generationSucceeded =
    generation.job?.status === 'succeeded' && Boolean(generation.job.resultImageUrl);

  useEffect(() => {
    if (generationSucceeded) {
      void queryClient.invalidateQueries({ queryKey: ['wallpapers'] });
    }
  }, [generationSucceeded, queryClient]);

  function updateChip(field: CreateChipField, value: string | undefined) {
    setChip(field, value);
  }

  function generateWallpaper() {
    generation.generate({
      category: trimmedCategory,
      height: deviceSize.targetHeight,
      mode: 'text2img',
      presetId,
      quality,
      userInputs: { idea: trimmedIdea, ...chipValues },
      width: deviceSize.targetWidth,
    });
  }

  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        gap: spacing.lg,
        padding: spacing.lg,
        paddingBottom: spacing.xxl + insets.bottom,
      }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <ThemedText style={{ color: theme.primary }} variant="label">
            <Trans>Create wallpaper</Trans>
          </ThemedText>
          <ThemedText variant="title">
            <Trans>Put the idea into words.</Trans>
          </ThemedText>
          <ThemedText style={{ color: theme.mutedText }} variant="caption">
            <Trans>Choose a starting point, then describe what you want to see.</Trans>
          </ThemedText>
        </View>
        <Pressable
          accessibilityLabel={t`Close creation panel`}
          accessibilityRole="button"
          onPress={onClose}
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
          <AppIcon color={theme.text} name="close" size={20} />
        </Pressable>
      </View>

      {generationSucceeded && generation.job ? (
        <ResultView job={generation.job} onRegenerate={generation.regenerate} />
      ) : (
        <View style={{ gap: spacing.lg }}>
          <PresetGrid onSelect={setPresetId} selectedPresetId={presetId} />
          <ChipsSelector onChange={updateChip} values={chipValues} />
          <IdeaInput onChangeText={setIdea} value={idea} />
          <View style={{ gap: spacing.sm }}>
            <ThemedText variant="label">
              <Trans>Save to category</Trans>
            </ThemedText>
            <TextInput
              accessibilityLabel={t`Wallpaper category`}
              autoCapitalize="sentences"
              maxLength={100}
              onChangeText={setCategory}
              placeholder={t`For example: Quiet nights`}
              placeholderTextColor={theme.mutedText}
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderRadius: radius.sm,
                borderWidth: 1,
                color: theme.text,
                fontFamily: theme.fontFamily,
                fontSize: 15,
                minHeight: 50,
                paddingHorizontal: spacing.md,
              }}
              value={category}
            />
          </View>
          <QualitySelector onChange={setQuality} value={quality} />
          {generation.cooldownSeconds > 0 && !generation.isGenerating ? (
            <ThemedText style={{ color: theme.mutedText }} variant="caption">
              <Trans>Try again in {generation.cooldownSeconds} seconds.</Trans>
            </ThemedText>
          ) : null}
          {generation.error ? (
            <ErrorState message={generation.error.message} onRetry={generation.retry} />
          ) : null}
          <GenerateButton
            disabled={
              !trimmedIdea ||
              !trimmedCategory ||
              generation.isGenerating ||
              generation.cooldownSeconds > 0
            }
            isGenerating={generation.isGenerating}
            onPress={generateWallpaper}
          />
        </View>
      )}
    </BottomSheetScrollView>
  );
}
