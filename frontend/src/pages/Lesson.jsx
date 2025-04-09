import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Presentation,
  Clock,
  CalendarDays,
} from 'lucide-react';
import PresentationUpload from '../components/presentation-upload';
import axios from 'axios';
import ImageViewer from '../components/image-viewer';
import VideoViewer from '../components/video-viewer';
import GameSelectionDialog from '../components/game-select';
import GamePreviewCard from '../components/game-preview-card';

const LessonDetails = () => {
  const { quarterId, lessonId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('presentations');
  const [presentations, setPresentations] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lesson, setLesson] = useState(null);
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [games, setGames] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  useEffect(() => {
    if (activeTab === 'games') {
      fetchGames();
    }
  }, [activeTab, lessonId]);

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

  const fetchGames = async () => {
    try {
      setIsLoadingGames(true);
      const response = await axios.get(`/api/game/lessons/${lessonId}/games`);
      if (response.data.success) {
        setGames(response.data.games);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Failed to load games');
    } finally {
      setIsLoadingGames(false);
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

  const handlePlayGame = (game) => {
    if (game.game_type === 'drag-drop') {
      navigate(
        `/quarter/${quarterId}/lesson/${lessonId}/game/drag-drop/${game.id}`
      );
    } else if (game.game_type === 'matching') {
      navigate(
        `/quarter/${quarterId}/lesson/${lessonId}/game/matching/${game.id}`
      );
    } else if (game.game_type === 'multiple-choice') {
      navigate(
        `/quarter/${quarterId}/lesson/${lessonId}/game/multiple-choice/${game.id}`
      );
    } else {
      // Default fallback
      navigate(
        `/quarter/${quarterId}/lesson/${lessonId}/game/drag-drop/${game.id}`
      );
    }
  };

  const getImagePresentations = () => {
    return presentations.filter((p) => p.content_type === 'image');
  };

  const handlePresentationClick = (presentation) => {
    if (presentation.content_type === 'powerpoint') {
      handleDownload(presentation);
    } else {
      setSelectedMedia(presentation);
      if (presentation.content_type === 'image') {
        const imagePresentations = getImagePresentations();
        setCurrentImageIndex(
          imagePresentations.findIndex((p) => p.id === presentation.id)
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <nav
            className="flex items-center text-2xl font-bold"
            aria-label="Breadcrumb"
          >
            <Button
              onClick={() => navigate('/quarter')}
              variant="link"
              className="p-0 h-auto font-bold text-2xl hover:underline hover:text-inherit"
            >
              Quarter
            </Button>
            <ChevronRight className="mx-1 h-5 w-5 flex-shrink-0 text-gray-400" />
            <Button
              onClick={() => navigate(`/quarter/${quarterId}`)}
              variant="link"
              className="p-0 h-auto font-bold text-2xl hover:underline hover:text-inherit"
            >
              Lessons
            </Button>
            <ChevronRight className="mx-1 h-5 w-5 flex-shrink-0 text-gray-400" />
            {lesson ? (
              <span className="text-gray-800">
                Lesson {lesson.lesson_number}
              </span>
            ) : (
              <span className="flex items-center">
                Lesson <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </span>
            )}
          </nav>
          <Separator className="my-4" />
        </div>

        <Tabs
          defaultValue="presentations"
          className="space-y-4"
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="presentations">Presentations</TabsTrigger>
              <TabsTrigger value="games">Games</TabsTrigger>
            </TabsList>
            {/* Only show Add Game button when there are no games */}
            {activeTab === 'games' && games.length === 0 && (
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowGameDialog(true)}
                className="bg-indigo-700 text-white hover:bg-indigo-800 hover:text-white transition-all duration-200 px-6 rounded-lg"
              >
                <Gamepad2 className="w-5 h-5" />
                Add Game
              </Button>
            )}
          </div>

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
                    className="group relative overflow-hidden rounded-xl border-0 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => handlePresentationClick(presentation)}
                    >
                      {/* Media Preview Section */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        {presentation.content_type === 'image' ? (
                          <>
                            <img
                              src={getMediaUrl(presentation)}
                              alt={presentation.file_url}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </>
                        ) : presentation.content_type === 'video' ? (
                          <>
                            <video
                              src={getMediaUrl(presentation)}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:bg-black/50">
                              <FileVideo className="h-16 w-16 text-white/90 drop-shadow-lg" />
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-slate-100 group-hover:to-slate-200 transition-colors">
                            <div className="text-center">
                              <FileType className="mx-auto h-16 w-16 text-slate-400 mb-2" />
                              <span className="text-sm font-medium text-slate-600">
                                PowerPoint
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Type Badge */}
                        <div className="absolute top-3 right-3">
                          <div className="backdrop-blur-md bg-white/90 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm border border-white/20">
                            {presentation.content_type === 'powerpoint'
                              ? 'PPT'
                              : presentation.content_type.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getFileTypeIcon(presentation.content_type)}
                            <h3 className="font-medium text-slate-700">
                              {getContentTitle(
                                presentation.content_type,
                                presentations.filter(
                                  (p) =>
                                    p.content_type ===
                                      presentation.content_type &&
                                    p.id <= presentation.id
                                )
                              )}
                            </h3>
                          </div>

                          {/* Download button for PowerPoint */}
                          {presentation.content_type === 'powerpoint' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(presentation);
                              }}
                            >
                              <Download className="w-4 h-4 mr-1.5" />
                              Download
                            </Button>
                          )}
                        </div>

                        {/* Upload Date */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            Uploaded{' '}
                            {new Date(
                              presentation.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Overlay for Images and Videos */}
                    {(presentation.content_type === 'image' ||
                      presentation.content_type === 'video') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                        <div className="transform translate-y-4 transition-transform group-hover:translate-y-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/90 text-slate-800 hover:bg-white"
                            onClick={() =>
                              handlePresentationClick(presentation)
                            }
                          >
                            {presentation.content_type === 'image'
                              ? 'View Image'
                              : 'Play Video'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center mt-12 py-24 bg-gray-100 rounded-lg">
                <Presentation className="mx-auto h-10 w-10 text-gray-400 mb-2" />
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
            {isLoadingGames ? (
              <div className="text-center my-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <span className="text-gray-500">Loading games...</span>
              </div>
            ) : games.length > 0 ? (
              <div className="space-y-6">
                {games.map((game) => (
                  <GamePreviewCard
                    key={game.id}
                    game={game}
                    onPlay={handlePlayGame}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-gray-100 rounded-lg">
                <Gamepad2 className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500 mb-2">
                  No games created for this lesson yet
                </p>
                <p className="text-sm text-gray-400">
                  Click the "Add Game" button to create one
                </p>
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
          images={getImagePresentations()}
          currentIndex={currentImageIndex}
          onNavigate={(newIndex) => {
            const imagePresentations = getImagePresentations();
            setCurrentImageIndex(newIndex);
            setSelectedMedia(imagePresentations[newIndex]);
          }}
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
      {/* Game Selection Dialog*/}
      <GameSelectionDialog
        isOpen={showGameDialog}
        onClose={() => setShowGameDialog(false)}
        onSelectGame={(gameId) => {
          setSelectedGame(gameId);
          setShowGameDialog(false);
          fetchGames();
        }}
      />
    </div>
  );
};

export default LessonDetails;
