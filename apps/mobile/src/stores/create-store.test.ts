import { useCreateStore } from './create-store';

describe('useCreateStore', () => {
  beforeEach(() => {
    useCreateStore.getState().reset();
  });

  it('keeps text generation and image editing drafts in one typed client store', () => {
    const store = useCreateStore.getState();

    store.setCategory('Quiet places');
    store.setIdea('A quiet lake at sunrise');
    store.setPresetId('preset-1');
    store.setChip('mood', '平静');
    store.setQuality('hd');
    store.setInstruction('Keep the mountain silhouette');
    store.setMode('edit');
    store.setSourceImageUrl('https://example.com/source.jpg');

    expect(useCreateStore.getState()).toMatchObject({
      category: 'Quiet places',
      chipValues: { mood: '平静' },
      idea: 'A quiet lake at sunrise',
      instruction: 'Keep the mountain silhouette',
      mode: 'edit',
      presetId: 'preset-1',
      quality: 'hd',
      sourceImageUrl: 'https://example.com/source.jpg',
    });
  });

  it('resets drafts to their defaults', () => {
    useCreateStore.getState().setIdea('temporary');
    useCreateStore.getState().setQuality('hd');

    useCreateStore.getState().reset();

    expect(useCreateStore.getState()).toMatchObject({
      category: '',
      chipValues: {},
      idea: '',
      instruction: '',
      quality: 'draft',
    });
    expect(useCreateStore.getState().mode).toBeUndefined();
    expect(useCreateStore.getState().presetId).toBeUndefined();
    expect(useCreateStore.getState().sourceImageUrl).toBeUndefined();
  });
});
