import { ClerkProvider, useAuth } from '@clerk/expo';
import { Host } from '@expo/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { ActivityIndicator } from 'react-native';

import { ApiTokenBridge } from '@/features/auth/ApiTokenBridge';
import { MobileI18nProvider } from '@/features/i18n/i18n-provider';
import { useTheme } from '@/hooks/use-theme';
import { clerkTokenCache } from '@/lib/clerkTokenCache';
import { queryClient } from '@/lib/queryClient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  const appTheme = useTheme();
  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: appTheme.background,
      border: appTheme.border,
      card: appTheme.surface,
      notification: appTheme.error,
      primary: appTheme.primary,
      text: appTheme.text,
    },
  };

  if (!publishableKey) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable');
  }

  return (
    <MobileI18nProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={clerkTokenCache}>
        <ApiTokenBridge />
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <Host colorScheme="dark" style={{ flex: 1 }}>
              <StatusBar style="light" />
              <SafeAreaProvider>
                <RootNavigator />
                <Toast />
              </SafeAreaProvider>
            </Host>
          </ThemeProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </MobileI18nProvider>
  );
}

export function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const theme = useTheme();

  if (!isLoaded) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{
          alignItems: 'center',
          backgroundColor: theme.background,
          flex: 1,
          gap: 24,
          justifyContent: 'center',
        }}
        testID="auth-loading-screen"
      >
        <Image
          accessibilityLabel="Lumina"
          contentFit="contain"
          source={require('../../assets/images/splash-icon.png')}
          style={{ height: 112, width: 128 }}
        />
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(isSignedIn)}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
