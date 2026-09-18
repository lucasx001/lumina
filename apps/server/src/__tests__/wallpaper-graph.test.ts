import { describe, expect, it } from 'vite-plus/test';

import type { Wallpaper } from '../../prisma/generated/prisma/client.js';
import type { ImageProvider, ImageResult, ImageSpec } from '../providers/types.js';
import { runWallpaperGraph } from '../graph/wallpaper.graph.js';
import type { WallpaperGraphDependencies } from '../graph/nodes/types.js';

const graphInput = {
  category: 'minimal',
  categoryId: 'category-a',
  clerkUserId: 'user-a',
  height: 2400,
  mode: 'text2img' as const,
  userId: 'local-1',
  userInputs: { idea: 'a calm night sky' },
  width: 1080,
};

describe('runWallpaperGraph', () => {
  it('uses stored image dimensions instead of requested or provider-reported dimensions', async () => {
    const harness = createHarness();
    harness.dependencies.storage.uploadBuffer = async (_, key) => ({
      key,
      url: `https://r2.example/${key}`,
      width: 512,
      height: 768,
    });
    const wallpaper = await runWallpaperGraph(graphInput, harness.dependencies);
    expect(wallpaper).toMatchObject({ width: 512, height: 768 });
  });
  it('creates and persists an account-owned generated artifact', async () => {
    const harness = createHarness();
    const wallpaper = await runWallpaperGraph(graphInput, harness.dependencies);

    expect(harness.calls).toEqual(['textToImage']);
    expect(harness.uploads[0]?.key).toMatch(/^wallpapers\/local-1\/\d{6}\/wallpaper-1\.png$/);
    expect(wallpaper.status).toBe('succeeded');
    expect(wallpaper.resultImageKey).toBe(harness.uploads[0]?.key);
    expect(wallpaper.userId).toBe('local-1');
  });

  it('uses the existing job and scopes updates to its owner', async () => {
    const harness = createHarness({ providerError: new Error('provider quota exhausted') });

    await expect(
      runWallpaperGraph({ ...graphInput, wallpaperId: 'wallpaper-1' }, harness.dependencies),
    ).rejects.toThrow('provider quota exhausted');

    expect(harness.createCalls()).toBe(0);
    expect(harness.lastOwner()).toEqual({ id: 'wallpaper-1', userId: 'local-1' });
    expect(harness.wallpaper.status).toBe('failed');
    expect(harness.wallpaper.error).toBe('provider quota exhausted');
  });

  it('routes draft requests to provider dimensions below the final size', async () => {
    const harness = createHarness();
    await runWallpaperGraph(
      {
        ...graphInput,
        quality: 'draft',
        userInputs: { idea: 'quick preview' },
      },
      harness.dependencies,
    );

    expect(harness.specs[0]).toMatchObject({ height: 1280, quality: 'standard', width: 576 });
  });

  it('resolves an account-owned source key only for provider use', async () => {
    const harness = createHarness();
    await runWallpaperGraph(
      {
        ...graphInput,
        mode: 'edit',
        sourceImageKey: 'sources/local-1/202609/source.png',
        userInputs: { idea: 'make it warmer' },
      },
      harness.dependencies,
    );

    expect(harness.specs[0]?.sourceImageUrl).toBe(
      'https://r2.example/sources/local-1/202609/source.png',
    );
    expect(harness.wallpaper.sourceImageKey).toBe('sources/local-1/202609/source.png');
  });

  it('rejects a source key from another account before provider access', async () => {
    const harness = createHarness();
    await expect(
      runWallpaperGraph(
        {
          ...graphInput,
          mode: 'edit',
          sourceImageKey: 'sources/local-2/202609/source.png',
          userInputs: { idea: 'make it warmer' },
        },
        harness.dependencies,
      ),
    ).rejects.toThrow('source image is not owned');
    expect(harness.calls).toEqual([]);
  });
});

function createHarness(options: { providerError?: Error } = {}) {
  const calls: string[] = [];
  const specs: ImageSpec[] = [];
  let createCalls = 0;
  let lastOwner: { id: string; userId: string } | undefined;
  const uploads: { contentType: string; key: string }[] = [];
  const wallpaper = {
    category: { id: 'category-a', name: 'minimal' },
    categoryId: 'category-a',
    createdAt: new Date(),
    error: null,
    favorite: false,
    height: null,
    id: 'wallpaper-1',
    mode: 'text2img',
    presetId: null,
    prompt: '',
    providerTask: null,
    quality: 'hd',
    resultImageKey: null,
    sourceImageKey: null,
    status: 'pending',
    updatedAt: new Date(),
    userId: 'local-1',
    width: null,
  } as unknown as Wallpaper;
  const provider = createProvider(calls, options.providerError, specs);

  const dependencies: WallpaperGraphDependencies = {
    imageProvider: provider,
    presets: {
      async findById(id) {
        return id === 'preset-minimal'
          ? {
              id,
              negativePrompt: 'watermark',
              promptTemplate: 'A minimal {{idea}} composition, {{width}}x{{height}}.',
              styleRefKey: null,
            }
          : null;
      },
    },
    storage: {
      async getUrl(key) {
        return `https://r2.example/${key}`;
      },
      async uploadBuffer(_buffer, key, contentType) {
        uploads.push({ contentType, key });
        return { key, url: `https://r2.example/${key}` };
      },
      async uploadFile() {
        throw new Error('unexpected uploadFile call');
      },
      async uploadFromUrl() {
        throw new Error('unexpected uploadFromUrl call');
      },
    },
    wallpapers: {
      async create(data) {
        createCalls += 1;
        Object.assign(wallpaper, data);
        return wallpaper;
      },
      async update(owner, data) {
        lastOwner = owner;
        Object.assign(wallpaper, data);
        return wallpaper;
      },
    },
  };

  return {
    calls,
    createCalls: () => createCalls,
    dependencies,
    lastOwner: () => lastOwner,
    specs,
    uploads,
    wallpaper,
  };
}

function createProvider(
  calls: string[],
  providerError?: Error,
  specs: ImageSpec[] = [],
): ImageProvider {
  const result = (): ImageResult => {
    if (providerError) {
      throw providerError;
    }
    return {
      imageBytes: new Uint8Array([1, 2, 3]),
      metadata: { mimeType: 'image/png' },
      providerTask: 'mock-task',
      width: 1080,
      height: 2400,
    };
  };
  const invoke = (operation: string) => async (spec: ImageSpec) => {
    calls.push(operation);
    specs.push(spec);
    return result();
  };

  return {
    editImage: invoke('edit'),
    extractStyle: invoke('style'),
    outpaint: invoke('outpaint'),
    textToImage: invoke('textToImage'),
    upscale: invoke('upscale'),
  };
}
