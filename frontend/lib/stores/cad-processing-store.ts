import { create } from 'zustand';
import type { GeometryMetrics } from '@/lib/types/cad';

interface MeshData {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

interface CADProcessingState {
  file: File | null;
  geometryMetrics: GeometryMetrics | null;
  meshData: MeshData | null;
  processingStage: 'idle' | 'ready' | 'parsing' | 'extracting' | 'estimating' | 'complete' | 'error';
  error: string | null;
  
  setFile: (file: File | null) => void;
  setGeometryMetrics: (metrics: GeometryMetrics | null) => void;
  setMeshData: (data: MeshData | null) => void;
  setProcessingStage: (stage: CADProcessingState['processingStage']) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useCADStore = create<CADProcessingState>((set) => ({
  file: null,
  geometryMetrics: null,
  meshData: null,
  processingStage: 'idle',
  error: null,
  
  setFile: (file) => set({ file, geometryMetrics: null, meshData: null, error: null }),
  setGeometryMetrics: (metrics) => {
    console.log('📊 Store: Setting geometry metrics', metrics);
    set({ geometryMetrics: metrics });
  },
  setMeshData: (data) => {
    console.log('🔺 Store: Setting mesh data', data ? `${data.vertices.length/3} vertices` : 'null');
    set({ meshData: data });
  },
  setProcessingStage: (stage) => set({ processingStage: stage }),
  setError: (error) => set({ error, processingStage: 'error' }),
  reset: () => set({
    file: null,
    geometryMetrics: null,
    meshData: null,
    processingStage: 'idle',
    error: null
  })
}));
