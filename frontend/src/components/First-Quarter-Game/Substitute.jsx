import { useState } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Confetti from 'canvas-confetti';

const ROUNDS = [
  {
    word: 'CAT',
    letters: ['Q', 'H', 'L'], // H is the correct answer
    correctLetter: 'H', // Add explicit correct letter
    targetIndex: 0, // Replace 'C' with 'H'
  },
  {
    word: 'BAND',
    letters: ['S', 'P', 'T'], // S is the correct answer
    correctLetter: 'S',
    targetIndex: 0, // Replace 'B' with 'S'
  },
  {
    word: 'FIGHT',
    letters: ['L', 'W', 'B'], // L is the correct answer
    correctLetter: 'L',
    targetIndex: 0, // Replace 'F' with 'L'
  },
];

const DraggableLetter = ({ letter, id }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: letter,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-20 h-20 bg-primary text-white rounded-lg flex items-center justify-center 
                   text-4xl font-bold cursor-grab shadow-md hover:shadow-lg transition-all
                   hover:scale-110 hover:bg-primary/90 active:cursor-grabbing
                   ${isDragging ? 'opacity-0' : 'opacity-100'}`}
    >
      {letter}
    </div>
  );
};

const LetterBox = ({ letter, isTarget, droppable }) => {
  const { setNodeRef } = useDroppable({
    id: `target-${letter}`, // Remove random to keep consistent ID
  });

  return (
    <div
      ref={isTarget ? setNodeRef : undefined}
      className={
        `w-20 h-20 border-4 relative ${
          isTarget
            ? 'border-accent border-dashed animate-pulse'
            : 'border-border'
        } rounded-lg flex items-center justify-center text-4xl font-bold
            ${droppable ? 'bg-accent/20' : 'bg-secondary/20'}
            ${
              isTarget
                ? 'after:content-["Drop_Here!"] after:absolute after:top-20 after:text-sm after:text-accent after:whitespace-nowrap'
                : ''
            }
            text-white transition-all duration-200` // Add transition for smooth letter change
      }
    >
      {letter}
    </div>
  );
};

const Substitute = ({ onComplete }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [draggedLetter, setDraggedLetter] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [replacedLetter, setReplacedLetter] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Make it easier to start dragging
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Reduce delay for touch devices
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    setDraggedLetter(event.active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    setDraggedLetter(null);
    if (!over) return;

    const draggedLetter = active.id;
    const currentWord = ROUNDS[currentRound];

    const isAnswerCorrect =
      draggedLetter === currentWord.correctLetter &&
      over.id.includes(`target-${currentWord.word[currentWord.targetIndex]}`);

    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    if (isAnswerCorrect) {
      // Set the replaced letter immediately
      setReplacedLetter(draggedLetter);
      Confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (currentRound === ROUNDS.length - 1) {
        setShowConfetti(true);
      }
    }
  };

  const handleNextRound = () => {
    setShowFeedback(false);
    setReplacedLetter(null);
    setCurrentRound((prev) => prev + 1);
  };

  const handleCompleteGame = () => {
    onComplete?.();
  };

  const renderLetterBoxContent = (letter, index) => {
    if (index === currentWord.targetIndex && replacedLetter) {
      return replacedLetter;
    }
    return letter;
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Letter Substitution Game</h2>
          <p className="mb-6 text-muted-foreground">
            Replace one letter to create a new word! Drag the correct letter to
            the highlighted box to form meaningful words.
          </p>
          <Button onClick={() => setGameStarted(true)} size="lg">
            Start Game
          </Button>
        </Card>
      </div>
    );
  }

  const currentWord = ROUNDS[currentRound];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex flex-col items-center gap-8 p-4">
        {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}

        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">
            Round {currentRound + 1}
          </h2>
          <p className="text-lg text-muted-foreground">
            Can you make a new word? Replace the blinking letter!
          </p>
        </div>

        {/* Word Display Area */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {currentWord.word.split('').map((letter, index) => (
              <LetterBox
                key={index}
                letter={renderLetterBoxContent(letter, index)}
                isTarget={index === currentWord.targetIndex && !replacedLetter}
                droppable={index === currentWord.targetIndex && !replacedLetter}
              />
            ))}
          </div>

          {/* Arrow indicator */}
          <div className="text-accent text-4xl animate-bounce">↓</div>

          {/* Letter choices */}
          <div className="flex gap-4">
            {currentWord.letters.map((letter, index) => (
              <DraggableLetter
                key={index}
                letter={letter}
                // Hide the letter if it's been used as replacement
                className={`${
                  letter === replacedLetter ? 'opacity-0' : 'opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        {showFeedback && (
          <div
            className={`text-center ${
              isCorrect ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <p className="text-3xl font-bold mb-4">
              {isCorrect ? '🎉 Correct! Well done!' : '❌ Try again!'}
            </p>
            {isCorrect && (
              <Button
                onClick={
                  currentRound === ROUNDS.length - 1
                    ? handleCompleteGame
                    : handleNextRound
                }
                size="lg"
                className="bg-green-500 hover:bg-green-600"
              >
                {currentRound === ROUNDS.length - 1
                  ? 'Complete Game'
                  : 'Next Round'}
              </Button>
            )}
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Progress:</span>
          <div className="flex gap-1">
            {Array.from({ length: ROUNDS.length }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i <= currentRound ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {draggedLetter ? (
            <div
              className="w-20 h-20 bg-primary text-white rounded-lg flex items-center justify-center 
                text-4xl font-bold shadow-xl ring-2 ring-accent cursor-grabbing"
            >
              {draggedLetter}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default Substitute;
