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
import { getPasswordStrength } from '@/lib/password-strength';
import { useTheme } from '@/hooks/use-theme';
import { usePasswordResetStore } from '@/stores/password-reset-store';

function isPasswordPolicyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const clerkError = error as {
    code?: unknown;
    longMessage?: unknown;
    message?: unknown;
  };
  const details = [clerkError.code, clerkError.longMessage, clerkError.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return (
    details.includes('password') &&
    /(strong|weak|length|character|common|compromised|pwned)/.test(details)
  );
}

export function PasswordResetScreen() {
  const { errors, fetchStatus, signIn } = useSignIn();
  const {
    code,
    emailAddress,
    password,
    reset,
    setCode,
    setEmailAddress,
    setPassword,
    setStage,
    stage,
  } = usePasswordResetStore();
  const { t } = useLingui();
  const router = useRouter();
  const theme = useTheme();
  const busy = fetchStatus === 'fetching';
  const fallbackError = t`Password reset failed.`;
  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthMessage =
    passwordStrength === 'weak'
      ? t`Password strength: weak`
      : passwordStrength === 'fair'
        ? t`Password strength: fair`
        : passwordStrength === 'strong'
          ? t`Password strength: strong`
          : t`Use at least 8 characters with a mix of letters, numbers, and symbols.`;

  useEffect(() => {
    reset();
    return reset;
  }, [reset]);

  const setError = (message: string) => {
    Toast.show({ text1: message, type: 'error' });
  };

  const requestReset = async () => {
    if (!emailAddress.trim()) {
      setError(t`Enter your email address first.`);
      return;
    }

    try {
      const { error: createError } = await signIn.create({ identifier: emailAddress.trim() });
      throwIfClerkError(createError);
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      throwIfClerkError(sendError);
      setCode('');
      setStage('verify');
    } catch (reason) {
      setError(getAuthFlowError(reason, fallbackError));
    }
  };

  const verifyResetCode = async () => {
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
      throwIfClerkError(error);
      if (signIn.status !== 'needs_new_password') {
        throw new Error(fallbackError);
      }
      setPassword('');
      setStage('password');
    } catch (reason) {
      setError(getAuthFlowError(reason, fallbackError));
    }
  };

  const submitNewPassword = async () => {
    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
      if (isPasswordPolicyError(error)) {
        return;
      }
      throwIfClerkError(error);
      if (signIn.status !== 'complete') {
        throw new Error(fallbackError);
      }
      const { error: finalizeError } = await signIn.finalize();
      throwIfClerkError(finalizeError);
      reset();
    } catch (reason) {
      setError(getAuthFlowError(reason, fallbackError));
    }
  };

  const startOver = async () => {
    const { error } = await signIn.reset();
    throwIfClerkError(error);
    setCode('');
    setPassword('');
    setStage('request');
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
            <Trans>Remember your password? </Trans>
            <ThemedText style={{ color: theme.text, fontWeight: '600' }} variant="caption">
              <Trans>Log in</Trans>
            </ThemedText>
          </ThemedText>
        </Pressable>
      }
      description={
        stage === 'request'
          ? t`Enter your email address and we’ll send you a secure password reset code.`
          : stage === 'verify'
            ? t`We sent a password reset code to ${emailAddress}.`
            : t`Choose a new password for your account.`
      }
      kicker={
        stage === 'request'
          ? t`Recover your account`
          : stage === 'verify'
            ? t`Verify your email`
            : t`Choose a new password`
      }
      resetArt={stage === 'request'}
      title={
        stage === 'request'
          ? t`Return to your wallpaper space.`
          : stage === 'verify'
            ? t`Check your inbox.`
            : t`Make a fresh start.`
      }
    >
      {stage === 'request' ? (
        <>
          <AuthTextField
            autoCapitalize="none"
            autoComplete="email"
            error={errors.fields.identifier?.message}
            keyboardType="email-address"
            label={t`Email`}
            onChangeText={setEmailAddress}
            onSubmitEditing={() => void requestReset()}
            placeholder={t`Your email address`}
            returnKeyType="done"
            testID="password-reset-email"
            textContentType="emailAddress"
            value={emailAddress}
          />
          <Button
            disabled={busy}
            fullWidth
            label={t`Send reset code`}
            loading={busy}
            onPress={() => void requestReset()}
            style={{ borderRadius: radius.md, minHeight: 52 }}
            testID="password-reset-request"
          />
        </>
      ) : stage === 'verify' ? (
        <>
          <AuthTextField
            autoComplete="one-time-code"
            error={errors.fields.code?.message}
            keyboardType="number-pad"
            label={t`Verification code`}
            onChangeText={setCode}
            onSubmitEditing={() => void verifyResetCode()}
            placeholder={t`Enter code`}
            returnKeyType="done"
            testID="password-reset-code"
            textContentType="oneTimeCode"
            value={code}
          />
          <Button
            disabled={busy || !code.trim()}
            fullWidth
            label={t`Verify code`}
            loading={busy}
            onPress={() => void verifyResetCode()}
            style={{ borderRadius: radius.md, minHeight: 52 }}
            testID="password-reset-verify"
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
            autoComplete="new-password"
            label={t`New password`}
            onChangeText={setPassword}
            onSubmitEditing={() => void submitNewPassword()}
            placeholder={t`Password`}
            returnKeyType="done"
            secureTextEntry
            testID="password-reset-new-password"
            textContentType="newPassword"
            value={password}
          />
          <ThemedText
            style={{
              color:
                passwordStrength === 'strong'
                  ? theme.primary
                  : passwordStrength === 'weak'
                    ? theme.error
                    : theme.mutedText,
              marginTop: -12,
            }}
            testID="password-reset-strength"
            variant="caption"
          >
            {passwordStrengthMessage}
          </ThemedText>
          <Button
            disabled={busy || !password}
            fullWidth
            label={t`Save new password`}
            loading={busy}
            onPress={() => void submitNewPassword()}
            style={{ borderRadius: radius.md, minHeight: 52 }}
            testID="password-reset-submit"
          />
        </>
      )}
    </AuthScreenLayout>
  );
}
