import 'dotenv/config';

import { extname, resolve } from 'node:path';

import { loadEnv } from '../src/config/env.js';
import { createR2Storage, generateWallpaperKey } from '../src/lib/r2.js';

const config = loadEnv();
const storage = createR2Storage({
  accessKeyId: config.R2_ACCESS_KEY_ID,
  accountId: config.R2_ACCOUNT_ID,
  bucket: config.R2_BUCKET,
  endpoint: config.R2_ENDPOINT,
  secretAccessKey: config.R2_SECRET_ACCESS_KEY,
});
const filePath = process.argv[2];
const contentType = process.argv[3] ?? 'image/png';
const extension = filePath ? extname(filePath).slice(1) || 'png' : 'png';
const key = generateWallpaperKey({ extension });

const result = filePath
  ? await storage.uploadFile(resolve(filePath), key, contentType)
  : await storage.uploadBuffer(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M/wHwAF/gL+X2n5WQAAAABJRU5ErkJggg==',
        'base64',
      ),
      key,
      contentType,
    );

console.log(
  JSON.stringify({
    ...result,
    presignedPutUrl: await storage.createPresignedPutUrl(key, contentType),
  }),
);
