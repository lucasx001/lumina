import { describe, expect, it, vi } from 'vite-plus/test';

import { CodexImageProvider } from '../providers/codex.js';

function createProvider(fetch = vi.fn<typeof globalThis.fetch>()) {
  return new CodexImageProvider({ apiKey: 'test-key', fetch, timeoutMs: 1_000 });
}

describe('CodexImageProvider', () => {
  it('sends an existing image to the GPT Image edits endpoint for outpainting', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { 'content-type': 'image/png' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: [{ b64_json: Buffer.from('image').toString('base64') }] }),
        ),
      );
    const provider = createProvider(fetch);

    const result = await provider.outpaint({
      height: 2400,
      prompt: 'Keep the subject centered.',
      sourceImageUrl: 'https://r2.example/source.png',
      width: 1080,
    });

    expect(result).toMatchObject({ height: 2400, providerTask: 'openai:image', width: 1088 });
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://r2.example/source.png');
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.openai.com/v1/images/edits',
      expect.objectContaining({ method: 'POST' }),
    );
    const request = fetch.mock.calls[1]?.[1];
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer test-key');
    const form = request?.body as FormData;
    expect(form.get('size')).toBe('1088x2400');
    const prompt = form.get('prompt');
    expect(typeof prompt).toBe('string');
    if (typeof prompt !== 'string') {
      throw new Error('Expected the image edit request to include a string prompt.');
    }
    expect(prompt).toContain('Expand the supplied image naturally');
  });

  it('extracts structured style metadata through the Responses API', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'resp_123',
          output_text: JSON.stringify({
            category: 'editorial',
            colorKeywords: ['warm amber'],
            compositionKeywords: ['centered portrait'],
            materialKeywords: ['matte paper'],
            name: 'Warm Editorial',
            promptTemplate: 'A warm editorial wallpaper of {{idea}}',
          }),
        }),
      ),
    );
    const provider = createProvider(fetch);

    const result = await provider.extractStyle({
      height: 2400,
      prompt: 'Extract a style.',
      sourceImageUrl: 'https://r2.example/source.png',
      width: 1080,
    });

    expect(result).toMatchObject({
      providerTask: 'openai:resp_123',
      style: { name: 'Warm Editorial', promptTemplate: 'A warm editorial wallpaper of {{idea}}' },
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
