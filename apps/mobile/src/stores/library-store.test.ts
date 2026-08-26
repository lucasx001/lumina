import type { WallpaperListItem } from '@/lib/api';

import { useLibraryStore } from './library-store';

const wallpaper: WallpaperListItem = {
  category: 'Nature',
  createdAt: '2026-08-01T00:00:00.000Z',
  height: 2400,
  id: 'wallpaper-1',
  mode: 'text2img',
  resultImageUrl: 'https://example.com/wallpaper.jpg',
  status: 'succeeded',
  width: 1080,
};

describe('useLibraryStore', () => {
  beforeEach(() => {
    useLibraryStore.getState().reset();
  });

  it('preserves filters and detail state across screen renders', () => {
    const store = useLibraryStore.getState();

    store.setFavoritesOnly(true);
    store.setSelectedCategory('nature');
    store.selectWallpaper(wallpaper);
    store.setPreviewMode('home-screen');
    store.setApplySheetVisible(true);

    expect(useLibraryStore.getState()).toMatchObject({
      favoritesOnly: true,
      isApplySheetVisible: true,
      previewMode: 'home-screen',
      selectedCategory: 'nature',
      selectedWallpaper: wallpaper,
    });
  });

  it('closes detail UI without clearing filters', () => {
    const store = useLibraryStore.getState();
    store.setFavoritesOnly(true);
    store.selectWallpaper(wallpaper);
    store.setApplySheetVisible(true);

    store.closeWallpaper();

    expect(useLibraryStore.getState()).toMatchObject({
      favoritesOnly: true,
      isApplySheetVisible: false,
      previewMode: 'lock-screen',
      selectedWallpaper: undefined,
    });
  });
});
