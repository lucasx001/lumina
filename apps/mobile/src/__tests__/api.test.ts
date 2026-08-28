import {
  ApiError,
  bindDevice,
  createApiClient,
  createGeneration,
  getGenerationJob,
  getPresets,
  getWallpapers,
  resolveApiBaseUrl,
} from '../lib/api';

describe('api client', () => {
  it('uses the public environment URL ahead of the Expo config URL', () => {
    expect(
      resolveApiBaseUrl(
        { EXPO_PUBLIC_API_URL: 'http://192.168.1.10:3000/' },
        { apiUrl: 'https://ignored.example' },
      ),
    ).toBe('http://192.168.1.10:3000');
  });

  it('returns JSON from a successful request', async () => {
    const fetchImpl = jest
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const apiFetch = createApiClient({ baseUrl: 'https://api.example', fetchImpl });

    await expect(apiFetch<{ ok: boolean }>('health')).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example/health',
      expect.objectContaining({ headers: expect.any(Headers), signal: expect.any(AbortSignal) }),
    );
  });

  it('turns server error payloads into typed errors', async () => {
    const apiFetch = createApiClient({
      baseUrl: 'https://api.example',
      fetchImpl: jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'JOB_NOT_FOUND', message: 'Job was not found.' } }),
          {
            status: 404,
            statusText: 'Not Found',
          },
        ),
      ),
    });

    await expect(apiFetch('/jobs/missing')).rejects.toEqual(
      new ApiError('Job was not found.', 404, 'JOB_NOT_FOUND'),
    );
  });

  it('turns connection failures into typed network errors', async () => {
    const apiFetch = createApiClient({
      baseUrl: 'https://api.example',
      fetchImpl: jest
        .fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
        .mockRejectedValue(new TypeError('Network request failed')),
    });

    await expect(apiFetch('/health')).rejects.toEqual(
      new ApiError('Network request failed', 0, 'NETWORK_ERROR'),
    );
  });

  it('adds a Clerk token when a token provider is supplied', async () => {
    const fetchImpl = jest
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const apiFetch = createApiClient({
      baseUrl: 'https://api.example',
      fetchImpl,
      getToken: async () => 'clerk-session-token',
    });

    await apiFetch('/me');

    const request = fetchImpl.mock.calls[0]?.[1];
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer clerk-session-token');
  });

  it('keeps anonymous requests free of an Authorization header', async () => {
    const fetchImpl = jest
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const apiFetch = createApiClient({ baseUrl: 'https://api.example', fetchImpl });

    await apiFetch('/generate');

    const request = fetchImpl.mock.calls[0]?.[1];
    expect(new Headers(request?.headers).has('Authorization')).toBe(false);
  });

  it('creates generation jobs and retrieves presets and jobs through the typed client', async () => {
    const fetchImpl = jest
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ jobId: 'job-1' }), { status: 202 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            presets: [
              {
                category: 'minimal',
                coverImageUrl: null,
                id: 'preset-1',
                name: 'Minimal',
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            height: 2400,
            resultImageUrl: 'https://images.example/job-1.jpg',
            status: 'succeeded',
            width: 1080,
          }),
          { status: 200 },
        ),
      );
    const apiFetch = createApiClient({ baseUrl: 'https://api.example', fetchImpl });

    await expect(
      apiFetch('/generate', {
        init: {
          body: JSON.stringify({
            height: 2400,
            mode: 'text2img',
            userInputs: { idea: 'night city' },
            width: 1080,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      }),
    ).resolves.toEqual({ jobId: 'job-1' });
    await expect(apiFetch('/presets')).resolves.toEqual({
      presets: [{ category: 'minimal', coverImageUrl: null, id: 'preset-1', name: 'Minimal' }],
    });
    await expect(apiFetch('/jobs/job-1')).resolves.toEqual({
      height: 2400,
      resultImageUrl: 'https://images.example/job-1.jpg',
      status: 'succeeded',
      width: 1080,
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://api.example/generate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('exposes typed helpers for generation endpoints', () => {
    expect(bindDevice).toBeInstanceOf(Function);
    expect(createGeneration).toBeInstanceOf(Function);
    expect(getGenerationJob).toBeInstanceOf(Function);
    expect(getPresets).toBeInstanceOf(Function);
    expect(getWallpapers).toBeInstanceOf(Function);
  });
});
