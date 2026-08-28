import { useWallpaperPreviewStore } from '@/stores/wallpaper-preview-store';

describe('useWallpaperPreviewStore', () => {
  beforeEach(() => {
    useWallpaperPreviewStore.getState().reset();
  });

  it('preserves preview state across screen renders', () => {
    const store = useWallpaperPreviewStore.getState();

    store.setPreviewMode('home-screen');
    store.setApplySheetVisible(true);

    expect(useWallpaperPreviewStore.getState()).toMatchObject({
      isApplySheetVisible: true,
      previewMode: 'home-screen',
    });
  });

  it('resets preview state', () => {
    const store = useWallpaperPreviewStore.getState();
    store.setPreviewMode('home-screen');
    store.setApplySheetVisible(true);

    store.reset();

    expect(useWallpaperPreviewStore.getState()).toMatchObject({
      isApplySheetVisible: false,
      previewMode: 'lock-screen',
    });
  });
});
