import { useState } from 'react';
import { useCADStore } from '@/lib/stores/cad-processing-store';
import { 
  parseSTEPFile, 
  calculateGeometryMetrics, 
  generateMesh,
  getOpenCascadeInstance 
} from '@/lib/opencascade/parser';
import { calculateSTLMetrics } from '@/lib/opencascade/stl-parser';

export function useCADProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { setGeometryMetrics, setMeshData, setProcessingStage, setError } = useCADStore();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingStage('parsing');
    setProgress(10);

    try {
      console.log('🚀 Starting CAD file processing...');
      
      // Step 1: Parse file
      setProgress(20);
      const shape = await parseSTEPFile(file);
      setProgress(40);
      
      // Step 2: Generate mesh (for STL, this does the actual parsing)
      setProcessingStage('extracting');
      setProgress(50);
      const oc = await getOpenCascadeInstance();
      const mesh = await generateMesh(oc, shape);
      setMeshData(mesh);
      setProgress(70);
      
      // Step 3: Calculate geometry metrics
      setProgress(80);
      let metrics;
      
      if (shape.isRealSTL) {
        // Calculate real metrics from STL mesh
        metrics = calculateSTLMetrics(mesh);
      } else {
        // Use mock metrics for STEP files
        metrics = await calculateGeometryMetrics(oc, shape);
      }
      
      setGeometryMetrics(metrics);
      setProgress(90);
      
      // Complete
      setProgress(100);
      setProcessingStage('complete');
      
      console.log('✅ CAD processing complete!');
      console.log('Vertices:', mesh.vertices.length / 3);
      console.log('Metrics:', metrics);
      
      return { success: true, metrics, mesh };
      
    } catch (error) {
      console.error('❌ CAD processing failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setProgress(0);
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    processFile, 
    isProcessing, 
    progress 
  };
}
