import { I18nProvider } from '@lingui/react';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useLocaleStore } from '@/stores/locale-store';

export function MobileI18nProvider({ children }: { children: ReactNode }) {
  const i18n = useLocaleStore((state) => state.i18n);
  const initializationError = useLocaleStore((state) => state.initializationError);
  const initialize = useLocaleStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (initializationError) {
    return (
      <View
        style={{ alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center', padding: 24 }}
      >
        <Text style={{ color: '#18181B', fontSize: 16, fontWeight: '600' }}>Lumina 无法初始化</Text>
        <Text selectable style={{ color: '#71717A', textAlign: 'center' }}>
          {initializationError.message}
        </Text>
      </View>
    );
  }

  if (!i18n) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color="#18181B" />
      </View>
    );
  }

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}

export function useAppLocale() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return { locale, setLocale };
}
