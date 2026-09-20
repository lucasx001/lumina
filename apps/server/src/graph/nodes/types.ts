import type { Wallpaper } from '../../../prisma/generated/prisma/client.js';
import type { R2Storage } from '../../lib/r2.js';
import type { ImageProvider } from '../../providers/types.js';

export type PresetRecord = {
  id: string;
  negativePrompt: string | null;
  promptTemplate: string;
  styleRefKey: string | null;
};

export type CustomPresetData = {
  category: string;
  colorKeywords: string[];
  compositionKeywords: string[];
  materialKeywords: string[];
  name: string;
  ownerClerkUserId: string;
  promptTemplate: string;
  styleRefKey: string;
};

export type WallpaperRepository = {
  create(data: {
    categoryId: string;
    mode: string;
    presetId?: string;
    prompt: string;
    quality?: string;
    sourceImageKey?: string;
    status: string;
    userId: string;
    width: number;
    height: number;
  }): Promise<Wallpaper>;
  update(
    owner: { id: string; userId: string },
    data: {
      error?: string | null;
      providerTask?: string | null;
      prompt?: string;
      resultImageKey?: string | null;
      status?: string;
      width?: number | null;
      height?: number | null;
    },
  ): Promise<Wallpaper>;
};

export type WallpaperGraphDependencies = {
  imageProvider: ImageProvider;
  onWallpaperCreated?: (wallpaperId: string) => void;
  presets: {
    createCustom?(data: CustomPresetData): Promise<PresetRecord>;
    findById(id: string, clerkUserId?: string): Promise<PresetRecord | null>;
  };
  storage: Pick<R2Storage, 'getUrl' | 'uploadBuffer' | 'uploadFile' | 'uploadFromUrl'>;
  wallpapers: WallpaperRepository;
};
