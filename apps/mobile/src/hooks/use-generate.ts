import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth as useClerkAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';

import {
  createGeneration,
  getGenerationJob,
  type GenerateRequest,
  type GenerationJob,
} from '@/lib/api';
import { useGenerationStore, type GenerationScope } from '@/stores/generation-store';
import {
  getAccountSession,
  isCurrentAccount,
  requireCurrentAccount,
  type AccountSession,
} from '@/lib/account-session';

const terminalStatuses = new Set<GenerationJob['status']>(['failed', 'succeeded']);
function isTerminal(job: GenerationJob | undefined): boolean {
  return job ? terminalStatuses.has(job.status) : false;
}

export function useGenerate(scope: GenerationScope = 'create') {
  const { userId } = useClerkAuth();
  const queryClient = useQueryClient();
  const session = useGenerationStore((state) => state.sessions[scope]);
  const setClientError = useGenerationStore((state) => state.setClientError);
  const setJobId = useGenerationStore((state) => state.setJobId);
  const start = useGenerationStore((state) => state.start);
  const [now, setNow] = useState(Date.now);
  const createMutation = useMutation({
    mutationFn: ({ request, account }: { request: GenerateRequest; account: AccountSession }) => {
      requireCurrentAccount(account);
      return createGeneration(request);
    },
    onError: (reason, { account }) => {
      if (isCurrentAccount(account)) {
        setClientError(
          scope,
          reason instanceof Error ? reason : new Error('Unable to start wallpaper generation.'),
        );
      }
    },
    onSuccess: ({ jobId: nextJobId }, { account }) => {
      if (isCurrentAccount(account)) {
        setJobId(scope, nextJobId);
        void queryClient.invalidateQueries({ queryKey: ['generation-jobs', account.accountId] });
      }
    },
  });
  const jobQuery = useQuery({
    enabled: Boolean(userId && session.jobId),
    queryFn: () => {
      if (!session.jobId) {
        throw new Error('A generation job id is required.');
      }

      return getGenerationJob(session.jobId);
    },
    queryKey: ['generation-job', userId, session.jobId],
    refetchInterval: (query) => (isTerminal(query.state.data) ? false : 1_000),
  });
  const jobFailure =
    jobQuery.data?.status === 'failed'
      ? new Error(jobQuery.data.error ?? 'Wallpaper generation failed. Please try again.')
      : undefined;
  const error = session.clientError ?? jobQuery.error ?? jobFailure;
  const cooldownSeconds = session.cooldownUntil
    ? Math.max(0, Math.ceil((session.cooldownUntil - now) / 1_000))
    : 0;

  useEffect(() => {
    if (!session.cooldownUntil || session.cooldownUntil <= Date.now()) {
      return;
    }

    const deadline = session.cooldownUntil;
    const timer = setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (nextNow >= deadline) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [session.cooldownUntil]);

  const generate = useCallback(
    (request: GenerateRequest) => {
      const account = getAccountSession();
      if (!isCurrentAccount(account) || account.accountId !== userId) return;
      const startedAt = Date.now();
      if (!start(scope, request, startedAt)) {
        return;
      }

      setNow(startedAt);
      createMutation.mutate({ request, account });
    },
    [createMutation, scope, start, userId],
  );

  const regenerate = useCallback(() => {
    if (session.lastRequest) {
      generate(session.lastRequest);
    }
  }, [generate, session.lastRequest]);

  const retry = useCallback(() => {
    if (session.jobId && jobQuery.isError) {
      void jobQuery.refetch();
      return;
    }

    regenerate();
  }, [jobQuery, regenerate, session.jobId]);

  return {
    error,
    generate,
    isGenerating:
      Boolean(session.isSubmitting) ||
      (Boolean(session.jobId) && !isTerminal(jobQuery.data) && !jobQuery.isError),
    job: jobQuery.data,
    jobId: session.jobId,
    cooldownSeconds,
    canRegenerate: Boolean(session.lastRequest),
    refreshImage: () => void jobQuery.refetch(),
    regenerate,
    retry,
  };
}
