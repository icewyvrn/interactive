import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Header from '../header';

const ProgressBar = ({ current, total }) => {
  const progress = (current / total) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
      <div
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// Reuse existing Draggable and Droppable components
const Draggable = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl border-2 border-indigo-200 cursor-move touch-none select-none"
      style={style}
    >
      {children}
    </div>
  );
};

const Droppable = ({ id, children, isOver }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[120px] min-h-[50px] p-3 rounded-xl transition-all duration-500 ${
        isOver
          ? 'bg-green-100 border-2 border-green-400 shadow-lg scale-105'
          : 'bg-gray-100 border-2 border-dashed border-gray-300'
      }`}
    >
      {children}
    </div>
  );
};

const GamePlay = () => {
  const { quarterId, lessonId, gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [droppedAnswer, setDroppedAnswer] = useState(null);
  const [dragStartPosition, setDragStartPosition] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150, // No delay for immediate response
        tolerance: 5, // Small tolerance for unintentional movements
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await axios.get(`/api/game/lessons/${lessonId}/games`);
        const foundGame = response.data.games.find(
          (g) => g.id === parseInt(gameId)
        );
        if (foundGame) {
          setGame(foundGame);
        }
      } catch (error) {
        console.error('Error fetching game:', error);
      }
    };
    fetchGame();
  }, [lessonId, gameId]);

  const handleDragStart = ({ active }) => {
    if (!active) return;

    setActiveId(active.id);
    setIsCorrect(false);
    setDroppedAnswer(null);

    // Check if rect and translated exist before accessing coordinates
    if (active.rect?.current?.translated) {
      setDragStartPosition({
        x: active.rect.current.translated.x,
        y: active.rect.current.translated.y,
      });
    }
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setIsOver(false);

    // Return early if no valid drop
    if (!active || !over || over.id !== 'blank' || !game) {
      return;
    }

    const choice = game.rounds[currentRound].choices.find(
      (c) => c.id === active.id
    );

    if (!choice) return;

    setDroppedAnswer(choice);

    if (choice.is_correct) {
      setIsCorrect(true);
      triggerConfetti();

      setTimeout(() => {
        if (currentRound + 1 < game.total_rounds) {
          setCurrentRound((prev) => prev + 1);
          setIsCorrect(false);
          setDroppedAnswer(null);
        } else {
          setGameComplete(true);
        }
      }, 5000);
    } else {
      toast.error("That's not correct. Try again!", {
        duration: 5000,
      });
      setTimeout(() => {
        setDroppedAnswer(null);
      }, 5000);
    }
  };

  const handleDragOver = ({ over }) => {
    setIsOver(!!over);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  if (!game) return <div>Loading...</div>;

  const round = game.rounds[currentRound];
  const [before, after] = round.question_text.split('_');

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <Header className="bg-white shadow-md"></Header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/quarter/${quarterId}/lesson/${lessonId}`)}
            className="hover:bg-indigo-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lesson
          </Button>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-10 space-y-10 border border-gray-100">
          {/* Game Info Section */}
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-indigo-900 text-center">
              Drag and Drop Game
            </h1>
            <div className="flex items-center gap-4 w-full">
              <p className="text-sm text-gray-500 whitespace-nowrap">
                Round {currentRound + 1} of {game.total_rounds}
              </p>
              <div className="flex-grow">
                <ProgressBar
                  current={currentRound + 1}
                  total={game.total_rounds}
                />
              </div>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            modifiers={[restrictToWindowEdges]}
          >
            <div className="flex items-center justify-center gap-3 text-3xl font-medium text-gray-800">
              <span>{before}</span>
              <Droppable id="blank" isOver={isOver}>
                {droppedAnswer ? (
                  <div
                    className={`p-3 rounded-xl transition-all duration-500 font-semibold ${
                      droppedAnswer.is_correct
                        ? 'bg-green-100 text-green-700 border-2 border-green-400'
                        : 'bg-red-100 text-red-700 border-2 border-red-400'
                    }`}
                  >
                    {droppedAnswer.word}
                  </div>
                ) : (
                  <div className="h-10 w-28 flex items-center justify-center">
                    <span className="text-gray-400 text-base">Drop here</span>
                  </div>
                )}
              </Droppable>
              <span>{after}</span>
            </div>

            <div className="flex justify-center gap-6 flex-wrap mt-12">
              {round.choices.map((choice) => (
                <Draggable key={choice.id} id={choice.id}>
                  {choice.word}
                </Draggable>
              ))}
            </div>

            <DragOverlay>
              {activeId && (
                <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-indigo-500 font-medium text-indigo-700">
                  {round.choices.find((c) => c.id === activeId).word}
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {isCorrect && (
            <div className="text-center text-green-600 font-bold animate-bounce text-2xl bg-green-50 py-4 rounded-xl transition-all duration-1000">
              Correct! Well done! 🎉
            </div>
          )}

          {gameComplete && (
            <div className="text-center space-y-6 bg-indigo-50 p-8 rounded-xl">
              <h3 className="text-3xl font-bold text-indigo-600">
                Congratulations! 🎉
              </h3>
              <p className="text-xl text-gray-700">
                You've completed all rounds!
              </p>
              <Button
                onClick={() =>
                  navigate(`/quarter/${quarterId}/lesson/${lessonId}`)
                }
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-lg"
              >
                Back to Lesson
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GamePlay;
