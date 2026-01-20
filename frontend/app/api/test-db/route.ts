import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM material_costs) as materials,
        (SELECT COUNT(*) FROM machining_standards) as standards,
        (SELECT extversion FROM pg_extension WHERE extname = 'vector') as pgvector
    `);
    
    await pool.end();
    
    return NextResponse.json({
      status: '✅ CONNECTED',
      region: 'Frankfurt (gwc.azure.neon.tech)',
      database: 'neondb',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: '❌ ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check DATABASE_URL in .env.local'
    }, { status: 500 });
  }
}
