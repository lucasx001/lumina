import { useAuth } from '@clerk/expo';
import { useEffect } from 'react';

import { setApiTokenProvider } from '@/lib/api';

/** Keeps the shared API client authenticated without coupling it to React hooks. */
export function ApiTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setApiTokenProvider(async () => getToken());
    return () => setApiTokenProvider(undefined);
  }, [getToken]);

  return null;
}
