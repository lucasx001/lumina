import { describe, expect, it, vi } from 'vite-plus/test';

import { SiliconFlowImageProvider, mapSiliconFlowError } from '../providers/siliconflow.js';

function createProvider(fetch = vi.fn<typeof globalThis.fetch>()): SiliconFlowImageProvider {
  return new SiliconFlowImageProvider({
    apiKey: 'test-api-key',
    fetch,
    model: 'black-forest-labs/FLUX.2-pro',
    timeoutMs: 1_000,
  });
}

describe('SiliconFlowImageProvider', () => {
  it('calls FLUX.2 Flex and returns a temporary image URL', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          images: [{ url: 'https://provider.example.com/generated.png' }],
          seed: 42,
          timings: { inference: 1_234 },
        }),
      ),
    );
    const provider = createProvider(fetch);

    const result = await provider.textToImage({
      negativePrompt: 'watermark',
      prompt: 'A moonlit lake wallpaper',
      quality: 'high',
      seed: 42,
      width: 576,
      height: 1024,
    });

    expect(result).toMatchObject({
      height: 1024,
      imageUrl: 'https://provider.example.com/generated.png',
      providerTask: 'siliconflow:42',
      width: 576,
    });
    expect(result.metadata).toMatchObject({
      inferenceMs: 1_234,
      model: 'black-forest-labs/FLUX.2-pro',
      seed: 42,
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.siliconflow.com/v1/images/generations',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-api-key' }),
        method: 'POST',
      }),
    );
    expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body as string)).toEqual({
      batch_size: 1,
      image_size: '576x1024',
      inference_steps: 50,
      model: 'black-forest-labs/FLUX.2-pro',
      negative_prompt: 'watermark',
      output_format: 'png',
      prompt: 'A moonlit lake wallpaper',
      seed: 42,
    });
  });

  it.each([
    [401, 'AUTHENTICATION_FAILED'],
    [429, 'RATE_LIMITED'],
    [503, 'PROVIDER_UNAVAILABLE'],
    [504, 'TIMEOUT'],
  ])('maps HTTP %i to %s', async (status, code) => {
    const provider = createProvider(vi.fn().mockResolvedValue(new Response('failure', { status })));

    await expect(
      provider.textToImage({ prompt: 'test', width: 576, height: 1024 }),
    ).rejects.toMatchObject({ code });
  });

  it('rejects missing image artifacts and unsupported operations', async () => {
    const provider = createProvider(
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ images: [] }))),
    );

    await expect(
      provider.textToImage({ prompt: 'test', width: 576, height: 1024 }),
    ).rejects.toMatchObject({ code: 'INVALID_ARTIFACT' });
    await expect(
      provider.editImage({ prompt: 'test', width: 576, height: 1024 }),
    ).rejects.toMatchObject({
      code: 'UNSUPPORTED_OPERATION',
    });
  });

  it('maps aborted requests to timeouts and validates user input', async () => {
    expect(mapSiliconFlowError(new DOMException('aborted', 'AbortError')).code).toBe('TIMEOUT');

    await expect(
      createProvider().textToImage({ prompt: '', width: 576, height: 1024 }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });
});
