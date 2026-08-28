export function normalizeAuthError(reason: unknown): Error {
  const error = reason instanceof Error ? reason : new Error('Google 登录失败，请稍后重试。');
  const message = error.message.toLowerCase();

  if (message.includes('expo-auth-session') || message.includes('cannot find module')) {
    return new Error('登录组件未安装完整，请安装最新的开发版本后重试。');
  }

  if (message.includes('network') || message.includes('fetch')) {
    return new Error('无法连接登录服务，请检查网络后重试。');
  }

  return error;
}
