import { act, fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateWallpaperScreen } from '@/screens/create-wallpaper';
import { useCreateStore } from '@/stores/create-store';
import { changeAccountSession } from '@/lib/account-session';

const mockGenerate = jest.fn();
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
const mockCreateCategory = jest.fn();
let mockStyles = { isSuccess: true, data: { presets: [{ id: 'style-a' }] } };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('@expo/ui', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  return {
    Host: View,
    Collapsible: ({
      isOpen,
      onOpenChange,
    }: {
      isOpen: boolean;
      onOpenChange: (value: boolean) => void;
    }) =>
      React.createElement(Pressable, { testID: 'advanced', onPress: () => onOpenChange(!isOpen) }),
  };
});
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetScrollView: require('react-native').ScrollView,
}));
jest.mock('@/components/create/preset-grid', () => ({ PresetGrid: () => null }));
jest.mock('@/hooks/use-presets', () => ({ usePresets: () => mockStyles }));
jest.mock('@/hooks/use-categories', () => ({
  useCategories: () => ({ categories: [], createCategory: mockCreateCategory }),
}));
jest.mock('@/hooks/use-generate', () => ({
  useGenerate: () => ({ generate: mockGenerate, isGenerating: false, cooldownSeconds: 0 }),
}));

function mountScreen() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <CreateWallpaperScreen onClose={jest.fn()} />
    </QueryClientProvider>,
  );
}

describe('creation constraints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    changeAccountSession(null);
    changeAccountSession('a');
    useCreateStore.getState().reset();
    useCreateStore.getState().setIdea('Forest');
    useCreateStore.getState().setCategory('Nature');
    mockStyles = { isSuccess: true, data: { presets: [{ id: 'style-a' }] } };
  });

  it('chooses a valid default, blocks empty styles, and collapses advanced controls', () => {
    const screen = mountScreen();
    expect(useCreateStore.getState().presetId).toBe('style-a');
    expect(screen.getByTestId('generate-button').props.accessibilityState.disabled).toBe(false);
    expect(screen.queryByTestId('quality-hd')).toBeNull();
    fireEvent.press(screen.getByTestId('advanced'));
    expect(screen.getByTestId('quality-hd')).toBeTruthy();
    screen.unmount();
    mockStyles = { isSuccess: true, data: { presets: [] } };
    const empty = mountScreen();
    expect(empty.getByTestId('generate-button').props.accessibilityState.disabled).toBe(true);
    empty.unmount();
    mockStyles = { isSuccess: false, data: { presets: [] } };
    const loading = mountScreen();
    expect(loading.getByTestId('generate-button').props.accessibilityState.disabled).toBe(true);
  });

  it('discards category creation that finishes after switching accounts', async () => {
    let complete!: (value: { category: { id: string } }) => void;
    mockCreateCategory.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const screen = mountScreen();
    fireEvent.press(screen.getByTestId('generate-button'));
    changeAccountSession('b');
    act(() => useCreateStore.getState().reset());
    await act(async () => {
      complete({ category: { id: 'category-a' } });
    });
    expect(mockGenerate).not.toHaveBeenCalled();
    expect(useCreateStore.getState().categoryId).toBeUndefined();
  });
});
