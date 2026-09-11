import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useGenerationRecovery } from '@/hooks/use-generation-recovery';
import { getGenerationJob, getGenerationJobs, createGeneration } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation-store';
import { changeAccountSession } from '@/lib/account-session';

jest.mock('@clerk/expo', () => ({ useAuth: () => ({ userId: 'a' }) }));
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  getGenerationJob: jest.fn(),
  getGenerationJobs: jest.fn(),
  createGeneration: jest.fn(),
}));

function mountRecovery() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useGenerationRecovery(), { wrapper });
  return { ...hook, client };
}

describe('generation recovery above navigation', () => {
  let onStateChange: (state: AppStateStatus) => void;
  beforeEach(() => {
    changeAccountSession('a');
    useGenerationStore.getState().reset('create');
    jest.mocked(getGenerationJobs).mockResolvedValue({
      jobs: [{ wallpaperId: 'job-a', status: 'processing', categoryId: 'cat-a' }],
    });
    jest.mocked(getGenerationJob).mockResolvedValue({ wallpaperId: 'job-a', status: 'processing' });
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      onStateChange = listener;
      return { remove: jest.fn() };
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('restores an existing job after a fresh app mount without submitting it again', async () => {
    const first = mountRecovery();
    await waitFor(() => expect(useGenerationStore.getState().sessions.create.jobId).toBe('job-a'));
    await waitFor(() => expect(getGenerationJob).toHaveBeenCalledWith('job-a'));
    first.unmount();
    first.client.clear();
    useGenerationStore.getState().reset('create');
    const restarted = mountRecovery();
    await waitFor(() => expect(useGenerationStore.getState().sessions.create.jobId).toBe('job-a'));
    expect(createGeneration).not.toHaveBeenCalled();
    restarted.unmount();
    restarted.client.clear();
  });

  it('refreshes completed results on foreground and invalidates the category catalog', async () => {
    const mounted = mountRecovery();
    const invalidate = jest.spyOn(mounted.client, 'invalidateQueries');
    await waitFor(() => expect(getGenerationJob).toHaveBeenCalled());
    act(() => onStateChange('background'));
    expect(focusManager.isFocused()).toBe(false);
    jest.mocked(getGenerationJob).mockResolvedValue({
      wallpaperId: 'job-a',
      status: 'succeeded',
      resultImageUrl: 'https://image.example/a.png',
    });
    act(() => onStateChange('active'));
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['categories', 'a'] }));
    expect(focusManager.isFocused()).toBe(true);
    mounted.unmount();
    mounted.client.clear();
  });
});
