'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Center } from '@react-three/drei';
import { Suspense, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Viewer3DProps {
  meshData?: {
    vertices: Float32Array;
    normals: Float32Array;
    indices: Uint32Array;
  } | null;
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#94a3b8" wireframe />
    </mesh>
  );
}

function CameraAdjuster({ geometry }: { geometry: THREE.BufferGeometry | null }) {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    if (!geometry || !controls) return;
    
    // Compute bounding box
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    const boundingBox = geometry.boundingBox;
    const boundingSphere = geometry.boundingSphere;
    
    if (!boundingBox || !boundingSphere) return;
    
    // Get size of the model
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Calculate camera distance to fit object
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;
    
    // Position camera to look at the model
    const center = boundingSphere.center;
    camera.position.set(
      center.x + cameraDistance,
      center.y + cameraDistance,
      center.z + cameraDistance
    );
    
    // Point camera at center
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    
    // Update controls target
    if (controls && 'target' in controls) {
      (controls as any).target.copy(center);
      (controls as any).update();
    }
    
    console.log(`📷 Camera adjusted: distance=${cameraDistance.toFixed(2)}, model size=${maxDim.toFixed(2)}`);
    
  }, [geometry, camera, controls]);
  
  return null;
}

function CADMesh({ meshData }: { meshData: Viewer3DProps['meshData'] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    if (!meshData || meshData.vertices.length === 0) {
      console.log('⚠️ No mesh data - returning null geometry');
      return null;
    }
    
    console.log(`🔺 Building geometry from ${meshData.vertices.length/3} vertices`);
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(meshData.vertices, 3));
    
    if (meshData.normals && meshData.normals.length > 0) {
      geo.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
    } else {
      geo.computeVertexNormals();
    }
    
    if (meshData.indices && meshData.indices.length > 0) {
      geo.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
    }
    
    // Center the geometry at origin
    geo.center();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    
    const bbox = geo.boundingBox;
    if (bbox) {
      const size = new THREE.Vector3();
      bbox.getSize(size);
      console.log(`   📏 Model size: ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`);
    }
    
    console.log('✅ Geometry built successfully');
    return geo;
  }, [meshData]);

  if (!geometry) {
    return null;
  }

  return (
    <>
      <CameraAdjuster geometry={geometry} />
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#3b82f6"
          metalness={0.3} 
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

export function Viewer3D({ meshData }: Viewer3DProps) {
  const hasData = meshData && meshData.vertices.length > 0;

  return (
    <div className="w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={0.5}
          maxDistance={100}
          maxPolarAngle={Math.PI}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight 
          position={[-10, -10, -5]} 
          intensity={0.3}
        />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
        />
        
        <Suspense fallback={<LoadingFallback />}>
          {hasData && <CADMesh meshData={meshData} />}
          <Environment preset="studio" />
          <Grid 
            args={[50, 50]} 
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#4b5563"
            fadeDistance={100}
            fadeStrength={1}
            position={[0, -0.01, 0]}
            infiniteGrid
          />
        </Suspense>
      </Canvas>
      
      {/* Status indicator */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs space-y-1">
        {hasData ? (
          <>
            <p className="text-green-600 font-semibold">✅ Mesh Loaded</p>
            <p className="text-gray-600">{(meshData.vertices.length / 3).toLocaleString()} vertices</p>
            {meshData.indices.length > 0 ? (
              <p className="text-gray-600">{(meshData.indices.length / 3).toLocaleString()} triangles</p>
            ) : (
              <p className="text-gray-500 text-xs">Non-indexed mesh</p>
            )}
          </>
        ) : (
          <>
            <p className="text-gray-500">⬜ Empty Canvas</p>
            <p className="text-gray-400 text-xs">Upload & process CAD file</p>
          </>
        )}
      </div>

      {/* Controls hint */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-gray-600">
        <p>🖱️ Left: Rotate</p>
        <p>🖱️ Right: Pan</p>
        <p>🖱️ Scroll: Zoom</p>
      </div>
      
      {/* Reset camera button */}
      {hasData && (
        <div className="absolute top-4 left-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs font-medium hover:bg-white transition-colors"
          >
            🔄 Reset View
          </button>
        </div>
      )}
    </div>
  );
}
