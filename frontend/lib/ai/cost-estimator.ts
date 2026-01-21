import type { GeometryMetrics } from '@/lib/types/cad';

export async function estimateCost(
  metrics: GeometryMetrics, 
  material: string = 'Aluminum 6061'
) {
  console.log('💰 Calling cost estimation API...');
  
  try {
    const response = await fetch('/api/estimate-cost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        geometryMetrics: metrics,
        material
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Estimation failed');
    }

    console.log(`✅ Cost estimate (${data.method}):`, data.estimate);
    return data.estimate;
    
  } catch (error) {
    console.error('❌ Cost estimation failed:', error);
    throw error;
  }
}
