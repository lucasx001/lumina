import { Hono } from 'hono';
import { z } from 'zod';

import type { WallpaperGraphInput } from '../graph/wallpaper.graph.js';
import { generationRunner, type GenerationRunner } from '../jobs/runner.js';
import type { ClerkAuthService } from '../lib/clerk.js';
import {
  generationRateLimiter,
  type GenerationRateLimiter,
} from '../lib/generation-rate-limiter.js';
import { isOwnedSourceImageKey } from '../lib/r2.js';
import { AppError } from '../middleware/error.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import { syncLocalUser, type LocalUser, type MeRepository } from './me.js';

const wallpaperModes = ['text2img', 'outpaint', 'edit', 'style', 'upscale'] as const;
const wallpaperQualities = ['draft', 'hd'] as const;

const userInputsSchema = z.object({
  idea: z.string().trim().min(1).max(1_000).optional(),
  mood: z.string().trim().min(1).max(200).optional(),
  theme: z.string().trim().min(1).max(200).optional(),
  tone: z.string().trim().min(1).max(200).optional(),
});

const generateRequestSchema = z.object({
  categoryId: z.string().trim().min(1).max(200),
  height: z.number().int().min(256).max(8_192),
  mode: z.enum(wallpaperModes),
  quality: z.enum(wallpaperQualities).default('hd'),
  presetId: z.string().trim().min(1).max(200).optional(),
  sourceImageKey: z.string().trim().min(1).max(500).optional(),
  userInputs: userInputsSchema,
  width: z.number().int().min(256).max(8_192),
});

export type JobRecord = {
  category?: string;
  createdAt?: Date;
  mode?: string;
  categoryId: string;
  error: string | null;
  height: number | null;
  id: string;
  resultImageUrl: string | null;
  quality: string;
  status: string;
  userId: string;
  width: number | null;
};

export type GenerationJobRepository = {
  listByUserId(input: { userId: string; recent: boolean }): Promise<JobRecord[]>;
  create(data: {
    categoryId: string;
    height: number;
    mode: string;
    presetId?: string;
    prompt: string;
    quality: string;
    sourceImageKey?: string;
    status: string;
    userId: string;
    width: number;
  }): Promise<JobRecord>;
  findById(input: { id: string; userId: string }): Promise<JobRecord | null>;
};

export type GenerateRouteDependencies = {
  categories?: {
    findById(input: { id: string; userId: string }): Promise<{ id: string; name: string } | null>;
  };
  clerk: ClerkAuthService;
  jobs?: GenerationJobRepository;
  rateLimiter?: GenerationRateLimiter;
  runner?: GenerationRunner;
  users?: MeRepository;
};

export function createGenerateRoutes(dependencies: GenerateRouteDependencies) {
  const routes = new Hono<{ Variables: AuthVariables }>();
  routes.use('*', requireAuth(dependencies.clerk));

  routes.post('/generate', async (context) => {
    const payload = await parseRequestBody(context.req.raw);
    const parsed = generateRequestSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError('Invalid generation request.', 400, 'VALIDATION_ERROR');
    }

    if (
      (parsed.data.mode !== 'text2img' && !parsed.data.sourceImageKey) ||
      (parsed.data.mode !== 'style' && !Object.values(parsed.data.userInputs).some(Boolean))
    ) {
      throw new AppError('Invalid generation request.', 400, 'VALIDATION_ERROR');
    }

    const user = await syncLocalUser(
      context.get('user')?.clerkUserId,
      dependencies.clerk,
      dependencies.users,
    );
    const clerkUserId = context.get('user')?.clerkUserId;
    if (!clerkUserId) {
      throw new AppError('Authentication is required.', 401, 'UNAUTHORIZED');
    }
    const category = await resolveCategory(parsed.data.categoryId, user, dependencies.categories);
    if (parsed.data.sourceImageKey && !isOwnedSourceImageKey(parsed.data.sourceImageKey, user.id)) {
      throw new AppError('Source image was not found.', 404, 'SOURCE_IMAGE_NOT_FOUND');
    }
    const jobs = dependencies.jobs ?? (await createPrismaJobRepository());
    const input = parsed.data;
    const rateLimit = (dependencies.rateLimiter ?? generationRateLimiter).check(
      'user:' + clerkUserId,
    );
    if (!rateLimit.allowed) {
      context.header('Retry-After', String(rateLimit.retryAfterSeconds));
      return context.json(
        {
          ok: false,
          error: {
            code: 'RATE_LIMITED',
            message:
              'Too many generation requests. Try again in ' +
              String(rateLimit.retryAfterSeconds) +
              ' seconds.',
          },
        },
        429,
      );
    }

    const job = await jobs.create({
      categoryId: category.id,
      height: input.height,
      mode: input.mode,
      presetId: input.presetId,
      prompt: initialPrompt(input.userInputs),
      quality: input.quality,
      sourceImageKey: input.sourceImageKey,
      status: 'pending',
      userId: user.id,
      width: input.width,
    });
    const graphInput: WallpaperGraphInput = {
      category: category.name,
      categoryId: category.id,
      clerkUserId,
      height: input.height,
      mode: input.mode,
      presetId: input.presetId,
      quality: input.quality,
      sourceImageKey: input.sourceImageKey,
      userId: user.id,
      userInputs: input.userInputs,
      wallpaperId: job.id,
      width: input.width,
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

    const user = await syncLocalUser(
      context.get('user')?.clerkUserId,
      dependencies.clerk,
      dependencies.users,
    );
    const jobs = dependencies.jobs ?? (await createPrismaJobRepository());
    const job = await jobs.findById({ id: jobId, userId: user.id });
    if (!job) {
      throw new AppError('Generation job was not found.', 404, 'JOB_NOT_FOUND');
    }

    return context.json({
      category: job.category,
      mode: job.mode,
      createdAt: job.createdAt,
      ...(job.error ? { error: job.error } : {}),
      ...(job.height ? { height: job.height } : {}),
      ...(job.resultImageUrl ? { resultImageUrl: job.resultImageUrl } : {}),
      categoryId: job.categoryId,
      quality: job.quality,
      status: job.status,
      userId: job.userId,
      ...(job.width ? { width: job.width } : {}),
      wallpaperId: job.id,
    });
  });

  routes.get('/jobs', async (context) => {
    const status = context.req.query('status') ?? 'unfinished';
    if (!['unfinished', 'recent'].includes(status)) {
      throw new AppError('Invalid job status filter.', 400, 'VALIDATION_ERROR');
    }
    const user = await syncLocalUser(
      context.get('user')?.clerkUserId,
      dependencies.clerk,
      dependencies.users,
    );
    const jobs = dependencies.jobs ?? (await createPrismaJobRepository());
    const records = await jobs.listByUserId({ userId: user.id, recent: status === 'recent' });
    return context.json({ jobs: records.map(({ id, ...job }) => ({ ...job, wallpaperId: id })) });
  });

  return routes;
}

async function resolveCategory(
  categoryId: string,
  user: LocalUser,
  repository:
    | {
        findById(input: {
          id: string;
          userId: string;
        }): Promise<{ id: string; name: string } | null>;
      }
    | undefined,
): Promise<{ id: string; name: string }> {
  const resolvedRepository = repository ?? (await createPrismaCategoryRepository());
  const category = await resolvedRepository.findById({ id: categoryId, userId: user.id });
  if (!category) {
    throw new AppError('Category was not found.', 404, 'CATEGORY_NOT_FOUND');
  }

  return category;
}

async function createPrismaCategoryRepository() {
  const { prisma } = await import('../lib/db.js');
  return {
    findById: ({ id, userId }: { id: string; userId: string }) =>
      prisma.category.findFirst({ select: { id: true, name: true }, where: { id, userId } }),
  };
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
  const [{ prisma }, { loadEnv }, { createR2Storage }] = await Promise.all([
    import('../lib/db.js'),
    import('../config/env.js'),
    import('../lib/r2.js'),
  ]);
  const env = loadEnv();
  const storage = createR2Storage({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    accountId: env.R2_ACCOUNT_ID,
    bucket: env.R2_BUCKET,
    endpoint: env.R2_ENDPOINT,
    publicBaseUrl: env.R2_PUBLIC_BASE_URL,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });

  return {
    async listByUserId({ userId, recent }) {
      const active = await prisma.wallpaper.findMany({
        where: { userId, status: { in: ['pending', 'processing'] } },
        include: { category: { select: { name: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      const finished = recent
        ? await prisma.wallpaper.findMany({
            where: { userId, status: { in: ['succeeded', 'failed'] } },
            include: { category: { select: { name: true } } },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 20,
          })
        : [];
      const records = [...active, ...finished];
      return Promise.all(
        records.map(async (job) => ({
          id: job.id,
          categoryId: job.categoryId,
          createdAt: job.createdAt,
          mode: job.mode,
          error: job.error,
          height: job.height,
          width: job.width,
          quality: job.quality,
          status: job.status,
          userId: job.userId,
          category: job.category.name,
          resultImageUrl: job.resultImageKey ? await storage.getUrl(job.resultImageKey) : null,
        })),
      );
    },
    create: async (data) => {
      const { sourceImageKey, ...jobData } = data;
      const job = await prisma.wallpaper.create({
        data: { ...jobData, sourceImageKey },
      });
      return {
        categoryId: job.categoryId,
        error: job.error,
        height: job.height,
        id: job.id,
        resultImageUrl: null,
        quality: job.quality,
        status: job.status,
        userId: job.userId,
        width: job.width,
      };
    },
    findById: async ({ id, userId }) => {
      const job = await prisma.wallpaper.findFirst({
        where: { id, userId },
        include: { category: { select: { name: true } } },
      });
      if (!job) {
        return null;
      }

      return {
        category: job.category.name,
        mode: job.mode,
        createdAt: job.createdAt,
        categoryId: job.categoryId,
        error: job.error,
        height: job.height,
        id: job.id,
        resultImageUrl: job.resultImageKey ? await storage.getUrl(job.resultImageKey) : null,
        quality: job.quality,
        status: job.status,
        userId: job.userId,
        width: job.width,
      };
    },
  };
}
