import Groq from 'groq-sdk';
import type { GeometryMetrics } from '@/lib/types/cad';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function estimateCost(metrics: GeometryMetrics, material: string = 'Aluminum 6061') {
  const prompt = `Manufacturing cost estimate for CNC machining:

Volume: ${metrics.volume} cm³
Surface Area: ${metrics.surfaceArea} cm²
Complexity: ${metrics.faceCount || 20} faces
Material: ${material}

Calculate costs for:
1. Material ($/cm³ × volume)
2. Machining ($90/hr shop rate)
3. Setup ($50 base)
4. Finishing (based on surface area)

Respond ONLY with JSON:
{"materialCost": X, "machiningCost": Y, "setupCost": 50, "finishingCost": Z, "totalCost": total, "estimatedTime": "X hours", "complexity": "Low/Medium/High"}`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices[0].message.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : getFallback(metrics);
  } catch (error) {
    console.warn('Groq API failed, using fallback');
    return getFallback(metrics);
  }
}

function getFallback(metrics: GeometryMetrics) {
  const materialCost = metrics.volume * 0.15;
  const machiningCost = (metrics.surfaceArea / 100) * 15 * 1.5;
  const setupCost = 50;
  const finishingCost = metrics.surfaceArea * 0.05;
  const total = materialCost + machiningCost + setupCost + finishingCost;
  
  return {
    materialCost: Math.round(materialCost * 100) / 100,
    machiningCost: Math.round(machiningCost * 100) / 100,
    setupCost,
    finishingCost: Math.round(finishingCost * 100) / 100,
    totalCost: Math.round(total * 100) / 100,
    estimatedTime: `${Math.round((machiningCost / 1.5) / 60 * 10) / 10} hours`,
    complexity: (metrics.faceCount || 0) > 30 ? 'High' : 'Medium'
  };
}
