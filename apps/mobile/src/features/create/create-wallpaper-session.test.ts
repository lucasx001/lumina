import type { GenerateRequest } from '@/lib/api';
import { useCreateStore } from '@/stores/create-store';
import { useGenerationStore } from '@/stores/generation-store';

import { resetCreateWallpaperSession } from './create-wallpaper-session';

const request: GenerateRequest = {
  category: 'Rainy nights',
  height: 2400,
  mode: 'text2img',
  quality: 'draft',
  userInputs: { idea: 'Rain on a city street' },
  width: 1080,
};

describe('resetCreateWallpaperSession', () => {
  it('starts each creation panel with a fresh draft and generation session', () => {
    useCreateStore.getState().setCategory('Rainy nights');
    useCreateStore.getState().setIdea('Rain on a city street');
    useGenerationStore.getState().start('create', request, 1_000);
    useGenerationStore.getState().setJobId('create', 'previous-job');

    resetCreateWallpaperSession();

    expect(useCreateStore.getState()).toMatchObject({
      category: '',
      chipValues: {},
      idea: '',
      quality: 'draft',
    });
    expect(useGenerationStore.getState().sessions.create).toEqual({});
  });
});
