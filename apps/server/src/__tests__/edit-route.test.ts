import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';
import { authHeaders, createAuthFixture } from './auth-fixtures.js';

describe('existing-image upload route', () => {
  it('signs a source image PUT upload and returns its usable source URL', async () => {
    const fixture = createAuthFixture();
    const app = createApp({
      clerk: fixture.clerk,
      edit: {
        storage: {
          async createPresignedPutUrl(key, contentType) {
            expect(key).toMatch(/^sources\/local-1\//);
            expect(contentType).toBe('image/png');
            return 'https://r2.example/upload';
          },
          async getUrl(key) {
            return `https://r2.example/${key}`;
          },
        },
      },
      me: fixture.users,
    });

    const response = await app.request('/uploads/presign', {
      body: JSON.stringify({ contentType: 'image/png' }),
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      key: expect.stringMatching(/^sources\/local-1\//),
      sourceImageUrl: expect.stringMatching(/^https:\/\/r2\.example\/sources\//),
      uploadUrl: 'https://r2.example/upload',
    });
  });

  it('rejects unsupported upload formats', async () => {
    const fixture = createAuthFixture();
    const app = createApp({ clerk: fixture.clerk, me: fixture.users });
    const response = await app.request('/uploads/presign', {
      body: JSON.stringify({ contentType: 'image/heic' }),
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(400);
  });
});
