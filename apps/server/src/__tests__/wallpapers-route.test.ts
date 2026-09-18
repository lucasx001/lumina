import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';
import type { WallpaperListItem, WallpaperRepository } from '../routes/wallpapers.js';
import { authHeaders, createAuthFixture } from './auth-fixtures.js';

describe('wallpaper routes', () => {
  it('scopes list, detail, and favorite operations to the authenticated account', async () => {
    const fixture = createAuthFixture();
    const wallpaper: WallpaperListItem = {
      category: 'Nature',
      categoryId: 'category-a',
      createdAt: new Date('2026-09-06T00:00:00.000Z'),
      favorite: false,
      height: 2400,
      id: 'wallpaper-a',
      mode: 'text2img',
      quality: 'hd',
      resultImageUrl: 'https://images.example/a.png',
      status: 'succeeded',
      width: 1080,
    };
    const repository: WallpaperRepository = {
      async getById(input) {
        return input.userId === 'local-1' && input.id === wallpaper.id ? wallpaper : null;
      },
      async listByUserId(input) {
        expect(input).toMatchObject({
          categoryId: 'category-a',
          favorite: true,
          limit: 20,
          page: 1,
          userId: 'local-1',
        });
        return [{ ...wallpaper, favorite: true }];
      },
      async setFavorite(input) {
        expect(input).toEqual({ favorite: true, id: 'wallpaper-a', userId: 'local-1' });
        return { ...wallpaper, favorite: true };
      },
    };
    const app = createApp({ clerk: fixture.clerk, me: fixture.users, wallpapers: repository });

    const list = await app.request('/wallpapers?categoryId=category-a&favorite=true', {
      headers: authHeaders(),
    });
    expect(list.status).toBe(200);
    await expect(list.json()).resolves.toMatchObject({
      items: [{ id: 'wallpaper-a', favorite: true }],
    });

    const favorite = await app.request('/wallpapers/wallpaper-a/favorite', {
      body: JSON.stringify({ favorite: true }),
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      method: 'PATCH',
    });
    expect(favorite.status).toBe(200);

    const detail = await app.request('/wallpapers/wallpaper-a', { headers: authHeaders() });
    expect(detail.status).toBe(200);
    await expect(detail.json()).resolves.toMatchObject({ wallpaper: { id: 'wallpaper-a' } });

    const image = await app.request('/wallpapers/wallpaper-a/image', { headers: authHeaders() });
    expect(image.status).toBe(200);
    await expect(image.json()).resolves.toEqual({ url: wallpaper.resultImageUrl });

    const otherAccount = await app.request('/wallpapers/wallpaper-a', {
      headers: authHeaders('token-user-b'),
    });
    expect(otherAccount.status).toBe(404);
    const otherImage = await app.request('/wallpapers/wallpaper-a/image', {
      headers: authHeaders('token-user-b'),
    });
    expect(otherImage.status).toBe(404);
  });
});
