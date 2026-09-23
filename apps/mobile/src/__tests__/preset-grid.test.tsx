import { fireEvent, render } from '@testing-library/react-native';
import { PresetGrid } from '@/components/create/preset-grid';
import { builtInPresetCovers } from '@/lib/preset-covers';

jest.mock('react-native-gesture-handler', () => ({
  FlatList: require('react-native').FlatList,
}));
jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: (props: Record<string, unknown>) =>
      React.createElement(require('react-native').View, props),
  };
});
const mockPresets = [
  ...['abstract', 'anime', 'cinematic', 'cyberpunk', 'editorial', 'minimal', 'nature'].map(
    (name) => ({ id: `preset_builtin_${name}`, name, category: name, coverImageUrl: null }),
  ),
  {
    id: 'custom',
    name: 'Custom',
    category: 'custom',
    coverImageUrl: 'https://example.com/custom.jpg',
  },
];
jest.mock('@/hooks/use-presets', () => ({
  usePresets: () => ({ data: { presets: mockPresets }, refetch: jest.fn() }),
}));

it('renders all seven bundled covers even when the database has no cover URLs', () => {
  const screen = render(<PresetGrid onSelect={jest.fn()} />);
  for (const preset of mockPresets.slice(0, 7)) {
    const cover = screen.getByTestId(`preset-cover-${preset.id}`);
    expect(cover.props.source).toBe(builtInPresetCovers[preset.id]);
    expect(cover.props.source).toBeDefined();
  }
  expect(screen.getByTestId('preset-cover-custom').props.source).toBe(
    'https://example.com/custom.jpg',
  );
});

it('keeps every preset in the horizontal list and selects an item beyond the first two', () => {
  const onSelect = jest.fn();
  const screen = render(<PresetGrid onSelect={onSelect} />);
  const list = screen.getByTestId('preset-carousel');
  expect(list.props.horizontal).toBe(true);
  expect(list.props.nestedScrollEnabled).toBe(true);
  fireEvent.press(screen.getByTestId('preset-preset_builtin_nature'));
  expect(onSelect).toHaveBeenCalledWith('preset_builtin_nature');
  screen.rerender(<PresetGrid onSelect={onSelect} selectedPresetId="preset_builtin_nature" />);
  expect(screen.getByTestId('preset-preset_builtin_nature').props.accessibilityState.selected).toBe(
    true,
  );
});
