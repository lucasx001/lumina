import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useGenerate } from '@/hooks/use-generate';
import { useWallpaper } from '@/hooks/use-wallpaper';
import { changeAccountSession } from '@/lib/account-session';
import { useGenerationStore } from '@/stores/generation-store';
import {
  createGeneration,
  getWallpaper,
  setWallpaperFavorite,
  type GenerateRequest,
} from '@/lib/api';

let mockUserId = 'a';
jest.mock('@clerk/expo', () => ({ useAuth: () => ({ userId: mockUserId }) }));
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  createGeneration: jest.fn(),
  getGenerationJob: jest.fn(),
  getWallpaper: jest.fn(),
  setWallpaperFavorite: jest.fn(),
}));
const request: GenerateRequest = {
  categoryId: 'cat-a',
  presetId: 'preset-a',
  width: 1080,
  height: 1920,
  mode: 'text2img',
  quality: 'draft',
  userInputs: { idea: 'forest' },
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe('account mutation responses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'a';
    changeAccountSession(null);
    changeAccountSession('a');
    useGenerationStore.getState().reset('create');
  });

  it('does not adopt an old generation response after a mounted hook switches account', async () => {
    let complete!: (value: { jobId: string }) => void;
    jest.mocked(createGeneration).mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { wrapper, client } = setup();
    const hook = renderHook(() => useGenerate(), { wrapper });
    act(() => hook.result.current.generate(request));
    await waitFor(() => expect(createGeneration).toHaveBeenCalled());
    act(() => {
      mockUserId = 'b';
      changeAccountSession('b');
      useGenerationStore.getState().reset('create');
      client.clear();
    });
    hook.rerender({});
    await act(async () => {
      complete({ jobId: 'job-a' });
    });
    expect(useGenerationStore.getState().sessions.create.jobId).toBeUndefined();
    hook.unmount();
    client.clear();
  });

  it('does not put an old favorite response in the new account cache', async () => {
    const wallpaper = {
      id: 'wallpaper-a',
      categoryId: 'cat-a',
      category: 'A',
      favorite: false,
      createdAt: '',
      height: 1,
      width: 1,
      mode: 'text2img' as const,
      status: 'succeeded' as const,
      resultImageUrl: 'https://image.example/a.png',
    };
    jest.mocked(getWallpaper).mockResolvedValue({ wallpaper });
    let complete!: (value: { wallpaper: typeof wallpaper }) => void;
    jest.mocked(setWallpaperFavorite).mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { wrapper, client } = setup();
    const hook = renderHook(() => useWallpaper('wallpaper-a'), { wrapper });
    await waitFor(() => expect(hook.result.current.wallpaper).toBeDefined());
    act(() => hook.result.current.toggleFavorite());
    await waitFor(() => expect(setWallpaperFavorite).toHaveBeenCalled());
    jest.mocked(getWallpaper).mockImplementation(() => new Promise(() => {}));
    act(() => {
      mockUserId = 'b';
      changeAccountSession('b');
      client.clear();
    });
    hook.rerender({});
    await act(async () => {
      complete({ wallpaper: { ...wallpaper, favorite: true } });
    });
    expect(client.getQueryData(['wallpaper', 'b', 'wallpaper-a'])).toBeUndefined();
    hook.unmount();
    client.clear();
  });
});
