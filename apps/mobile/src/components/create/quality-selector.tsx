import { Trans, useLingui } from '@lingui/react/macro';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GenerationQuality } from '@/lib/api';

type QualitySelectorProps = {
  onChange: (quality: GenerationQuality) => void;
  value: GenerationQuality;
};

export function QualitySelector({ onChange, value }: QualitySelectorProps) {
  const { t } = useLingui();
  const theme = useTheme();
  const qualityOptions: Array<{
    description: string;
    label: string;
    value: GenerationQuality;
  }> = [
    {
      description: t`Faster and lower resolution, ideal for iterating on ideas`,
      label: t`Quick preview`,
      value: 'draft',
    },
    {
      description: t`Full 2K+ resolution, ideal for saving and applying`,
      label: t`High resolution`,
      value: 'hd',
    },
  ];

  return (
    <View style={{ gap: spacing.sm }}>
      <ThemedText variant="subtitle">
        <Trans>Output quality</Trans>
      </ThemedText>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {qualityOptions.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({
                backgroundColor: selected ? theme.primary : theme.surface,
                borderColor: selected ? theme.primary : theme.border,
                borderCurve: 'continuous',
                borderRadius: radius.md,
                borderWidth: selected ? 2 : 1,
                flex: 1,
                gap: spacing.xs,
                minHeight: 92,
                opacity: pressed ? 0.86 : 1,
                padding: spacing.md,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              })}
              testID={`quality-${option.value}`}
            >
              <ThemedText
                style={{ color: selected ? theme.primaryForeground : theme.text }}
                variant="body"
              >
                {option.label}
              </ThemedText>
              <ThemedText
                style={{ color: selected ? theme.primaryForeground : theme.mutedText }}
                variant="caption"
              >
                {option.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
