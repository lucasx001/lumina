import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { WallpaperPreview, type WallpaperPreviewMode } from '@/components/WallpaperPreview';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { radius, spacing } from '@/constants/theme';
import { ApplySheet } from '@/features/apply/ApplySheet';
import { useTheme } from '@/hooks/use-theme';
import type { GenerationJob } from '@/lib/api';

type ResultViewProps = {
  job: GenerationJob;
  onRegenerate: () => void;
};

export function ResultView({ job, onRegenerate }: ResultViewProps) {
  const { t } = useLingui();
  const [mode, setMode] = useState<WallpaperPreviewMode>('lock-screen');
  const [isApplySheetVisible, setIsApplySheetVisible] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const theme = useTheme();

  if (!job.resultImageUrl) {
    return null;
  }

  const previewWidth = Math.max(160, Math.min(windowWidth - 48, 280));
  const previewHeight = Math.round(previewWidth * ((job.height ?? 2) / (job.width ?? 1)));

  return (
    <View style={{ alignItems: 'center', gap: spacing.lg }}>
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <ThemedText variant="title">
          <Trans>Your wallpaper is ready</Trans>
        </ThemedText>
        <ThemedText selectable style={{ color: theme.mutedText }} variant="caption">
          {job.quality === 'draft'
            ? t`Quick preview · Low resolution`
            : t`High resolution · Full 2K+`}
        </ThemedText>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(
          [
            ['lock-screen', t`Lock screen`],
            ['home-screen', t`Home screen`],
          ] as const
        ).map(([nextMode, label]) => {
          const selected = mode === nextMode;

          return (
            <Pressable
              key={nextMode}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setMode(nextMode)}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
                borderCurve: 'continuous',
                borderRadius: radius.full,
                borderWidth: 1,
                justifyContent: 'center',
                minHeight: 44,
                opacity: pressed ? 0.84 : 1,
                paddingHorizontal: spacing.md,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
              testID={`preview-mode-${nextMode}`}
            >
              <ThemedText
                style={{ color: selected ? theme.primaryForeground : theme.text }}
                variant="caption"
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <WallpaperPreview
        height={previewHeight}
        image={{ uri: job.resultImageUrl }}
        mode={mode}
        width={previewWidth}
      />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          justifyContent: 'center',
        }}
      >
        <Button
          icon="refresh"
          label={t`Regenerate`}
          onPress={onRegenerate}
          testID="regenerate-button"
          variant="secondary"
        />
        <Button
          icon="download"
          label={t`Apply and save`}
          onPress={() => setIsApplySheetVisible(true)}
          testID="open-apply-sheet"
        />
      </View>
      <ApplySheet
        imageUrl={job.resultImageUrl}
        onDismiss={() => setIsApplySheetVisible(false)}
        visible={isApplySheetVisible}
      />
    </View>
  );
}
