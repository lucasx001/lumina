import { useSignIn } from '@clerk/expo';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { AuthScreenLayout, AuthTextField } from '@/components/auth';
import { radius } from '@/constants/theme';
import { getAuthFlowError, throwIfClerkError } from '@/lib/clerk-flow-error';
import { useAuth as useAppAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useSignInStore } from '@/stores/sign-in-store';

export function SignInScreen() {
  const { errors, fetchStatus, signIn } = useSignIn();
  const { isSigningIn: isGoogleLoading, signInWithGoogle } = useAppAuth();
  const { emailAddress, password, reset, setEmailAddress, setPassword } = useSignInStore();
  const { t } = useLingui();
  const router = useRouter();
  const theme = useTheme();
  const busy = fetchStatus === 'fetching';
  const fallbackError = t`Sign-in failed.`;

  useEffect(() => {
    reset();
    return reset;
  }, [reset]);

  const setError = (message: string) => {
    Toast.show({ text1: message, type: 'error' });
  };

  const finalizeIfComplete = async () => {
    if (signIn.status !== 'complete') {
      return false;
    }

    const { error } = await signIn.finalize();
    throwIfClerkError(error);
    reset();
    return true;
  };

  const submitCredentials = async () => {
    if (!emailAddress.trim() || !password) {
      setError(t`Enter your email and password.`);
      return;
    }

    try {
      const { error } = await signIn.password({ emailAddress: emailAddress.trim(), password });
      throwIfClerkError(error);
      if (await finalizeIfComplete()) {
        return;
      }

      throw new Error(fallbackError);
    } catch (reason) {
      setError(getAuthFlowError(reason, fallbackError));
    }
  };

  return (
    <AuthScreenLayout
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/sign-up')}
          style={({ pressed }) => ({ minHeight: 44, opacity: pressed ? 0.7 : 1, padding: 10 })}
        >
          <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }} variant="caption">
            <Trans>Don't have an account? </Trans>
            <ThemedText style={{ color: theme.text, fontWeight: '600' }} variant="caption">
              <Trans>Sign up</Trans>
            </ThemedText>
          </ThemedText>
        </Pressable>
      }
      description={t`Log in to find your wallpaper categories, creative history, and preferences.`}
      googleAccessibilityLabel={t`Continue with Google`}
      googleLoading={isGoogleLoading}
      kicker={t`Welcome back`}
      onGooglePress={() => void signInWithGoogle()}
      title={t`Let the idea keep growing.`}
    >
      <AuthTextField
        autoCapitalize="none"
        autoComplete="email"
        error={errors.fields.identifier?.message}
        keyboardType="email-address"
        label={t`Email`}
        onChangeText={setEmailAddress}
        placeholder={t`Your email address`}
        returnKeyType="next"
        testID="sign-in-email"
        textContentType="emailAddress"
        value={emailAddress}
      />
      <AuthTextField
        autoComplete="current-password"
        error={errors.fields.password?.message}
        label={t`Password`}
        onChangeText={setPassword}
        onSubmitEditing={() => void submitCredentials()}
        placeholder={t`Password`}
        returnKeyType="done"
        secureTextEntry
        testID="sign-in-password"
        textContentType="password"
        value={password}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/password-reset')}
        style={({ pressed }) => ({
          alignSelf: 'flex-end',
          minHeight: 44,
          opacity: pressed ? 0.7 : 1,
          paddingVertical: 10,
        })}
      >
        <ThemedText style={{ color: theme.mutedText }} variant="caption">
          <Trans>Forgot password?</Trans>
        </ThemedText>
      </Pressable>
      <Button
        disabled={busy}
        fullWidth
        label={t`Log in`}
        loading={busy}
        onPress={() => void submitCredentials()}
        style={{ borderRadius: radius.md, minHeight: 52 }}
        testID="sign-in-submit"
      />
    </AuthScreenLayout>
  );
}
