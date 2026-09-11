import type { MiddlewareHandler } from 'hono';

import type { AuthenticatedClerkUser, ClerkAuthService } from '../lib/clerk.js';
import { AppError } from './error.js';

export type AuthVariables = {
  user?: AuthenticatedClerkUser;
};

type AuthEnvironment = {
  Variables: AuthVariables;
};

/**
 * Resolves a Bearer token when present for the application health surface.
 */
export function optionalAuth(clerk: ClerkAuthService): MiddlewareHandler<AuthEnvironment> {
  return async (context, next) => {
    const token = getBearerToken(context.req.header('Authorization'));
    if (!token) {
      await next();
      return;
    }

    try {
      context.set('user', await clerk.verifyToken(token));
    } catch {
      throw new AppError('Clerk token is invalid.', 401, 'UNAUTHORIZED');
    }

    await next();
  };
}

/**
 * Requires an authenticated Clerk user. It reuses the user attached by
 * optionalAuth so protected routes do not verify a session token twice.
 */
export function requireAuth(clerk: ClerkAuthService): MiddlewareHandler<AuthEnvironment> {
  const authenticate = optionalAuth(clerk);

  return async (context, next) => {
    if (!context.get('user')) {
      await authenticate(context, async () => Promise.resolve());
    }

    if (!context.get('user')) {
      throw new AppError('Authentication is required.', 401, 'UNAUTHORIZED');
    }

    await next();
  };
}

function getBearerToken(authorization: string | undefined): string | null {
  const matched = authorization?.match(/^Bearer\s+(.+)$/i);
  return matched?.[1]?.trim() || null;
}
