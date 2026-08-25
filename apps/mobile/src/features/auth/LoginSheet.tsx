import { Trans, useLingui } from '@lingui/react/macro';
import { Modal, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { GoogleSignInButton } from './GoogleSignInButton';

export type LoginSheetProps = {
  error?: Error;
  isLoading?: boolean;
  onDismiss: () => void;
  onGoogleSignIn: () => void;
  visible: boolean;
};

export function LoginSheet({
  error,
  isLoading = false,
  onDismiss,
  onGoogleSignIn,
  visible,
}: LoginSheetProps) {
  const { t } = useLingui();
  const theme = useTheme();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        style={{
          backgroundColor: theme.overlay,
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Pressable accessibilityLabel={t`Close sign-in`} onPress={onDismiss} style={{ flex: 1 }} />
        <ThemedView
          variant="card"
          style={{
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            gap: spacing.lg,
            padding: spacing.lg,
            paddingBottom: 36,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              backgroundColor: theme.primary,
              borderRadius: radius.full,
              height: 4,
              width: 40,
            }}
          />
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: theme.primary,
                borderRadius: radius.full,
                height: 64,
                justifyContent: 'center',
                width: 64,
              }}
            >
              <ThemedText style={{ color: theme.primaryForeground }} variant="title">
                L
              </ThemedText>
            </View>
            <View style={{ gap: 6 }}>
              <ThemedText style={{ textAlign: 'center' }} variant="title">
                <Trans>Connect your creative space</Trans>
              </ThemedText>
              <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }} variant="body">
                <Trans>
                  Sign in with Google to merge this device history into your account and keep
                  creating anywhere.
                </Trans>
              </ThemedText>
            </View>
          </View>
          {error ? (
            <ThemedText style={{ color: theme.error }} variant="caption">
              {error.message}
            </ThemedText>
          ) : null}
          <GoogleSignInButton isLoading={isLoading} onPress={onGoogleSignIn} />
          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => ({
              alignSelf: 'center',
              minHeight: 44,
              opacity: pressed ? 0.65 : 1,
              padding: spacing.sm,
            })}
          >
            <ThemedText style={{ color: theme.mutedText }} variant="caption">
              <Trans>Not now</Trans>
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}
