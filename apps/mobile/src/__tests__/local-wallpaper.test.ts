import { changeAccountSession } from '@/lib/account-session';
import { withLocalWallpaper, clearWallpaperDownloads } from '@/lib/local-wallpaper';

const mockDelete = jest.fn();
const mockDirectoryDelete = jest.fn();
const mockDownload = jest.fn();
jest.mock('expo-file-system', () => ({
  File: Object.assign(
    jest.fn(() => ({ exists: true, delete: mockDelete })),
    {
      downloadFileAsync: (...args: unknown[]) => mockDownload(...args),
    },
  ),
  Directory: jest.fn(() => ({ exists: true, create: jest.fn(), delete: mockDirectoryDelete })),
  Paths: { cache: 'file:///cache' },
}));

describe('private temporary wallpapers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    changeAccountSession(null);
    changeAccountSession('a');
  });

  it('removes a downloaded file when a native action fails', async () => {
    mockDownload.mockResolvedValue({ uri: 'file:///image.png' });
    await expect(
      withLocalWallpaper('https://images.example/image.png', () =>
        Promise.reject(new Error('denied')),
      ),
    ).rejects.toThrow('denied');
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('does not export a download that finishes after account switching', async () => {
    let complete!: (file: { uri: string }) => void;
    mockDownload.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const action = jest.fn();
    const pending = withLocalWallpaper('https://images.example/image.png', action);
    changeAccountSession('b');
    complete({ uri: 'file:///image.png' });
    await expect(pending).rejects.toThrow('Account session changed');
    expect(action).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('cleans partial downloads and only uses the app-owned cache directory', async () => {
    mockDownload.mockRejectedValue(new Error('offline'));
    await expect(withLocalWallpaper('https://images.example/image.png', jest.fn())).rejects.toThrow(
      'offline',
    );
    expect(mockDelete).toHaveBeenCalledTimes(1);
    clearWallpaperDownloads();
    expect(jest.requireMock('expo-file-system').Directory).toHaveBeenLastCalledWith(
      'file:///cache',
      'lumina-wallpapers',
    );
    expect(mockDirectoryDelete).toHaveBeenCalledTimes(1);
  });
});
