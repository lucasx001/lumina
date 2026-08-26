import { Hono } from 'hono';
import { z } from 'zod';

import type { WallpaperGraphInput } from '../graph/wallpaper.graph.js';
import { generationRunner, type GenerationRunner } from '../jobs/runner.js';
import {
  generationRateLimiter,
  type GenerationRateLimiter,
} from '../lib/generation-rate-limiter.js';
import { AppError } from '../middleware/error.js';
import type { AuthVariables } from '../middleware/auth.js';

const wallpaperModes = ['text2img', 'outpaint', 'edit', 'style', 'upscale'] as const;
const wallpaperQualities = ['draft', 'hd'] as const;

const userInputsSchema = z.object({
  idea: z.string().trim().min(1).max(1_000).optional(),
  mood: z.string().trim().min(1).max(200).optional(),
  theme: z.string().trim().min(1).max(200).optional(),
  tone: z.string().trim().min(1).max(200).optional(),
});

const generateRequestSchema = z.object({
  category: z.string().trim().min(1).max(100),
  deviceId: z.string().trim().min(1).max(200).optional(),
  height: z.number().int().min(256).max(8_192),
  mode: z.enum(wallpaperModes),
  quality: z.enum(wallpaperQualities).default('hd'),
  presetId: z.string().trim().min(1).max(200).optional(),
  sourceImageUrl: z.url().optional(),
  userInputs: userInputsSchema,
  width: z.number().int().min(256).max(8_192),
});

export type JobRecord = {
  deviceId: string | null;
  error: string | null;
  height: number | null;
  id: string;
  resultImageUrl: string | null;
  quality: string;
  status: string;
  width: number | null;
};

export type GenerationJobRepository = {
  create(data: {
    category: string;
    deviceId?: string;
    height: number;
    mode: string;
    presetId?: string;
    prompt: string;
    quality: string;
    sourceImageUrl?: string;
    status: string;
    width: number;
  }): Promise<JobRecord>;
  findById(id: string): Promise<JobRecord | null>;
};

export type GenerateRouteDependencies = {
  jobs?: GenerationJobRepository;
  rateLimiter?: GenerationRateLimiter;
  runner?: GenerationRunner;
};

export function createGenerateRoutes(dependencies: GenerateRouteDependencies = {}) {
  const routes = new Hono<{ Variables: AuthVariables }>();

  routes.post('/generate', async (context) => {
    const payload = await parseRequestBody(context.req.raw);
    const parsed = generateRequestSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError('Invalid generation request.', 400, 'VALIDATION_ERROR');
    }

    if (
      (parsed.data.mode !== 'text2img' && !parsed.data.sourceImageUrl) ||
      (parsed.data.mode !== 'style' && !Object.values(parsed.data.userInputs).some(Boolean))
    ) {
      throw new AppError('Invalid generation request.', 400, 'VALIDATION_ERROR');
    }
    if (parsed.data.mode === 'style' && !context.get('user')) {
      throw new AppError(
        'Authentication is required to save a custom preset.',
        401,
        'UNAUTHORIZED',
      );
    }

    const jobs = dependencies.jobs ?? (await createPrismaJobRepository());
    const input = parsed.data;
    const rateLimit = (dependencies.rateLimiter ?? generationRateLimiter).check(
      generationRateLimitKey(context.get('user')?.clerkUserId, input.deviceId),
    );
    if (!rateLimit.allowed) {
      context.header('Retry-After', String(rateLimit.retryAfterSeconds));
      return context.json(
        {
          ok: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many generation requests. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
          },
        },
        429,
      );
    }
    const job = await jobs.create({
      category: input.category,
      deviceId: input.deviceId,
      height: input.height,
      mode: input.mode,
      presetId: input.presetId,
      prompt: initialPrompt(input.userInputs),
      quality: input.quality,
      sourceImageUrl: input.sourceImageUrl,
      status: 'pending',
      width: input.width,
    });
    const graphInput: WallpaperGraphInput = {
      ...input,
      clerkUserId: context.get('user')?.clerkUserId,
      wallpaperId: job.id,
    };
    const runner = dependencies.runner ?? generationRunner;

    void runner.run(graphInput).catch(() => {});

    return context.json({ jobId: job.id }, 202);
  });

  routes.get('/jobs/:id', async (context) => {
    const jobId = context.req.param('id').trim();
    if (!jobId) {
      throw new AppError('Job id is required.', 400, 'VALIDATION_ERROR');
    }

    const jobs = dependencies.jobs ?? (await createPrismaJobRepository());
    const job = await jobs.findById(jobId);
    if (!job) {
      throw new AppError('Generation job was not found.', 404, 'JOB_NOT_FOUND');
    }

    return context.json({
      ...(job.error ? { error: job.error } : {}),
      ...(job.height ? { height: job.height } : {}),
      ...(job.resultImageUrl ? { resultImageUrl: job.resultImageUrl } : {}),
      quality: job.quality,
      status: job.status,
      ...(job.width ? { width: job.width } : {}),
    });
  });

  return routes;
}

function generationRateLimitKey(
  clerkUserId: string | undefined,
  deviceId: string | undefined,
): string {
  return clerkUserId ? `user:${clerkUserId}` : `device:${deviceId ?? 'anonymous'}`;
}

async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError('Request body must be valid JSON.', 400, 'INVALID_JSON');
  }
}

function initialPrompt(userInputs: WallpaperGraphInput['userInputs']): string {
  return [userInputs.idea, userInputs.theme, userInputs.mood, userInputs.tone]
    .filter((value): value is string => Boolean(value))
    .join(', ');
}

async function createPrismaJobRepository(): Promise<GenerationJobRepository> {
  const { prisma } = await import('../lib/db.js');

  return {
    create: (data) => prisma.wallpaper.create({ data }),
    findById: (id) => prisma.wallpaper.findUnique({ where: { id } }),
  };
}
