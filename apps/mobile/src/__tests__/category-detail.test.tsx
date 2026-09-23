import { fireEvent, render } from '@testing-library/react-native';
import { CategoryDetailScreen } from '@/screens/category-detail';
import { RemoteImage } from '@/components/remote-image';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({ category: 'autumn' }),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('expo-image', () => ({ Image: require('react-native').View }));
jest.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({ categories: [{ id: 'autumn', name: '秋' }] }),
}));
jest.mock('@/hooks/use-wallpapers', () => ({
  useWallpapers: () => ({
    wallpapers: [
      { id: 'wall', width: 1024, height: 1024, resultImageUrl: 'https://example.com/wall.png' },
    ],
    refetch: jest.fn(),
  }),
}));

it('allocates a visible square tile for a single generated wallpaper and opens its preview', () => {
  const screen = render(<CategoryDetailScreen />);
  const image = screen.getByLabelText('Generated wallpaper');
  const style = screen.UNSAFE_getByType(RemoteImage).props.style;
  expect(style.width).toBeGreaterThan(0);
  expect(style.height).toBe(style.width);
  expect(image.props.source).toEqual({ uri: 'https://example.com/wall.png' });
  fireEvent.press(screen.getByRole('button', { name: 'Open wallpaper preview' }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/category/[category]/[wallpaperId]',
    params: { category: 'autumn', wallpaperId: 'wall' },
  });
});

it('gives the Chinese category title a full-width padded line without negative tracking', () => {
  const screen = render(<CategoryDetailScreen />);
  expect(screen.getByText('秋')).toHaveStyle({
    width: '100%',
    textAlign: 'center',
    lineHeight: 42,
    includeFontPadding: true,
    letterSpacing: 0,
    paddingHorizontal: 4,
  });
  expect(screen.getByText('秋').props.numberOfLines).toBe(1);
});
