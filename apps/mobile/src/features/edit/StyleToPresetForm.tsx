import { Trans, useLingui } from '@lingui/react/macro';
import { TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StyleToPresetFormProps = {
  instruction: string;
  isSubmitting: boolean;
  onChangeInstruction: (instruction: string) => void;
  onSubmit: (instruction: string) => void;
};

export function StyleToPresetForm({
  instruction,
  isSubmitting,
  onChangeInstruction,
  onSubmit,
}: StyleToPresetFormProps) {
  const { t } = useLingui();
  const theme = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <ThemedText variant="subtitle">
        <Trans>Extract style</Trans>
      </ThemedText>
      <ThemedText style={{ color: theme.mutedText }} variant="caption">
        <Trans>Analyze color, composition, and texture to save a private creative preset.</Trans>
      </ThemedText>
      <TextInput
        editable={!isSubmitting}
        onChangeText={onChangeInstruction}
        placeholder={t`Optional: describe the details you want to preserve`}
        placeholderTextColor={theme.mutedText}
        style={{
          borderColor: theme.border,
          borderCurve: 'continuous',
          borderRadius: radius.md,
          borderWidth: 1,
          color: theme.text,
          minHeight: 52,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
        testID="style-preset-instruction"
        value={instruction}
      />
      <Button
        disabled={isSubmitting}
        label={isSubmitting ? t`Extracting…` : t`Save custom preset`}
        loading={isSubmitting}
        onPress={() =>
          onSubmit(instruction || 'Extract a reusable wallpaper style from this image.')
        }
        testID="extract-style-preset"
      />
    </View>
  );
}
