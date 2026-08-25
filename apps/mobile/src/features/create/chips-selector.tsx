import { useLingui } from '@lingui/react/macro';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GenerationUserInputs } from '@/lib/api';

export type CreateChipField = 'mood' | 'theme' | 'tone';
export type CreateChipValues = Pick<GenerationUserInputs, CreateChipField>;

type ChipsSelectorProps = {
  onChange: (field: CreateChipField, value: string | undefined) => void;
  values: CreateChipValues;
};

export function ChipsSelector({ onChange, values }: ChipsSelectorProps) {
  const { t } = useLingui();
  const theme = useTheme();
  const chipGroups: Array<{
    field: CreateChipField;
    label: string;
    options: Array<{ label: string; value: string }>;
  }> = [
    {
      field: 'theme',
      label: t`Theme`,
      options: [
        { label: t`Nature`, value: 'nature' },
        { label: t`City`, value: 'city' },
        { label: t`Space`, value: 'space' },
        {
          label: t`Abstract`,
          value: 'abstract',
        },
      ],
    },
    {
      field: 'tone',
      label: t`Color tone`,
      options: [
        { label: t`Warm`, value: 'warm' },
        { label: t`Cool`, value: 'cool' },
        { label: t`Soft`, value: 'soft' },
        {
          label: t`High contrast`,
          value: 'high-contrast',
        },
      ],
    },
    {
      field: 'mood',
      label: t`Mood`,
      options: [
        { label: t`Calm`, value: 'calm' },
        {
          label: t`Mysterious`,
          value: 'mysterious',
        },
        {
          label: t`Energetic`,
          value: 'energetic',
        },
        { label: t`Dreamy`, value: 'dreamy' },
      ],
    },
  ];

  return (
    <View style={{ gap: spacing.lg }}>
      {chipGroups.map(({ field, label, options }) => (
        <View key={field} style={{ gap: spacing.sm }}>
          <ThemedText variant="subtitle">{label}</ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {options.map((option) => {
              const selected = values[field] === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onChange(field, selected ? undefined : option.value)}
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
                  testID={`chip-${field}-${option.value}`}
                >
                  <ThemedText
                    style={{ color: selected ? theme.primaryForeground : theme.text }}
                    variant="caption"
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
