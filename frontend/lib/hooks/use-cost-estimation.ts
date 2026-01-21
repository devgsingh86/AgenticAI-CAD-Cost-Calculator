import { useState } from 'react';
import { estimateCost } from '@/lib/ai/cost-estimator';
import type { GeometryMetrics } from '@/lib/types/cad';

export interface CostEstimate {
  materialCost: number;
  machiningCost: number;
  setupCost: number;
  finishingCost: number;
  totalCost: number;
  estimatedTime: string;
  complexity: string;
  material: string;
  breakdown?: {
    materialRate: string;
    shopRate: string;
    surfaceComplexityMultiplier: number;
  };
}

export function useCostEstimation() {
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateCost = async (
    metrics: GeometryMetrics, 
    material: string = 'Aluminum 6061'
  ) => {
    setIsEstimating(true);
    setError(null);

    try {
      console.log('💰 Calculating cost estimate...');
      const result = await estimateCost(metrics, material);
      setEstimate(result);
      console.log('✅ Cost estimate complete:', result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to estimate cost';
      console.error('❌ Cost estimation error:', message);
      setError(message);
      throw err;
    } finally {
      setIsEstimating(false);
    }
  };

  const reset = () => {
    setEstimate(null);
    setError(null);
  };

  return { 
    calculateCost, 
    isEstimating, 
    estimate, 
    error,
    reset 
  };
}
