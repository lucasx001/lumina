import type { ImageProps } from 'expo-image';
import minimal from '../../assets/presets/minimal.svg';
import cinematic from '../../assets/presets/cinematic.svg';
import cyberpunk from '../../assets/presets/cyberpunk.svg';
import nature from '../../assets/presets/nature.svg';
import anime from '../../assets/presets/anime.svg';
import abstract from '../../assets/presets/abstract.svg';
import editorial from '../../assets/presets/editorial.svg';

// Bundled style illustrations remain available offline and on a fresh database.
export const builtInPresetCovers: Partial<Record<string, ImageProps['source']>> = {
  preset_builtin_minimal: minimal,
  preset_builtin_cinematic: cinematic,
  preset_builtin_cyberpunk: cyberpunk,
  preset_builtin_nature: nature,
  preset_builtin_anime: anime,
  preset_builtin_abstract: abstract,
  preset_builtin_editorial: editorial,
};
