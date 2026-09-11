import { Hono } from 'hono';
import { z } from 'zod';

import { generateSourceImageKey, type R2Storage } from '../lib/r2.js';
import type { ClerkAuthService } from '../lib/clerk.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { syncLocalUser, type MeRepository } from './me.js';

const presignUploadSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export type EditRouteDependencies = {
  clerk: ClerkAuthService;
  storage?: Pick<R2Storage, 'createPresignedPutUrl' | 'getUrl'>;
  users?: MeRepository;
};

export function createEditRoutes(dependencies: EditRouteDependencies) {
  const routes = new Hono<{ Variables: AuthVariables }>();
  routes.use('*', requireAuth(dependencies.clerk));

  routes.post('/uploads/presign', async (context) => {
    const parsed = presignUploadSchema.safeParse(await parseRequestBody(context.req.raw));
    if (!parsed.success) {
      throw new AppError(
        'Upload content type must be JPEG, PNG, or WebP.',
        400,
        'VALIDATION_ERROR',
      );
    }

    const user = await syncLocalUser(
      context.get('user')?.clerkUserId,
      dependencies.clerk,
      dependencies.users,
    );
    const storage = dependencies.storage ?? (await createStorage());
    const key = generateSourceImageKey({
      extension: extensionForContentType(parsed.data.contentType),
      ownerId: user.id,
    });
    const [uploadUrl, sourceImageUrl] = await Promise.all([
      storage.createPresignedPutUrl(key, parsed.data.contentType),
      storage.getUrl(key),
    ]);

    return context.json({ key, sourceImageUrl, uploadUrl });
  });

  return routes;
}

async function createStorage(): Promise<Pick<R2Storage, 'createPresignedPutUrl' | 'getUrl'>> {
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

async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError('Request body must be valid JSON.', 400, 'INVALID_JSON');
  }
}

function extensionForContentType(
  contentType: z.infer<typeof presignUploadSchema>['contentType'],
): string {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[contentType];
}
