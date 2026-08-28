import { describe, expect, it } from 'vite-plus/test';

import { getImageProvider } from '../providers/index.js';
import { MockImageProvider } from '../providers/mock.js';
import { SiliconFlowImageProvider } from '../providers/siliconflow.js';

describe('getImageProvider', () => {
  it('returns the deterministic mock provider when SiliconFlow is disabled', () => {
    const provider = getImageProvider({
      SILICONFLOW_IMAGE_MODEL: 'black-forest-labs/FLUX.2-pro',
      SILICONFLOW_IMAGE_TIMEOUT_MS: 120_000,
      SILICONFLOW_PROVIDER_ENABLED: false,
    });

    expect(provider).toBeInstanceOf(MockImageProvider);
  });

  it('returns the SiliconFlow provider when enabled', () => {
    const provider = getImageProvider(
      {
        SILICONFLOW_API_KEY: 'test-api-key',
        SILICONFLOW_IMAGE_MODEL: 'black-forest-labs/FLUX.2-pro',
        SILICONFLOW_IMAGE_TIMEOUT_MS: 120_000,
        SILICONFLOW_PROVIDER_ENABLED: true,
      },
      { siliconFlowFetch: fetch },
    );

    expect(provider).toBeInstanceOf(SiliconFlowImageProvider);
  });
});
