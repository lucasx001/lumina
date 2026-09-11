import { Hono } from 'hono';
import type { ClerkAuthService, ClerkUserProfile } from '../lib/clerk.js';
import { type AuthVariables, requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

export type LocalUser = {
  avatarUrl: string | null;
  clerkUserId: string;
  email: string | null;
  googleSubject: string | null;
  id: string;
  nickname: string | null;
};

export type MeRepository = {
  upsertUser(user: ClerkUserProfile): Promise<LocalUser>;
};

export type MeRouteDependencies = {
  clerk: ClerkAuthService;
  users?: MeRepository;
};

type MeEnvironment = {
  Variables: AuthVariables;
};

export function createMeRoutes({ clerk, users }: MeRouteDependencies) {
  const routes = new Hono<MeEnvironment>();

  routes.use('/me', requireAuth(clerk));

  routes.get('/me', async (context) => {
    const user = await syncLocalUser(context.get('user')?.clerkUserId, clerk, users);
    return context.json({ user });
  });

  return routes;
}

export async function syncLocalUser(
  clerkUserId: string | undefined,
  clerk: ClerkAuthService,
  users?: MeRepository,
): Promise<LocalUser> {
  if (!clerkUserId) {
    throw new AppError('Authentication is required.', 401, 'UNAUTHORIZED');
  }

  const profile = await clerk.getUser(clerkUserId);
  const repository = users ?? (await createPrismaMeRepository());
  return repository.upsertUser(profile);
}

async function createPrismaMeRepository(): Promise<MeRepository> {
  const { prisma } = await import('../lib/db.js');

  return {
    upsertUser: (user) =>
      prisma.user.upsert({
        create: user,
        update: {
          avatarUrl: user.avatarUrl,
          email: user.email,
          googleSubject: user.googleSubject,
          nickname: user.nickname,
        },
        where: { clerkUserId: user.clerkUserId },
      }),
  };
}
