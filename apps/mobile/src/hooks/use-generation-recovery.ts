import { useAuth } from '@clerk/expo';
import { focusManager, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { getGenerationJobs } from '@/lib/api';
import { useGenerationStore } from '@/stores/generation-store';
import { useGenerate } from '@/hooks/use-generate';

export function useRecentJobs() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['generation-jobs', userId],
    queryFn: getGenerationJobs,
    enabled: Boolean(userId),
    refetchInterval: (query) =>
      query.state.data?.jobs.some((job) => job.status === 'pending' || job.status === 'processing')
        ? 5_000
        : false,
    staleTime: 0,
  });
}

/** Mounted above navigation so closing the creation sheet does not stop polling. */
export function useGenerationRecovery() {
  const { userId } = useAuth();
  const jobs = useRecentJobs();
  const generation = useGenerate();
  const queryClient = useQueryClient();
  const recoveredAccount = useRef<string | null | undefined>(null);
  const completedJob = useRef<string | null>(null);
  const finishedSignature = jobs.data?.jobs
    .filter((job) => job.status === 'succeeded')
    .map((job) => job.wallpaperId)
    .join(',');

  useEffect(() => {
    if (!userId || !finishedSignature) return;
    void queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    void queryClient.invalidateQueries({ queryKey: ['wallpapers', userId] });
  }, [finishedSignature, queryClient, userId]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      recoveredAccount.current = null;
      completedJob.current = null;
      return;
    }
    if (!jobs.data || recoveredAccount.current === userId) return;
    recoveredAccount.current = userId;
    const store = useGenerationStore.getState();
    if (store.sessions.create.jobId || store.sessions.create.lastRequest) return;
    const latest =
      jobs.data.jobs.find((job) => job.status === 'pending' || job.status === 'processing') ??
      jobs.data.jobs.at(0);
    if (latest?.wallpaperId) store.setJobId('create', latest.wallpaperId);
  }, [jobs.data, userId]);

  useEffect(() => {
    if (
      !userId ||
      generation.job?.status !== 'succeeded' ||
      completedJob.current === generation.jobId
    )
      return;
    completedJob.current = generation.jobId ?? null;
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ['categories', userId] }),
      queryClient.invalidateQueries({ queryKey: ['wallpapers', userId] }),
      queryClient.invalidateQueries({ queryKey: ['generation-jobs', userId] }),
    ]);
  }, [generation.job?.status, generation.jobId, queryClient, userId]);
}
