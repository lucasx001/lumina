import { useAuth as useClerkAuth, useSSO, useUser } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';
import { useCallback, useEffect, useRef, useState } from 'react';

import { bindDevice } from '@/lib/api';
import { getAnonymousDeviceId } from '@/lib/device-id';

import { normalizeAuthError } from './auth-error';

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const { getToken, isLoaded, isSignedIn, signOut, userId } = useClerkAuth();
  const { startSSOFlow } = useSSO();
  const { user } = useUser();
  const [authError, setAuthError] = useState<Error>();
  const [bindError, setBindError] = useState<Error>();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const lastBoundUserId = useRef<string | null>(null);

  const syncDeviceHistory = useCallback(async () => {
    if (!userId) {
      return;
    }

    lastBoundUserId.current = userId;
    setIsSyncingHistory(true);
    setBindError(undefined);
    try {
      await bindDevice(await getAnonymousDeviceId(), getToken);
    } catch (reason) {
      setBindError(reason instanceof Error ? reason : new Error('设备历史同步失败。'));
    } finally {
      setIsSyncingHistory(false);
    }
  }, [getToken, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || lastBoundUserId.current === userId) {
      return;
    }

    void syncDeviceHistory();
  }, [isLoaded, isSignedIn, syncDeviceHistory, userId]);

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
      lastBoundUserId.current = null;
      setBindError(undefined);
    } catch (reason) {
      const error = normalizeAuthError(reason);
      setAuthError(error);
      Toast.show({ text1: error.message, type: 'error' });
    }
  }, [signOut]);

  return {
    authError,
    bindError,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    isSigningIn,
    isSyncingHistory,
    signInWithGoogle,
    signOut: signOutFromApp,
    syncDeviceHistory,
    user,
  };
}
