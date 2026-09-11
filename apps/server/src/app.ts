import { cors } from 'hono/cors';
import { Hono } from 'hono';

import { createClerkAuthService, type ClerkAuthService } from './lib/clerk.js';
import { type AuthVariables, optionalAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { createGenerateRoutes, type GenerateRouteDependencies } from './routes/generate.js';
import { createEditRoutes, type EditRouteDependencies } from './routes/edit.js';
import { createMeRoutes, type MeRepository } from './routes/me.js';
import { createPresetRoutes, type PresetRepository } from './routes/presets.js';
import { createWallpaperRoutes, type WallpaperRepository } from './routes/wallpapers.js';
import { createCategoryRoutes, type CategoryRepository } from './routes/categories.js';

const defaultCorsOrigins = ['http://localhost:8081', 'http://127.0.0.1:8081'];

export type AppOptions = {
  clerk?: ClerkAuthService;
  corsOrigins?: string[];
  generation?: Omit<GenerateRouteDependencies, 'clerk'>;
  categories?: CategoryRepository;
  edit?: Omit<EditRouteDependencies, 'clerk'>;
  me?: MeRepository;
  presets?: PresetRepository;
  wallpapers?: WallpaperRepository;
};

export function createApp({
  clerk = createClerkAuthService({ secretKey: process.env.CLERK_SECRET_KEY }),
  corsOrigins = defaultCorsOrigins,
  generation,
  categories,
  edit,
  me,
  presets,
  wallpapers,
}: AppOptions = {}) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.use(
    '*',
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  app.onError(errorHandler);
  app.use('*', optionalAuth(clerk));

  app.get('/health', (context) => context.json({ ok: true }));
  app.route('/', createGenerateRoutes({ ...generation, clerk, users: me }));
  app.route('/', createEditRoutes({ ...edit, clerk, users: me }));
  app.route('/', createMeRoutes({ clerk, users: me }));
  app.route('/', createCategoryRoutes({ categories, clerk, users: me }));
  app.route('/', createPresetRoutes({ clerk, repository: presets }));
  app.route('/', createWallpaperRoutes({ clerk, repository: wallpapers, users: me }));

  return app;
}

export const app = createApp();
