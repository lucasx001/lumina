import { fireEvent, render } from '@testing-library/react-native';

import { HomeScreen } from '@/screens/home';

const mockPush = jest.fn();
const mockUseCategories = jest.fn();
jest.mock('@/components/generation-tasks', () => ({ GenerationTasks: () => null }));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');

  return { Image: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/use-categories', () => ({
  useCategories: (...args: unknown[]) => mockUseCategories(...args),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseCategories.mockReturnValue({
      categories: [],
      error: null,
      isLoading: true,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  it('waits for the category request before showing the empty state', () => {
    const screen = render(<HomeScreen />);

    expect(screen.queryByTestId('home-empty-create')).toBeNull();
    mockUseCategories.mockReturnValueOnce({
      categories: [],
      error: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
    const emptyScreen = render(<HomeScreen />);
    const createButton = emptyScreen.getByTestId('home-empty-create');
    fireEvent.press(createButton);
    expect(mockPush).toHaveBeenCalledWith('/create-wallpaper');
  });
});
