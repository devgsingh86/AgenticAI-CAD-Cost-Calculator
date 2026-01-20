'use client';

import { CADUploader } from '@/components/upload/cad-uploader';

export default function UploadPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">CAD Cost Estimator</h1>
        <p className="text-gray-600 mb-8">Upload STEP or STL file for cost estimation</p>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Upload CAD File</h2>
          <CADUploader />
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">✅ Day 2 Progress</p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>✅ Database connected</li>
            <li>✅ Basic upload UI working</li>
            <li>⏳ Next: Add drag & drop (react-dropzone)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
