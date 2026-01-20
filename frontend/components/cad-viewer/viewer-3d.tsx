'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment } from '@react-three/drei';
import { Suspense } from 'react';

interface Viewer3DProps {
  meshData?: any;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4287f5" wireframe />
    </mesh>
  );
}

function PlaceholderMesh() {
  return (
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[2, 1, 1]} />
      <meshStandardMaterial 
        color="#4287f5" 
        metalness={0.3} 
        roughness={0.4}
      />
    </mesh>
  );
}

export function Viewer3D({ meshData }: Viewer3DProps) {
  return (
    <div className="w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={20}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
        />
        <directionalLight 
          position={[-10, -10, -5]} 
          intensity={0.3}
        />
        
        <Suspense fallback={<LoadingFallback />}>
          {meshData ? (
            <primitive object={meshData} />
          ) : (
            <PlaceholderMesh />
          )}
          <Environment preset="studio" />
          <Grid 
            args={[20, 20]} 
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#4b5563"
            fadeDistance={25}
            fadeStrength={1}
            position={[0, -0.5, 0]}
          />
        </Suspense>
      </Canvas>
      
      {!meshData && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs text-gray-600">
          📦 Placeholder mesh - Upload CAD to see actual geometry
        </div>
      )}
    </div>
  );
}
