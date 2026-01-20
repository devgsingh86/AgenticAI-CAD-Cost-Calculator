import type { GeometryMetrics, MeshData } from './types';
import * as THREE from 'three';
import { parseSTLFile, calculateSTLMetrics } from './stl-parser';

let isInitialized = false;

export async function getOpenCascadeInstance(): Promise<any> {
  if (isInitialized) return {};
  
  console.log('🔧 Mock OpenCascade.js (STEP support coming in Day 3)');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  isInitialized = true;
  return {};
}

export async function parseSTEPFile(file: File): Promise<any> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  
  // If it's an STL file, parse it for real!
  if (fileExt === 'stl') {
    console.log('🎯 Real STL file detected - using actual parser');
    return {
      fileName: file.name,
      fileType: 'stl',
      isRealSTL: true,
      file: file
    };
  }
  
  // Otherwise use mock for STEP files
  console.log(`📂 Mock parsing: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
  const parseTime = Math.min(file.size / 1000000, 2000);
  await new Promise(resolve => setTimeout(resolve, parseTime));
  
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: fileExt || 'unknown',
    isRealSTL: false
  };
}

export async function calculateGeometryMetrics(
  oc: any, 
  shape: any
): Promise<GeometryMetrics> {
  // If it's a real STL file, we'll calculate metrics after mesh generation
  if (shape.isRealSTL) {
    console.log('📐 Will calculate metrics from real STL mesh...');
    return {
      volume: 0,
      surfaceArea: 0,
      boundingBox: { x: 0, y: 0, z: 0 },
      faceCount: 0,
      edgeCount: 0
    };
  }
  
  // Mock metrics for STEP files
  console.log('📐 Calculating mock geometry metrics...');
  
  const seed = (shape.fileName || 'default').split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
  const random = (min: number, max: number, offset: number = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    return min + ((x - Math.floor(x)) * (max - min));
  };
  
  const volume = random(50, 500, 1);
  const surfaceArea = volume * random(5, 8, 2);
  
  const metrics: GeometryMetrics = {
    volume: Math.round(volume * 100) / 100,
    surfaceArea: Math.round(surfaceArea * 100) / 100,
    boundingBox: {
      x: Math.round(random(50, 150, 3) * 10) / 10,
      y: Math.round(random(40, 120, 4) * 10) / 10,
      z: Math.round(random(30, 100, 5) * 10) / 10
    },
    faceCount: Math.floor(random(10, 40, 6)),
    edgeCount: Math.floor(random(20, 80, 7))
  };
  
  console.log('✅ Mock metrics:', metrics);
  return metrics;
}

function extractMeshData(geometry: THREE.BufferGeometry): MeshData {
  if (!geometry.attributes.position) {
    geometry.computeBoundingBox();
  }
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }
  
  const positionAttr = geometry.attributes.position;
  const normalAttr = geometry.attributes.normal;
  const indexAttr = geometry.index;
  
  const vertices = new Float32Array(positionAttr.array);
  const normals = normalAttr ? new Float32Array(normalAttr.array) : new Float32Array(vertices.length);
  const indices = indexAttr ? new Uint32Array(indexAttr.array) : new Uint32Array(0);
  
  console.log(`   → Extracted: ${vertices.length/3} vertices, ${indices.length/3} triangles`);
  
  return { vertices, normals, indices };
}

export async function generateMesh(
  oc: any, 
  shape: any,
  linearDeflection: number = 0.1
): Promise<MeshData> {
  // If it's a real STL file, parse it properly
  if (shape.isRealSTL && shape.file) {
    console.log('🔺 Parsing real STL file...');
    const meshData = await parseSTLFile(shape.file);
    return meshData;
  }
  
  // Otherwise generate mock geometry
  console.log('🔺 Generating mock mesh for:', shape.fileName);
  
  const fileName = (shape.fileName || '').toLowerCase();
  let geometry: THREE.BufferGeometry;
  let shapeType = 'box';
  
  if (fileName.includes('bracket')) {
    shapeType = 'bracket';
    geometry = createBracketGeometry();
  } else if (fileName.includes('shaft') || fileName.includes('cylinder')) {
    shapeType = 'cylinder';
    geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
  } else if (fileName.includes('sphere') || fileName.includes('ball')) {
    shapeType = 'sphere';
    geometry = new THREE.SphereGeometry(1, 32, 32);
  } else if (fileName.includes('torus') || fileName.includes('ring')) {
    shapeType = 'torus';
    geometry = new THREE.TorusGeometry(1, 0.3, 16, 32);
  } else if (fileName.includes('cone')) {
    shapeType = 'cone';
    geometry = new THREE.ConeGeometry(0.8, 2, 32);
  } else {
    shapeType = 'box';
    geometry = new THREE.BoxGeometry(2, 1, 0.8);
  }
  
  console.log(`   📦 Shape type: ${shapeType}`);
  
  const meshData = extractMeshData(geometry);
  geometry.dispose();
  
  console.log(`✅ Generated ${shapeType} mesh: ${meshData.vertices.length/3} vertices`);
  
  return meshData;
}

function createBracketGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  
  shape.moveTo(0, 0);
  shape.lineTo(2, 0);
  shape.lineTo(2, 0.2);
  shape.lineTo(0.2, 0.2);
  shape.lineTo(0.2, 1.5);
  shape.lineTo(0, 1.5);
  shape.lineTo(0, 0);
  
  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}
