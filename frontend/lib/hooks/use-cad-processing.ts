import { useState } from 'react';
import { useCADStore } from '@/lib/stores/cad-processing-store';
import { 
  parseSTEPFile, 
  calculateGeometryMetrics, 
  generateMesh,
  getOpenCascadeInstance 
} from '@/lib/opencascade/parser';
import { calculateSTLMetrics } from '@/lib/opencascade/stl-parser';
import { estimateCost } from '@/lib/ai/cost-estimator';

export function useCADProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { 
    setGeometryMetrics, 
    setMeshData, 
    setCostEstimate,
    setProcessingStage, 
    setError 
  } = useCADStore();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingStage('parsing');
    setProgress(10);

    try {
      console.log('🚀 Starting CAD file processing...');
      
      // Step 1: Parse file
      setProgress(20);
      const shape = await parseSTEPFile(file);
      setProgress(35);
      
      // Step 2: Generate mesh (for STL, this does the actual parsing)
      setProcessingStage('extracting');
      setProgress(45);
      const oc = await getOpenCascadeInstance();
      const mesh = await generateMesh(oc, shape);
      setMeshData(mesh);
      setProgress(60);
      
      // Step 3: Calculate geometry metrics
      setProgress(70);
      let metrics;
      
      if (shape.isRealSTL) {
        metrics = calculateSTLMetrics(mesh);
      } else {
        metrics = await calculateGeometryMetrics(oc, shape);
      }
      
      setGeometryMetrics(metrics);
      setProgress(80);
      
      // Step 4: Calculate cost estimate with AI
      setProcessingStage('estimating');
      setProgress(85);
      console.log('💰 Calculating cost estimate...');
      const costEstimate = await estimateCost(metrics, 'Aluminum 6061');
      setCostEstimate(costEstimate);
      setProgress(95);
      
      // Complete
      setProgress(100);
      setProcessingStage('complete');
      
      console.log('✅ CAD processing complete!');
      console.log('Vertices:', mesh.vertices.length / 3);
      console.log('Metrics:', metrics);
      console.log('Cost:', costEstimate);
      
      return { success: true, metrics, mesh, costEstimate };
      
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
