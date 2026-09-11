import { Hono } from 'hono';

import type { ClerkAuthService } from '../lib/clerk.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';

export type PresetListItem = {
  category: string;
  coverImageUrl: string | null;
  id: string;
  name: string;
};

export type PresetRepository = {
  listVisible(clerkUserId: string): Promise<PresetListItem[]>;
};

export function createPresetRoutes({
  clerk,
  repository,
}: {
  clerk: ClerkAuthService;
  repository?: PresetRepository;
}) {
  const routes = new Hono<{ Variables: AuthVariables }>();
  routes.use('*', requireAuth(clerk));

  routes.get('/presets', async (context) => {
    const clerkUserId = context.get('user')?.clerkUserId;
    if (!clerkUserId) {
      throw new Error('Authenticated Clerk user is missing.');
    }
    const resolvedRepository = repository ?? (await createPrismaPresetRepository());
    const presets = await resolvedRepository.listVisible(clerkUserId);
    return context.json({ presets });
  });

  return routes;
}

async function createPrismaPresetRepository(): Promise<PresetRepository> {
  const { prisma } = await import('../lib/db.js');

  return {
    listVisible: (clerkUserId) =>
      prisma.preset.findMany({
        orderBy: { name: 'asc' },
        select: { category: true, coverImageUrl: true, id: true, name: true },
        where: {
          OR: [{ isBuiltIn: true }, ...(clerkUserId ? [{ owner: { clerkUserId } }] : [])],
        },
      }),
  };
}
