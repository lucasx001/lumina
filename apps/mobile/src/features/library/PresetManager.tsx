import { Trans } from '@lingui/react/macro';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function PresetManager() {
  const theme = useTheme();

  return (
    <ThemedView variant="card" style={{ gap: spacing.sm, padding: spacing.md }}>
      <View style={{ gap: 2 }}>
        <ThemedText variant="subtitle">
          <Trans>Custom presets</Trans>
        </ThemedText>
        <ThemedText style={{ color: theme.mutedText }} variant="caption">
          <Trans>Styles extracted from your favorite wallpapers will appear here.</Trans>
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        disabled
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          borderRadius: radius.sm,
          minHeight: 44,
          justifyContent: 'center',
          opacity: pressed ? 0.4 : 0.55,
          paddingHorizontal: spacing.sm,
        })}
        testID="preset-manager-placeholder"
      >
        <ThemedText style={{ color: theme.mutedText }} variant="body">
          <Trans>No custom presets yet</Trans>
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}
