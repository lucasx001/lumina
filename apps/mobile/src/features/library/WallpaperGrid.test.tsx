import { fireEvent, render } from '@testing-library/react-native';

import { WallpaperGrid } from './WallpaperGrid';

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Image: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

describe('WallpaperGrid', () => {
  const commonProps = {
    isLoading: false,
    isRefreshing: false,
    onCreate: jest.fn(),
    onEndReached: jest.fn(),
    onRefresh: jest.fn(),
    onSelect: jest.fn(),
  };

  it('shows a friendly empty state that navigates to creation', () => {
    const onCreate = jest.fn();
    const screen = render(<WallpaperGrid {...commonProps} items={[]} onCreate={onCreate} />);

    expect(screen.getByText('No wallpapers yet')).toBeTruthy();
    expect(screen.getByTestId('create-wallpaper-button')).toHaveStyle({ alignSelf: 'center' });
    fireEvent.press(screen.getByTestId('create-wallpaper-button'));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('renders saved wallpapers and opens the selected item', () => {
    const onSelect = jest.fn();
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
    const screen = render(
      <WallpaperGrid {...commonProps} items={[wallpaper]} onSelect={onSelect} />,
    );

    fireEvent.press(screen.getByTestId('wallpaper-grid-item-wallpaper-1'));
    expect(onSelect).toHaveBeenCalledWith(wallpaper);
  });
});
