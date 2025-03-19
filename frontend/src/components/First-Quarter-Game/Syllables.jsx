import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  DragOverlay,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import confetti from 'canvas-confetti';

// Word database with syllable count
const wordDatabase = [
  // 2 syllable words
  { word: 'tiger', syllables: 2, icon: '🐯' },
  { word: 'apple', syllables: 2, icon: '🍎' },
  { word: 'pencil', syllables: 2, icon: '✏️' },
  { word: 'paper', syllables: 2, icon: '📝' },
  { word: 'robot', syllables: 2, icon: '🤖' },

  // 3 syllable words
  { word: 'banana', syllables: 3, icon: '🍌' },
  { word: 'computer', syllables: 3, icon: '💻' },
  { word: 'elephant', syllables: 3, icon: '🐘' },
  { word: 'dinosaur', syllables: 3, icon: '🦖' },
  { word: 'hamburger', syllables: 3, icon: '🍔' },

  // 4 syllable words
  { word: 'watermelon', syllables: 4, icon: '🍉' },
  { word: 'alligator', syllables: 4, icon: '🐊' },
  { word: 'avocado', syllables: 4, icon: '🥑' },
  { word: 'calculator', syllables: 4, icon: '🧮' },
  { word: 'california', syllables: 4, icon: '🌉' },
];

// Function to get random words by syllable count
const getRandomWordsBySyllableCount = (syllableCount) => {
  const filteredWords = wordDatabase.filter(
    (w) => w.syllables === syllableCount
  );
  return filteredWords[Math.floor(Math.random() * filteredWords.length)];
};

// Function to get random words for options (including the correct one)
const getRandomOptions = (correctWord) => {
  // Start with the correct word
  const options = [correctWord];

  // Add one word from each remaining syllable count
  [2, 3, 4].forEach((syllableCount) => {
    if (syllableCount !== correctWord.syllables) {
      const availableWords = wordDatabase.filter(
        (w) => w.syllables === syllableCount
      );
      const randomWord =
        availableWords[Math.floor(Math.random() * availableWords.length)];
      options.push(randomWord);
    }
  });

  // Shuffle the options
  return options.sort(() => Math.random() - 0.5);
};

// Function to trigger confetti
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
};

// Draggable Word Component
const DraggableWord = ({ word, icon, isCorrect, correctWord, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: word,
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
      className={`
        flex flex-col items-center p-4 border-2 rounded-lg select-none
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${
          isCorrect && word === correctWord
            ? 'border-green-500'
            : 'border-border'
        }
        cursor-grab hover:bg-accent/10 transition-colors touch-none
      `}
    >
      <div className="text-5xl mb-2">{icon}</div>
      <div className="text-xl font-medium">{word}</div>
    </div>
  );
};

// Droppable Zone Component
const DroppableZone = ({ id, children, isCorrect, hasItem }) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="flex items-center gap-4">
      <div
        ref={setNodeRef}
        className={`
            w-32 h-32 border-2 rounded-lg flex items-center justify-center
            ${hasItem ? 'border-solid' : 'border-dashed'} 
            ${
              isCorrect
                ? 'border-green-500 bg-green-500/10'
                : 'border-border bg-secondary/10'
            }
          `}
      >
        {children}
      </div>
      <div className="flex items-center">
        <div
          className={`h-[2px] w-24 ${isCorrect ? 'bg-green-500' : 'bg-border'}`}
        />
        <div className="text-2xl mx-2">×</div>
        <div className="text-2xl font-medium">
          {hasItem ? children?.props?.syllables || 0 : '?'}
        </div>
      </div>
    </div>
  );
};

const DragAndDrop = ({ onComplete }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [rounds, setRounds] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropzoneStatus, setDropzoneStatus] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Initialize game
  useEffect(() => {
    // Create 3 rounds with different syllable counts
    const gameRounds = [
      { targetWord: getRandomWordsBySyllableCount(2), options: [] },
      { targetWord: getRandomWordsBySyllableCount(3), options: [] },
      { targetWord: getRandomWordsBySyllableCount(4), options: [] },
    ];

    // Generate options for each round
    gameRounds.forEach((round) => {
      round.options = getRandomOptions(round.targetWord);
    });

    setRounds(gameRounds);
  }, []);

  useEffect(() => {
    if (rounds.length > 0 && currentRound < rounds.length) {
      setDropzoneStatus([null]);
      setIsCorrect(false);
      setShowFeedback(false);
    }
  }, [rounds, currentRound]);

  // Call onComplete when game is finished
  useEffect(() => {
    if (gameComplete && onComplete) {
      onComplete();
    }
  }, [gameComplete, onComplete]);

  const startGame = () => {
    setGameStarted(true);
  };

  const nextRound = () => {
    if (currentRound < rounds.length - 1) {
      setCurrentRound(currentRound + 1);
    } else {
      setGameComplete(true);
    }
  };

  const restartGame = () => {
    setCurrentRound(0);
    setGameStarted(true);
    setGameComplete(false);
    setIsCorrect(false);
    setShowFeedback(false);

    // Re-initialize game with new words
    const gameRounds = [
      { targetWord: getRandomWordsBySyllableCount(2), options: [] },
      { targetWord: getRandomWordsBySyllableCount(3), options: [] },
      { targetWord: getRandomWordsBySyllableCount(4), options: [] },
    ];

    // Generate options for each round
    gameRounds.forEach((round) => {
      round.options = getRandomOptions(round.targetWord);
    });

    setRounds(gameRounds);
  };

  const handleDragStart = (event) => {
    setDraggedItem(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { over, active } = event;
    setDraggedItem(null);

    if (over && over.id === 'dropzone-0') {
      const droppedWord = rounds[currentRound].options.find(
        (option) => option.word === active.id
      );

      const currentDropzones = [droppedWord];
      setDropzoneStatus(currentDropzones);

      if (droppedWord.word === rounds[currentRound].targetWord.word) {
        setIsCorrect(true);
        setShowFeedback(true);
        triggerConfetti();
      } else {
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          setDropzoneStatus([null]);
        }, 1000);
      }
    }
  };

  // Game start screen
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Syllable Drop Game</h2>
          <p className="mb-6 text-muted-foreground">
            Drag the correct word to the boxes at the bottom of the screen. Each
            box represents one syllable in the word.
          </p>
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
        </Card>
      </div>
    );
  }

  // Game completion screen
  if (gameComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-3xl font-bold mb-2">🎉 Game Complete! 🎉</h2>
          <p className="text-xl mb-6">
            Great job! You've completed all the rounds.
          </p>
          <Button onClick={restartGame} size="lg">
            Play Again
          </Button>
        </Card>
      </div>
    );
  }

  // Current round
  const currentTargetWord = rounds[currentRound]?.targetWord;
  const currentOptions = rounds[currentRound]?.options || [];
  const syllableCount = currentTargetWord?.syllables || 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="flex flex-col items-center justify-between h-full p-4">
        {/* Round info */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-normal mb-2 text-gray-300">
            Round {currentRound + 1} of 3
          </h2>
        </div>

        {/* Syllable Question */}
        <div className="text-xl font-semibold text-center">
          Find a word with {syllableCount} syllables
        </div>

        {/* Options area */}
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          {currentOptions.map((option) => (
            <DraggableWord
              key={option.word}
              word={option.word}
              icon={option.icon}
              isCorrect={isCorrect}
              correctWord={currentTargetWord.word}
              isDragging={draggedItem === option.word}
            />
          ))}
        </div>

        {/* Feedback area */}
        {showFeedback && (
          <div
            className={`mb-6 text-center ${
              isCorrect ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <p className="text-2xl font-bold mb-2">
              {isCorrect ? 'Correct! 🎉' : 'Try Again!'}
            </p>
            {isCorrect && (
              <Button onClick={nextRound} className="mt-2">
                {currentRound < 2 ? 'Next Round' : 'Complete Game'}
              </Button>
            )}
          </div>
        )}

        {/* Dropzone area */}
        <div className="flex justify-center mb-4">
          <DroppableZone
            id="dropzone-0"
            isCorrect={isCorrect}
            hasItem={Boolean(dropzoneStatus[0])}
          >
            {dropzoneStatus[0] && (
              <div
                className="text-center"
                syllables={dropzoneStatus[0].syllables}
              >
                <div className="text-3xl">{dropzoneStatus[0].icon}</div>
                <div className="text-sm font-medium">
                  {dropzoneStatus[0].word}
                </div>
              </div>
            )}
          </DroppableZone>
        </div>

        {/* Help text */}
        <div className="text-center text-muted-foreground mt-4">
          <p>Drag the correct word to the box below</p>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedItem && (
          <div className="flex flex-col items-center p-4 border-2 rounded-lg border-primary bg-background">
            <div className="text-5xl mb-2">
              {
                currentOptions.find((option) => option.word === draggedItem)
                  ?.icon
              }
            </div>
            <div className="text-xl font-medium">{draggedItem}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default DragAndDrop;
