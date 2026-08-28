import { describe, expect, it } from 'vite-plus/test';

import { createGenerationRunner } from '../jobs/runner.js';
import { ImageProviderError } from '../providers/types.js';

describe('generation runner', () => {
  it('delegates the persisted job input to the wallpaper graph', async () => {
    const received: string[] = [];
    const runner = createGenerationRunner(async (input) => {
      received.push(input.wallpaperId ?? 'missing');
    });

    await runner.run({
      category: 'night skies',
      height: 2400,
      mode: 'text2img',
      userInputs: { idea: 'a calm night sky' },
      wallpaperId: 'job-1',
      width: 1080,
    });

    expect(received).toEqual(['job-1']);
  });

  it('retries temporary provider failures with exponential backoff', async () => {
    let attempts = 0;
    const delays: number[] = [];
    const runner = createGenerationRunner(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new ImageProviderError('TIMEOUT', 'temporary provider timeout');
        }
      },
      {
        sleep: async (milliseconds) => {
          delays.push(milliseconds);
        },
      },
    );

    await runner.run({
      category: 'retries',
      height: 2400,
      mode: 'text2img',
      userInputs: { idea: 'retry wallpaper' },
      width: 1080,
    });

    expect(attempts).toBe(3);
    expect(delays).toEqual([250, 500]);
  });
});
