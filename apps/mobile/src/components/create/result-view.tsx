import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { WallpaperPreview, type WallpaperPreviewMode } from '@/components/WallpaperPreview';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { ApplySheet } from '@/components/apply';
import { useTheme } from '@/hooks/use-theme';
import type { GenerationJob } from '@/lib/api';

type ResultViewProps = {
  job: GenerationJob;
  onRegenerate?: () => void;
  onCreateNew?: () => void;
  onViewCategory?: () => void;
  onViewWallpaper?: () => void;
  onRetryImage?: () => void;
};

export function ResultView({
  job,
  onRegenerate,
  onCreateNew,
  onViewCategory,
  onViewWallpaper,
  onRetryImage,
}: ResultViewProps) {
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
          {job.width && job.height ? `${job.width} × ${job.height} px` : t`Resolution unavailable`}
        </ThemedText>
        {job.category ? (
          <ThemedText variant="body">
            <Trans>Saved to {job.category}</Trans>
          </ThemedText>
        ) : null}
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
        onRetryImage={onRetryImage}
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
        {onRegenerate ? (
          <Button
            icon="refresh"
            label={t`Regenerate`}
            onPress={onRegenerate}
            testID="regenerate-button"
            variant="secondary"
          />
        ) : null}
        {onCreateNew ? (
          <Button label={t`Create a new wallpaper`} onPress={onCreateNew} variant="secondary" />
        ) : null}
        {onViewCategory && job.categoryId ? (
          <Button label={t`View category`} onPress={onViewCategory} variant="secondary" />
        ) : null}
        {onViewWallpaper && job.wallpaperId ? (
          <Button label={t`View wallpaper`} onPress={onViewWallpaper} variant="secondary" />
        ) : null}
        <Button
          icon="download"
          label={t`Apply and save`}
          onPress={() => setIsApplySheetVisible(true)}
          testID="open-apply-sheet"
        />
      </View>
      <ApplySheet
        onRetryImage={onRetryImage}
        imageUrl={job.resultImageUrl}
        onDismiss={() => setIsApplySheetVisible(false)}
        visible={isApplySheetVisible}
      />
    </View>
  );
}
