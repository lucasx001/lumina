import { defineConfig } from 'vite-plus';

import {
  mobileReactPreset,
  serverNodePreset,
  serverTestPreset,
  strictCodeQualityPreset,
  webReactPreset,
} from './config/oxlint-presets.js';

export default defineConfig({
  fmt: {
    ignorePatterns: [
      '.agents/**',
      '.claude/**',
      'example/**',
      'apps/mobile/assets/**',
      'apps/mobile/babel.config.cjs',
      'apps/mobile/lingui.config.cjs',
      'apps/landing/.next/**',
      'apps/landing/next-env.d.ts',
      '**/node_modules/**',
      '**/.expo/**',
      '**/dist/**',
      '**/web-build/**',
      '**/coverage/**',
      '**/.vite/**',
    ],
    semi: true,
    singleQuote: true,
    printWidth: 100,
    overrides: [
      {
        files: ['**/*.md'],
        options: {
          proseWrap: 'always',
        },
      },
    ],
  },
  lint: {
    ignorePatterns: [
      '.agents/**',
      '.claude/**',
      'example/**',
      'apps/mobile/assets/**',
      'apps/mobile/babel.config.cjs',
      'apps/mobile/lingui.config.cjs',
      '**/node_modules/**',
      '**/.expo/**',
      '**/dist/**',
      '**/web-build/**',
      '**/coverage/**',
      '**/.vite/**',
    ],
    plugins: [...strictCodeQualityPreset.plugins],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: strictCodeQualityPreset.rules,
    overrides: [
      {
        files: ['apps/mobile/**/*.{ts,tsx}'],
        plugins: [...mobileReactPreset.plugins],
        rules: mobileReactPreset.rules,
      },
      {
        files: ['apps/landing/**/*.{ts,tsx}'],
        plugins: [...webReactPreset.plugins],
        rules: webReactPreset.rules,
      },
      {
        files: ['apps/server/**/*.ts'],
        plugins: [...serverNodePreset.plugins],
        env: {
          node: true,
        },
        rules: serverNodePreset.rules,
      },
      {
        files: ['apps/server/**/*.test.ts'],
        plugins: [...serverTestPreset.plugins],
        rules: serverTestPreset.rules,
      },
    ],
  },
  test: {
    include: ['apps/server/src/__tests__/**/*.test.ts'],
  },
  staged: {
    '*.{js,cjs,mjs,ts,tsx,json,md,yml,yaml}': 'vp check --fix',
  },
  run: {
    cache: {
      scripts: true,
      tasks: true,
    },
    tasks: {
      'test:all': {
        command: 'bun --filter=@lumina/mobile run test && vp test run',
        input: [
          { auto: true },
          '!apps/mobile/.expo/**',
          '!apps/mobile/dist/**',
          '!apps/landing/.next/**',
        ],
        output: [
          { auto: true },
          '!apps/mobile/.expo/**',
          '!apps/mobile/dist/**',
          '!apps/landing/.next/**',
        ],
      },
      'build:all': {
        command:
          'vp run --parallel --log labeled --filter=@lumina/mobile --filter=@lumina/server --filter=@lumina/landing build',
        output: ['apps/mobile/dist/**', 'apps/server/dist/**', '!apps/landing/.next/**'],
      },
      'build:android': {
        command: 'bun --filter=@lumina/mobile run build:android',
        cache: false,
      },
    },
  },
});
