import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vite-plus/test';

import {
  createR2Storage,
  generateWallpaperKey,
  R2StorageError,
  type R2Config,
  type R2StorageDependencies,
  type S3CommandClient,
} from '../lib/r2.js';

const config: R2Config = {
  accessKeyId: 'test-access-key',
  accountId: 'test-account-id',
  bucket: 'lumina-images',
  endpoint: 'https://test-account-id.r2.cloudflarestorage.com',
  secretAccessKey: 'test-secret-key',
};

function createClient(): {
  client: S3CommandClient;
  send: ReturnType<typeof vi.fn<S3CommandClient['send']>>;
} {
  const send = vi.fn<S3CommandClient['send']>().mockResolvedValue({});
  return { client: { send }, send };
}

describe('generateWallpaperKey', () => {
  it('creates a date-partitioned image key', () => {
    expect(
      generateWallpaperKey({
        id: 'ckv4b1n2m0000j1qz8kvh4p0g',
        now: new Date('2026-07-25T12:00:00.000Z'),
      }),
    ).toBe('wallpapers/202607/ckv4b1n2m0000j1qz8kvh4p0g.png');
  });

  it('rejects IDs that could create an unsafe key', () => {
    expect(() => generateWallpaperKey({ id: '../outside' })).toThrow(R2StorageError);
  });
});

describe('R2Storage', () => {
  it('uploads a buffer and returns a public URL', async () => {
    const { client, send } = createClient();
    const storage = createR2Storage(
      { ...config, publicBaseUrl: 'https://images.example.com' },
      { client },
    );
    const image = Buffer.from('image bytes');

    await expect(
      storage.uploadBuffer(image, 'wallpapers/202607/image.png', 'image/png'),
    ).resolves.toEqual({
      key: 'wallpapers/202607/image.png',
      url: 'https://images.example.com/wallpapers/202607/image.png',
    });

    const command = send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Body: image,
      Bucket: 'lumina-images',
      ContentLength: image.byteLength,
      ContentType: 'image/png',
      Key: 'wallpapers/202607/image.png',
    });
  });

  it('buffers a remote image so R2 receives a known content length', async () => {
    const { client, send } = createClient();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(
        new Response('image bytes', { headers: { 'content-type': 'image/webp; charset=binary' } }),
      );
    const storage = createR2Storage(
      { ...config, publicBaseUrl: 'https://images.example.com' },
      { client, fetch },
    );

    await storage.uploadFromUrl(
      'https://provider.example.com/image.webp',
      'wallpapers/202607/image.webp',
    );

    const command = send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Body: Buffer.from('image bytes'),
      Bucket: 'lumina-images',
      ContentLength: Buffer.byteLength('image bytes'),
      ContentType: 'image/webp',
      Key: 'wallpapers/202607/image.webp',
    });
  });

  it('uploads a local file without reading it into a buffer', async () => {
    const { client, send } = createClient();
    const folder = await mkdtemp(join(tmpdir(), 'lumina-r2-'));
    const filePath = join(folder, 'image.png');
    await writeFile(filePath, 'image bytes');
    const storage = createR2Storage(
      { ...config, publicBaseUrl: 'https://images.example.com' },
      { client },
    );

    await storage.uploadFile(filePath, 'wallpapers/202607/image.png', 'image/png');

    const command = send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    if (!(command instanceof PutObjectCommand)) {
      throw new Error('Expected the upload to send a PutObjectCommand.');
    }
    expect(command.input.Body).toBeTruthy();
    expect(command.input.ContentLength).toBe(Buffer.byteLength('image bytes'));
    await rm(folder, { force: true, recursive: true });
  });

  it('rejects an oversized remote image before uploading it', async () => {
    const { client, send } = createClient();
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response('too large', {
        headers: { 'content-length': String(65 * 1024 * 1024) },
      }),
    );
    const storage = createR2Storage(config, { client, fetch });

    await expect(
      storage.uploadFromUrl(
        'https://provider.example.com/oversized.png',
        'wallpapers/202607/oversized.png',
      ),
    ).rejects.toMatchObject({
      code: 'R2_DOWNLOAD_FAILED',
      message: 'The remote image exceeds the 64 MiB limit.',
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('uses a signed GET URL for private buckets and signs browser PUT uploads', async () => {
    const { client } = createClient();
    const getSignedUrl = vi
      .fn<NonNullable<R2StorageDependencies['getSignedUrl']>>()
      .mockResolvedValueOnce('https://signed.example.com/get')
      .mockResolvedValueOnce('https://signed.example.com/put');
    const storage = createR2Storage(config, { client, getSignedUrl });

    await expect(storage.getUrl('wallpapers/202607/image.png', 120)).resolves.toBe(
      'https://signed.example.com/get',
    );
    await expect(
      storage.createPresignedPutUrl('wallpapers/202607/image.png', 'image/png', 180),
    ).resolves.toBe('https://signed.example.com/put');

    expect(getSignedUrl.mock.calls[0]?.[1]).toBeInstanceOf(GetObjectCommand);
    expect(getSignedUrl.mock.calls[0]?.[2]).toEqual({ expiresIn: 120, signableHeaders: undefined });
    const putCommand = getSignedUrl.mock.calls[1]?.[1];
    expect(putCommand).toBeInstanceOf(PutObjectCommand);
    if (!(putCommand instanceof PutObjectCommand)) {
      throw new Error('Expected the second signing call to receive a PutObjectCommand.');
    }
    expect(putCommand.input).toMatchObject({
      Bucket: 'lumina-images',
      ContentType: 'image/png',
      Key: 'wallpapers/202607/image.png',
    });
    expect(getSignedUrl.mock.calls[1]?.[2]).toEqual({
      expiresIn: 180,
      signableHeaders: new Set(['content-type']),
    });
  });

  it('exposes failed downloads and uploads as structured storage errors', async () => {
    const { client } = createClient();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 502 }));
    const storage = createR2Storage(config, { client, fetch });

    await expect(
      storage.uploadFromUrl(
        'https://provider.example.com/missing.png',
        'wallpapers/202607/missing.png',
      ),
    ).rejects.toMatchObject({ code: 'R2_DOWNLOAD_FAILED', name: 'R2StorageError' });
    await expect(
      storage.uploadBuffer(Buffer.from('x'), '../unsafe.png', 'image/png'),
    ).rejects.toMatchObject({
      code: 'R2_INVALID_KEY',
      name: 'R2StorageError',
    });
  });
});
