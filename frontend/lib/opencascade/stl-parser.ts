import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { MeshData } from './types';
import * as THREE from 'three';

/**
 * Parse real STL file and extract geometry
 */
export async function parseSTLFile(file: File): Promise<MeshData> {
  console.log(`📂 Parsing real STL file: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        // Use Three.js STLLoader to parse the file
        const loader = new STLLoader();
        const geometry = loader.parse(arrayBuffer);
        
        console.log(`✅ STL parsed: ${geometry.attributes.position.count} vertices`);
        
        // Extract mesh data
        const positionAttr = geometry.attributes.position;
        const normalAttr = geometry.attributes.normal;
        const indexAttr = geometry.index;
        
        const meshData: MeshData = {
          vertices: new Float32Array(positionAttr.array),
          normals: normalAttr ? new Float32Array(normalAttr.array) : new Float32Array(positionAttr.array.length),
          indices: indexAttr ? new Uint32Array(indexAttr.array) : new Uint32Array(0)
        };
        
        // Compute normals if missing
        if (!normalAttr) {
          geometry.computeVertexNormals();
          const computedNormals = geometry.attributes.normal;
          if (computedNormals) {
            meshData.normals = new Float32Array(computedNormals.array);
          }
        }
        
        // Clean up
        geometry.dispose();
        
        console.log(`✅ Extracted: ${meshData.vertices.length/3} vertices, ${meshData.indices.length/3 || 'no'} triangles`);
        resolve(meshData);
        
      } catch (error) {
        console.error('❌ STL parsing error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Calculate geometry metrics from STL mesh data
 */
export function calculateSTLMetrics(meshData: MeshData) {
  console.log('📐 Calculating STL geometry metrics...');
  
  const vertices = meshData.vertices;
  
  // Calculate bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  
  const boundingBox = {
    x: Math.abs(maxX - minX),
    y: Math.abs(maxY - minY),
    z: Math.abs(maxZ - minZ)
  };
  
  // Estimate volume (very rough approximation)
  // For accurate volume, we'd need to check if mesh is watertight and use proper algorithm
  const volume = boundingBox.x * boundingBox.y * boundingBox.z * 0.4; // 40% fill factor estimate
  
  // Estimate surface area from triangles
  let surfaceArea = 0;
  const triangleCount = meshData.indices.length > 0 
    ? meshData.indices.length / 3 
    : vertices.length / 9;
  
  // Rough surface area estimate
  surfaceArea = triangleCount * Math.pow((boundingBox.x + boundingBox.y + boundingBox.z) / 3, 2) * 0.1;
  
  const metrics = {
    volume: Math.round(volume * 100) / 100,
    surfaceArea: Math.round(surfaceArea * 100) / 100,
    boundingBox: {
      x: Math.round(boundingBox.x * 10) / 10,
      y: Math.round(boundingBox.y * 10) / 10,
      z: Math.round(boundingBox.z * 10) / 10
    },
    faceCount: Math.floor(triangleCount),
    edgeCount: Math.floor(triangleCount * 1.5) // Rough estimate
  };
  
  console.log('✅ STL metrics calculated:', metrics);
  return metrics;
}
