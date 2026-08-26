import { createWallpaperOverlayOptions } from './create-wallpaper-overlay-options';

describe('createWallpaperOverlayOptions', () => {
  it('lets the community bottom sheet own the presentation and gestures', () => {
    expect(createWallpaperOverlayOptions()).toEqual({
      animation: 'none',
      contentStyle: { backgroundColor: 'transparent' },
      gestureEnabled: false,
      headerShown: false,
      presentation: 'transparentModal',
    });
  });
});
