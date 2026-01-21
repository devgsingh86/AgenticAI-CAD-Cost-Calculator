import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import type { GeometryMetrics } from '@/lib/types/cad';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

function getFallbackEstimate(metrics: GeometryMetrics, material: string) {
  console.log('💡 Using algorithmic cost estimation...');
  
  const materialRates: Record<string, number> = {
    'Aluminum 6061': 0.15,
    'Steel 1018': 0.12,
    'Stainless Steel 304': 0.25,
    'Titanium Grade 5': 1.50,
    'Brass': 0.20,
    'Plastic (ABS)': 0.05
  };
  
  const materialRate = materialRates[material] || 0.15;
  const materialCost = metrics.volume * materialRate;
  
  const complexity = metrics.faceCount || 20;
  const surfaceComplexity = complexity > 30 ? 1.5 : complexity > 20 ? 1.2 : 1.0;
  
  const machiningMinutes = (metrics.surfaceArea / 100) * 15 * surfaceComplexity;
  const machiningCost = machiningMinutes * 1.5;
  
  const setupCost = 50;
  const finishingCost = metrics.surfaceArea * 0.05;
  
  const total = materialCost + machiningCost + setupCost + finishingCost;
  
  let complexityLevel = 'Low';
  if (complexity > 30 || metrics.volume > 500) {
    complexityLevel = 'High';
  } else if (complexity > 20 || metrics.volume > 200) {
    complexityLevel = 'Medium';
  }
  
  return {
    materialCost: Math.round(materialCost * 100) / 100,
    machiningCost: Math.round(machiningCost * 100) / 100,
    setupCost,
    finishingCost: Math.round(finishingCost * 100) / 100,
    totalCost: Math.round(total * 100) / 100,
    estimatedTime: `${Math.round(machiningMinutes / 60 * 10) / 10} hours`,
    complexity: complexityLevel,
    material,
    breakdown: {
      materialRate: `$${materialRate}/cm³`,
      shopRate: '$90/hour',
      surfaceComplexityMultiplier: surfaceComplexity
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { geometryMetrics, material = 'Aluminum 6061' } = await request.json();
    
    if (!geometryMetrics) {
      return NextResponse.json(
        { error: 'Missing geometry metrics' },
        { status: 400 }
      );
    }

    // If no Groq API key, use fallback
    if (!process.env.GROQ_API_KEY) {
      console.warn('No Groq API key, using algorithmic fallback');
      const estimate = getFallbackEstimate(geometryMetrics, material);
      return NextResponse.json({ success: true, estimate, method: 'algorithm' });
    }

    const prompt = `You are an expert manufacturing cost estimator for CNC machining.

Part Specifications:
- Volume: ${geometryMetrics.volume} cm³
- Surface Area: ${geometryMetrics.surfaceArea} cm²
- Bounding Box: ${geometryMetrics.boundingBox.x} × ${geometryMetrics.boundingBox.y} × ${geometryMetrics.boundingBox.z} mm
- Complexity: ${geometryMetrics.faceCount || 20} faces
- Material: ${material}

Calculate the manufacturing cost breakdown for CNC machining this part. Use these rates:
- Aluminum 6061: $0.15/cm³
- Shop rate: $90/hour ($1.50/minute)
- Setup cost: $50
- Finishing: $0.05/cm²

Respond ONLY with valid JSON (no markdown):
{
  "materialCost": 36.85,
  "machiningCost": 359.29,
  "setupCost": 50.00,
  "finishingCost": 79.84,
  "totalCost": 525.98,
  "estimatedTime": "4.0 hours",
  "complexity": "Medium",
  "material": "${material}"
}`;

    try {
      console.log('🤖 Calling Groq API...');
      
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a manufacturing cost estimation expert. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0].message.content || '{}';
      console.log('📥 Groq response:', content);
      
      // Extract JSON
      let jsonStr = content;
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      const estimate = JSON.parse(jsonStr);
      console.log('✅ Parsed estimate:', estimate);
      
      return NextResponse.json({ 
        success: true, 
        estimate,
        method: 'groq-ai' 
      });
      
    } catch (error) {
      console.error('❌ Groq API error:', error);
      console.log('Using algorithmic fallback...');
      const estimate = getFallbackEstimate(geometryMetrics, material);
      return NextResponse.json({ 
        success: true, 
        estimate,
        method: 'algorithm-fallback'
      });
    }
    
  } catch (error) {
    console.error('Cost estimation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to estimate cost',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
