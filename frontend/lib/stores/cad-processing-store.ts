import { create } from 'zustand';

interface CADProcessingState {
  file: File | null;
  processingStage: string;
  setFile: (file: File | null) => void;
  setProcessingStage: (stage: string) => void;
}

export const useCADStore = create<CADProcessingState>((set) => ({
  file: null,
  processingStage: 'idle',
  setFile: (file) => set({ file }),
  setProcessingStage: (stage) => set({ processingStage: stage }),
}));
