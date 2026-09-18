import { imageSize } from "image-size";
import { readFile, stat } from "node:fs/promises";

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_EXPIRY_SECONDS = 60 * 15;
const DEFAULT_CONTENT_TYPE = "application/octet-stream";
const MAX_REMOTE_IMAGE_BYTES = 64 * 1024 * 1024;
const MAX_EXPIRY_SECONDS = 60 * 60 * 24 * 7;

type SignedUrlOptions = {
  expiresIn: number;
  signableHeaders?: Set<string>;
};

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  /** Deprecated compatibility field; all asset URLs are signed regardless of this value. */
  publicBaseUrl?: string;
  secretAccessKey: string;
};

export type R2StorageErrorCode =
  | "R2_DOWNLOAD_FAILED"
  | "R2_INVALID_KEY"
  | "R2_SIGNING_FAILED"
  | "R2_UPLOAD_FAILED";

export class R2StorageError extends Error {
  constructor(
    readonly code: R2StorageErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "R2StorageError";
  }
}

export type R2Object = {
  width?: number;
  height?: number;
  key: string;
  url: string;
};

export type GenerateWallpaperKeyOptions = {
  extension?: string;
  id?: string;
  now?: Date;
  ownerId?: string;
};

export type GenerateSourceImageKeyOptions = GenerateWallpaperKeyOptions & {
  ownerId?: string;
};

type S3Command = GetObjectCommand | PutObjectCommand;

export type S3CommandClient = {
  send(command: S3Command): Promise<unknown>;
};

export type R2StorageDependencies = {
  client?: S3CommandClient;
  fetch?: typeof globalThis.fetch;
  getSignedUrl?: (
    client: S3CommandClient,
    command: S3Command,
    options: SignedUrlOptions,
  ) => Promise<string>;
};

/**
 * Produces a stable, partitioned object key without adding a separate ID dependency.
 */
export function generateWallpaperKey(
  options: GenerateWallpaperKeyOptions = {},
): string {
  const now = options.now ?? new Date();
  const extension = normalizeExtension(options.extension ?? "png");
  const id = options.id ?? crypto.randomUUID();

  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) {
    throw new R2StorageError(
      "R2_INVALID_KEY",
      "The object ID contains unsupported characters.",
    );
  }

  const month = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const ownerPrefix = options.ownerId
    ? `${validateOwnerId(options.ownerId)}/`
    : "";
  return `wallpapers/${ownerPrefix}${month}/${id}.${extension}`;
}

export function generateSourceImageKey(
  options: GenerateSourceImageKeyOptions = {},
): string {
  return generateWallpaperKey(options).replace(/^wallpapers\//, "sources/");
}

export class R2Storage {
  private readonly client: S3CommandClient;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly signUrl: NonNullable<R2StorageDependencies["getSignedUrl"]>;

  constructor(
    private readonly config: R2Config,
    dependencies: R2StorageDependencies = {},
  ) {
    this.client = dependencies.client ?? createS3Client(config);
    this.fetcher = dependencies.fetch ?? globalThis.fetch;
    this.signUrl = dependencies.getSignedUrl ?? defaultGetSignedUrl;
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<R2Object> {
    return this.upload(key, buffer, contentType, buffer.byteLength);
  }

  async uploadFile(
    filePath: string,
    key: string,
    contentType: string,
  ): Promise<R2Object> {
    try {
      const file = await stat(filePath);
      if (file.size > MAX_REMOTE_IMAGE_BYTES)
        throw remoteImageTooLarge(MAX_REMOTE_IMAGE_BYTES);
      return await this.upload(
        key,
        await readFile(filePath),
        contentType,
        file.size,
      );
    } catch (error) {
      throw asStorageError(
        "R2_UPLOAD_FAILED",
        `Failed to upload file at ${filePath}.`,
        error,
      );
    }
  }

  async uploadFromUrl(
    sourceUrl: string | URL,
    key: string,
    contentType?: string,
  ): Promise<R2Object> {
    let response: Response;

    try {
      response = await this.fetcher(sourceUrl);
    } catch (error) {
      throw asStorageError(
        "R2_DOWNLOAD_FAILED",
        "Failed to download the remote image.",
        error,
      );
    }

    if (!response.ok || !response.body) {
      throw new R2StorageError(
        "R2_DOWNLOAD_FAILED",
        `Failed to download the remote image: HTTP ${response.status}.`,
      );
    }

    const sourceContentType = response.headers
      .get("content-type")
      ?.split(";", 1)[0];
    const buffer = await readResponseBuffer(response, MAX_REMOTE_IMAGE_BYTES);

    return this.upload(
      key,
      buffer,
      contentType ?? sourceContentType ?? DEFAULT_CONTENT_TYPE,
      buffer.byteLength,
    );
  }

  async getUrl(
    key: string,
    expiresIn = DEFAULT_EXPIRY_SECONDS,
  ): Promise<string> {
    const validatedKey = validateObjectKey(key);
    return this.createSignedUrl(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: validatedKey }),
      expiresIn,
    );
  }

  async createPresignedPutUrl(
    key: string,
    contentType: string,
    expiresIn = DEFAULT_EXPIRY_SECONDS,
  ): Promise<string> {
    const validatedKey = validateObjectKey(key);
    const validatedContentType = validateContentType(contentType);

    return this.createSignedUrl(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        ContentType: validatedContentType,
        Key: validatedKey,
      }),
      expiresIn,
      new Set(["content-type"]),
    );
  }

  private async upload(
    key: string,
    body: NonNullable<PutObjectCommandInput["Body"]>,
    contentType: string,
    contentLength: number,
  ): Promise<R2Object> {
    const validatedKey = validateObjectKey(key);
    const validatedContentType = validateContentType(contentType);

    try {
      await this.client.send(
        new PutObjectCommand({
          Body: body,
          Bucket: this.config.bucket,
          ContentLength: contentLength,
          ContentType: validatedContentType,
          Key: validatedKey,
        }),
      );
    } catch (error) {
      throw asStorageError(
        "R2_UPLOAD_FAILED",
        `Failed to upload ${validatedKey} to R2.`,
        error,
      );
    }

    let dimensions: { width?: number; height?: number } = {};
    if (Buffer.isBuffer(body)) {
      try {
        const { width, height } = imageSize(body);
        dimensions = { width, height };
      } catch {
        // Unknown formats must not be labelled with the requested dimensions.
      }
    }
    return {
      key: validatedKey,
      url: await this.getUrl(validatedKey),
      ...dimensions,
    };
  }

  private async createSignedUrl(
    command: S3Command,
    expiresIn: number,
    signableHeaders?: Set<string>,
  ): Promise<string> {
    if (
      !Number.isInteger(expiresIn) ||
      expiresIn <= 0 ||
      expiresIn > MAX_EXPIRY_SECONDS
    ) {
      throw new R2StorageError(
        "R2_SIGNING_FAILED",
        "The signed URL expiry must be between 1 second and 7 days.",
      );
    }

    try {
      return await this.signUrl(this.client, command, {
        expiresIn,
        signableHeaders,
      });
    } catch (error) {
      throw asStorageError(
        "R2_SIGNING_FAILED",
        "Failed to create an R2 signed URL.",
        error,
      );
    }
  }
}

async function readResponseBuffer(
  response: Response,
  maxBytes: number,
): Promise<Buffer> {
  const declaredLength = parseContentLength(
    response.headers.get("content-length"),
  );
  if (declaredLength !== undefined && declaredLength > maxBytes) {
    throw remoteImageTooLarge(maxBytes);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new R2StorageError(
      "R2_DOWNLOAD_FAILED",
      "The remote image response has no body.",
    );
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      const { value } = chunk;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw remoteImageTooLarge(maxBytes);
      }
      chunks.push(value);
      chunk = await reader.read();
    }
  } catch (error) {
    throw asStorageError(
      "R2_DOWNLOAD_FAILED",
      "Failed to read the remote image.",
      error,
    );
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}

function parseContentLength(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const length = Number(value);
  return Number.isSafeInteger(length) ? length : undefined;
}

function remoteImageTooLarge(maxBytes: number): R2StorageError {
  return new R2StorageError(
    "R2_DOWNLOAD_FAILED",
    `The remote image exceeds the ${Math.floor(maxBytes / 1024 / 1024)} MiB limit.`,
  );
}

export function createR2Storage(
  config: R2Config,
  dependencies?: R2StorageDependencies,
): R2Storage {
  return new R2Storage(config, dependencies);
}

/** Source uploads are account-owned objects and may only be referenced by their owner. */
export function isOwnedSourceImageKey(key: string, ownerId: string): boolean {
  try {
    const validatedKey = validateObjectKey(key);
    const ownerPrefix = `sources/${validateOwnerId(ownerId)}/`;
    return validatedKey.startsWith(ownerPrefix);
  } catch {
    return false;
  }
}

function createS3Client(config: R2Config): S3Client {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    region: "auto",
  });
}

async function defaultGetSignedUrl(
  client: S3CommandClient,
  command: S3Command,
  options: SignedUrlOptions,
): Promise<string> {
  return getSignedUrl(client as S3Client, command, options);
}

function asStorageError(
  code: R2StorageErrorCode,
  message: string,
  cause: unknown,
): R2StorageError {
  if (cause instanceof R2StorageError) {
    return cause;
  }

  return new R2StorageError(code, message, cause);
}

function normalizeExtension(extension: string): string {
  const normalizedExtension = extension.replace(/^\./, "").toLowerCase();

  if (!/^[a-z0-9]{1,10}$/.test(normalizedExtension)) {
    throw new R2StorageError(
      "R2_INVALID_KEY",
      "The object extension is invalid.",
    );
  }

  return normalizedExtension;
}

function validateOwnerId(ownerId: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(ownerId)) {
    throw new R2StorageError(
      "R2_INVALID_KEY",
      "The owner ID contains unsupported characters.",
    );
  }

  return ownerId;
}

function validateContentType(contentType: string): string {
  const normalizedContentType = contentType.trim();

  if (!normalizedContentType) {
    throw new R2StorageError(
      "R2_UPLOAD_FAILED",
      "A content type is required for R2 uploads.",
    );
  }

  return normalizedContentType;
}

function validateObjectKey(key: string): string {
  const normalizedKey = key.trim();
  const segments = normalizedKey.split("/");

  if (
    !normalizedKey ||
    normalizedKey.startsWith("/") ||
    segments.some((segment) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segment))
  ) {
    throw new R2StorageError("R2_INVALID_KEY", "The R2 object key is invalid.");
  }

  return normalizedKey;
}
