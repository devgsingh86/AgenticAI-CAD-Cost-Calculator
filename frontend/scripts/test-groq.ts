import { estimateCost } from '../lib/ai/cost-estimator';

async function test() {
  console.log('🧪 Testing Groq Cost Estimation\n');
  
  const mockGeometry = {
    volume: 245.67,
    surfaceArea: 1596.86,
    boundingBox: { x: 120.5, y: 80.3, z: 45.2 },
    faceCount: 24,
    edgeCount: 48
  };
  
  console.log('📦 Test Geometry:', mockGeometry);
  console.log('🔧 Material: Aluminum 6061\n');
  
  try {
    const estimate = await estimateCost(mockGeometry, 'Aluminum 6061');
    
    console.log('✅ Cost Estimate Result:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Material Cost:   $' + estimate.materialCost);
    console.log('Machining Cost:  $' + estimate.machiningCost);
    console.log('Setup Cost:      $' + estimate.setupCost);
    console.log('Finishing Cost:  $' + estimate.finishingCost);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TOTAL:           $' + estimate.totalCost);
    console.log('');
    console.log('Estimated Time:  ' + estimate.estimatedTime);
    console.log('Complexity:      ' + estimate.complexity);
    console.log('Material:        ' + estimate.material);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
