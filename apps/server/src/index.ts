import 'dotenv/config';

import { serve } from '@hono/node-server';

import { createApp } from './app.js';
import { getCorsOrigins, loadEnv } from './config/env.js';
import { createClerkAuthService } from './lib/clerk.js';
import { logger } from './lib/logger.js';
import { ensureBuiltInPresets } from './lib/built-in-presets.js';

const config = loadEnv();
await ensureBuiltInPresets();
const app = createApp({
  clerk: createClerkAuthService({ secretKey: config.CLERK_SECRET_KEY }),
  corsOrigins: getCorsOrigins(config),
});

serve({ fetch: app.fetch, port: config.PORT });

logger.info('Server listening.', { port: config.PORT });
