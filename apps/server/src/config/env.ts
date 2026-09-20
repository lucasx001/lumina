import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

const siliconFlowEnvSchema = z
  .object({
    SILICONFLOW_PROVIDER_ENABLED: z.literal('true'),
    SILICONFLOW_API_KEY: nonEmptyString,
    SILICONFLOW_IMAGE_MODEL: nonEmptyString.default('black-forest-labs/FLUX.2-pro'),
    SILICONFLOW_IMAGE_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  })
  .transform((env) => ({
    ...env,
    SILICONFLOW_PROVIDER_ENABLED: true,
  }));

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: nonEmptyString,
    CLERK_SECRET_KEY: nonEmptyString,
    CLERK_PUBLISHABLE_KEY: nonEmptyString,
    R2_ACCOUNT_ID: nonEmptyString,
    R2_BUCKET: nonEmptyString,
    R2_ACCESS_KEY_ID: nonEmptyString,
    R2_SECRET_ACCESS_KEY: nonEmptyString,
    R2_ENDPOINT: z.url(),
    SILICONFLOW_PROVIDER_ENABLED: z.stringbool().default(false),
    SILICONFLOW_API_KEY: nonEmptyString.optional(),
    SILICONFLOW_IMAGE_MODEL: nonEmptyString.default('black-forest-labs/FLUX.2-pro'),
    SILICONFLOW_IMAGE_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
    CORS_ORIGIN: z.string().optional(),
  })
  .superRefine((env, context) => {
    if (env.SILICONFLOW_PROVIDER_ENABLED && !env.SILICONFLOW_API_KEY) {
      context.addIssue({
        code: 'custom',
        message: 'SILICONFLOW_API_KEY is required when SILICONFLOW_PROVIDER_ENABLED is true.',
        path: ['SILICONFLOW_API_KEY'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
export type SiliconFlowEnv = z.infer<typeof siliconFlowEnvSchema>;

export class EnvValidationError extends Error {
  constructor(readonly issues: z.core.$ZodIssue[]) {
    super(`Invalid environment configuration:\n${issues.map(formatIssue).join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new EnvValidationError(result.error.issues);
  }

  return result.data;
}

/**
 * Loads the minimal configuration needed by the standalone SiliconFlow spike.
 * It intentionally does not require the server's database, Clerk, or R2 settings.
 */
export function loadSiliconFlowEnv(source: NodeJS.ProcessEnv = process.env): SiliconFlowEnv {
  const result = siliconFlowEnvSchema.safeParse(source);

  if (!result.success) {
    throw new EnvValidationError(result.error.issues);
  }

  return result.data;
}

export function getCorsOrigins(config: Env): string[] {
  return (
    config.CORS_ORIGIN?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}

function formatIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.join('.') || 'environment';
  return `- ${path}: ${issue.message}`;
}
