'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileIcon, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCADStore } from '@/lib/stores/cad-processing-store';

interface CADUploaderProps {
  onFileSelected?: (file: File) => void;
}

export function CADUploader({ onFileSelected }: CADUploaderProps) {
  const { file, setFile, setProcessingStage } = useCADStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    
    if (!uploadedFile) return;
    
    // Validate file extension
    const validExtensions = ['.stp', '.step', '.stl'];
    const ext = uploadedFile.name.slice(uploadedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      alert('Invalid file type. Please upload STEP (.stp, .step) or STL (.stl) files.');
      return;
    }
    
    // Validate file size (max 50MB)
    if (uploadedFile.size > 50 * 1024 * 1024) {
      alert('File too large. Maximum size is 50MB.');
      return;
    }
    
    setFile(uploadedFile);
    setProcessingStage('ready');
    
    // Trigger auto-processing
    if (onFileSelected) {
      onFileSelected(uploadedFile);
    }
  }, [setFile, setProcessingStage, onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/step': ['.stp', '.step'],
      'model/stl': ['.stl']
    },
    maxFiles: 1,
    multiple: false
  });

  const clearFile = () => {
    setFile(null);
    setProcessingStage('idle');
  };

  return (
    <Card className="overflow-hidden">
      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className={`mx-auto h-16 w-16 mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-600">Drop file here...</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">Drop CAD file here or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">
                STEP (.stp, .step) or STL (.stl) files • Max 50MB
              </p>
              <Button variant="outline" className="mt-2">
                Browse Files
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <FileIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {file.name.slice(file.name.lastIndexOf('.')).toUpperCase()}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
