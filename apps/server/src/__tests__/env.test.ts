import { describe, expect, it } from 'vite-plus/test';

import { EnvValidationError, getCorsOrigins, loadEnv, loadSiliconFlowEnv } from '../config/env.js';

const validEnv = {
  CLERK_PUBLISHABLE_KEY: 'pk_test_example',
  CLERK_SECRET_KEY: 'sk_test_example',
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/lumina',
  R2_ACCESS_KEY_ID: 'access-key',
  R2_ACCOUNT_ID: 'account-id',
  R2_BUCKET: 'lumina',
  R2_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com',
  R2_SECRET_ACCESS_KEY: 'secret-key',
};

describe('loadEnv', () => {
  it('parses required configuration and defaults', () => {
    const config = loadEnv(validEnv);

    expect(config.PORT).toBe(3000);
    expect(config.ENRICH_PROMPT).toBe(false);
    expect(config.SILICONFLOW_PROVIDER_ENABLED).toBe(false);
    expect(config.SILICONFLOW_IMAGE_MODEL).toBe('black-forest-labs/FLUX.2-pro');
    expect(getCorsOrigins(config)).toEqual([]);
  });

  it('reports missing required configuration', () => {
    const { DATABASE_URL: _databaseUrl, ...missingDatabaseUrl } = validEnv;

    expect(() => loadEnv(missingDatabaseUrl)).toThrow(EnvValidationError);
    expect(() => loadEnv(missingDatabaseUrl)).toThrow('DATABASE_URL');
  });

  it('requires a SiliconFlow API key when the provider is enabled', () => {
    expect(() => loadEnv({ ...validEnv, SILICONFLOW_PROVIDER_ENABLED: 'true' })).toThrow(
      'SILICONFLOW_API_KEY is required',
    );
  });

  it('loads the standalone SiliconFlow spike without unrelated server configuration', () => {
    const config = loadSiliconFlowEnv({
      SILICONFLOW_API_KEY: 'siliconflow-test-key',
      SILICONFLOW_PROVIDER_ENABLED: 'true',
    });

    expect(config.SILICONFLOW_PROVIDER_ENABLED).toBe(true);
    expect(config.SILICONFLOW_IMAGE_MODEL).toBe('black-forest-labs/FLUX.2-pro');
  });

  it('requires an enabled SiliconFlow provider and API key for the standalone spike', () => {
    expect(() => loadSiliconFlowEnv({ SILICONFLOW_API_KEY: 'siliconflow-test-key' })).toThrow(
      'SILICONFLOW_PROVIDER_ENABLED',
    );
    expect(() => loadSiliconFlowEnv({ SILICONFLOW_PROVIDER_ENABLED: 'true' })).toThrow(
      'SILICONFLOW_API_KEY',
    );
  });

  it('requires OpenAI configuration when prompt enrichment is enabled', () => {
    expect(() => loadEnv({ ...validEnv, ENRICH_PROMPT: 'true' })).toThrow(
      'OPENAI_API_KEY is required',
    );

    expect(() =>
      loadEnv({ ...validEnv, ENRICH_PROMPT: 'true', OPENAI_API_KEY: 'sk-test' }),
    ).toThrow('OPENAI_PROMPT_MODEL is required');
  });
});
