import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';
import type { ClerkAuthService, ClerkUserProfile } from '../lib/clerk.js';
import type { LocalUser, MeRepository } from '../routes/me.js';

describe('authentication and /me routes', () => {
  it('returns 401 when a protected route has no Clerk token', async () => {
    const app = createApp({ clerk: createClerkService(), me: createMeRepository() });

    const response = await app.request('/me');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required.' },
    });
  });

  it('returns 401 when a Clerk token is invalid', async () => {
    const app = createApp({ clerk: createClerkService(), me: createMeRepository() });

    const response = await app.request('/me', {
      headers: { Authorization: 'Bearer invalid-token' },
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: 'UNAUTHORIZED', message: 'Clerk token is invalid.' },
    });
  });

  it('attaches optional authentication and upserts a local user only once', async () => {
    const clerk = createClerkService();
    const users = createMeRepository();
    const app = createApp({ clerk, me: users });
    app.get('/optional-user', (context) => context.json({ user: context.get('user') ?? null }));

    const anonymous = await app.request('/optional-user');
    expect(anonymous.status).toBe(200);
    await expect(anonymous.json()).resolves.toEqual({ user: null });

    const authenticated = await app.request('/optional-user', {
      headers: { Authorization: 'Bearer valid-token' },
    });
    await expect(authenticated.json()).resolves.toEqual({
      user: { clerkUserId: 'user_clerk_123' },
    });

    const first = await app.request('/me', { headers: { Authorization: 'Bearer valid-token' } });
    const second = await app.request('/me', { headers: { Authorization: 'Bearer valid-token' } });

    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({
      user: {
        avatarUrl: 'https://images.example/avatar.png',
        clerkUserId: 'user_clerk_123',
        email: 'lumina@example.com',
        googleSubject: 'google-subject-123',
        id: 'local-user-1',
        nickname: 'Lumina',
      },
    });
    expect(second.status).toBe(200);
    expect(users.records).toHaveLength(1);
    expect(clerk.verifiedTokens).toEqual(['valid-token', 'valid-token', 'valid-token']);
  });

  it('binds anonymous device history to the authenticated local user', async () => {
    const users = createMeRepository();
    const app = createApp({ clerk: createClerkService(), me: users });

    const response = await app.request('/me/bind-device', {
      body: JSON.stringify({ deviceId: 'device-anonymous-123' }),
      headers: {
        Authorization: 'Bearer valid-token',
        'content-type': 'application/json',
      },
      method: 'POST',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ bound: 2 });
    expect(users.boundDevices).toEqual([
      { deviceId: 'device-anonymous-123', userId: 'local-user-1' },
    ]);
  });

  it('validates bind-device input before changing wallpaper ownership', async () => {
    const users = createMeRepository();
    const app = createApp({ clerk: createClerkService(), me: users });

    const response = await app.request('/me/bind-device', {
      body: JSON.stringify({ deviceId: '' }),
      headers: {
        Authorization: 'Bearer valid-token',
        'content-type': 'application/json',
      },
      method: 'POST',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'deviceId is invalid.' },
    });
    expect(users.boundDevices).toEqual([]);
  });
});

function createClerkService(): ClerkAuthService & { verifiedTokens: string[] } {
  const verifiedTokens: string[] = [];
  const profile: ClerkUserProfile = {
    avatarUrl: 'https://images.example/avatar.png',
    clerkUserId: 'user_clerk_123',
    email: 'lumina@example.com',
    googleSubject: 'google-subject-123',
    nickname: 'Lumina',
  };

  return {
    async getUser(clerkUserId) {
      expect(clerkUserId).toBe(profile.clerkUserId);
      return profile;
    },
    verifiedTokens,
    async verifyToken(token) {
      if (token !== 'valid-token') {
        throw new Error('Invalid token.');
      }

      verifiedTokens.push(token);
      return { clerkUserId: profile.clerkUserId };
    },
  };
}

function createMeRepository(): MeRepository & {
  boundDevices: Array<{ deviceId: string; userId: string }>;
  records: LocalUser[];
} {
  const records: LocalUser[] = [];
  const boundDevices: Array<{ deviceId: string; userId: string }> = [];

  return {
    boundDevices,
    async bindDeviceToUser(input) {
      boundDevices.push(input);
      return 2;
    },
    records,
    async upsertUser(profile) {
      const existing = records.find((record) => record.clerkUserId === profile.clerkUserId);
      if (existing) {
        Object.assign(existing, profile);
        return existing;
      }

      const user = { ...profile, id: `local-user-${records.length + 1}` };
      records.push(user);
      return user;
    },
  };
}
