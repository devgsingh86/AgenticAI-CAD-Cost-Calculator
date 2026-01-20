// Type definitions for CAD processing

export interface GeometryMetrics {
  volume: number; // cm³
  surfaceArea: number; // cm²
  boundingBox: {
    x: number; // mm
    y: number; // mm
    z: number; // mm
  };
  faceCount?: number;
  edgeCount?: number;
}

export interface MeshData {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

// Mock OpenCascade instance type
export interface OpenCascadeInstance {
  [key: string]: any;
}
