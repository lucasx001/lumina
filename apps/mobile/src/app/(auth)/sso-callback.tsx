import { Trans } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export default function SsoCallbackScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{
        alignItems: 'center',
        backgroundColor: theme.background,
        flex: 1,
        gap: 16,
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <ActivityIndicator color={theme.primary} size="large" />
      <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }} variant="body">
        <Trans>Completing Google sign-in…</Trans>
      </ThemedText>
    </SafeAreaView>
  );
}
