import { useSignUp } from '@clerk/expo';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { AuthScreenLayout } from '@/features/auth/auth-screen-layout';
import { AuthTextField } from '@/features/auth/auth-text-field';
import { getAuthFlowError, throwIfClerkError } from '@/features/auth/clerk-flow-error';
import { useAuth as useAppAuth } from '@/features/auth/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { useSignUpStore } from '@/stores/sign-up-store';

export function SignUpScreen() {
  const { errors, fetchStatus, signUp } = useSignUp();
  const { isSigningIn: isGoogleLoading, signInWithGoogle } = useAppAuth();
  const {
    code,
    confirmPassword,
    emailAddress,
    isVerifying,
    password,
    reset,
    setCode,
    setConfirmPassword,
    setEmailAddress,
    setIsVerifying,
    setPassword,
  } = useSignUpStore();
  const { t } = useLingui();
  const router = useRouter();
  const theme = useTheme();
  const busy = fetchStatus === 'fetching';
  const fallbackError = t`Sign-up failed.`;

  useEffect(() => {
    reset();
    return reset;
  }, [reset]);

  const setError = (message: string) => {
    Toast.show({ text1: message, type: 'error' });
  };

  const finalizeIfComplete = async () => {
    if (signUp.status !== 'complete') {
      return false;
    }

    const { error } = await signUp.finalize();
    throwIfClerkError(error);
    reset();
    return true;
  };

  const submitSignUp = async () => {
    if (!emailAddress.trim() || !password) {
      setError(t`Enter your email and password.`);
      return;
    }
    if (password !== confirmPassword) {
      setError(t`Passwords do not match.`);
      return;
    }

    try {
      const { error } = await signUp.password({ emailAddress: emailAddress.trim(), password });
      throwIfClerkError(error);
      if (await finalizeIfComplete()) {
        return;
      }

      const { error: verificationError } = await signUp.verifications.sendEmailCode();
      throwIfClerkError(verificationError);
      setCode('');
      setIsVerifying(true);
    } catch (reason) {
      setError(getAuthFlowError(reason, fallbackError));
    }
  };

  const verifyEmail = async () => {
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      throwIfClerkError(error);
      if (!(await finalizeIfComplete())) {
        throw new Error(fallbackError);
      }
    } catch (reason) {
      setError(getAuthFlowError(reason, fallbackError));
    }
  };

  const startOver = async () => {
    const { error } = await signUp.reset();
    throwIfClerkError(error);
    setCode('');
    setIsVerifying(false);
  };

  return (
    <AuthScreenLayout
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/sign-in')}
          style={({ pressed }) => ({ minHeight: 44, opacity: pressed ? 0.7 : 1, padding: 10 })}
        >
          <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }} variant="caption">
            <Trans>Already have an account? </Trans>
            <ThemedText style={{ color: theme.text, fontWeight: '600' }} variant="caption">
              <Trans>Log in</Trans>
            </ThemedText>
          </ThemedText>
        </Pressable>
      }
      googleAccessibilityLabel={t`Sign up with Google`}
      googleLoading={isGoogleLoading}
      onGooglePress={() => void signInWithGoogle()}
      socialLabel={t`Or sign up with`}
      title={isVerifying ? t`Verify email` : t`Sign up`}
    >
      {isVerifying ? (
        <>
          <ThemedText style={{ color: theme.mutedText }} variant="body">
            <Trans>We sent a verification code to {emailAddress}.</Trans>
          </ThemedText>
          <AuthTextField
            autoComplete="one-time-code"
            error={errors.fields.code?.message}
            keyboardType="number-pad"
            label={t`Verification code`}
            onChangeText={setCode}
            onSubmitEditing={() => void verifyEmail()}
            placeholder={t`Enter code`}
            returnKeyType="done"
            testID="sign-up-verification-code"
            textContentType="oneTimeCode"
            value={code}
          />
          <Button
            disabled={busy || !code.trim()}
            fullWidth
            label={t`Verify`}
            loading={busy}
            onPress={() => void verifyEmail()}
            testID="sign-up-verify"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => void startOver()}
            style={({ pressed }) => ({
              alignSelf: 'center',
              minHeight: 44,
              opacity: pressed ? 0.7 : 1,
              padding: 10,
            })}
          >
            <ThemedText style={{ color: theme.mutedText }} variant="caption">
              <Trans>Use a different email</Trans>
            </ThemedText>
          </Pressable>
        </>
      ) : (
        <>
          <AuthTextField
            autoCapitalize="none"
            autoComplete="email"
            error={errors.fields.emailAddress?.message}
            keyboardType="email-address"
            label={t`Email`}
            onChangeText={setEmailAddress}
            placeholder={t`Your email address`}
            returnKeyType="next"
            testID="sign-up-email"
            textContentType="emailAddress"
            value={emailAddress}
          />
          <AuthTextField
            autoComplete="new-password"
            error={errors.fields.password?.message}
            label={t`Password`}
            onChangeText={setPassword}
            placeholder={t`Create password`}
            returnKeyType="next"
            secureTextEntry
            testID="sign-up-password"
            textContentType="newPassword"
            value={password}
          />
          <AuthTextField
            autoComplete="new-password"
            label={t`Confirm password`}
            onChangeText={setConfirmPassword}
            onSubmitEditing={() => void submitSignUp()}
            placeholder={t`Repeat password`}
            returnKeyType="done"
            secureTextEntry
            testID="sign-up-confirm-password"
            textContentType="newPassword"
            value={confirmPassword}
          />
          <Button
            disabled={busy}
            fullWidth
            label={t`Sign up`}
            loading={busy}
            onPress={() => void submitSignUp()}
            testID="sign-up-submit"
          />
        </>
      )}
    </AuthScreenLayout>
  );
}
