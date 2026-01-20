'use client';

import { useState } from 'react';

export function CADUploader() {
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
      <input
        type="file"
        accept=".step,.stp,.stl"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="text-6xl mb-4">📁</div>
        {fileName ? (
          <p className="text-lg font-medium">Selected: {fileName}</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">Click to upload CAD file</p>
            <p className="text-sm text-gray-500">STEP (.stp, .step) or STL (.stl)</p>
          </>
        )}
      </label>
    </div>
  );
}
