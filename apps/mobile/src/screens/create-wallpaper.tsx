import { Trans, useLingui } from '@lingui/react/macro';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Collapsible, Host } from '@expo/ui';
import { useRouter } from 'expo-router';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/feedback';
import { ExistingImageEditor } from '@/screens/existing-image-editor';
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
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import { useDeviceSize } from '@/lib/useDeviceSize';
import { useCreateStore } from '@/stores/create-store';
import { usePresets } from '@/hooks/use-presets';
import { getAccountSession, isCurrentAccount } from '@/lib/account-session';
import { resetCreateWallpaperSession } from '@/lib/create-wallpaper-session';

export function CreateWallpaperScreen({ onClose }: { onClose: () => void }) {
  const { t } = useLingui();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const deviceSize = useDeviceSize();
  const category = useCreateStore((state) => state.category);
  const categoryId = useCreateStore((state) => state.categoryId);
  const chipValues = useCreateStore((state) => state.chipValues);
  const idea = useCreateStore((state) => state.idea);
  const presetId = useCreateStore((state) => state.presetId);
  const quality = useCreateStore((state) => state.quality);
  const setCategory = useCreateStore((state) => state.setCategory);
  const setCategoryId = useCreateStore((state) => state.setCategoryId);
  const setChip = useCreateStore((state) => state.setChip);
  const setIdea = useCreateStore((state) => state.setIdea);
  const setPresetId = useCreateStore((state) => state.setPresetId);
  const setQuality = useCreateStore((state) => state.setQuality);
  const generation = useGenerate();
  const categoriesQuery = useCategories();
  const presetsQuery = usePresets();
  const validPreset =
    presetsQuery.isSuccess && presetsQuery.data.presets.some((preset) => preset.id === presetId);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  useEffect(() => {
    if (presetsQuery.isSuccess && !validPreset) setPresetId(presetsQuery.data.presets[0]?.id);
  }, [presetsQuery.data, presetsQuery.isSuccess, setPresetId, validPreset]);
  const trimmedCategory = category.trim();
  const trimmedIdea = idea.trim();
  const generationSucceeded =
    generation.job?.status === 'succeeded' && Boolean(generation.job.resultImageUrl);

  useEffect(() => {
    if (generationSucceeded) {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallpapers'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ]);
    }
  }, [generationSucceeded, queryClient]);

  function updateChip(field: CreateChipField, value: string | undefined) {
    setChip(field, value);
  }

  async function generateWallpaper() {
    const account = getAccountSession();
    if (!isCurrentAccount(account) || !validPreset || !trimmedIdea || !trimmedCategory) return;
    let resolvedCategoryId = categoryId;
    try {
      if (!resolvedCategoryId) {
        const response = await categoriesQuery.createCategory(trimmedCategory);
        if (!isCurrentAccount(account)) return;
        resolvedCategoryId = response.category.id;
        setCategoryId(resolvedCategoryId);
      }
    } catch {
      // The category mutation displays its error and offers retry.
      return;
    }

    generation.generate({
      categoryId: resolvedCategoryId,
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
            {showEditor ? (
              <Trans>Edit an existing image.</Trans>
            ) : (
              <Trans>Put the idea into words.</Trans>
            )}
          </ThemedText>
          <ThemedText style={{ color: theme.mutedText }} variant="caption">
            {showEditor ? (
              <Trans>
                Upload an image, choose an operation, and save the result to your library.
              </Trans>
            ) : (
              <Trans>Choose a starting point, then describe what you want to see.</Trans>
            )}
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
        <ResultView
          onRetryImage={generation.refreshImage}
          job={generation.job}
          onRegenerate={generation.canRegenerate ? generation.regenerate : undefined}
          onCreateNew={resetCreateWallpaperSession}
          onViewCategory={() =>
            router.replace({
              pathname: '/category/[category]',
              params: { category: generation.job?.categoryId ?? '' },
            })
          }
          onViewWallpaper={() =>
            router.replace({
              pathname: '/category/[category]/[wallpaperId]',
              params: {
                category: generation.job?.categoryId ?? '',
                wallpaperId: generation.job?.wallpaperId ?? '',
              },
            })
          }
        />
      ) : (
        <View style={{ gap: spacing.lg }}>
          {showEditor ? (
            <>
              <Pressable
                accessibilityLabel={t`Back to text-to-image creation`}
                accessibilityRole="button"
                onPress={() => setShowEditor(false)}
                style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.xs }}
              >
                <AppIcon color={theme.primary} name="arrow-left" size={18} />
                <ThemedText style={{ color: theme.primary }} variant="label">
                  <Trans>Back to text creation</Trans>
                </ThemedText>
              </Pressable>
              <ExistingImageEditor deviceSize={deviceSize} />
            </>
          ) : (
            <>
              <PresetGrid onSelect={setPresetId} selectedPresetId={presetId} />
              <Pressable
                accessibilityLabel={t`Edit an existing image`}
                accessibilityRole="button"
                onPress={() => setShowEditor(true)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  borderColor: theme.border,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: spacing.sm,
                  opacity: pressed ? 0.75 : 1,
                  padding: spacing.md,
                })}
              >
                <AppIcon color={theme.primary} name="edit" size={18} />
                <ThemedText style={{ flex: 1 }} variant="label">
                  <Trans>Edit an existing image</Trans>
                </ThemedText>
                <ThemedText style={{ color: theme.mutedText }} variant="caption">
                  <Trans>Open editor</Trans>
                </ThemedText>
              </Pressable>
              <IdeaInput onChangeText={setIdea} value={idea} />
              <View style={{ gap: spacing.sm }}>
                <ThemedText variant="label">
                  <Trans>Save to category</Trans>
                </ThemedText>
                <TextInput
                  accessibilityLabel={t`Wallpaper category`}
                  autoCapitalize="sentences"
                  maxLength={100}
                  onChangeText={(value) => {
                    setCategory(value);
                    setCategoryId(undefined);
                  }}
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
                {categoriesQuery.categories.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                    {categoriesQuery.categories.map((item) => {
                      const selected = item.id === categoryId;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          key={item.id}
                          onPress={() => {
                            setCategory(item.name);
                            setCategoryId(item.id);
                          }}
                          style={{
                            backgroundColor: selected ? theme.primary : theme.surface,
                            borderColor: selected ? theme.primary : theme.border,
                            borderRadius: radius.full,
                            borderWidth: 1,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                          }}
                        >
                          <ThemedText
                            style={{ color: selected ? theme.primaryForeground : theme.text }}
                            variant="caption"
                          >
                            {item.name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
                {categoriesQuery.createCategoryError ? (
                  <ErrorState
                    message={categoriesQuery.createCategoryError}
                    onRetry={() => void generateWallpaper()}
                  />
                ) : null}
              </View>
              <Host matchContents>
                <Collapsible
                  isOpen={advancedOpen}
                  onOpenChange={setAdvancedOpen}
                  label={t`Advanced options`}
                />
              </Host>
              {advancedOpen ? (
                <View style={{ gap: spacing.md }}>
                  <ChipsSelector onChange={updateChip} values={chipValues} />
                  <QualitySelector onChange={setQuality} value={quality} />
                </View>
              ) : null}
              {generation.cooldownSeconds > 0 && !generation.isGenerating ? (
                <ThemedText style={{ color: theme.mutedText }} variant="caption">
                  <Trans>Try again in {generation.cooldownSeconds} seconds.</Trans>
                </ThemedText>
              ) : null}
              {generation.error ? (
                <ErrorState message={generation.error} onRetry={generation.retry} />
              ) : null}
              {generation.jobId && !generation.isGenerating ? (
                <Pressable accessibilityRole="button" onPress={resetCreateWallpaperSession}>
                  <ThemedText variant="label">
                    <Trans>Create a new wallpaper</Trans>
                  </ThemedText>
                </Pressable>
              ) : null}
              <GenerateButton
                disabled={
                  !trimmedIdea ||
                  !validPreset ||
                  !trimmedCategory ||
                  generation.isGenerating ||
                  categoriesQuery.isCreatingCategory ||
                  generation.cooldownSeconds > 0
                }
                isGenerating={generation.isGenerating}
                onPress={generateWallpaper}
              />
            </>
          )}
        </View>
      )}
    </BottomSheetScrollView>
  );
}
