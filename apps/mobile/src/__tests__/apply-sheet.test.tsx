import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { ApplySheet } from '@/features/apply/ApplySheet';

jest.mock('../../modules/expo-wallpaper', () => ({
  setWallpaper: jest.fn(),
}));

jest.mock(
  'expo-file-system',
  () => ({
    File: Object.assign(jest.fn(), { downloadFileAsync: jest.fn() }),
    Paths: { cache: 'cache' },
  }),
  { virtual: true },
);

jest.mock(
  'expo-media-library',
  () => ({
    Asset: { create: jest.fn() },
    requestPermissionsAsync: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  'expo-sharing',
  () => ({
    isAvailableAsync: jest.fn(),
    shareAsync: jest.fn(),
  }),
  { virtual: true },
);

const mockSetWallpaper = jest.requireMock('../../modules/expo-wallpaper').setWallpaper as jest.Mock;
const mockDownloadFile = jest.requireMock('expo-file-system').File.downloadFileAsync as jest.Mock;
const mockCreateAsset = jest.requireMock('expo-media-library').Asset.create as jest.Mock;
const mockRequestPermissions = jest.requireMock('expo-media-library')
  .requestPermissionsAsync as jest.Mock;
const mockShare = jest.requireMock('expo-sharing').shareAsync as jest.Mock;
const mockSharingAvailable = jest.requireMock('expo-sharing').isAvailableAsync as jest.Mock;

describe('ApplySheet', () => {
  beforeEach(() => {
    Platform.OS = 'android';
    mockSetWallpaper.mockReset();
    mockDownloadFile.mockReset();
    mockCreateAsset.mockReset();
    mockRequestPermissions.mockReset();
    mockShare.mockReset();
    mockSharingAvailable.mockReset();

    mockDownloadFile.mockResolvedValue({ uri: 'file:///cache/wallpaper.jpg' });
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });
    mockSharingAvailable.mockResolvedValue(true);
  });

  it('downloads the result before applying the selected Android target', async () => {
    const screen = render(
      <ApplySheet imageUrl="https://images.example/wallpaper.jpg" onDismiss={jest.fn()} visible />,
    );

    fireEvent.press(screen.getByTestId('apply-wallpaper-both'));

    await waitFor(() =>
      expect(mockSetWallpaper).toHaveBeenCalledWith('file:///cache/wallpaper.jpg', 'both'),
    );
  });

  it('only shows loading on the selected target while disabling the other actions', async () => {
    let resolveSetWallpaper!: () => void;
    mockSetWallpaper.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSetWallpaper = resolve;
        }),
    );
    const screen = render(
      <ApplySheet imageUrl="https://images.example/wallpaper.jpg" onDismiss={jest.fn()} visible />,
    );

    fireEvent.press(screen.getByTestId('apply-wallpaper-home'));

    await waitFor(() => {
      expect(screen.getByTestId('apply-wallpaper-home').props.accessibilityState).toEqual(
        expect.objectContaining({ busy: true, disabled: true }),
      );
      expect(screen.getByTestId('apply-wallpaper-lock').props.accessibilityState).toEqual(
        expect.objectContaining({ busy: false, disabled: true }),
      );
      expect(screen.getByTestId('apply-wallpaper-both').props.accessibilityState).toEqual(
        expect.objectContaining({ busy: false, disabled: true }),
      );
    });

    await act(async () => {
      resolveSetWallpaper();
    });
  });

  it('requests library permission before saving and shares a local file', async () => {
    const screen = render(
      <ApplySheet imageUrl="https://images.example/wallpaper.jpg" onDismiss={jest.fn()} visible />,
    );

    fireEvent.press(screen.getByTestId('save-wallpaper'));
    await waitFor(() =>
      expect(mockCreateAsset).toHaveBeenCalledWith('file:///cache/wallpaper.jpg'),
    );

    fireEvent.press(screen.getByTestId('share-wallpaper'));
    await waitFor(() => expect(mockShare).toHaveBeenCalledWith('file:///cache/wallpaper.jpg'));
  });

  it('keeps the sheet open and shows a permission error when saving is denied', async () => {
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });
    const onDismiss = jest.fn();
    const screen = render(
      <ApplySheet imageUrl="https://images.example/wallpaper.jpg" onDismiss={onDismiss} visible />,
    );

    fireEvent.press(screen.getByTestId('save-wallpaper'));

    expect(
      await screen.findByText('Photo library permission is required to save wallpapers.'),
    ).toBeTruthy();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('uses the iOS save-only fallback and explains the system step', () => {
    Platform.OS = 'ios';
    const screen = render(
      <ApplySheet imageUrl="https://images.example/wallpaper.jpg" onDismiss={jest.fn()} visible />,
    );

    expect(screen.getByTestId('save-wallpaper')).toBeTruthy();
    expect(screen.queryByTestId('apply-wallpaper-home')).toBeNull();
    expect(screen.queryByTestId('share-wallpaper')).toBeNull();
    expect(screen.getByTestId('apply-ios-hint')).toBeTruthy();
  });
});
