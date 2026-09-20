import { Hono } from 'hono';
import { z } from 'zod';

import type { R2Storage } from '../lib/r2.js';
import type { ClerkAuthService } from '../lib/clerk.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { syncLocalUser, type MeRepository } from './me.js';

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export type CategoryListItem = {
  count: number;
  coverImageUrls: string[];
  id: string;
  name: string;
};

export type CategoryRecord = {
  id: string;
  name: string;
  userId: string;
};

export type CategoryRepository = {
  create(input: { name: string; normalizedName: string; userId: string }): Promise<CategoryRecord>;
  findById(input: { id: string; userId: string }): Promise<CategoryRecord | null>;
  listByUserId(userId: string): Promise<CategoryListItem[]>;
};

export type CategoryRouteDependencies = {
  clerk: ClerkAuthService;
  categories?: CategoryRepository;
  storage?: Pick<R2Storage, 'getUrl'>;
  users?: MeRepository;
};

export function createCategoryRoutes({
  categories,
  clerk,
  storage,
  users,
}: CategoryRouteDependencies) {
  const routes = new Hono<{ Variables: AuthVariables }>();
  routes.use('*', requireAuth(clerk));

  routes.get('/categories', async (context) => {
    const user = await syncLocalUser(context.get('user')?.clerkUserId, clerk, users);
    const repository = categories ?? (await createPrismaCategoryRepository(storage));
    return context.json({ categories: await repository.listByUserId(user.id) });
  });

  routes.post('/categories', async (context) => {
    const payload = await parseRequestBody(context.req.raw);
    const parsed = createCategorySchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError('Category name is invalid.', 400, 'VALIDATION_ERROR');
    }

    const user = await syncLocalUser(context.get('user')?.clerkUserId, clerk, users);
    const repository = categories ?? (await createPrismaCategoryRepository(storage));
    const category = await repository.create({
      name: parsed.data.name,
      normalizedName: normalizeCategoryName(parsed.data.name),
      userId: user.id,
    });

    return context.json({ category }, 201);
  });

  return routes;
}

export function normalizeCategoryName(name: string): string {
  return name.normalize('NFKC').trim().toLocaleLowerCase();
}

async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError('Request body must be valid JSON.', 400, 'INVALID_JSON');
  }
}

async function createPrismaCategoryRepository(
  suppliedStorage?: Pick<R2Storage, 'getUrl'>,
): Promise<CategoryRepository> {
  const { prisma } = await import('../lib/db.js');
  const storage = suppliedStorage ?? (await createStorage());

  return {
    async create({ name, normalizedName, userId }) {
      const existing = await prisma.category.findFirst({ where: { normalizedName, userId } });
      if (existing) {
        return existing;
      }

      return prisma.category.create({ data: { name, normalizedName, userId } });
    },
    findById: ({ id, userId }) => prisma.category.findFirst({ where: { id, userId } }),
    async listByUserId(userId) {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        where: { userId },
      });

      return Promise.all(
        categories.map(async (category) => {
          const wallpapers = await prisma.wallpaper.findMany({
            orderBy: { createdAt: 'desc' },
            select: { resultImageKey: true },
            take: 2,
            where: {
              categoryId: category.id,
              resultImageKey: { not: null },
              status: 'succeeded',
              userId,
            },
          });
          const count = await prisma.wallpaper.count({
            where: {
              categoryId: category.id,
              resultImageKey: { not: null },
              status: 'succeeded',
              userId,
            },
          });

          return {
            count,
            coverImageUrls: await Promise.all(
              wallpapers.flatMap((wallpaper) =>
                wallpaper.resultImageKey ? [storage.getUrl(wallpaper.resultImageKey)] : [],
              ),
            ),
            id: category.id,
            name: category.name,
          };
        }),
      );
    },
  };
}

async function createStorage(): Promise<Pick<R2Storage, 'getUrl'>> {
  const [{ loadEnv }, { createR2Storage }] = await Promise.all([
    import('../config/env.js'),
    import('../lib/r2.js'),
  ]);
  const env = loadEnv();
  return createR2Storage({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    accountId: env.R2_ACCOUNT_ID,
    bucket: env.R2_BUCKET,
    endpoint: env.R2_ENDPOINT,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });
}
