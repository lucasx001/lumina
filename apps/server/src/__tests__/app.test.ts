import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';

describe('health endpoint', () => {
  it('returns a healthy response', async () => {
    const app = createApp();
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('returns a structured response for unhandled errors', async () => {
    const app = createApp();
    app.get('/error', () => {
      throw new Error('Unexpected failure');
    });

    const response = await app.request('/error');

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
      },
    });
  });
});
