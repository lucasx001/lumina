import { Annotation } from '@langchain/langgraph';

import type { ImageResult } from '../providers/types.js';

export const wallpaperModes = ['text2img', 'outpaint', 'edit', 'style', 'upscale'] as const;

export type WallpaperMode = (typeof wallpaperModes)[number];
export type WallpaperQuality = 'draft' | 'hd';

export type WallpaperUserInputs = {
  idea?: string;
  mood?: string;
  theme?: string;
  tone?: string;
};

export type WallpaperGraphInput = {
  category: string;
  clerkUserId?: string;
  deviceId?: string;
  height: number;
  mode: WallpaperMode;
  quality?: WallpaperQuality;
  presetId?: string;
  sourceImageUrl?: string;
  userId?: string;
  userInputs: WallpaperUserInputs;
  wallpaperId?: string;
  width: number;
};

export type WallpaperGraphState = WallpaperGraphInput & {
  error?: string;
  negativePrompt?: string;
  prompt?: string;
  providerResult?: ImageResult;
  resultImageUrl?: string;
  styleRefUrl?: string;
  wallpaperId?: string;
};

export const WallpaperGraphAnnotation = Annotation.Root({
  category: Annotation<string>,
  clerkUserId: Annotation<string | undefined>,
  deviceId: Annotation<string | undefined>,
  presetId: Annotation<string | undefined>,
  userId: Annotation<string | undefined>,
  userInputs: Annotation<WallpaperUserInputs>,
  mode: Annotation<WallpaperMode>,
  quality: Annotation<WallpaperQuality | undefined>,
  width: Annotation<number>,
  height: Annotation<number>,
  prompt: Annotation<string | undefined>,
  negativePrompt: Annotation<string | undefined>,
  sourceImageUrl: Annotation<string | undefined>,
  styleRefUrl: Annotation<string | undefined>,
  providerResult: Annotation<ImageResult | undefined>,
  resultImageUrl: Annotation<string | undefined>,
  wallpaperId: Annotation<string | undefined>,
  error: Annotation<string | undefined>,
});
