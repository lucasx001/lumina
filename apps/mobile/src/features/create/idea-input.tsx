import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type IdeaInputProps = {
  onChangeText: (value: string) => void;
  value: string;
};

export function IdeaInput({ onChangeText, value }: IdeaInputProps) {
  const { t } = useLingui();
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <ThemedText variant="subtitle">
          <Trans>Describe your idea</Trans>
        </ThemedText>
        <ThemedText
          style={{ color: theme.mutedText, fontVariant: ['tabular-nums'] }}
          variant="caption"
        >
          {value.length}/1000
        </ThemedText>
      </View>
      <TextInput
        accessibilityLabel={t`Wallpaper idea`}
        maxLength={1_000}
        onBlur={() => setIsFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        placeholder={t`For example: a neon city on a rainy night`}
        placeholderTextColor={theme.mutedText}
        multiline
        returnKeyType="default"
        selectionColor={theme.primary}
        textAlignVertical="top"
        style={{
          backgroundColor: theme.surface,
          borderColor: isFocused ? theme.primary : theme.border,
          borderCurve: 'continuous',
          borderRadius: radius.md,
          borderWidth: isFocused ? 2 : 1,
          color: theme.text,
          fontFamily: theme.fontFamily,
          fontSize: 16,
          lineHeight: 23,
          minHeight: 120,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        }}
        value={value}
      />
    </View>
  );
}
