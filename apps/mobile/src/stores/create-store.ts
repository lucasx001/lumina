import { create } from 'zustand';

import type { CreateChipField, CreateChipValues } from '@/components/create';
import type { ExistingImageMode } from '@/components/edit';
import type { GenerationQuality } from '@/lib/api';

type CreateState = {
  category: string;
  chipValues: CreateChipValues;
  idea: string;
  instruction: string;
  mode?: ExistingImageMode;
  presetId?: string;
  quality: GenerationQuality;
  sourceImageUrl?: string;
};

type CreateActions = {
  reset: () => void;
  setCategory: (category: string) => void;
  setChip: (field: CreateChipField, value: string | undefined) => void;
  setIdea: (idea: string) => void;
  setInstruction: (instruction: string) => void;
  setMode: (mode: ExistingImageMode | undefined) => void;
  setPresetId: (presetId: string | undefined) => void;
  setQuality: (quality: GenerationQuality) => void;
  setSourceImageUrl: (sourceImageUrl: string | undefined) => void;
};

export type CreateStore = CreateState & CreateActions;

const initialCreateState: CreateState = {
  category: '',
  chipValues: {},
  idea: '',
  instruction: '',
  mode: undefined,
  presetId: undefined,
  quality: 'draft',
  sourceImageUrl: undefined,
};

export const useCreateStore = create<CreateStore>()((set) => ({
  ...initialCreateState,
  reset: () => set(initialCreateState),
  setCategory: (category) => set({ category }),
  setChip: (field, value) =>
    set((state) => ({ chipValues: { ...state.chipValues, [field]: value } })),
  setIdea: (idea) => set({ idea }),
  setInstruction: (instruction) => set({ instruction }),
  setMode: (mode) => set({ mode }),
  setPresetId: (presetId) => set({ presetId }),
  setQuality: (quality) => set({ quality }),
  setSourceImageUrl: (sourceImageUrl) => set({ sourceImageUrl }),
}));
