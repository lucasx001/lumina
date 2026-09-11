export type GenerationRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type GenerationRateLimiter = {
  check(key: string): GenerationRateLimitResult;
};

type CreateGenerationRateLimiterOptions = {
  limit?: number;
  now?: () => number;
  windowMs?: number;
};

/**
 * A small in-memory guard for the single-process MVP. The requester key is a
 * Clerk user ID for account-scoped generation requests.
 */
export function createGenerationRateLimiter({
  limit = 3,
  now = Date.now,
  windowMs = 60_000,
}: CreateGenerationRateLimiterOptions = {}): GenerationRateLimiter {
  const attempts = new Map<string, number[]>();

  return {
    check(key) {
      const timestamp = now();
      const earliest = timestamp - windowMs;
      const recent = (attempts.get(key) ?? []).filter((attempt) => attempt > earliest);
      if (recent.length >= limit) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((recent[0] + windowMs - timestamp) / 1_000),
        );
        attempts.set(key, recent);
        return { allowed: false, retryAfterSeconds };
      }

      recent.push(timestamp);
      attempts.set(key, recent);
      return { allowed: true };
    },
  };
}

export const generationRateLimiter = createGenerationRateLimiter();
