import { describe, expect, it } from 'vite-plus/test';

import { createApp } from '../app.js';
import type { GenerationJobRepository, JobRecord } from '../routes/generate.js';
import { authHeaders, createAuthFixture } from './auth-fixtures.js';

describe('generation API', () => {
  it('recovers only the current account unfinished jobs and optionally its recent results', async () => {
    const fixture = createAuthFixture();
    const base: JobRecord = {
      id: 'job-a',
      categoryId: 'category-a',
      error: null,
      height: null,
      width: null,
      quality: 'hd',
      status: 'processing',
      userId: 'local-1',
      resultImageUrl: null,
    };
    const jobs = createJobs([
      base,
      { ...base, id: 'done-a', status: 'succeeded' },
      { ...base, id: 'job-b', userId: 'local-2' },
    ]);
    const app = createApp({ clerk: fixture.clerk, me: fixture.users, generation: { jobs } });
    expect((await app.request('/jobs')).status).toBe(401);
    const own = await app.request('/jobs', { headers: authHeaders() });
    await expect(own.json()).resolves.toMatchObject({ jobs: [{ wallpaperId: 'job-a' }] });
    const recent = await app.request('/jobs?status=recent', { headers: authHeaders() });
    expect(
      (await recent.json()).jobs.map((job: { wallpaperId: string }) => job.wallpaperId),
    ).toEqual(['job-a', 'done-a']);
    const other = await app.request('/jobs', { headers: authHeaders('token-user-b') });
    await expect(other.json()).resolves.toMatchObject({ jobs: [{ wallpaperId: 'job-b' }] });
    expect((await app.request('/jobs?status=unknown', { headers: authHeaders() })).status).toBe(
      400,
    );
  });
  it('creates an account-owned job using an account-owned category', async () => {
    const fixture = createAuthFixture();
    const inputs: unknown[] = [];
    const jobs = createJobs();
    const app = createApp({
      clerk: fixture.clerk,
      generation: {
        categories: {
          async findById(input) {
            expect(input).toEqual({ id: 'category-a', userId: 'local-1' });
            return { id: 'category-a', name: 'Nature' };
          },
        },
        jobs,
        runner: {
          async run(input) {
            inputs.push(input);
          },
        },
      },
      me: fixture.users,
    });

    const response = await app.request('/generate', {
      body: JSON.stringify({
        categoryId: 'category-a',
        height: 2400,
        mode: 'text2img',
        quality: 'hd',
        userInputs: { idea: 'a calm night sky' },
        width: 1080,
      }),
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ jobId: 'job-1' });
    expect(jobs.records[0]).toMatchObject({ categoryId: 'category-a', userId: 'local-1' });
    expect(inputs[0]).toMatchObject({
      categoryId: 'category-a',
      clerkUserId: 'user-a',
      userId: 'local-1',
      wallpaperId: 'job-1',
    });
  });

  it('rejects anonymous and cross-account generation requests', async () => {
    const fixture = createAuthFixture();
    const app = createApp({
      clerk: fixture.clerk,
      generation: {
        categories: {
          async findById(input) {
            return input.userId === 'local-1' ? { id: input.id, name: 'Nature' } : null;
          },
        },
        jobs: createJobs(),
        runner: { async run() {} },
      },
      me: fixture.users,
    });
    const body = JSON.stringify({
      categoryId: 'category-a',
      height: 2400,
      mode: 'text2img',
      userInputs: { idea: 'night sky' },
      width: 1080,
    });

    expect((await app.request('/generate', { body, method: 'POST' })).status).toBe(401);
    await app.request('/me', { headers: authHeaders() });
    expect(
      (
        await app.request('/generate', {
          body,
          headers: { ...authHeaders('token-user-b'), 'content-type': 'application/json' },
          method: 'POST',
        })
      ).status,
    ).toBe(404);
  });

  it('rejects source image keys owned by another account', async () => {
    const fixture = createAuthFixture();
    const app = createApp({
      clerk: fixture.clerk,
      generation: {
        categories: {
          async findById() {
            return { id: 'category-a', name: 'Nature' };
          },
        },
        jobs: createJobs(),
        runner: { async run() {} },
      },
      me: fixture.users,
    });

    const response = await app.request('/generate', {
      body: JSON.stringify({
        categoryId: 'category-a',
        height: 2400,
        mode: 'edit',
        sourceImageKey: 'sources/local-2/202609/source.png',
        userInputs: { idea: 'make it warmer' },
        width: 1080,
      }),
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'SOURCE_IMAGE_NOT_FOUND' },
    });
  });

  it('only returns a job to its owning account', async () => {
    const fixture = createAuthFixture();
    const jobs = createJobs([
      {
        categoryId: 'category-a',
        error: null,
        height: 2400,
        id: 'job-a',
        resultImageUrl: 'https://images.example/a.png',
        quality: 'hd',
        status: 'succeeded',
        userId: 'local-1',
        width: 1080,
      },
    ]);
    const app = createApp({
      clerk: fixture.clerk,
      generation: { jobs, runner: { async run() {} } },
      me: fixture.users,
    });

    const owner = await app.request('/jobs/job-a', { headers: authHeaders() });
    expect(owner.status).toBe(200);
    await expect(owner.json()).resolves.toMatchObject({
      categoryId: 'category-a',
      wallpaperId: 'job-a',
    });

    const otherAccount = await app.request('/jobs/job-a', {
      headers: authHeaders('token-user-b'),
    });
    expect(otherAccount.status).toBe(404);
  });
});

function createJobs(initial: JobRecord[] = []): GenerationJobRepository & { records: JobRecord[] } {
  const records = [...initial];
  return {
    records,
    async listByUserId({ userId, recent }) {
      return records.filter(
        (record) =>
          record.userId === userId && (recent || ['pending', 'processing'].includes(record.status)),
      );
    },
    async create(data) {
      const job: JobRecord = {
        categoryId: data.categoryId,
        error: null,
        height: data.height,
        id: `job-${records.length + 1}`,
        resultImageUrl: null,
        quality: data.quality,
        status: data.status,
        userId: data.userId,
        width: data.width,
      };
      records.push(job);
      return job;
    },
    async findById(input) {
      return (
        records.find((record) => record.id === input.id && record.userId === input.userId) ?? null
      );
    },
  };
}
