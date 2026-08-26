import { Hono } from 'hono';
import { z } from 'zod';

import { AppError } from '../middleware/error.js';

const querySchema = z.object({
  category: z.string().trim().min(1).max(100).optional(),
  deviceId: z.string().trim().min(1).max(200),
  favorite: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type WallpaperListItem = {
  category: string;
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
  listByDeviceId(input: {
    category?: string;
    deviceId: string;
    favorite?: boolean;
    limit: number;
    page: number;
  }): Promise<WallpaperListItem[]>;
  setFavorite(input: {
    deviceId: string;
    favorite: boolean;
    id: string;
  }): Promise<WallpaperListItem | null>;
};

export function createWallpaperRoutes(repository?: WallpaperRepository) {
  const routes = new Hono();

  routes.get('/wallpapers', async (context) => {
    const parsed = querySchema.safeParse(context.req.query());
    if (!parsed.success) {
      throw new AppError('deviceId, page, or limit is invalid.', 400, 'VALIDATION_ERROR');
    }

    const wallpapers = await (
      repository ?? (await createPrismaWallpaperRepository())
    ).listByDeviceId(parsed.data);
    const { limit, page } = parsed.data;

    return context.json({
      hasMore: wallpapers.length > limit,
      items: wallpapers.slice(0, limit),
      limit,
      page,
    });
  });

  routes.patch('/wallpapers/:id/favorite', async (context) => {
    const parsed = favoriteRequestSchema.safeParse(await parseRequestBody(context.req.raw));
    if (!parsed.success) {
      throw new AppError('Favorite request is invalid.', 400, 'VALIDATION_ERROR');
    }

    const wallpaper = await (repository ?? (await createPrismaWallpaperRepository())).setFavorite({
      ...parsed.data,
      id: context.req.param('id'),
    });
    if (!wallpaper) {
      throw new AppError('Wallpaper was not found.', 404, 'WALLPAPER_NOT_FOUND');
    }

    return context.json({ wallpaper });
  });

  return routes;
}

const favoriteRequestSchema = z.object({
  deviceId: z.string().trim().min(1).max(200),
  favorite: z.boolean(),
});

async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError('Request body must be valid JSON.', 400, 'INVALID_JSON');
  }
}

async function createPrismaWallpaperRepository(): Promise<WallpaperRepository> {
  const { prisma } = await import('../lib/db.js');

  return {
    async listByDeviceId({ category, deviceId, favorite, limit, page }) {
      const wallpapers = await prisma.wallpaper.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit + 1,
        where: {
          ...(category ? { category } : {}),
          deviceId,
          ...(favorite === undefined ? {} : { favorite }),
        },
      });
      return wallpapers;
    },
    async setFavorite({ deviceId, favorite, id }) {
      const updated = await prisma.wallpaper.updateMany({
        data: { favorite },
        where: { deviceId, id },
      });
      if (!updated.count) {
        return null;
      }

      const wallpaper = await prisma.wallpaper.findUnique({
        where: { id },
      });
      if (!wallpaper) {
        return null;
      }

      return wallpaper;
    },
  };
}
