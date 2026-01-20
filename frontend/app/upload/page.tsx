'use client';

import { CADUploader } from '@/components/upload/cad-uploader';
import { Viewer3D } from '@/components/cad-viewer/viewer-3d';
import { useCADStore } from '@/lib/stores/cad-processing-store';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Cpu, DollarSign } from 'lucide-react';

export default function UploadPage() {
  const { file, processingStage } = useCADStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CAD Cost Estimator</h1>
            <p className="text-sm text-gray-600">AI-powered manufacturing cost analysis</p>
          </div>
          <Badge variant="outline">MVP - Day 2</Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Upload & Info */}
          <div className="space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  1. Upload CAD File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CADUploader />
              </CardContent>
            </Card>

            {/* File Info */}
            {file && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  <p className="font-semibold text-green-900 mb-2">✅ File Ready</p>
                  <div className="text-sm space-y-1 text-green-800">
                    <p>• Name: {file.name}</p>
                    <p>• Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p>• Type: {file.type || 'CAD file'}</p>
                    <p>• Status: {processingStage}</p>
                  </div>
                  <Button className="mt-4 w-full" disabled>
                    <Cpu className="h-4 w-4 mr-2" />
                    Process File (Coming in Day 3-4)
                  </Button>
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
                    <span>Database setup (12 materials, 12 standards)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>File upload with drag & drop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>3D viewer component (placeholder)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">⏳</span>
                    <span className="text-gray-600">OpenCascade.js STEP parsing (Day 3-4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">⏳</span>
                    <span className="text-gray-400">AI cost estimation (Day 6-7)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">⏳</span>
                    <span className="text-gray-400">DfM recommendations (Day 8)</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    🎯 Demo Day: February 3, 2026 (12 days remaining)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: 3D Viewer */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  2. 3D Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Viewer3D />
              </CardContent>
            </Card>

            {/* Cost Preview Placeholder */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-400">
                  <DollarSign className="h-5 w-5" />
                  3. Cost Estimate (Coming Soon)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span>$--</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Machining:</span>
                    <span>$--</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Setup:</span>
                    <span>$--</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Finishing:</span>
                    <span>$--</span>
                  </div>
                  <div className="pt-3 border-t flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>$--</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
