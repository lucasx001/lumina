import { normalizeAuthError } from '@/lib/auth-error';

describe('normalizeAuthError', () => {
  it('turns a missing Expo auth dependency into an actionable message', () => {
    expect(normalizeAuthError(new Error('Unable to load expo-auth-session')).message).toBe(
      '登录组件未安装完整，请安装最新的开发版本后重试。',
    );
  });

  it('keeps useful provider errors intact', () => {
    const providerError = new Error('OAuth provider is not enabled.');
    expect(normalizeAuthError(providerError)).toBe(providerError);
  });
});
