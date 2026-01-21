'use client';

import { CADUploader } from '@/components/upload/cad-uploader';
import { Viewer3D } from '@/components/cad-viewer/viewer-3d';
import { useCADStore } from '@/lib/stores/cad-processing-store';
import { useCADProcessing } from '@/lib/hooks/use-cad-processing';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Cpu, DollarSign, RefreshCw, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const { 
    file, 
    geometryMetrics, 
    meshData, 
    costEstimate, 
    processingStage, 
    error, 
    reset 
  } = useCADStore();
  
  const { processFile, isProcessing, progress } = useCADProcessing();

  const handleFileSelected = async (selectedFile: File) => {
    console.log('🎯 File selected, auto-processing:', selectedFile.name);
    await processFile(selectedFile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CAD Cost Estimator</h1>
            <p className="text-sm text-gray-600">AI-powered manufacturing cost analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Day 3 - Groq AI Integration</Badge>
            {geometryMetrics && (
              <button
                onClick={reset}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                New File
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  1. Upload CAD File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CADUploader onFileSelected={handleFileSelected} />
              </CardContent>
            </Card>

            {/* Processing Status */}
            {isProcessing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Processing CAD File...</p>
                      <p className="text-sm text-blue-700">
                        {processingStage === 'parsing' && 'Reading file structure...'}
                        {processingStage === 'extracting' && 'Extracting geometry...'}
                        {processingStage === 'estimating' && 'Calculating costs with AI...'}
                        {processingStage === 'complete' && 'Complete!'}
                      </p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-blue-600 mt-2 text-right">{progress}%</p>
                </CardContent>
              </Card>
            )}

            {/* Geometry Results */}
            {geometryMetrics && !isProcessing && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-green-900">✅ Geometry Extracted</p>
                    {file?.name.toLowerCase().endsWith('.stl') ? (
                      <Badge variant="secondary" className="text-xs">Real STL</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Mock Data</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Volume:</p>
                      <p className="font-mono font-semibold text-green-900">
                        {geometryMetrics.volume.toFixed(2)} cm³
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Surface Area:</p>
                      <p className="font-mono font-semibold text-green-900">
                        {geometryMetrics.surfaceArea.toFixed(2)} cm²
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Bounding Box:</p>
                      <p className="font-mono text-xs text-green-800">
                        {geometryMetrics.boundingBox.x.toFixed(1)} × {' '}
                        {geometryMetrics.boundingBox.y.toFixed(1)} × {' '}
                        {geometryMetrics.boundingBox.z.toFixed(1)} mm
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Complexity:</p>
                      <p className="font-mono text-xs text-green-800">
                        {geometryMetrics.faceCount} faces
                      </p>
                    </div>
                  </div>
                  
                  {meshData && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="text-xs text-green-700">
                        Mesh: {(meshData.vertices.length/3).toLocaleString()} vertices
                        {meshData.indices.length > 0 && `, ${(meshData.indices.length/3).toLocaleString()} triangles`}
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  <p className="font-semibold">❌ Processing Error</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button 
                    onClick={reset}
                    className="mt-2 text-xs underline"
                  >
                    Try another file
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Progress Tracker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Development Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Groq AI cost estimation working</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Real STL parsing & 3D display</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Auto-processing pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">⏳</span>
                    <span className="text-gray-600">STEP file parsing (Day 4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">⏳</span>
                    <span className="text-gray-400">DfM recommendations (Day 8-9)</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    🎯 Demo: Feb 3, 2026 • Days remaining: 13
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* 3D Viewer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  2. 3D Preview
                  {meshData && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {(meshData.vertices.length/3).toLocaleString()} vertices
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Viewer3D meshData={meshData} />
              </CardContent>
            </Card>

            {/* Cost Estimate */}
            {costEstimate ? (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <DollarSign className="h-5 w-5" />
                    3. Cost Estimate
                    <Badge variant="secondary" className="ml-auto">
                      {costEstimate.complexity} Complexity
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Material ({costEstimate.material}):</span>
                      <span className="font-mono font-semibold text-green-900">
                        ${costEstimate.materialCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Machining Time:</span>
                      <span className="font-mono font-semibold text-green-900">
                        ${costEstimate.machiningCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Setup & Tooling:</span>
                      <span className="font-mono font-semibold text-green-900">
                        ${costEstimate.setupCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Surface Finish:</span>
                      <span className="font-mono font-semibold text-green-900">
                        ${costEstimate.finishingCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-green-300 flex justify-between font-semibold text-lg">
                      <span className="text-green-900">Total Estimate:</span>
                      <span className="text-green-900">${costEstimate.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="text-center pt-2">
                      <p className="text-xs text-green-700">
                        ⏱️ Estimated Time: {costEstimate.estimatedTime}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        🤖 Powered by Groq AI (Llama 3.3 70B)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-400">
                    <DollarSign className="h-5 w-5" />
                    3. Cost Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Material Cost:</span>
                      <span>$--</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Machining Time:</span>
                      <span>$--</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Setup & Tooling:</span>
                      <span>$--</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Surface Finish:</span>
                      <span>$--</span>
                    </div>
                    <div className="pt-3 border-t border-gray-300 flex justify-between font-semibold">
                      <span>Total Estimate:</span>
                      <span>$--</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    Upload a file to get AI cost estimate
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
