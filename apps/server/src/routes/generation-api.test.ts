import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';
import { createGenerationRateLimiter } from '../lib/generation-rate-limiter.js';
import type { GenerationJobRepository, JobRecord } from './generate.js';

describe('generation API', () => {
  it('creates a pending job and starts the runner without awaiting it', async () => {
    const jobs = createJobRepository();
    const inputs: Array<{ wallpaperId?: string }> = [];
    let releaseRunner: (() => void) | undefined;
    const runnerDone = new Promise<void>((resolve) => {
      releaseRunner = resolve;
    });
    const app = createApp({
      generation: {
        jobs,
        runner: {
          async run(input) {
            inputs.push(input);
            await runnerDone;
          },
        },
      },
    });

    const response = await app.request('/generate', {
      body: JSON.stringify({
        category: 'Quiet nights',
        deviceId: 'device-123',
        height: 2400,
        mode: 'text2img',
        presetId: 'preset_builtin_minimal',
        userInputs: { idea: 'a calm night sky' },
        width: 1080,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ jobId: 'job-1' });
    expect(jobs.records[0]).toMatchObject({
      category: 'Quiet nights',
      deviceId: 'device-123',
      height: 2400,
      prompt: 'a calm night sky',
      quality: 'hd',
      status: 'pending',
      width: 1080,
    });
    expect(inputs).toEqual([
      expect.objectContaining({
        category: 'Quiet nights',
        deviceId: 'device-123',
        presetId: 'preset_builtin_minimal',
        wallpaperId: 'job-1',
      }),
    ]);

    releaseRunner?.();
  });

  it('returns validation errors for invalid generation input', async () => {
    const app = createApp({ generation: { jobs: createJobRepository() } });

    const response = await app.request('/generate', {
      body: JSON.stringify({
        height: 2400,
        mode: 'text2img',
        userInputs: {},
        width: 100,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid generation request.' },
    });
  });

  it('accepts drafts and rate limits repeated requests from one device', async () => {
    const jobs = createJobRepository();
    const app = createApp({
      generation: {
        jobs,
        rateLimiter: createGenerationRateLimiter({ limit: 1 }),
        runner: { async run() {} },
      },
    });
    const request = () =>
      app.request('/generate', {
        body: JSON.stringify({
          category: 'drafts',
          deviceId: 'device-rate-limited',
          height: 2400,
          mode: 'text2img',
          quality: 'draft',
          userInputs: { idea: 'draft idea' },
          width: 1080,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });

    expect((await request()).status).toBe(202);
    const limited = await request();

    expect(jobs.records[0]?.quality).toBe('draft');
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBeTruthy();
    await expect(limited.json()).resolves.toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });

  it('rejects malformed JSON before creating a job', async () => {
    const jobs = createJobRepository();
    const app = createApp({ generation: { jobs } });

    const response = await app.request('/generate', {
      body: '{',
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
    });
    expect(jobs.records).toHaveLength(0);
  });

  it('returns a job polling response and a 404 for unknown jobs', async () => {
    const jobs = createJobRepository([
      {
        deviceId: 'device-123',
        error: null,
        height: 2400,
        id: 'job-1',
        resultImageUrl: 'https://images.example/job-1.png',
        quality: 'hd',
        status: 'succeeded',
        width: 1080,
      },
    ]);
    const app = createApp({ generation: { jobs } });

    const successful = await app.request('/jobs/job-1');
    expect(successful.status).toBe(200);
    await expect(successful.json()).resolves.toEqual({
      height: 2400,
      resultImageUrl: 'https://images.example/job-1.png',
      quality: 'hd',
      status: 'succeeded',
      width: 1080,
    });

    const missing = await app.request('/jobs/missing');
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toEqual({
      ok: false,
      error: { code: 'JOB_NOT_FOUND', message: 'Generation job was not found.' },
    });
  });

  it('lists built-in presets and device-scoped wallpapers with pagination', async () => {
    const app = createApp({
      presets: {
        async listVisible() {
          return [
            {
              category: 'minimal',
              coverImageUrl: 'https://assets.example/minimal.jpg',
              id: 'preset_builtin_minimal',
              name: 'Minimal',
            },
          ];
        },
      },
      wallpapers: {
        async listByDeviceId({ deviceId, limit, page }) {
          expect({ deviceId, limit, page }).toEqual({ deviceId: 'device-123', limit: 1, page: 2 });
          return [
            {
              category: 'minimal',
              createdAt: new Date('2026-07-26T00:00:00.000Z'),
              favorite: false,
              height: 2400,
              id: 'job-2',
              mode: 'text2img',
              quality: 'hd',
              resultImageUrl: 'https://images.example/job-2.png',
              status: 'succeeded',
              width: 1080,
            },
            {
              category: 'minimal',
              createdAt: new Date('2026-07-25T00:00:00.000Z'),
              favorite: false,
              height: 2400,
              id: 'job-1',
              mode: 'text2img',
              quality: 'hd',
              resultImageUrl: 'https://images.example/job-1.png',
              status: 'succeeded',
              width: 1080,
            },
          ];
        },
        async setFavorite() {
          return null;
        },
      },
    });

    const presets = await app.request('/presets');
    expect(presets.status).toBe(200);
    await expect(presets.json()).resolves.toEqual({
      presets: [
        {
          category: 'minimal',
          coverImageUrl: 'https://assets.example/minimal.jpg',
          id: 'preset_builtin_minimal',
          name: 'Minimal',
        },
      ],
    });

    const wallpapers = await app.request('/wallpapers?deviceId=device-123&limit=1&page=2');
    expect(wallpapers.status).toBe(200);
    await expect(wallpapers.json()).resolves.toEqual({
      hasMore: true,
      items: [
        {
          category: 'minimal',
          createdAt: '2026-07-26T00:00:00.000Z',
          favorite: false,
          height: 2400,
          id: 'job-2',
          mode: 'text2img',
          quality: 'hd',
          resultImageUrl: 'https://images.example/job-2.png',
          status: 'succeeded',
          width: 1080,
        },
      ],
      limit: 1,
      page: 2,
    });
  });
});

function createJobRepository(initialRecords: JobRecord[] = []): GenerationJobRepository & {
  records: Array<JobRecord & { category: string; prompt?: string }>;
} {
  const records: Array<JobRecord & { category: string; prompt?: string }> = initialRecords.map(
    (record) => ({ ...record, category: 'test' }),
  );

  return {
    records,
    async create(data) {
      const job: JobRecord & { prompt: string } = {
        deviceId: data.deviceId ?? null,
        error: null,
        height: data.height,
        id: `job-${records.length + 1}`,
        prompt: data.prompt,
        quality: data.quality,
        resultImageUrl: null,
        status: data.status,
        width: data.width,
      };
      records.push({ ...job, category: data.category });
      return job;
    },
    async findById(id) {
      return records.find((record) => record.id === id) ?? null;
    },
  };
}
