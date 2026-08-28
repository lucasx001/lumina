import { fireEvent, render } from '@testing-library/react-native';

import { HomeScreen } from '@/screens/home';

const mockPush = jest.fn();
const mockUseWallpapers = jest.fn();

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  return { Image: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/use-wallpapers', () => ({
  useWallpapers: (...args: unknown[]) => mockUseWallpapers(...args),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseWallpapers.mockReturnValue({
      deviceIdError: undefined,
      error: null,
      favoriteError: null,
      isLoading: true,
      isPreparingDeviceId: true,
      isRefetching: false,
      refetch: jest.fn(),
      wallpapers: [],
    });
  });

  it('shows the new-user guidance while the first wallpaper request is preparing', () => {
    const screen = render(<HomeScreen />);

    const createButton = screen.getByTestId('home-empty-create');
    expect(createButton).toBeTruthy();
    fireEvent.press(createButton);
    expect(mockPush).toHaveBeenCalledWith('/create-wallpaper');
  });
});
