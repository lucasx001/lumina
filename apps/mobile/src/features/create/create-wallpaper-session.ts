import { useCreateStore } from '@/stores/create-store';
import { useGenerationStore } from '@/stores/generation-store';

export function resetCreateWallpaperSession() {
  useCreateStore.getState().reset();
  useGenerationStore.getState().reset('create');
}
