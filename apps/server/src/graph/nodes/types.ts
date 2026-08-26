import type { Wallpaper } from '../../../prisma/generated/prisma/client.js';
import type { R2Storage } from '../../lib/r2.js';
import type { ImageProvider } from '../../providers/types.js';
import type { WallpaperGraphState } from '../state.js';

export type PresetRecord = {
  id: string;
  negativePrompt: string | null;
  promptTemplate: string;
  styleRefUrl: string | null;
};

export type CustomPresetData = {
  category: string;
  colorKeywords: string[];
  compositionKeywords: string[];
  materialKeywords: string[];
  name: string;
  ownerClerkUserId: string;
  promptTemplate: string;
  styleRefUrl: string;
};

export type WallpaperRepository = {
  create(data: {
    category: string;
    deviceId?: string;
    mode: string;
    presetId?: string;
    prompt: string;
    quality?: string;
    sourceImageUrl?: string;
    status: string;
    userId?: string;
    width: number;
    height: number;
  }): Promise<Wallpaper>;
  update(
    id: string,
    data: {
      error?: string | null;
      providerTask?: string | null;
      prompt?: string;
      resultImageUrl?: string | null;
      status?: string;
      width?: number | null;
      height?: number | null;
    },
  ): Promise<Wallpaper>;
};

export type PromptEnricher = (state: WallpaperGraphState) => Promise<string>;

export type WallpaperGraphDependencies = {
  enrichPrompt?: PromptEnricher;
  imageProvider: ImageProvider;
  onWallpaperCreated?: (wallpaperId: string) => void;
  presets: {
    createCustom?(data: CustomPresetData): Promise<PresetRecord>;
    findById(id: string, clerkUserId?: string): Promise<PresetRecord | null>;
  };
  storage: Pick<R2Storage, 'uploadBuffer' | 'uploadFile' | 'uploadFromUrl'>;
  wallpapers: WallpaperRepository;
};
