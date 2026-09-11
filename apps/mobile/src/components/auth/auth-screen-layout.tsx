import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/constants/theme';
import { GoogleSignInButton } from './google-sign-in-button';
import { useTheme } from '@/hooks/use-theme';

type AuthScreenLayoutProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  googleAccessibilityLabel?: string;
  googleLoading?: boolean;
  introTop?: number;
  kicker: string;
  legalNote?: ReactNode;
  onGooglePress?: () => void;
  resetArt?: boolean;
  showGoogle?: boolean;
  socialLabel?: string;
  title: string;
};

export function AuthScreenLayout({
  children,
  description,
  footer,
  googleAccessibilityLabel = '',
  googleLoading = false,
  introTop = 76,
  kicker,
  legalNote,
  onGooglePress = () => {},
  resetArt = false,
  showGoogle = false,
  socialLabel = '',
  title,
}: AuthScreenLayoutProps) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ backgroundColor: theme.background, flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{
            alignSelf: 'center',
            flexGrow: 1,
            maxWidth: 430,
            paddingBottom: spacing.lg,
            paddingHorizontal: 24,
            paddingTop: 28,
            width: '100%',
          }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontSize: 24, fontWeight: '700', lineHeight: 30 }} variant="title">
              Lumina
            </ThemedText>
            {resetArt ? (
              <View
                style={{
                  backgroundColor: theme.muted,
                  borderColor: theme.border,
                  borderCurve: 'continuous',
                  borderRadius: 22,
                  borderWidth: 1,
                  height: 112,
                  marginBottom: 28,
                  marginTop: 85,
                  position: 'relative',
                  transform: [{ rotate: '-3deg' }],
                  width: 92,
                }}
              >
                <View
                  style={{
                    borderColor: theme.primary,
                    borderRadius: 999,
                    borderWidth: 1,
                    bottom: 20,
                    left: 20,
                    position: 'absolute',
                    right: 20,
                    top: 20,
                  }}
                />
              </View>
            ) : null}
            <View style={{ marginTop: resetArt ? 0 : introTop }}>
              <ThemedText
                style={{ color: theme.accent, fontFamily: theme.fontFamily, letterSpacing: 1.2 }}
                variant="caption"
              >
                {kicker}
              </ThemedText>
              <ThemedText
                style={{ fontSize: 42, letterSpacing: -1, lineHeight: 43, marginTop: 10 }}
                variant="display"
              >
                {title}
              </ThemedText>
              <ThemedText
                style={{ color: theme.mutedText, fontSize: 14, lineHeight: 22, marginTop: 14 }}
                variant="body"
              >
                {description}
              </ThemedText>
            </View>

            <View style={{ gap: 18, marginTop: 34 }}>{children}</View>
            {legalNote ? <View style={{ marginTop: 12 }}>{legalNote}</View> : null}

            <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: 'auto' }}>
              {footer}
            </View>
            {showGoogle ? (
              <>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ backgroundColor: theme.border, flex: 1, height: 1 }} />
                  <ThemedText style={{ color: theme.mutedText }} variant="caption">
                    {socialLabel}
                  </ThemedText>
                  <View style={{ backgroundColor: theme.border, flex: 1, height: 1 }} />
                </View>
                <GoogleSignInButton
                  accessibilityLabel={googleAccessibilityLabel}
                  iconOnly
                  isLoading={googleLoading}
                  onPress={onGooglePress}
                />
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
