import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';
import type { WallpaperRepository } from '../routes/wallpapers.js';

describe('wallpaper routes', () => {
  it('filters by category and favorites, then updates a device-owned favorite', async () => {
    const repository: WallpaperRepository = {
      async listByDeviceId(input) {
        expect(input).toEqual({
          category: 'nature',
          deviceId: 'device-1',
          favorite: true,
          limit: 20,
          page: 1,
        });
        return [wallpaper];
      },
      async setFavorite(input) {
        expect(input).toEqual({ deviceId: 'device-1', favorite: true, id: 'wallpaper-1' });
        return { ...wallpaper, favorite: true };
      },
    };
    const app = createApp({ wallpapers: repository });

    const list = await app.request('/wallpapers?deviceId=device-1&category=nature&favorite=true');
    expect(list.status).toBe(200);
    await expect(list.json()).resolves.toMatchObject({ items: [{ favorite: false }] });

    const favorite = await app.request('/wallpapers/wallpaper-1/favorite', {
      body: JSON.stringify({ deviceId: 'device-1', favorite: true }),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    });
    expect(favorite.status).toBe(200);
    await expect(favorite.json()).resolves.toMatchObject({ wallpaper: { favorite: true } });
  });
});

const wallpaper = {
  category: 'nature',
  createdAt: new Date('2026-07-28T00:00:00.000Z'),
  favorite: false,
  height: 2400,
  id: 'wallpaper-1',
  mode: 'text2img',
  quality: 'hd',
  resultImageUrl: 'https://images.example/wallpaper-1.png',
  status: 'succeeded',
  width: 1080,
};
