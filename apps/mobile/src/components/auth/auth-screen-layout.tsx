import { useLingui } from '@lingui/react/macro';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { spacing } from '@/constants/theme';
import { GoogleSignInButton } from './google-sign-in-button';
import { useTheme } from '@/hooks/use-theme';

type AuthScreenLayoutProps = {
  children: ReactNode;
  footer: ReactNode;
  googleAccessibilityLabel?: string;
  googleLoading?: boolean;
  onGooglePress?: () => void;
  showGoogle?: boolean;
  socialLabel?: string;
  title: string;
};

export function AuthScreenLayout({
  children,
  footer,
  googleAccessibilityLabel = '',
  googleLoading = false,
  onGooglePress = () => {},
  showGoogle = true,
  socialLabel = '',
  title,
}: AuthScreenLayoutProps) {
  const { t } = useLingui();
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
            paddingBottom: spacing.xl,
            paddingHorizontal: 36,
            paddingTop: spacing.xxl,
            width: '100%',
          }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        >
          <View style={{ alignItems: 'center' }}>
            <Image
              accessibilityLabel={t`Lumina`}
              contentFit="contain"
              source={require('../../../assets/images/splash-icon.png')}
              style={{ height: 150, width: 170 }}
            />
            <ThemedText style={{ fontSize: 34, lineHeight: 44, marginTop: -8 }} variant="title">
              {title}
            </ThemedText>
          </View>

          <View style={{ gap: spacing.lg, marginTop: spacing.xxl }}>{children}</View>

          <View style={{ alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg }}>
            {footer}
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
