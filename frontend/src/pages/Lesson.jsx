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
  Plus,
  ArrowLeft,
} from 'lucide-react';
import PresentationUpload from '../components/presentation-upload';
import axios from 'axios';
import ImageViewer from '../components/image-viewer';
import VideoViewer from '../components/video-viewer';
import GameSelectionDialog from '../components/game-select';
import GamePreviewCard from '../components/game-preview-card';
import DragDropSettings from '../components/game-settings/drag-drop';
import MatchingGameSettings from '../components/game-settings/matching-game';
import MultipleChoiceSettings from '../components/game-settings/multiple-choice';
import { toast } from 'sonner';
import LessonBackground from '../components/LessonBackground';

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
  const [showDragDropEditDialog, setShowDragDropEditDialog] = useState(false);
  const [showMatchingEditDialog, setShowMatchingEditDialog] = useState(false);
  const [showMultipleChoiceEditDialog, setShowMultipleChoiceEditDialog] =
    useState(false);
  const [gameToEdit, setGameToEdit] = useState(null);

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

  const handleEditGame = (game) => {
    setGameToEdit(game);
    if (game.game_type === 'drag-drop') {
      setShowDragDropEditDialog(true);
      setShowMatchingEditDialog(false);
    } else if (game.game_type === 'matching') {
      setShowMatchingEditDialog(true);
      setShowDragDropEditDialog(false);
    } else if (game.game_type === 'multiple-choice') {
      setShowMultipleChoiceEditDialog(true);
      setShowDragDropEditDialog(false);
      setShowMatchingEditDialog(false);
    }
  };

  const handleDeleteGame = async (game) => {
    try {
      if (game.game_type === 'drag-drop') {
        const response = await axios.delete(
          `/api/game/games/drag-drop/${game.id}`
        );
        if (response.data.success) {
          toast.success('Game deleted successfully');
          fetchGames(); // Refresh the games list
        } else {
          toast.error('Failed to delete game');
        }
      } else if (game.game_type === 'matching') {
        const response = await axios.delete(
          `/api/game/games/matching/${game.id}`
        );
        if (response.data.success) {
          toast.success('Game deleted successfully');
          fetchGames(); // Refresh the games list
        } else {
          toast.error('Failed to delete game');
        }
      } else if (game.game_type === 'multiple-choice') {
        const response = await axios.delete(
          `/api/game/games/multiple-choice/${game.id}`
        );
        if (response.data.success) {
          toast.success('Game deleted successfully');
          fetchGames(); // Refresh the games list
        } else {
          toast.error('Failed to delete game');
        }
      }
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error(error.response?.data?.message || 'Failed to delete game');
    }
  };

  const handleGameUpdate = (updatedGame) => {
    fetchGames(); // Refresh the games list after update
    toast.success('Game updated successfully');
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

  const renderPresentationsGrid = () => {
    const videoItems = presentations.filter((p) => p.content_type === 'video');
    const otherItems = presentations.filter((p) => p.content_type !== 'video');

    return (
      <>
        {/* Videos section - displayed at top, full width */}
        {videoItems.length > 0 && (
          <div className="mb-8">
            <h3 className="font-medium text-lg mb-4">Videos</h3>
            <div className="space-y-4">
              {videoItems.map((presentation) => (
                <Card
                  key={presentation.id}
                  className="group relative overflow-hidden rounded-xl border-0 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
                >
                  <div
                    className="cursor-pointer grid grid-cols-1 md:grid-cols-3 gap-4"
                    onClick={() => handlePresentationClick(presentation)}
                  >
                    {/* Video Preview - Left side */}
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      <video
                        src={getMediaUrl(presentation)}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:bg-black/50">
                        <FileVideo className="h-12 w-12 text-white/90 drop-shadow-lg" />
                      </div>

                      {/* Type Badge */}
                      <div className="absolute top-3 right-3">
                        <div className="backdrop-blur-md bg-white/90 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm border border-white/20">
                          VIDEO
                        </div>
                      </div>
                    </div>

                    {/* Content Info - Right side */}
                    <div className="p-4 md:col-span-2 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <FileVideo className="w-5 h-5 text-slate-500" />
                        <h3 className="font-medium text-lg text-slate-800">
                          {presentation.title ||
                            getContentTitle(
                              'video',
                              videoItems.filter((p) => p.id <= presentation.id)
                            )}
                        </h3>
                      </div>

                      {presentation.description && (
                        <p className="text-slate-600 mt-1 mb-auto line-clamp-3">
                          {presentation.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
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

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                    <div className="transform translate-y-4 transition-transform group-hover:translate-y-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/90 text-slate-800 hover:bg-white"
                        onClick={() => handlePresentationClick(presentation)}
                      >
                        Play Video
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other content (images and presentations) in grid */}
        {otherItems.length > 0 && (
          <div>
            <h3 className="font-medium text-lg mb-4">Images & Presentations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherItems.map((presentation) => (
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
                            {presentation.title ||
                              getContentTitle(
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

                      {/* Description if available */}
                      {presentation.description && (
                        <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">
                          {presentation.description}
                        </p>
                      )}

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

                  {/* Hover Overlay for Images */}
                  {presentation.content_type === 'image' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                      <div className="transform translate-y-4 transition-transform group-hover:translate-y-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/90 text-slate-800 hover:bg-white"
                          onClick={() => handlePresentationClick(presentation)}
                        >
                          View Image
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <LessonBackground>
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-4 flex justify-between items-center mb-8">
              {/* Left Side: Breadcrumb Navigation */}
              <nav
                className="flex items-center text-2xl font-bold"
                aria-label="Breadcrumb"
              >
                <Button
                  onClick={() => navigate('/quarter')}
                  variant="link"
                  className="p-0 h-auto font-bold text-2xl text-gray-800 hover:underline"
                >
                  Quarter
                </Button>
                <ChevronRight className="mx-2 h-5 w-5 flex-shrink-0 text-gray-400" />
                <Button
                  onClick={() => navigate(`/quarter/${quarterId}`)}
                  variant="link"
                  className="p-0 h-auto font-bold text-2xl text-gray-800 hover:underline"
                >
                  Lessons
                </Button>
                <ChevronRight className="mx-2 h-5 w-5 flex-shrink-0 text-gray-400" />
                {lesson ? (
                  <span className="text-gray-800 hover:underline px-3 py-1 rounded-md">
                    Lesson {lesson.lesson_number}
                  </span>
                ) : (
                  <span className="flex items-center bg-blue-100/50 px-3 py-1 rounded-md">
                    Lesson{' '}
                    <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-600" />
                  </span>
                )}
              </nav>

              {/* Right Side: Back Button */}
              <Button
                onClick={() => navigate(`/quarter/${quarterId}`)}
                variant="outline"
                className="flex items-center bg-white border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
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
              {/* Show Add Game button in games tab */}
              {activeTab === 'games' && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowGameDialog(true)}
                  className="bg-indigo-700 text-white hover:bg-indigo-800 hover:text-white transition-all duration-200 px-6 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Game
                </Button>
              )}
            </div>

            <TabsContent value="presentations">
              {isLoading ? (
                <div className="text-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <span className="text-gray-500">
                    Loading presentations...
                  </span>
                </div>
              ) : presentations.length > 0 ? (
                <>
                  {/* Using our new rendering function */}
                  {renderPresentationsGrid()}

                  {/* Show upload component below after presentations */}
                  <div className="mt-10 border-t pt-8">
                    <h3 className="text-lg font-medium mb-4">
                      Add More Content
                    </h3>
                    <PresentationUpload
                      lessonId={lessonId}
                      onUploadComplete={handleUploadComplete}
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-center mt-4">{error}</p>
                  )}
                </>
              ) : (
                <>
                  {/* When no presentations exist, show the upload component first */}
                  <PresentationUpload
                    lessonId={lessonId}
                    onUploadComplete={handleUploadComplete}
                  />

                  {error && (
                    <p className="text-red-500 text-center mt-4">{error}</p>
                  )}

                  <div className="text-center mt-12 py-24 bg-gray-100 rounded-lg">
                    <Presentation className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-gray-500 mb-2">
                      No presentations uploaded yet
                    </p>
                    <p className="text-sm text-gray-400">
                      Use the uploader above to add content
                    </p>
                  </div>
                </>
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
                      onEdit={handleEditGame}
                      onDelete={handleDeleteGame}
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

        {/* Drag and Drop Edit Dialog */}
        <DragDropSettings
          isOpen={showDragDropEditDialog}
          onClose={() => setShowDragDropEditDialog(false)}
          onBack={() => setShowDragDropEditDialog(false)}
          onSubmit={handleGameUpdate}
          gameToEdit={gameToEdit}
        />

        {/* Matching Game Edit Dialog */}
        <MatchingGameSettings
          isOpen={showMatchingEditDialog}
          onClose={() => setShowMatchingEditDialog(false)}
          onBack={() => setShowMatchingEditDialog(false)}
          onSubmit={handleGameUpdate}
          gameToEdit={gameToEdit}
        />

        {/* Multiple Choice Edit Dialog */}
        <MultipleChoiceSettings
          isOpen={showMultipleChoiceEditDialog}
          onClose={() => setShowMultipleChoiceEditDialog(false)}
          onBack={() => setShowMultipleChoiceEditDialog(false)}
          onSubmit={handleGameUpdate}
          gameToEdit={gameToEdit}
        />
      </div>
    </LessonBackground>
  );
};

export default LessonDetails;
