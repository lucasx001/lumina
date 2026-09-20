import type { Env } from '../config/env.js';

import { MockImageProvider } from './mock.js';
import { SiliconFlowImageProvider } from './siliconflow.js';
import type { ImageProvider } from './types.js';

export * from './mock.js';
export * from './siliconflow.js';
export * from './types.js';

export interface ImageProviderFactoryOptions {
  siliconFlowFetch?: typeof globalThis.fetch;
}

type ImageProviderEnv = Pick<
  Env,
  | 'SILICONFLOW_API_KEY'
  | 'SILICONFLOW_IMAGE_MODEL'
  | 'SILICONFLOW_IMAGE_TIMEOUT_MS'
  | 'SILICONFLOW_PROVIDER_ENABLED'
>;

export function getImageProvider(
  env: ImageProviderEnv,
  options: ImageProviderFactoryOptions = {},
): ImageProvider {
  if (!env.SILICONFLOW_PROVIDER_ENABLED) {
    return new MockImageProvider();
  }

  if (!env.SILICONFLOW_API_KEY) {
    throw new Error('SiliconFlow provider requires SILICONFLOW_API_KEY.');
  }

  return new SiliconFlowImageProvider({
    apiKey: env.SILICONFLOW_API_KEY,
    fetch: options.siliconFlowFetch,
    model: env.SILICONFLOW_IMAGE_MODEL,
    timeoutMs: env.SILICONFLOW_IMAGE_TIMEOUT_MS,
  });
}
