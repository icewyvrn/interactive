import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, FileType, Image, Video, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const PresentationUpload = ({ lessonId, onUploadComplete }) => {
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [imageError, setImageError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [converting, setConverting] = useState(false);

  // Dialog and video metadata state
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoMetadata, setVideoMetadata] = useState([]);

  const onImageDrop = useCallback(
    async (acceptedFiles) => {
      setImageUploading(true);
      setImageError('');
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
              setImageUploadProgress(Math.round(progress));
            },
          }
        );

        if (response.data.success) {
          onUploadComplete(response.data.presentations);
        }
        toast.success('Images/Presentations uploaded successfully!');
      } catch (error) {
        toast.error('Upload error:', error);
        setImageError(
          error.response?.data?.message || 'Failed to upload files'
        );
      } finally {
        setImageUploading(false);
        setConverting(false);
        setImageUploadProgress(0);
      }
    },
    [lessonId, onUploadComplete]
  );

  const onVideoDrop = useCallback(async (acceptedFiles) => {
    // Instead of uploading immediately, save files and show the metadata dialog
    setVideoFiles(acceptedFiles);

    // Initialize metadata for each file with empty title and description
    const initialMetadata = acceptedFiles.map(() => ({
      title: '',
      description: '',
    }));

    setVideoMetadata(initialMetadata);
    setShowVideoDialog(true);
  }, []);

  const handleVideoUpload = async () => {
    setVideoUploading(true);
    setVideoError('');
    const formData = new FormData();

    // Add all video files to the form data
    videoFiles.forEach((file, index) => {
      formData.append('files', file);
    });

    // Add metadata for each file
    videoMetadata.forEach((meta, index) => {
      formData.append(`titles[]`, meta.title);
      formData.append(`descriptions[]`, meta.description);
    });

    try {
      const response = await axios.post(
        `/api/lessons/${lessonId}/presentations`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setVideoUploadProgress(Math.round(progress));
          },
        }
      );

      if (response.data.success) {
        onUploadComplete(response.data.presentations);
        setShowVideoDialog(false);
        setVideoFiles([]);
        setVideoMetadata([]);
      }
      toast.success('Videos uploaded successfully!');
    } catch (error) {
      toast.error('Upload error:', error);
      setVideoError(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setVideoUploading(false);
      setVideoUploadProgress(0);
    }
  };

  const updateVideoMetadata = (index, field, value) => {
    const updatedMetadata = [...videoMetadata];
    updatedMetadata[index] = {
      ...updatedMetadata[index],
      [field]: value,
    };
    setVideoMetadata(updatedMetadata);
  };

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: onImageDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB max file size
    multiple: true,
  });

  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: onVideoDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB max file size
    multiple: true,
  });

  return (
    <div className="space-y-6">
      {/* Added a container with glass-morphism effect */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side - Images and PPT uploads */}
          <div className="space-y-4">
            <h3 className="text-center font-medium text-lg text-blue-700">
              Images & Presentations
            </h3>
            <div
              {...getImageRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${
                  isImageDragActive
                    ? 'border-blue-500 bg-blue-100/70'
                    : 'border-blue-300 bg-white/50'
                }
                ${
                  imageUploading || converting
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer hover:bg-blue-50/70'
                }
                shadow-sm backdrop-blur-sm
              `}
            >
              <input {...getImageInputProps()} />
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                <Image className="w-10 h-10 mx-auto text-blue-500" />
              </div>
              <p className="text-blue-800 font-medium">
                {isImageDragActive
                  ? 'Drop files here...'
                  : 'Drag & drop files here, or click to select files'}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                PowerPoint (.pptx), Images (.jpg, .png)
              </p>
              <p className="text-sm text-blue-600">Maximum file size: 100MB</p>
            </div>

            {imageError && (
              <p className="text-sm text-red-500 text-center bg-red-50/90 p-2 rounded-md">
                {imageError}
              </p>
            )}

            {(imageUploading || converting) && (
              <Card className="p-4 bg-white/80">
                <CardContent className="space-y-2 py-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-blue-700">
                      {converting
                        ? 'Converting PowerPoint to PDF...'
                        : 'Uploading...'}
                    </span>
                    {imageUploading && <span>{imageUploadProgress}%</span>}
                  </div>
                  <Progress
                    value={
                      imageUploading
                        ? imageUploadProgress
                        : converting
                        ? 100
                        : 0
                    }
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

          {/* Right side - Video uploads */}
          <div className="space-y-4">
            <h3 className="text-center font-medium text-lg text-green-700">
              Videos
            </h3>
            <div
              {...getVideoRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${
                  isVideoDragActive
                    ? 'border-green-500 bg-green-100/70'
                    : 'border-green-300 bg-white/50'
                }
                ${
                  videoUploading
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer hover:bg-green-50/70'
                }
                shadow-sm backdrop-blur-sm
              `}
            >
              <input {...getVideoInputProps()} />
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                <Video className="w-10 h-10 mx-auto text-green-500" />
              </div>
              <p className="text-green-800 font-medium">
                {isVideoDragActive
                  ? 'Drop videos here...'
                  : 'Drag & drop videos here, or click to select videos'}
              </p>
              <p className="text-sm text-green-600 mt-2">
                Video formats: MP4, WebM
              </p>
              <p className="text-sm text-green-600">Maximum file size: 100MB</p>
            </div>

            {videoError && (
              <p className="text-sm text-red-500 text-center bg-red-50/90 p-2 rounded-md">
                {videoError}
              </p>
            )}

            {videoUploading && (
              <Card className="p-4 bg-white/80">
                <CardContent className="space-y-2 py-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-green-700">
                      Uploading video...
                    </span>
                    <span>{videoUploadProgress}%</span>
                  </div>
                  <Progress
                    value={videoUploadProgress}
                    className="w-full"
                    indicatorClassName="bg-green-600"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Video Metadata Dialog - No changes needed here, already has a background */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Video Information</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            {videoFiles.map((file, index) => (
              <div
                key={index}
                className="space-y-4 pb-4 border-b border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Video {index + 1}</h4>
                  <p className="text-sm text-gray-500">{file.name}</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`video-title-${index}`}>Title</Label>
                    <Input
                      id={`video-title-${index}`}
                      placeholder="Enter video title"
                      value={videoMetadata[index]?.title || ''}
                      onChange={(e) =>
                        updateVideoMetadata(index, 'title', e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`video-desc-${index}`}>Description</Label>
                    <Textarea
                      id={`video-desc-${index}`}
                      placeholder="Enter video description"
                      value={videoMetadata[index]?.description || ''}
                      onChange={(e) =>
                        updateVideoMetadata(
                          index,
                          'description',
                          e.target.value
                        )
                      }
                      className="resize-none h-24"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowVideoDialog(false);
                setVideoFiles([]);
              }}
              disabled={videoUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVideoUpload}
              disabled={videoUploading}
              className={
                videoUploading ? '' : 'bg-green-600 hover:bg-green-700'
              }
            >
              {videoUploading ? 'Uploading...' : 'Upload Videos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresentationUpload;
