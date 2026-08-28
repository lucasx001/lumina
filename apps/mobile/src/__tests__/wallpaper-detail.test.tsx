import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WallpaperDetail } from '@/features/wallpapers/wallpaper-detail';

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Image: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

describe('WallpaperDetail', () => {
  const wallpaper = {
    category: 'Nature',
    createdAt: '2026-07-26T00:00:00.000Z',
    height: 2400,
    id: 'wallpaper-1',
    mode: 'text2img' as const,
    resultImageUrl: 'https://images.example/wallpaper-1.jpg',
    status: 'succeeded' as const,
    width: 1080,
  };

  it('supports immersive preview controls and leaves a graceful action slot', () => {
    const onClose = jest.fn();
    const onModeChange = jest.fn();
    const onToggleFavorite = jest.fn();
    const screen = render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { height: 844, width: 390, x: 0, y: 0 },
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
      >
        <WallpaperDetail
          onClose={onClose}
          onModeChange={onModeChange}
          onToggleFavorite={onToggleFavorite}
          previewMode="lock-screen"
          wallpaper={wallpaper}
        />
      </SafeAreaProvider>,
    );

    expect(screen.getByTestId('wallpaper-detail-image')).toBeTruthy();
    expect(screen.getByTestId('preview-lock-clock')).toBeTruthy();
    expect(screen.getByTestId('apply-sheet-placeholder')).toBeTruthy();
    fireEvent.press(screen.getByTestId('detail-preview-mode-home-screen'));
    fireEvent.press(screen.getByTestId('detail-toggle-favorite'));
    fireEvent.press(screen.getByTestId('detail-toggle-info'));
    fireEvent.press(screen.getByTestId('close-wallpaper-detail'));
    expect(onModeChange).toHaveBeenCalledWith('home-screen');
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('wallpaper-information')).toBeTruthy();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
