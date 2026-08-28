import { createMobileI18n, mobileLocaleStorageKey } from '@lumina/i18n/mobile';
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

import { useLocaleStore } from '@/stores/locale-store';

jest.mock('@lumina/i18n/mobile', () => ({
  createMobileI18n: jest.fn(async (locale: string) => ({ locale })),
  mobileLocaleStorageKey: 'lumina.locale',
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'en-US' }]),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe('useLocaleStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocaleStore.getState().reset();
  });

  it('initializes from the persisted locale', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('zh-CN');

    await useLocaleStore.getState().initialize();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(mobileLocaleStorageKey);
    expect(createMobileI18n).toHaveBeenCalledWith('zh-CN');
    expect(useLocaleStore.getState()).toMatchObject({
      initializationError: undefined,
      isInitializing: false,
      locale: 'zh-CN',
    });
    expect(useLocaleStore.getState().i18n).not.toBeNull();
  });

  it('falls back to the device locale and persists later changes', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    jest.mocked(SecureStore.setItemAsync).mockResolvedValue();

    await useLocaleStore.getState().initialize();
    await useLocaleStore.getState().setLocale('zh-CN');

    expect(getLocales).toHaveBeenCalled();
    expect(createMobileI18n).toHaveBeenNthCalledWith(1, 'en');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(mobileLocaleStorageKey, 'zh-CN');
    expect(useLocaleStore.getState().locale).toBe('zh-CN');
  });
});
