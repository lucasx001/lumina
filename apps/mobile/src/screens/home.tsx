import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ErrorState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppIcon } from '@/components/ui/app-icon';
import { radius, spacing } from '@/constants/theme';
import { ChipsSelector, type CreateChipField } from '@/features/create/chips-selector';
import { GenerateButton } from '@/features/create/generate-button';
import { IdeaInput } from '@/features/create/idea-input';
import { PresetGrid } from '@/features/create/preset-grid';
import { QualitySelector } from '@/features/create/quality-selector';
import { ResultView } from '@/features/create/result-view';
import { ExistingImageEditor } from '@/features/edit/ExistingImageEditor';
import { useGenerate } from '@/hooks/use-generate';
import { useDeviceSize } from '@/lib/useDeviceSize';
import { useTheme } from '@/hooks/use-theme';
import { useCreateStore } from '@/stores/create-store';

export function HomeScreen() {
  const { t } = useLingui();
  const theme = useTheme();
  const [workspaceMode, setWorkspaceMode] = useState<'create' | 'edit'>('create');
  const deviceSize = useDeviceSize();
  const idea = useCreateStore((state) => state.idea);
  const presetId = useCreateStore((state) => state.presetId);
  const chipValues = useCreateStore((state) => state.chipValues);
  const quality = useCreateStore((state) => state.quality);
  const setIdea = useCreateStore((state) => state.setIdea);
  const setPresetId = useCreateStore((state) => state.setPresetId);
  const setChip = useCreateStore((state) => state.setChip);
  const setQuality = useCreateStore((state) => state.setQuality);
  const generation = useGenerate();
  const trimmedIdea = idea.trim();
  const generationSucceeded =
    generation.job?.status === 'succeeded' && Boolean(generation.job.resultImageUrl);

  function updateChip(field: CreateChipField, value: string | undefined) {
    setChip(field, value);
  }

  function generateWallpaper() {
    generation.generate({
      height: deviceSize.targetHeight,
      mode: 'text2img',
      presetId,
      quality,
      userInputs: { idea: trimmedIdea, ...chipValues },
      width: deviceSize.targetWidth,
    });
  }

  return (
    <ScrollView
      contentContainerStyle={{ gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xxl }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xs }}>
        <ThemedText variant="display">
          <Trans>Make your screen yours</Trans>
        </ThemedText>
        <ThemedText style={{ color: theme.mutedText }} variant="body">
          <Trans>Create a new wallpaper from an idea, or transform one of your photos.</Trans>
        </ThemedText>
      </View>

      <View
        accessibilityRole="tablist"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderCurve: 'continuous',
          borderRadius: radius.full,
          borderWidth: 1,
          flexDirection: 'row',
          gap: spacing.xs,
          padding: spacing.xs,
        }}
      >
        <WorkspaceModeButton
          icon="sparkles"
          label={t`Create`}
          onPress={() => setWorkspaceMode('create')}
          selected={workspaceMode === 'create'}
        />
        <WorkspaceModeButton
          icon="image"
          label={t`Edit a photo`}
          onPress={() => setWorkspaceMode('edit')}
          selected={workspaceMode === 'edit'}
        />
      </View>

      {generationSucceeded && generation.job ? (
        <ResultView job={generation.job} onRegenerate={generation.regenerate} />
      ) : workspaceMode === 'create' ? (
        <ThemedView variant="card" style={{ gap: spacing.xl }}>
          <PresetGrid onSelect={setPresetId} selectedPresetId={presetId} />
          <ChipsSelector onChange={updateChip} values={chipValues} />
          <IdeaInput onChangeText={setIdea} value={idea} />
          <QualitySelector onChange={setQuality} value={quality} />
          {generation.cooldownSeconds > 0 && !generation.isGenerating ? (
            <ThemedText selectable variant="caption">
              <Trans>
                To avoid duplicate requests, try again in {generation.cooldownSeconds} seconds.
              </Trans>
            </ThemedText>
          ) : null}
          {generation.error ? (
            <ErrorState message={generation.error.message} onRetry={generation.retry} />
          ) : null}
          <GenerateButton
            disabled={!trimmedIdea || generation.isGenerating || generation.cooldownSeconds > 0}
            isGenerating={generation.isGenerating}
            onPress={generateWallpaper}
          />
        </ThemedView>
      ) : (
        <ExistingImageEditor deviceSize={deviceSize} />
      )}

      <ThemedView
        variant="card"
        style={{
          alignItems: 'center',
          borderRadius: radius.md,
          flexDirection: 'row',
          gap: spacing.md,
          justifyContent: 'space-between',
          padding: spacing.md,
        }}
      >
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: theme.muted,
              borderRadius: radius.full,
              height: 36,
              justifyContent: 'center',
              width: 36,
            }}
          >
            <AppIcon color={theme.primary} name="image" size={18} />
          </View>
          <ThemedText variant="label">
            <Trans>Optimized for this device</Trans>
          </ThemedText>
        </View>
        <ThemedText style={{ color: theme.primary, fontVariant: ['tabular-nums'] }} variant="label">
          {deviceSize.targetWidth} × {deviceSize.targetHeight}
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

function WorkspaceModeButton({
  icon,
  label,
  onPress,
  selected,
}: {
  icon: 'image' | 'sparkles';
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: selected ? theme.primary : 'transparent',
        borderCurve: 'continuous',
        borderRadius: radius.full,
        flex: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        minHeight: 48,
        opacity: pressed ? 0.82 : 1,
        paddingHorizontal: spacing.md,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <AppIcon color={selected ? theme.primaryForeground : theme.mutedText} name={icon} />
      <ThemedText
        style={{ color: selected ? theme.primaryForeground : theme.text, fontWeight: '600' }}
        variant="body"
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
