import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { getAnonymousDeviceId } from '@/lib/device-id';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '12345678-1234-4234-8234-123456789abc'),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe('getAnonymousDeviceId', () => {
  it('persists and reuses a neutral anonymous UUID when no value exists', async () => {
    const getItemAsync = jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    const setItemAsync = jest.mocked(SecureStore.setItemAsync).mockResolvedValue();

    const first = await getAnonymousDeviceId();
    const second = await getAnonymousDeviceId();

    expect(first).toBe('anonymous-12345678-1234-4234-8234-123456789abc');
    expect(second).toBe(first);
    expect(Crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(getItemAsync).toHaveBeenCalledTimes(1);
    expect(setItemAsync).toHaveBeenCalledWith('lumina.anonymous-device-id', first);
  });
});
