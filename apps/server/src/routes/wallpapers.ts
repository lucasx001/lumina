import { Hono } from 'hono';
import { z } from 'zod';

import type { ClerkAuthService } from '../lib/clerk.js';
import type { R2Storage } from '../lib/r2.js';
import { AppError } from '../middleware/error.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import { syncLocalUser, type MeRepository } from './me.js';

const querySchema = z.object({
  categoryId: z.string().trim().min(1).max(200).optional(),
  favorite: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type WallpaperListItem = {
  category: string;
  categoryId: string;
  createdAt: Date;
  favorite: boolean;
  height: number | null;
  id: string;
  mode: string;
  quality: string;
  resultImageUrl: string | null;
  status: string;
  width: number | null;
};

export type WallpaperRepository = {
  getById(input: { id: string; userId: string }): Promise<WallpaperListItem | null>;
  listByUserId(input: {
    categoryId?: string;
    favorite?: boolean;
    limit: number;
    page: number;
    userId: string;
  }): Promise<WallpaperListItem[]>;
  setFavorite(input: {
    favorite: boolean;
    id: string;
    userId: string;
  }): Promise<WallpaperListItem | null>;
};

export type WallpaperRouteDependencies = {
  clerk: ClerkAuthService;
  repository?: WallpaperRepository;
  storage?: Pick<R2Storage, 'getUrl'>;
  users?: MeRepository;
};

export function createWallpaperRoutes({
  clerk,
  repository,
  storage,
  users,
}: WallpaperRouteDependencies) {
  const routes = new Hono<{ Variables: AuthVariables }>();
  routes.use('*', requireAuth(clerk));

  routes.get('/wallpapers', async (context) => {
    const parsed = querySchema.safeParse(context.req.query());
    if (!parsed.success) {
      throw new AppError('categoryId, page, or limit is invalid.', 400, 'VALIDATION_ERROR');
    }

    const user = await syncLocalUser(context.get('user')?.clerkUserId, clerk, users);
    const resolvedRepository = repository ?? (await createPrismaWallpaperRepository(storage));
    const wallpapers = await resolvedRepository.listByUserId({ ...parsed.data, userId: user.id });
    const { limit, page } = parsed.data;

    return context.json({
      hasMore: wallpapers.length > limit,
      items: wallpapers.slice(0, limit),
      limit,
      page,
    });
  });

  routes.get('/wallpapers/:id', async (context) => {
    const user = await syncLocalUser(context.get('user')?.clerkUserId, clerk, users);
    const resolvedRepository = repository ?? (await createPrismaWallpaperRepository(storage));
    const wallpaper = await resolvedRepository.getById({
      id: context.req.param('id'),
      userId: user.id,
    });
    if (!wallpaper) {
      throw new AppError('Wallpaper was not found.', 404, 'WALLPAPER_NOT_FOUND');
    }

    return context.json({ wallpaper });
  });

  routes.get('/wallpapers/:id/image', async (context) => {
    const user = await syncLocalUser(context.get('user')?.clerkUserId, clerk, users);
    const resolvedRepository = repository ?? (await createPrismaWallpaperRepository(storage));
    const wallpaper = await resolvedRepository.getById({
      id: context.req.param('id'),
      userId: user.id,
    });
    if (!wallpaper?.resultImageUrl) {
      throw new AppError('Wallpaper image was not found.', 404, 'WALLPAPER_IMAGE_NOT_FOUND');
    }

    return context.json({ url: wallpaper.resultImageUrl });
  });

  routes.patch('/wallpapers/:id/favorite', async (context) => {
    const parsed = favoriteRequestSchema.safeParse(await parseRequestBody(context.req.raw));
    if (!parsed.success) {
      throw new AppError('Favorite request is invalid.', 400, 'VALIDATION_ERROR');
    }

    const user = await syncLocalUser(context.get('user')?.clerkUserId, clerk, users);
    const resolvedRepository = repository ?? (await createPrismaWallpaperRepository(storage));
    const wallpaper = await resolvedRepository.setFavorite({
      ...parsed.data,
      id: context.req.param('id'),
      userId: user.id,
    });
    if (!wallpaper) {
      throw new AppError('Wallpaper was not found.', 404, 'WALLPAPER_NOT_FOUND');
    }

    return context.json({ wallpaper });
  });

  return routes;
}

const favoriteRequestSchema = z.object({
  favorite: z.boolean(),
});

async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError('Request body must be valid JSON.', 400, 'INVALID_JSON');
  }
}

async function createPrismaWallpaperRepository(
  suppliedStorage?: Pick<R2Storage, 'getUrl'>,
): Promise<WallpaperRepository> {
  const { prisma } = await import('../lib/db.js');
  const storage = suppliedStorage ?? (await createStorage());

  const toListItem = async (wallpaper: {
    category: { id: string; name: string };
    createdAt: Date;
    favorite: boolean;
    height: number | null;
    id: string;
    mode: string;
    quality: string;
    resultImageKey: string | null;
    status: string;
    width: number | null;
  }): Promise<WallpaperListItem> => ({
    category: wallpaper.category.name,
    categoryId: wallpaper.category.id,
    createdAt: wallpaper.createdAt,
    favorite: wallpaper.favorite,
    height: wallpaper.height,
    id: wallpaper.id,
    mode: wallpaper.mode,
    quality: wallpaper.quality,
    resultImageUrl: wallpaper.resultImageKey
      ? await storage.getUrl(wallpaper.resultImageKey)
      : null,
    status: wallpaper.status,
    width: wallpaper.width,
  });

  const whereFor = ({
    categoryId,
    favorite,
    userId,
  }: {
    categoryId?: string;
    favorite?: boolean;
    userId: string;
  }) => ({
    ...(categoryId ? { categoryId } : {}),
    ...(favorite === undefined ? {} : { favorite }),
    resultImageKey: { not: null },
    status: 'succeeded',
    userId,
  });

  const getById = async ({ id, userId }: { id: string; userId: string }) => {
    const wallpaper = await prisma.wallpaper.findFirst({
      include: { category: { select: { id: true, name: true } } },
      where: { ...whereFor({ userId }), id },
    });
    return wallpaper ? toListItem(wallpaper) : null;
  };

  return {
    getById,
    async listByUserId({ categoryId, favorite, limit, page, userId }) {
      const wallpapers = await prisma.wallpaper.findMany({
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit + 1,
        where: whereFor({ categoryId, favorite, userId }),
      });
      return Promise.all(wallpapers.map(toListItem));
    },
    async setFavorite({ favorite, id, userId }) {
      const updated = await prisma.wallpaper.updateMany({
        data: { favorite },
        where: { ...whereFor({ userId }), id },
      });
      if (!updated.count) {
        return null;
      }

      return getById({ id, userId });
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
    publicBaseUrl: env.R2_PUBLIC_BASE_URL,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });
}
