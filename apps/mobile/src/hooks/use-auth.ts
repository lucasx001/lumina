import { useAuth as useClerkAuth, useSSO, useUser } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import { useCallback, useState } from 'react';

import { normalizeAuthError } from '@/lib/auth-error';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { startSSOFlow } = useSSO();
  const { user } = useUser();
  const [authError, setAuthError] = useState<Error>();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(undefined);
    setIsSigningIn(true);
    try {
      const { authSessionResult, createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
      });
      if (authSessionResult?.type === 'cancel' || authSessionResult?.type === 'dismiss') {
        return;
      }
      if (!createdSessionId || !setActive) {
        throw new Error('Google 登录未完成。');
      }

      await setActive({ session: createdSessionId });
    } catch (reason) {
      const error = normalizeAuthError(reason);
      setAuthError(error);
      Toast.show({ text1: error.message, type: 'error' });
    } finally {
      setIsSigningIn(false);
    }
  }, [startSSOFlow]);

  const signOutFromApp = useCallback(async () => {
    setAuthError(undefined);
    try {
      await signOut();
    } catch (reason) {
      const error = normalizeAuthError(reason);
      setAuthError(error);
      Toast.show({ text1: error.message, type: 'error' });
    }
  }, [signOut]);

  return {
    authError,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    isSigningIn,
    signInWithGoogle,
    signOut: signOutFromApp,
    user,
  };
}
