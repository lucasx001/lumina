import {
  ImageProviderError,
  type ImageProvider,
  type ImageResult,
  type ImageSpec,
} from './types.js';

export const DEFAULT_SILICONFLOW_IMAGE_MODEL = 'black-forest-labs/FLUX.2-pro';
const SILICONFLOW_IMAGE_ENDPOINT = 'https://api.siliconflow.com/v1/images/generations';

type SiliconFlowImageResponse = {
  images?: Array<{ url?: unknown }>;
  seed?: unknown;
  timings?: { inference?: unknown };
};

export interface SiliconFlowImageProviderOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  model?: string;
  timeoutMs: number;
}

export class SiliconFlowImageProvider implements ImageProvider {
  private readonly fetcher: typeof globalThis.fetch;
  private readonly model: string;

  constructor(private readonly options: SiliconFlowImageProviderOptions) {
    validateOptions(options);
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.model = options.model ?? DEFAULT_SILICONFLOW_IMAGE_MODEL;
  }

  async textToImage(spec: ImageSpec): Promise<ImageResult> {
    return this.requestImage(spec);
  }

  async editImage(spec: ImageSpec): Promise<ImageResult> {
    return this.requestImage(requireSourceImage(spec, 'edit_image'));
  }

  async outpaint(spec: ImageSpec): Promise<ImageResult> {
    return this.requestImage(requireSourceImage(spec, 'outpaint'));
  }

  async upscale(_spec: ImageSpec): Promise<ImageResult> {
    throw unsupportedOperation('upscale');
  }

  async extractStyle(_spec: ImageSpec): Promise<ImageResult> {
    throw unsupportedOperation('extract_style');
  }

  private async requestImage(spec: ImageSpec): Promise<ImageResult> {
    validateSpec(spec);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await this.fetcher(this.options.baseUrl ?? SILICONFLOW_IMAGE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toRequestBody(this.model, spec)),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await mapSiliconFlowResponseError(response);
      }

      return toImageResult(await readResponse(response), this.model, spec);
    } catch (error) {
      if (error instanceof ImageProviderError) {
        throw error;
      }

      throw mapSiliconFlowError(error, controller.signal.aborted);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function mapSiliconFlowError(error: unknown, timedOut = false): ImageProviderError {
  if (timedOut || hasErrorName(error, 'AbortError') || hasErrorCode(error, 'ABORT_ERR')) {
    return new ImageProviderError('TIMEOUT', 'SiliconFlow image generation timed out.', error);
  }

  return new ImageProviderError(
    'PROVIDER_UNAVAILABLE',
    'SiliconFlow image generation failed.',
    error,
  );
}

function toRequestBody(model: string, spec: ImageSpec): Record<string, unknown> {
  return {
    model,
    prompt: spec.prompt,
    image_size: `${spec.width}x${spec.height}`,
    output_format: 'png',
    ...(spec.negativePrompt ? { negative_prompt: spec.negativePrompt } : {}),
    ...(spec.seed === undefined ? {} : { seed: spec.seed }),
    ...(spec.quality === 'high' ? { inference_steps: 50 } : {}),
    ...(spec.sourceImageUrl ? { input_image: spec.sourceImageUrl } : {}),
    ...(spec.styleRefUrl ? { input_image_2: spec.styleRefUrl } : {}),
  };
}

function requireSourceImage(spec: ImageSpec, operation: string): ImageSpec {
  if (!spec.sourceImageUrl) {
    throw new ImageProviderError(
      'INVALID_INPUT',
      `SiliconFlow ${operation} requires a source image URL.`,
    );
  }

  return spec;
}

async function mapSiliconFlowResponseError(response: Response): Promise<ImageProviderError> {
  const details = await response.text();

  if (response.status === 401) {
    return new ImageProviderError('AUTHENTICATION_FAILED', 'SiliconFlow authentication failed.');
  }

  if (response.status === 429) {
    return new ImageProviderError('RATE_LIMITED', 'SiliconFlow image generation is rate limited.');
  }

  if (response.status === 503) {
    return new ImageProviderError(
      'PROVIDER_UNAVAILABLE',
      'SiliconFlow model service is overloaded.',
    );
  }

  if (response.status === 504) {
    return new ImageProviderError('TIMEOUT', 'SiliconFlow image generation timed out.');
  }

  return new ImageProviderError(
    'TOOL_FAILED',
    `SiliconFlow image generation failed with HTTP ${response.status}${details ? `: ${details}` : ''}.`,
  );
}

async function readResponse(response: Response): Promise<SiliconFlowImageResponse> {
  try {
    return (await response.json()) as SiliconFlowImageResponse;
  } catch (error) {
    throw new ImageProviderError(
      'INVALID_ARTIFACT',
      'SiliconFlow returned an invalid image response.',
      error,
    );
  }
}

function toImageResult(
  response: SiliconFlowImageResponse,
  model: string,
  spec: ImageSpec,
): ImageResult {
  const imageUrl = response.images?.[0]?.url;

  if (typeof imageUrl !== 'string' || !isHttpsUrl(imageUrl)) {
    throw new ImageProviderError('INVALID_ARTIFACT', 'SiliconFlow returned an invalid image URL.');
  }

  const seed = asSeed(response.seed);
  const inferenceMs = asNumber(response.timings?.inference);

  return {
    imageUrl,
    providerTask: `siliconflow:${seed ?? 'unknown'}`,
    metadata: {
      imageSize: `${spec.width}x${spec.height}`,
      inferenceMs: inferenceMs ?? null,
      model,
      seed: seed ?? null,
    },
  };
}

function unsupportedOperation(operation: string): ImageProviderError {
  return new ImageProviderError(
    'UNSUPPORTED_OPERATION',
    `SiliconFlow ${operation} is not implemented in the text-to-image provider.`,
  );
}

function validateOptions(options: SiliconFlowImageProviderOptions): void {
  if (!options.apiKey.trim()) {
    throw new ImageProviderError('CONFIGURATION_ERROR', 'SiliconFlow API key must not be empty.');
  }

  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new ImageProviderError(
      'CONFIGURATION_ERROR',
      'SiliconFlow image timeout must be a positive integer.',
    );
  }
}

function validateSpec(spec: ImageSpec): void {
  if (!spec.prompt.trim()) {
    throw new ImageProviderError('INVALID_INPUT', 'Image prompt must not be empty.');
  }

  if (
    !Number.isInteger(spec.width) ||
    spec.width <= 0 ||
    !Number.isInteger(spec.height) ||
    spec.height <= 0
  ) {
    throw new ImageProviderError('INVALID_INPUT', 'Image dimensions must be positive integers.');
  }

  if (spec.seed !== undefined && (!Number.isInteger(spec.seed) || spec.seed < 0)) {
    throw new ImageProviderError('INVALID_INPUT', 'Image seed must be a non-negative integer.');
  }

  for (const [name, value] of [
    ['source image', spec.sourceImageUrl],
    ['style reference image', spec.styleRefUrl],
  ] as const) {
    if (value !== undefined && !isHttpsUrl(value)) {
      throw new ImageProviderError('INVALID_INPUT', `${name} URL must use HTTPS.`);
    }
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function asSeed(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function hasErrorCode(error: unknown, expectedCode: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === expectedCode
  );
}

function hasErrorName(error: unknown, expectedName: string): boolean {
  return error instanceof Error && error.name === expectedName;
}
