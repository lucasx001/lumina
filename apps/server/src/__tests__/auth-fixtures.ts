import type { ClerkAuthService, ClerkUserProfile } from '../lib/clerk.js';
import type { LocalUser, MeRepository } from '../routes/me.js';

export function createAuthFixture() {
  const profiles: Partial<Record<string, ClerkUserProfile>> = {
    'user-a': {
      avatarUrl: null,
      clerkUserId: 'user-a',
      email: 'a@example.com',
      googleSubject: null,
      nickname: 'A',
    },
    'user-b': {
      avatarUrl: null,
      clerkUserId: 'user-b',
      email: 'b@example.com',
      googleSubject: null,
      nickname: 'B',
    },
  };
  const records: LocalUser[] = [];
  const clerk: ClerkAuthService = {
    async getUser(clerkUserId) {
      const profile = profiles[clerkUserId];
      if (!profile) {
        throw new Error('Unknown Clerk user.');
      }
      return profile;
    },
    async verifyToken(token) {
      const clerkUserId = token.replace('token-', '');
      if (!profiles[clerkUserId]) {
        throw new Error('Invalid token.');
      }
      return { clerkUserId };
    },
  };
  const users: MeRepository = {
    async upsertUser(profile) {
      const existing = records.find((record) => record.clerkUserId === profile.clerkUserId);
      if (existing) {
        return existing;
      }
      const user = { ...profile, id: `local-${records.length + 1}` };
      records.push(user);
      return user;
    },
  };

  return { clerk, records, users };
}

export function authHeaders(token = 'token-user-a'): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
