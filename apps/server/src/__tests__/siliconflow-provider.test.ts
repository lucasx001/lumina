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
  it('calls FLUX.2 Pro and returns a temporary image URL', async () => {
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
      imageUrl: 'https://provider.example.com/generated.png',
      providerTask: 'siliconflow:42',
    });
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
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

  it('edits an existing image through the generation endpoint', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ images: [{ url: 'https://provider.example.com/edited.png' }] }),
        ),
      );
    const provider = createProvider(fetch);

    const result = await provider.editImage({
      mode: 'edit',
      prompt: 'Make the sky warmer',
      sourceImageUrl: 'https://r2.example.com/source.png',
      width: 1080,
      height: 1920,
    });

    expect(result.imageUrl).toBe('https://provider.example.com/edited.png');
    expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body as string)).toMatchObject({
      image_size: '1080x1920',
      input_image: 'https://r2.example.com/source.png',
      model: 'black-forest-labs/FLUX.2-pro',
      prompt: 'Make the sky warmer',
    });
  });

  it('uses the source image for outpainting and rejects missing sources', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ images: [{ url: 'https://provider.example.com/outpainted.png' }] }),
        ),
      );
    const provider = createProvider(fetch);

    await expect(
      provider.outpaint({
        mode: 'outpaint',
        prompt: 'Extend the scene to the sides',
        sourceImageUrl: 'https://r2.example.com/source.png',
        width: 1920,
        height: 1080,
      }),
    ).resolves.toMatchObject({ imageUrl: 'https://provider.example.com/outpainted.png' });

    await expect(
      provider.editImage({ prompt: 'Make it warmer', width: 576, height: 1024 }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('rejects missing image artifacts and unsupported operations', async () => {
    const provider = createProvider(
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ images: [] }))),
    );

    await expect(
      provider.textToImage({ prompt: 'test', width: 576, height: 1024 }),
    ).rejects.toMatchObject({ code: 'INVALID_ARTIFACT' });
    await expect(
      provider.upscale({ prompt: 'test', width: 576, height: 1024 }),
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
