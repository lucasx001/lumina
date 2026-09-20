import { Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { TextInput, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/feedback';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';
import { ResultView } from '@/components/create';
import { useGenerate } from '@/hooks/use-generate';
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import { useCreateStore } from '@/stores/create-store';
import { getAccountSession, isCurrentAccount } from '@/lib/account-session';
import { resetCreateWallpaperSession } from '@/lib/create-wallpaper-session';
import type { WallpaperSize } from '@/lib/useDeviceSize';

import {
  EditModePicker,
  ImagePickerEntry,
  StyleToPresetForm,
  type ExistingImageMode,
} from '@/components/edit';

type ExistingImageEditorProps = {
  deviceSize: WallpaperSize;
};

export function ExistingImageEditor({ deviceSize }: ExistingImageEditorProps) {
  const { t } = useLingui();
  const category = useCreateStore((state) => state.category);
  const categoryId = useCreateStore((state) => state.categoryId);
  const instruction = useCreateStore((state) => state.instruction);
  const mode = useCreateStore((state) => state.mode);
  const sourceImageUrl = useCreateStore((state) => state.sourceImageUrl);
  const sourceImageKey = useCreateStore((state) => state.sourceImageKey);
  const setCategory = useCreateStore((state) => state.setCategory);
  const setCategoryId = useCreateStore((state) => state.setCategoryId);
  const setInstruction = useCreateStore((state) => state.setInstruction);
  const setMode = useCreateStore((state) => state.setMode);
  const setSourceImage = useCreateStore((state) => state.setSourceImage);
  const generation = useGenerate('edit');
  const categoriesQuery = useCategories();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const hasResult =
    generation.job?.status === 'succeeded' && Boolean(generation.job.resultImageUrl);
  const isStyleComplete = hasResult && mode === 'style';

  useEffect(() => {
    if (isStyleComplete) {
      void queryClient.invalidateQueries({ queryKey: ['presets'] });
    }
  }, [isStyleComplete, queryClient]);

  async function run(modeToRun: ExistingImageMode, requestedInstruction?: string) {
    if (!sourceImageUrl || !sourceImageKey) {
      return;
    }
    const account = getAccountSession();
    if (!isCurrentAccount(account)) return;
    let resolvedCategoryId = categoryId;
    try {
      if (!resolvedCategoryId && category.trim()) {
        const response = await categoriesQuery.createCategory(category.trim());
        if (!isCurrentAccount(account)) return;
        resolvedCategoryId = response.category.id;
        setCategoryId(resolvedCategoryId);
      }
    } catch {
      return;
    }
    if (!resolvedCategoryId) return;
    const defaultInstruction =
      modeToRun === 'outpaint'
        ? 'Extend the image to fit my screen naturally.'
        : modeToRun === 'upscale'
          ? 'Improve the image quality and preserve all visual details.'
          : modeToRun === 'style'
            ? 'Extract a reusable wallpaper style from this image.'
            : instruction;
    generation.generate({
      categoryId: resolvedCategoryId,
      height: deviceSize.targetHeight,
      mode: modeToRun,
      quality: 'hd',
      sourceImageKey,
      userInputs: {
        idea: requestedInstruction ?? defaultInstruction,
      },
      width: deviceSize.targetWidth,
    });
  }

  if (hasResult && generation.job) {
    if (isStyleComplete) {
      return (
        <ThemedView variant="card" style={{ gap: spacing.sm }}>
          <ThemedText variant="subtitle">
            <Trans>Custom preset saved</Trans>
          </ThemedText>
          <ThemedText style={{ color: theme.mutedText }} variant="body">
            <Trans>Select it from the preset list above to generate another wallpaper.</Trans>
          </ThemedText>
          <Button
            icon="refresh"
            label={t`Extract another style`}
            onPress={generation.regenerate}
            variant="secondary"
          />
        </ThemedView>
      );
    }
    return (
      <ResultView
        job={generation.job}
        onCreateNew={resetCreateWallpaperSession}
        onRegenerate={generation.regenerate}
      />
    );
  }

  return (
    <ThemedView variant="card" style={{ gap: spacing.lg }}>
      <ImagePickerEntry onUploaded={setSourceImage} sourceImageUrl={sourceImageUrl} />
      <View style={{ gap: spacing.sm }}>
        <ThemedText variant="label">
          <Trans>Save to category</Trans>
        </ThemedText>
        <TextInput
          accessibilityLabel={t`Wallpaper category`}
          maxLength={100}
          onChangeText={(value) => {
            setCategory(value);
            setCategoryId(undefined);
          }}
          placeholder={t`For example: Quiet nights`}
          placeholderTextColor={theme.mutedText}
          style={{
            borderColor: theme.border,
            borderRadius: radius.md,
            borderWidth: 1,
            color: theme.text,
            minHeight: 50,
            paddingHorizontal: spacing.md,
          }}
          value={category}
        />
        {categoriesQuery.categories.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {categoriesQuery.categories.map((item) => {
              const selected = item.id === categoryId;
              return (
                <Button
                  key={item.id}
                  label={item.name}
                  onPress={() => {
                    setCategory(item.name);
                    setCategoryId(item.id);
                  }}
                  size="sm"
                  variant={selected ? 'primary' : 'secondary'}
                />
              );
            })}
          </View>
        ) : null}
        {categoriesQuery.createCategoryError ? (
          <ErrorState
            message={categoriesQuery.createCategoryError}
            onRetry={() => {
              if (mode) void run(mode);
            }}
          />
        ) : null}
      </View>
      {sourceImageUrl ? <EditModePicker onSelect={setMode} selectedMode={mode} /> : null}
      {mode === 'edit' ? (
        <View style={{ gap: spacing.sm }}>
          <ThemedText variant="subtitle">
            <Trans>What would you like to change?</Trans>
          </ThemedText>
          <TextInput
            multiline
            onChangeText={setInstruction}
            placeholder={t`For example: turn the sky into a sunset and keep the people and buildings`}
            placeholderTextColor={theme.mutedText}
            style={{
              borderColor: theme.border,
              borderCurve: 'continuous',
              borderRadius: radius.md,
              borderWidth: 1,
              color: theme.text,
              minHeight: 96,
              padding: spacing.md,
            }}
            value={instruction}
          />
          <ActionButton
            disabled={
              !category.trim() ||
              !instruction.trim() ||
              generation.isGenerating ||
              categoriesQuery.isCreatingCategory
            }
            label={t`Start editing`}
            onPress={() => void run('edit')}
          />
        </View>
      ) : null}
      {mode === 'style' ? (
        <StyleToPresetForm
          disabled={!category.trim() || categoriesQuery.isCreatingCategory}
          instruction={instruction}
          isSubmitting={generation.isGenerating}
          onChangeInstruction={setInstruction}
          onSubmit={(value) => void run('style', value)}
        />
      ) : null}
      {mode === 'outpaint' || mode === 'upscale' ? (
        <ActionButton
          disabled={
            !category.trim() || generation.isGenerating || categoriesQuery.isCreatingCategory
          }
          label={mode === 'outpaint' ? t`Extend to screen ratio` : t`Enhance wallpaper`}
          onPress={() => void run(mode)}
        />
      ) : null}
      {generation.isGenerating ? <LoadingState label={t`Processing your image…`} /> : null}
      {generation.error ? (
        <ErrorState message={generation.error} onRetry={generation.retry} />
      ) : null}
    </ThemedView>
  );
}

function ActionButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return <Button disabled={disabled} label={label} onPress={onPress} />;
}
