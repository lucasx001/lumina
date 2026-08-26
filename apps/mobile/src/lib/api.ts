import Constants from 'expo-constants';

export type HealthResponse = { ok: boolean };

export type GenerationMode = 'text2img' | 'outpaint' | 'edit' | 'style' | 'upscale';
export type GenerationQuality = 'draft' | 'hd';

export type GenerationUserInputs = {
  idea?: string;
  mood?: string;
  theme?: string;
  tone?: string;
};

export type GenerateRequest = {
  category: string;
  deviceId?: string;
  height: number;
  mode: GenerationMode;
  quality: GenerationQuality;
  presetId?: string;
  sourceImageUrl?: string;
  userInputs: GenerationUserInputs;
  width: number;
};

export type GenerateResponse = { jobId: string };

export type PresignedUpload = {
  key: string;
  sourceImageUrl: string;
  uploadUrl: string;
};

export type GenerationJobStatus = 'failed' | 'pending' | 'processing' | 'succeeded';

export type GenerationJob = {
  error?: string;
  height?: number;
  resultImageUrl?: string;
  quality?: GenerationQuality;
  status: GenerationJobStatus;
  width?: number;
};

export type PresetListItem = {
  category: string;
  coverImageUrl: string | null;
  id: string;
  name: string;
};

export type PresetsResponse = { presets: PresetListItem[] };

export type WallpaperListItem = {
  category: string;
  createdAt: string;
  favorite?: boolean;
  height: number | null;
  id: string;
  mode: GenerationMode;
  quality?: GenerationQuality;
  resultImageUrl: string | null;
  status: GenerationJobStatus;
  width: number | null;
};

export type WallpapersResponse = {
  hasMore: boolean;
  items: WallpaperListItem[];
  limit: number;
  page: number;
};

export type WallpapersRequest = {
  category?: string;
  deviceId: string;
  favorite?: boolean;
  limit?: number;
  page?: number;
};

export type BindDeviceResponse = { bound: number };
export type FavoriteWallpaperResponse = { wallpaper: WallpaperListItem };

type ErrorPayload = { error?: { code?: unknown; message?: unknown } };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiClientOptions = {
  baseUrl?: string;
  fetchImpl?: FetchLike;
  getToken?: ApiTokenProvider;
  timeoutMs?: number;
};

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type ApiTokenProvider = () => Promise<string | null | undefined>;

export function resolveApiBaseUrl(
  env: Record<string, string | undefined> = process.env,
  extra: Record<string, unknown> | undefined = Constants.expoConfig?.extra,
): string | undefined {
  const value = env.EXPO_PUBLIC_API_URL ?? extra?.apiUrl;
  return typeof value === 'string' && value.trim() ? value.trim().replace(/\/+$/, '') : undefined;
}

export const apiBaseUrl = resolveApiBaseUrl();
export const hasApiBaseUrl = Boolean(apiBaseUrl);

const defaultFetch: FetchLike = (input, init) => fetch(input, init);
let defaultTokenProvider: ApiTokenProvider | undefined;

export function setApiTokenProvider(provider: ApiTokenProvider | undefined): void {
  defaultTokenProvider = provider;
}

export function createApiClient({
  baseUrl,
  fetchImpl = defaultFetch,
  getToken = async () => defaultTokenProvider?.(),
  timeoutMs = 20_000,
}: ApiClientOptions = {}) {
  return async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    if (!baseUrl) {
      throw new ApiError('EXPO_PUBLIC_API_URL is not configured.', 0, 'API_URL_NOT_CONFIGURED');
    }

    const headers = new Headers(init?.headers);
    headers.set('Accept', 'application/json');
    const token = await getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    init?.signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    let response: Response;

    try {
      response = await fetchImpl(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } catch (reason) {
      if (init?.signal?.aborted) {
        throw new ApiError('请求已取消。', 0, 'REQUEST_ABORTED');
      }
      if (controller.signal.aborted) {
        throw new ApiError('请求超时，请检查网络后重试。', 0, 'REQUEST_TIMEOUT');
      }
      throw new ApiError(
        reason instanceof Error ? reason.message : '无法连接服务器，请检查网络后重试。',
        0,
        'NETWORK_ERROR',
      );
    } finally {
      clearTimeout(timeout);
      init?.signal?.removeEventListener('abort', abortFromCaller);
    }

    const payload = await parseJson(response);

    if (!response.ok) {
      const error = payload as ErrorPayload | undefined;
      const message =
        typeof error?.error?.message === 'string' ? error.error.message : response.statusText;
      const code = typeof error?.error?.code === 'string' ? error.error.code : 'REQUEST_FAILED';
      throw new ApiError(message || 'Request failed.', response.status, code);
    }

    return payload as T;
  };
}

export const apiFetch = createApiClient({ baseUrl: apiBaseUrl });

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health');
}

export function getPresets(): Promise<PresetsResponse> {
  return apiFetch<PresetsResponse>('/presets');
}

export function createGeneration(request: GenerateRequest): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>('/generate', {
    body: JSON.stringify(request),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

export function createSourceImageUpload(contentType: string): Promise<PresignedUpload> {
  return apiFetch<PresignedUpload>('/uploads/presign', {
    body: JSON.stringify({ contentType }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

export async function uploadSourceImage(
  localUri: string,
  contentType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<string> {
  const upload = await createSourceImageUpload(contentType);
  const localResponse = await fetch(localUri);
  if (!localResponse.ok) {
    throw new ApiError(
      'The selected image could not be read.',
      localResponse.status,
      'LOCAL_FILE_ERROR',
    );
  }
  const uploadResponse = await fetch(upload.uploadUrl, {
    body: await localResponse.blob(),
    headers: { 'Content-Type': contentType },
    method: 'PUT',
  });
  if (!uploadResponse.ok) {
    throw new ApiError(
      'The selected image could not be uploaded.',
      uploadResponse.status,
      'UPLOAD_FAILED',
    );
  }
  return upload.sourceImageUrl;
}

export function getGenerationJob(jobId: string): Promise<GenerationJob> {
  return apiFetch<GenerationJob>(`/jobs/${encodeURIComponent(jobId)}`);
}

export function getWallpapers({
  category,
  deviceId,
  favorite,
  limit = 20,
  page = 1,
}: WallpapersRequest) {
  const query = new URLSearchParams({
    deviceId,
    limit: String(limit),
    page: String(page),
  });
  if (category) {
    query.set('category', category);
  }
  if (favorite !== undefined) {
    query.set('favorite', String(favorite));
  }

  return apiFetch<WallpapersResponse>(`/wallpapers?${query.toString()}`);
}

export function setWallpaperFavorite(
  id: string,
  input: { deviceId: string; favorite: boolean },
): Promise<FavoriteWallpaperResponse> {
  return apiFetch<FavoriteWallpaperResponse>(`/wallpapers/${encodeURIComponent(id)}/favorite`, {
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  });
}

export function bindDevice(
  deviceId: string,
  getToken?: ApiTokenProvider,
): Promise<BindDeviceResponse> {
  const client = getToken ? createApiClient({ baseUrl: apiBaseUrl, getToken }) : apiFetch;
  return client<BindDeviceResponse>('/me/bind-device', {
    body: JSON.stringify({ deviceId }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    if (!response.ok) {
      return undefined;
    }
    throw new ApiError(
      'The server returned invalid JSON.',
      response.status,
      'INVALID_JSON_RESPONSE',
    );
  }
}
