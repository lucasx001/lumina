import { Trans, useLingui } from '@lingui/react/macro';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GenerationMode } from '@/lib/api';

export type ExistingImageMode = Exclude<GenerationMode, 'text2img'>;

type EditModePickerProps = {
  onSelect: (mode: ExistingImageMode) => void;
  selectedMode?: ExistingImageMode;
};

export function EditModePicker({ onSelect, selectedMode }: EditModePickerProps) {
  const { t } = useLingui();
  const theme = useTheme();
  const modes: Array<{ description: string; label: string; value: ExistingImageMode }> = [
    {
      description: t`Fill your screen`,
      label: t`Extend`,
      value: 'outpaint',
    },
    {
      description: t`Enhance clarity and detail`,
      label: t`Enhance`,
      value: 'upscale',
    },
    {
      description: t`Change with a prompt`,
      label: t`Edit`,
      value: 'edit',
    },
    {
      description: t`Save as a creative preset`,
      label: t`Extract style`,
      value: 'style',
    },
  ];

  return (
    <View style={{ gap: spacing.sm }}>
      <ThemedText variant="subtitle">
        <Trans>Choose an action</Trans>
      </ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {modes.map((mode) => {
          const selected = selectedMode === mode.value;
          return (
            <Pressable
              key={mode.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(mode.value)}
              style={({ pressed }) => ({
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
                borderCurve: 'continuous',
                borderRadius: radius.md,
                borderWidth: selected ? 2 : 1,
                gap: spacing.xs,
                minHeight: 92,
                opacity: pressed ? 0.86 : 1,
                padding: spacing.md,
                transform: [{ scale: pressed ? 0.985 : 1 }],
                width: '47%',
              })}
              testID={`edit-mode-${mode.value}`}
            >
              <ThemedText
                style={{ color: selected ? theme.primaryForeground : theme.text }}
                variant="body"
              >
                {mode.label}
              </ThemedText>
              <ThemedText
                style={{ color: selected ? theme.primaryForeground : theme.mutedText }}
                variant="caption"
              >
                {mode.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
