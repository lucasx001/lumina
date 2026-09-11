import { create } from 'zustand';

import { ApiError, type GenerateRequest } from '@/lib/api';

export type GenerationScope = 'create' | 'edit';

type GenerationSession = {
  isSubmitting?: boolean;
  clientError?: Error;
  cooldownUntil?: number;
  jobId?: string;
  lastRequest?: GenerateRequest;
};

type GenerationState = {
  activeAccountId: string | null;
  sessions: Record<GenerationScope, GenerationSession>;
};

type GenerationActions = {
  reset: (scope: GenerationScope) => void;
  setActiveAccount: (accountId: string | null) => void;
  setClientError: (scope: GenerationScope, error: Error) => void;
  setJobId: (scope: GenerationScope, jobId: string) => void;
  start: (scope: GenerationScope, request: GenerateRequest, now?: number) => boolean;
};

export type GenerationStore = GenerationState & GenerationActions;

export const clientCooldownMs = 5_000;

function createInitialSessions(): GenerationState['sessions'] {
  return { create: {}, edit: {} };
}

export const useGenerationStore = create<GenerationStore>()((set, get) => ({
  activeAccountId: null,
  sessions: createInitialSessions(),
  reset: (scope) => set((state) => ({ sessions: { ...state.sessions, [scope]: {} } })),
  setActiveAccount: (activeAccountId) => set({ activeAccountId }),
  setClientError: (scope, clientError) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [scope]: { ...state.sessions[scope], clientError, isSubmitting: false },
      },
    })),
  setJobId: (scope, jobId) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [scope]: { ...state.sessions[scope], jobId, isSubmitting: false },
      },
    })),
  start: (scope, request, now = Date.now()) => {
    const session = get().sessions[scope];
    if (session.isSubmitting) return false;
    const cooldownUntil = session.cooldownUntil;

    if (cooldownUntil && cooldownUntil > now) {
      set((state) => ({
        sessions: {
          ...state.sessions,
          [scope]: {
            ...state.sessions[scope],
            clientError: new ApiError(
              `Please wait ${Math.ceil((cooldownUntil - now) / 1_000)} seconds.`,
              429,
              'RATE_LIMITED',
            ),
          },
        },
      }));
      return false;
    }

    set((state) => ({
      sessions: {
        ...state.sessions,
        [scope]: {
          clientError: undefined,
          cooldownUntil: now + clientCooldownMs,
          jobId: undefined,
          lastRequest: request,
          isSubmitting: true,
        },
      },
    }));
    return true;
  },
}));
