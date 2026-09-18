import { END, START, StateGraph } from '@langchain/langgraph';

import type { Wallpaper } from '../../prisma/generated/prisma/client.js';
import { getErrorLogContext, logger } from '../lib/logger.js';
import {
  WallpaperGraphAnnotation,
  type WallpaperGraphInput,
  type WallpaperGraphState,
  type WallpaperMode,
  type WallpaperQuality,
  type WallpaperUserInputs,
} from './state.js';
import { createWallpaperNodes } from './nodes/wallpaper.nodes.js';
import type { PromptEnricher, WallpaperGraphDependencies } from './nodes/types.js';

export type { WallpaperGraphDependencies };
export type {
  WallpaperGraphInput,
  WallpaperGraphState,
  WallpaperMode,
  WallpaperQuality,
  WallpaperUserInputs,
};

type GraphWithInvoke = {
  invoke(input: WallpaperGraphInput): Promise<WallpaperGraphState>;
};

export function createWallpaperGraph(dependencies: WallpaperGraphDependencies): GraphWithInvoke {
  const nodes = createWallpaperNodes(dependencies);

  return (
    new StateGraph(WallpaperGraphAnnotation)
      .addNode('resolvePreset', nodes.resolvePreset)
      .addNode('enrichPrompt', nodes.enrichPrompt)
      .addNode('generate', nodes.generate)
      .addNode('edit', nodes.edit)
      .addNode('outpaint', nodes.outpaint)
      .addNode('style', nodes.style)
      .addNode('upscale', nodes.upscale)
      .addNode('persist', nodes.persist)
      .addEdge(START, 'resolvePreset')
      .addEdge('resolvePreset', 'enrichPrompt')
      // TODO: moderation / watermark / policy checks
      .addConditionalEdges('enrichPrompt', routeMode, {
        text2img: 'generate',
        edit: 'edit',
        outpaint: 'outpaint',
        style: 'style',
        upscale: 'upscale',
      })
      .addEdge('generate', 'persist')
      .addEdge('edit', 'persist')
      .addEdge('outpaint', 'persist')
      .addEdge('style', 'persist')
      .addEdge('upscale', 'persist')
      .addEdge('persist', END)
      .compile()
  );
}

export async function runWallpaperGraph(
  input: WallpaperGraphInput,
  suppliedDependencies?: Partial<WallpaperGraphDependencies>,
): Promise<Wallpaper> {
  let wallpaperId = input.wallpaperId;
  const startedAt = performance.now();
  const dependencies = await resolveDependencies(suppliedDependencies ?? {}, (id) => {
    wallpaperId = id;
  });

  logger.info('wallpaper graph started', { mode: input.mode, presetId: input.presetId });
  try {
    const state = await createWallpaperGraph(dependencies).invoke(input);
    if (!state.wallpaperId) {
      throw new Error('Wallpaper graph completed without creating a wallpaper.');
    }

    const wallpaper = await dependencies.wallpapers.update(
      { id: state.wallpaperId, userId: input.userId },
      {},
    );
    logger.info('wallpaper graph completed', {
      durationMs: Math.round(performance.now() - startedAt),
      wallpaperId: wallpaper.id,
    });
    return wallpaper;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Wallpaper generation failed.';
    if (wallpaperId) {
      await dependencies.wallpapers.update(
        { id: wallpaperId, userId: input.userId },
        { error: message, status: 'failed' },
      );
    }
    logger.error('wallpaper graph failed', {
      durationMs: Math.round(performance.now() - startedAt),
      ...getErrorLogContext(error),
      wallpaperId,
    });
    throw error;
  }
}

function routeMode(state: WallpaperGraphState): WallpaperGraphState['mode'] {
  return state.mode;
}

async function resolveDependencies(
  supplied: Partial<WallpaperGraphDependencies>,
  onWallpaperCreated: (id: string) => void,
): Promise<WallpaperGraphDependencies> {
  if (supplied.imageProvider && supplied.presets && supplied.storage && supplied.wallpapers) {
    return {
      ...supplied,
      imageProvider: supplied.imageProvider,
      onWallpaperCreated,
      presets: supplied.presets,
      storage: supplied.storage,
      wallpapers: supplied.wallpapers,
    };
  }

  const [{ loadEnv }, { prisma }, { createR2Storage }, { getImageProvider }] = await Promise.all([
    import('../config/env.js'),
    import('../lib/db.js'),
    import('../lib/r2.js'),
    import('../providers/index.js'),
  ]);
  const env = loadEnv();
  const enrichPrompt = env.ENRICH_PROMPT
    ? createOpenAIPromptEnricher({
        OPENAI_API_KEY: env.OPENAI_API_KEY as string,
        OPENAI_PROMPT_MODEL: env.OPENAI_PROMPT_MODEL as string,
      })
    : undefined;

  return {
    enrichPrompt: supplied.enrichPrompt ?? enrichPrompt,
    imageProvider: supplied.imageProvider ?? getImageProvider(env),
    onWallpaperCreated,
    presets: supplied.presets ?? {
      createCustom: ({
        category,
        colorKeywords,
        compositionKeywords,
        materialKeywords,
        name,
        ownerClerkUserId,
        promptTemplate,
        styleRefKey,
      }) =>
        prisma.preset
          .create({
            data: {
              category,
              name,
              owner: {
                connectOrCreate: {
                  create: { clerkUserId: ownerClerkUserId },
                  where: { clerkUserId: ownerClerkUserId },
                },
              },
              params: { colorKeywords, compositionKeywords, materialKeywords },
              promptTemplate,
              styleRefUrl: styleRefKey,
            },
          })
          .then((preset) => ({
            id: preset.id,
            negativePrompt: preset.negativePrompt,
            promptTemplate: preset.promptTemplate,
            styleRefKey: preset.styleRefUrl,
          })),
      findById: async (id, clerkUserId) => {
        const preset = await prisma.preset.findFirst({
          where: {
            id,
            OR: [{ isBuiltIn: true }, ...(clerkUserId ? [{ owner: { clerkUserId } }] : [])],
          },
        });
        return preset
          ? {
              id: preset.id,
              negativePrompt: preset.negativePrompt,
              promptTemplate: preset.promptTemplate,
              styleRefKey: preset.styleRefUrl,
            }
          : null;
      },
    },
    storage:
      supplied.storage ??
      createR2Storage({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        accountId: env.R2_ACCOUNT_ID,
        bucket: env.R2_BUCKET,
        endpoint: env.R2_ENDPOINT,
        publicBaseUrl: env.R2_PUBLIC_BASE_URL,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      }),
    wallpapers: supplied.wallpapers ?? {
      create: (data) =>
        prisma.wallpaper.create({
          data: {
            categoryId: data.categoryId,
            height: data.height,
            mode: data.mode,
            presetId: data.presetId,
            prompt: data.prompt,
            quality: data.quality ?? 'hd',
            sourceImageKey: data.sourceImageKey,
            status: data.status,
            userId: data.userId,
            width: data.width,
          },
        }),
      update: async ({ id, userId }, data) => {
        const result = await prisma.wallpaper.updateMany({ where: { id, userId }, data });
        if (result.count === 0) {
          throw new Error(`Wallpaper ${id} was not found for the authenticated user.`);
        }

        const wallpaper = await prisma.wallpaper.findFirst({ where: { id, userId } });
        if (!wallpaper) {
          throw new Error(`Wallpaper ${id} was not found for the authenticated user.`);
        }

        return wallpaper;
      },
    },
  };
}

function createOpenAIPromptEnricher(env: {
  OPENAI_API_KEY: string;
  OPENAI_PROMPT_MODEL: string;
}): PromptEnricher {
  return async (state) => {
    const response = await fetch('https://api.openai.com/v1/responses', {
      body: JSON.stringify({
        input: `Expand this wallpaper prompt into a concise, professional image-generation prompt. Preserve the subject and avoid any text or watermark instructions.\n\n${state.prompt}`,
        model: env.OPENAI_PROMPT_MODEL,
      }),
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`OpenAI prompt enrichment failed: HTTP ${response.status}.`);
    }

    const outputText = extractResponseOutputText(await response.json());
    if (!outputText) {
      throw new Error('OpenAI prompt enrichment returned no text.');
    }

    return outputText;
  };
}

function extractResponseOutputText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const response = payload as {
    output?: Array<{ content?: Array<{ text?: unknown; type?: unknown }> }>;
    output_text?: unknown;
  };
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (
        content.type === 'output_text' &&
        typeof content.text === 'string' &&
        content.text.trim()
      ) {
        return content.text.trim();
      }
    }
  }

  return undefined;
}
