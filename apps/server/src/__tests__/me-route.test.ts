import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';
import { authHeaders, createAuthFixture } from './auth-fixtures.js';

describe('authentication and /me routes', () => {
  it('requires a valid Clerk token for account routes', async () => {
    const fixture = createAuthFixture();
    const app = createApp({ clerk: fixture.clerk, me: fixture.users });

    const anonymous = await app.request('/me');
    expect(anonymous.status).toBe(401);

    const invalid = await app.request('/me', { headers: authHeaders('invalid-token') });
    expect(invalid.status).toBe(401);
  });

  it('upserts the authenticated account and exposes no device binding endpoint', async () => {
    const fixture = createAuthFixture();
    const app = createApp({ clerk: fixture.clerk, me: fixture.users });

    const response = await app.request('/me', { headers: authHeaders() });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: { clerkUserId: 'user-a', id: 'local-1' },
    });
    expect(fixture.records).toHaveLength(1);

    const removedEndpoint = await app.request('/me/bind-device', {
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      method: 'POST',
    });
    expect(removedEndpoint.status).toBe(404);
  });
});
