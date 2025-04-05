import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  Gamepad2,
  Image,
  FileVideo,
  FileType,
  Download,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import PresentationUpload from '../components/presentation-upload';
import axios from 'axios';
import ImageViewer from '../components/image-viewer';
import VideoViewer from '../components/video-viewer';

const LessonDetails = () => {
  const { quarterId, lessonId } = useParams();
  const [presentations, setPresentations] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lesson, setLesson] = useState(null);

  // Fetch lesson details
  useEffect(() => {
    const fetchLessonDetails = async () => {
      try {
        const response = await axios.get(`/api/lessons/${lessonId}`);
        if (response.data.success) {
          setLesson(response.data.lesson);
        }
      } catch (error) {
        console.error('Error fetching lesson details:', error);
        setError('Failed to load lesson details');
      }
    };

    fetchLessonDetails();
  }, [lessonId]);

  // Fetch presentations on component mount
  useEffect(() => {
    fetchPresentations();
  }, [lessonId]);

  const fetchPresentations = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/lessons/${lessonId}/presentations`
      );
      if (response.data.success) {
        setPresentations(response.data.presentations);
      }
    } catch (error) {
      console.error('Error fetching presentations:', error);
      setError('Failed to load presentations');
    } finally {
      setIsLoading(false);
    }
  };

  // function to get the correct media URL
  const getMediaUrl = (presentation) => {
    const baseUrl = 'http://localhost:5000/uploads/';
    const filePath = presentation.file_url;

    // For PowerPoint files that have been converted to PDF
    if (presentation.content_type === 'powerpoint') {
      return `${baseUrl}${filePath}#view=FitH`;
    }

    // For images and videos, use relative path
    return `/uploads/${filePath}`;
  };

  const handleDownload = async (presentation) => {
    try {
      const url = getMediaUrl(presentation);
      const link = document.createElement('a');
      link.href = url;
      link.download = `presentation-${presentation.id}.pptx`; // or any name you want
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  const games = [
    {
      id: 'drag-and-drop',
      title: 'Drag and Drop',
      description: 'Create drag and drop exercises',
    },
    {
      id: 'matching',
      title: 'Matching',
      description: 'Create matching pairs games',
    },
    {
      id: 'multiple-choice',
      title: 'Multiple Choice',
      description: 'Create multiple choice questions',
    },
  ];

  const getFileTypeIcon = (type) => {
    switch (type) {
      case 'powerpoint':
        return <FileType className="w-6 h-6" />;
      case 'image':
        return <Image className="w-6 h-6" />;
      case 'video':
        return <FileVideo className="w-6 h-6" />;
      default:
        return <FileType className="w-6 h-6" />;
    }
  };

  const getContentTitle = (contentType, presentations) => {
    const typeCount = presentations.filter(
      (p) => p.content_type === contentType
    ).length;
    switch (contentType) {
      case 'image':
        return `Image ${typeCount}`;
      case 'video':
        return `Video ${typeCount}`;
      case 'powerpoint':
        return `Presentation ${typeCount}`;
      default:
        return `File ${typeCount}`;
    }
  };

  const handleUploadComplete = (newPresentations) => {
    setPresentations((prev) => [...prev, ...newPresentations]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center">
            Quarter <ChevronRight className="mx-1 h-5 w-5" /> Lessons{' '}
            <ChevronRight className="mx-1 h-5 w-5" />
            {lesson ? (
              `Lesson ${lesson.lesson_number}`
            ) : (
              <span className="flex items-center">
                Lesson <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </span>
            )}
          </h1>
          <Separator className="my-4" />
        </div>

        <Tabs defaultValue="presentations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="presentations">Presentations</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
          </TabsList>

          <TabsContent value="presentations">
            <PresentationUpload
              lessonId={lessonId}
              onUploadComplete={handleUploadComplete}
            />

            {error && <p className="text-red-500 text-center mt-4">{error}</p>}

            {isLoading ? (
              <div className="text-center my-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <span className="text-gray-500">Loading presentations...</span>
              </div>
            ) : presentations.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presentations.map((presentation) => (
                  <Card
                    key={presentation.id}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200 group relative"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        if (presentation.content_type === 'powerpoint') {
                          handleDownload(presentation);
                        } else {
                          setSelectedMedia(presentation);
                        }
                      }}
                    >
                      <div className="relative">
                        {presentation.content_type === 'image' ? (
                          <div className="h-52 overflow-hidden bg-slate-100">
                            <img
                              src={getMediaUrl(presentation)}
                              alt={presentation.file_url}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : presentation.content_type === 'video' ? (
                          <div className="h-52 overflow-hidden bg-slate-100">
                            <video
                              src={getMediaUrl(presentation)}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <FileVideo className="w-12 h-12 text-white drop-shadow-md" />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-100 h-52 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                            <FileType className="w-16 h-16 text-slate-400" />
                          </div>
                        )}

                        <div className="absolute top-3 right-3">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium shadow-sm">
                            {presentation.content_type === 'powerpoint'
                              ? 'PPT'
                              : presentation.content_type}
                          </div>
                        </div>
                      </div>

                      <CardHeader className="pt-6 pb-2">
                        <CardTitle className="text-base font-medium flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate mr-2">
                            {getFileTypeIcon(presentation.content_type)}
                            <span className="truncate">
                              {getContentTitle(
                                presentation.content_type,
                                presentations.filter(
                                  (p) =>
                                    p.content_type ===
                                      presentation.content_type &&
                                    p.id <= presentation.id
                                )
                              )}
                            </span>
                          </div>
                          {presentation.content_type === 'powerpoint' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-blue-600 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(presentation);
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center mt-12 py-12 border border-dashed rounded-lg">
                <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 mb-2">
                  No presentations uploaded yet
                </p>
                <p className="text-sm text-gray-400">
                  Use the uploader above to add content
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="games">
            {!selectedGame ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {games.map((game) => (
                  <Card
                    key={game.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedGame(game.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5" />
                        {game.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{game.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedGame(null)}
                  className="mb-4"
                >
                  Back to Game Selection
                </Button>
                {/* Game creation form will go here */}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Media Viewers */}
      {selectedMedia?.content_type === 'image' && (
        <ImageViewer
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
          imageUrl={getMediaUrl(selectedMedia)}
          className="max-w-screen max-h-screen"
        />
      )}

      {selectedMedia?.content_type === 'video' && (
        <VideoViewer
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
          videoUrl={getMediaUrl(selectedMedia)}
          className="max-w-screen max-h-screen"
        />
      )}
    </div>
  );
};

export default LessonDetails;
