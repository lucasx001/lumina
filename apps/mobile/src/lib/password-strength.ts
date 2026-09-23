export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return 'empty';
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return 'weak';
  }
  if (score <= 4) {
    return 'fair';
  }
  return 'strong';
}
