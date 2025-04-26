import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoveRight, Check, Circle, Trophy } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Header from '../header';
import GameBackground from '../GameBackground';
// No arrow functionality as requested

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

// Draggable connector point component
const DraggableConnector = ({ id, disabled, matched }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
      disabled: disabled,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: 'none',
        touchAction: 'none',
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      data-connector-id={id.split('-')[1]}
      className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-4 w-8 h-8 rounded-full flex items-center justify-center will-change-transform ${
        matched
          ? 'bg-green-500 text-white cursor-default shadow-lg'
          : disabled
          ? 'bg-gray-300 cursor-not-allowed'
          : isDragging
          ? 'bg-blue-600 text-white shadow-xl scale-110'
          : 'bg-blue-500 text-white cursor-grab hover:bg-blue-600 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200'
      }`}
    >
      {matched ? (
        <Check className="h-4 w-4" />
      ) : (
        <MoveRight className="h-4 w-4" />
      )}
    </div>
  );
};

// Droppable target component
const DroppableTarget = ({ id, isOver, disabled, matched }) => {
  const { setNodeRef } = useDroppable({
    id: id,
    disabled: disabled,
  });

  return (
    <div
      ref={setNodeRef}
      data-target-id={id.split('-')[1]}
      className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
        matched
          ? 'bg-green-500 text-white shadow-lg'
          : isOver && !disabled
          ? 'bg-blue-500 text-white scale-125 shadow-lg'
          : disabled
          ? 'bg-gray-300'
          : 'bg-gray-200 border-2 border-dashed border-gray-400 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200'
      }`}
    >
      {matched ? (
        <Check className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4 opacity-50" />
      )}
    </div>
  );
};

const MatchingGamePlay = () => {
  const { quarterId, lessonId, gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 0,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await axios.get(`/api/game/lessons/${lessonId}/games`);
        const foundGame = response.data.games.find(
          (g) => g.id === parseInt(gameId) && g.game_type === 'matching'
        );
        if (foundGame) {
          setGame(foundGame);
          // Reset matches when loading a new round
          setMatches([]);
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        toast.error('Failed to load the game');
      }
    };
    fetchGame();
  }, [lessonId, gameId]);

  // Reset matches when changing rounds
  useEffect(() => {
    setMatches([]);
  }, [currentRound]);

  const handleDragStart = ({ active }) => {
    if (!active) return;
    setActiveId(active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setIsOver(false);

    // Return early if no valid drop
    if (!active || !over || !game) {
      return;
    }

    // Make sure the drop is on a target (strict checking)
    if (!over.id.startsWith('target-')) {
      return;
    }

    const round = game.rounds[currentRound];

    // Extract the actual IDs and types from the draggable/droppable IDs
    // Format: 'connector-{id}' and 'target-{id}'
    const activeIdParts = active.id.split('-');
    const overIdParts = over.id.split('-');

    if (activeIdParts.length < 2 || overIdParts.length < 2) return;

    // Get the ID and ensure we're dealing with a connector (first choice) and target (second choice)
    const firstChoiceId = parseInt(activeIdParts[1]);
    const secondChoiceId = parseInt(overIdParts[1]);

    if (isNaN(firstChoiceId) || isNaN(secondChoiceId)) return;

    // Verify we're dragging from first choices to second choices
    if (
      !activeIdParts[0].includes('connector') ||
      !overIdParts[0].includes('target')
    ) {
      console.warn('Invalid drag operation: not from connector to target');
      return;
    }

    // Check if the first choice (dragged item) is already matched
    const firstChoiceAlreadyMatched = matches.some(
      (match) => match.firstChoiceId === firstChoiceId
    );

    // Check if the second choice (drop target) is already matched
    const secondChoiceAlreadyMatched = matches.some(
      (match) => match.secondChoiceId === secondChoiceId
    );

    // If either item is already matched, prevent the new match
    if (firstChoiceAlreadyMatched || secondChoiceAlreadyMatched) {
      toast.error('One or both items are already matched!', {
        icon: '⚠️',
        duration: 3000,
      });
      return;
    }

    // Find the correct match for this first choice
    // We need to be very explicit about the matching to avoid issues with overlapping IDs
    const correctMatch = round.correct_matches.find(
      (match) => match.first_choice_id === firstChoiceId
    );

    if (!correctMatch) {
      console.warn(
        `No correct match found for first choice ID: ${firstChoiceId}`
      );
      return;
    }

    // Check if the drop target is the correct match for this specific first choice
    // This is the critical check - we need to ensure the exact match between first and second choice
    const isCorrectDrop = correctMatch.second_choice_id === secondChoiceId;

    console.log(
      `Checking match: first=${firstChoiceId}, second=${secondChoiceId}, correct=${isCorrectDrop}`
    );
    console.log('Expected second choice:', correctMatch.second_choice_id);

    if (isCorrectDrop) {
      // Add to matches
      const newMatch = {
        firstChoiceId: firstChoiceId,
        secondChoiceId: secondChoiceId,
      };

      setMatches((prev) => [...prev, newMatch]);

      // Match has been made successfully

      // Play success animation
      triggerConfetti();

      // Check if all matches are complete
      const totalMatchesNeeded = round.correct_matches.length;
      if (matches.length + 1 >= totalMatchesNeeded) {
        // Round complete
        setTimeout(() => {
          if (currentRound + 1 < game.total_rounds) {
            setCurrentRound((prev) => prev + 1);
            // Reset for next round
          } else {
            setGameComplete(true);
          }
        }, 2000);
      }
    } else {
      // Incorrect match
      toast.error(
        "That's not the correct match for this item. Try a different combination!",
        {
          icon: '❌',
          duration: 3000,
        }
      );
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

  const handlePlayAgain = () => {
    setCurrentRound(0);
    setMatches([]);
    setGameComplete(false);
  };

  const handleBackToLesson = () => {
    navigate(`/quarter/${quarterId}/lesson/${lessonId}`);
  };

  // Check if an item is matched
  const isMatched = (itemId, itemType) => {
    // itemType can be 'first' or 'second'
    if (itemType === 'first') {
      return matches.some((match) => match.firstChoiceId === itemId);
    } else if (itemType === 'second') {
      return matches.some((match) => match.secondChoiceId === itemId);
    } else {
      // For backward compatibility, check both (but this should be avoided)
      console.warn('isMatched called without specifying itemType');
      return matches.some(
        (match) =>
          match.firstChoiceId === itemId || match.secondChoiceId === itemId
      );
    }
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-10 w-10 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Congratulations!
              </h1>
              <p className="text-gray-600">
                You've successfully completed all matching challenges
              </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-2">Game Complete</h2>
              <p className="text-gray-600">
                You've mastered all {game.total_rounds} rounds in this Matching
                Game.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleBackToLesson}>
                Back to Lesson
              </Button>
              <Button onClick={handlePlayAgain}>Play Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) return <div>Loading...</div>;

  const round = game.rounds[currentRound];

  return (
    <GameBackground>
      <div className="min-h-screen">
        <Header className="bg-white shadow-md" />

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/quarter/${quarterId}/lesson/${lessonId}`)
              }
              className="text-red-700 hover:text-red-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lesson
            </Button>
          </div>

          {/* Game Container */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 space-y-6 border border-gray-100">
            {/* Game Header */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Matching Game
                </h1>
                <p className="text-gray-600">
                  Match the items on the left with their corresponding pairs on
                  the right
                </p>
              </div>
              <div className="flex items-center gap-4 w-full">
                <div className="bg-indigo-50 px-4 py-2 rounded-full">
                  <p className="text-sm font-medium text-indigo-700">
                    Round {currentRound + 1} of {game.total_rounds}
                  </p>
                </div>
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
              collisionDetection={
                pointerWithin
              } /* Use pointerWithin for more precise collision detection */
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              modifiers={[restrictToWindowEdges]}
            >
              {/* Matching Game Board */}
              <div
                className="flex justify-between h-[calc(100vh-300px)] min-h-[400px] mb-8 relative px-4 game-board-container"
                style={{ maxWidth: '1400px', margin: '0 auto' }}
              >
                {/* No visual indicators for connections as arrows have been removed */}

                {/* Left Column - First Choices */}
                <div className="w-[40%] flex flex-col">
                  <h3 className="text-xl font-semibold text-center text-indigo-700 mb-6">
                    Items
                  </h3>
                  <div className="flex-1 flex flex-col justify-around py-4">
                    {round.first_choices.map((choice) => {
                      const matched = isMatched(choice.id, 'first');
                      return (
                        <div
                          key={choice.id}
                          data-connector-id={choice.id}
                          className={`relative bg-white p-5 rounded-xl shadow-md border ${
                            matched
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200'
                          } flex items-center transition-all duration-300 hover:shadow-lg`}
                        >
                          <div className="flex-1 flex items-center justify-start">
                            {choice.image_url ? (
                              <img
                                src={`/uploads/${choice.image_url}`}
                                alt={choice.word || 'Image'}
                                className="max-h-20 max-w-full object-contain mr-3"
                              />
                            ) : null}
                            <span className="text-gray-800 font-medium text-lg">
                              {choice.word}
                            </span>
                          </div>

                          <DraggableConnector
                            id={`connector-${choice.id}`}
                            disabled={matched}
                            matched={matched}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Center space - increased width */}
                <div
                  className="h-full flex items-center justify-center"
                  style={{ width: '20%' }}
                >
                  <div className="h-[80%] w-0.5 bg-gray-200 rounded-full"></div>
                </div>

                {/* Right Column - Second Choices (Drop Targets) */}
                <div className="w-[40%] flex flex-col">
                  <h3 className="text-xl font-semibold text-center text-indigo-700 mb-6">
                    Matches
                  </h3>
                  <div className="flex-1 flex flex-col justify-around py-4">
                    {round.second_choices.map((choice) => {
                      const matched = isMatched(choice.id, 'second');
                      const isCurrentOver =
                        isOver && activeId && activeId.startsWith('connector-');

                      return (
                        <div
                          key={choice.id}
                          data-target-id={choice.id}
                          className={`relative bg-white p-5 rounded-xl shadow-md border ${
                            matched
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200'
                          } flex items-center transition-all duration-300 hover:shadow-lg`}
                        >
                          <DroppableTarget
                            id={`target-${choice.id}`}
                            isOver={isCurrentOver}
                            disabled={matched}
                            matched={matched}
                          />

                          <div className="flex-1 flex items-center justify-end">
                            {choice.image_url ? (
                              <img
                                src={`/uploads/${choice.image_url}`}
                                alt={choice.word || 'Image'}
                                className="max-h-20 max-w-full object-contain ml-3"
                              />
                            ) : null}
                            <span className="text-gray-800 font-medium text-lg">
                              {choice.word}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DndContext>

            {/* Game Complete Screen */}
            {gameComplete && (
              <div className="text-center space-y-6 bg-gradient-to-br from-indigo-50 to-blue-50 p-10 rounded-xl shadow-lg">
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
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg shadow-lg shadow-indigo-200 transition-all duration-300 hover:scale-105"
                >
                  Back to Lesson
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </GameBackground>
  );
};

export default MatchingGamePlay;
