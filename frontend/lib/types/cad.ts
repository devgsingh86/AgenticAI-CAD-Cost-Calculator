export interface GeometryMetrics {
  volume: number; // cm³
  surfaceArea: number; // cm²
  boundingBox: {
    x: number;
    y: number;
    z: number;
  };
  complexity?: number; // 1-10 scale
}

export interface Feature {
  id: string;
  type: 'HOLE' | 'POCKET' | 'FILLET' | 'CHAMFER' | 'THREAD' | 'SLOT';
  dimensions: {
    diameter?: number;
    depth?: number;
    radius?: number;
    width?: number;
    length?: number;
  };
  location: { x: number; y: number; z: number };
}

export interface CostBreakdown {
  material: number;
  setup: number;
  machining: number;
  finishing: number;
  overhead?: number;
  total: number;
  currency: string;
}

export interface DfMRecommendation {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  estimatedSavings: number;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
}
