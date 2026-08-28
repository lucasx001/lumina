import { create } from 'zustand';

import type { WallpaperPreviewMode } from '@/components/WallpaperPreview';

type WallpaperPreviewState = {
  isApplySheetVisible: boolean;
  previewMode: WallpaperPreviewMode;
};

type WallpaperPreviewActions = {
  reset: () => void;
  setApplySheetVisible: (visible: boolean) => void;
  setPreviewMode: (previewMode: WallpaperPreviewMode) => void;
};

export type WallpaperPreviewStore = WallpaperPreviewState & WallpaperPreviewActions;

const initialWallpaperPreviewState: WallpaperPreviewState = {
  isApplySheetVisible: false,
  previewMode: 'lock-screen',
};

export const useWallpaperPreviewStore = create<WallpaperPreviewStore>()((set) => ({
  ...initialWallpaperPreviewState,
  reset: () => set(initialWallpaperPreviewState),
  setApplySheetVisible: (isApplySheetVisible) => set({ isApplySheetVisible }),
  setPreviewMode: (previewMode) => set({ previewMode }),
}));
