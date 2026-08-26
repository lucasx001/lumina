import 'dotenv/config';
import assert from 'node:assert/strict';

import type { Wallpaper } from '../prisma/generated/prisma/client.js';
import {
  runWallpaperGraph,
  type WallpaperGraphDependencies,
} from '../src/graph/wallpaper.graph.js';
import { MockImageProvider } from '../src/providers/mock.js';

let wallpaper: Wallpaper | undefined;

const dependencies: WallpaperGraphDependencies = {
  imageProvider: new MockImageProvider(),
  presets: {
    async findById(id) {
      return id === 'demo-preset'
        ? {
            id,
            negativePrompt: 'text, watermark',
            promptTemplate:
              'A polished {{idea}} wallpaper in a {{tone}} tone, {{width}}x{{height}}.',
            styleRefUrl: null,
          }
        : null;
    },
  },
  storage: {
    async uploadBuffer(_buffer, key) {
      return { key, url: `https://offline-r2.example/${key}` };
    },
    async uploadFile() {
      throw new Error('The offline graph script should not upload files.');
    },
    async uploadFromUrl() {
      throw new Error('The offline graph script should not download provider URLs.');
    },
  },
  wallpapers: {
    async create(data) {
      wallpaper = {
        ...data,
        createdAt: new Date(),
        error: null,
        id: 'offline-wallpaper',
        providerTask: null,
        resultImageUrl: null,
        updatedAt: new Date(),
      } as Wallpaper;
      return wallpaper;
    },
    async update(_id, data) {
      assert.ok(wallpaper, 'The graph must create a wallpaper before updating it.');
      Object.assign(wallpaper, data);
      return wallpaper;
    },
  },
};

const result = await runWallpaperGraph(
  {
    category: 'demo',
    height: 2400,
    mode: 'text2img',
    presetId: 'demo-preset',
    userInputs: { idea: 'misty mountain lake', tone: 'serene' },
    width: 1080,
  },
  dependencies,
);

assert.equal(result.status, 'succeeded');
assert.match(result.resultImageUrl ?? '', /^https:\/\/offline-r2\.example\//);
assert.ok(Math.abs((result.width ?? 0) - 1080) <= 1);
assert.ok(Math.abs((result.height ?? 0) - 2400) <= 1);

console.log(`Graph succeeded: ${result.resultImageUrl}`);
