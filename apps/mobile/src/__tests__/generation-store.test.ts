import { ApiError, type GenerateRequest } from '@/lib/api';

import { clientCooldownMs, useGenerationStore } from '@/stores/generation-store';

const request: GenerateRequest = {
  category: 'Aurora',
  height: 2400,
  mode: 'text2img',
  quality: 'draft',
  userInputs: { idea: 'Aurora over a forest' },
  width: 1080,
};

describe('useGenerationStore', () => {
  beforeEach(() => {
    useGenerationStore.getState().reset('create');
    useGenerationStore.getState().reset('edit');
  });

  it('tracks independent generation sessions by scope', () => {
    expect(useGenerationStore.getState().start('create', request, 1_000)).toBe(true);
    useGenerationStore.getState().setJobId('create', 'job-1');

    expect(useGenerationStore.getState().sessions.create).toMatchObject({
      cooldownUntil: 1_000 + clientCooldownMs,
      jobId: 'job-1',
      lastRequest: request,
    });
    expect(useGenerationStore.getState().sessions.edit).toEqual({});
  });

  it('blocks duplicate requests during the client cooldown', () => {
    useGenerationStore.getState().start('create', request, 1_000);

    expect(useGenerationStore.getState().start('create', request, 2_000)).toBe(false);
    expect(useGenerationStore.getState().sessions.create.clientError).toBeInstanceOf(ApiError);
    expect(useGenerationStore.getState().sessions.create.clientError?.message).toBe(
      'Please wait 4 seconds.',
    );
  });
});
