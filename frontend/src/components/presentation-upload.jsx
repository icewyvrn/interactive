import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, FileType } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const PresentationUpload = ({ lessonId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setUploading(true);
      setError('');
      const formData = new FormData();

      // Check if any PowerPoint files are included
      const hasPowerPoint = acceptedFiles.some(
        (file) =>
          file.type ===
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );

      // Append each file to formData
      acceptedFiles.forEach((file) => {
        formData.append('files', file);
      });

      try {
        if (hasPowerPoint) {
          setConverting(true);
        }

        const response = await axios.post(
          `/api/lessons/${lessonId}/presentations`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const progress =
                (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(Math.round(progress));
            },
          }
        );

        if (response.data.success) {
          onUploadComplete(response.data.presentations);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setError(error.response?.data?.message || 'Failed to upload files');
      } finally {
        setUploading(false);
        setConverting(false);
        setUploadProgress(0);
      }
    },
    [lessonId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB max file size
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${
            uploading || converting
              ? 'pointer-events-none opacity-50'
              : 'cursor-pointer'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag & drop files here, or click to select files'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: PPT, Images (JPG, PNG), Videos (MP4, WebM)
        </p>
        <p className="text-sm text-gray-500">Maximum file size: 100MB</p>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {(uploading || converting) && (
        <Card className="p-4">
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {converting
                  ? 'Converting PowerPoint to PDF...'
                  : 'Uploading...'}
              </span>
              {uploading && <span>{uploadProgress}%</span>}
            </div>
            <Progress
              value={uploading ? uploadProgress : converting ? 100 : 0}
              className="w-full"
            />
            {converting && (
              <p className="text-xs text-gray-500 mt-1">
                This may take a few moments...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PresentationUpload;
