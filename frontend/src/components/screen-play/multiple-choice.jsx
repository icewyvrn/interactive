import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
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

const MultipleChoiceGamePlay = () => {
  const { quarterId, lessonId, gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await axios.get(`/api/game/lessons/${lessonId}/games`);
        const foundGame = response.data.games.find(
          (g) => g.id === parseInt(gameId) && g.game_type === 'multiple-choice'
        );
        if (foundGame) {
          setGame(foundGame);
        } else {
          toast.error('Game not found');
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        toast.error('Failed to load the game');
      }
    };
    fetchGame();
  }, [lessonId, gameId]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleChoiceSelect = (choice) => {
    if (isCorrect !== null) return; // Prevent selection after answer is revealed

    // Choice selected by user
    setSelectedChoice(choice);

    // Handle both property naming conventions (is_correct from backend, isCorrect from frontend)
    if (choice.is_correct || choice.isCorrect) {
      setIsCorrect(true);
      setScore(score + 1);
      triggerConfetti();

      toast.success('Correct answer!', {
        icon: '✅',
        duration: 3000,
      });

      // Move to next question after delay
      setTimeout(() => {
        if (currentRound + 1 < game.total_rounds) {
          setCurrentRound(currentRound + 1);
          setSelectedChoice(null);
          setIsCorrect(null);
        } else {
          setGameComplete(true);
        }
      }, 2000);
    } else {
      // Mark the answer as incorrect but don't show which one is correct
      // and don't automatically proceed to the next question
      setIsCorrect(false);

      toast.error('Incorrect answer! Try again.', {
        icon: '❌',
        duration: 3000,
      });

      // Allow the user to try again by just clearing the selection and isCorrect state
      setTimeout(() => {
        setSelectedChoice(null);
        setIsCorrect(null);
      }, 1500);
    }
  };

  const handleBackToLesson = () => {
    navigate(`/quarter/${quarterId}/lesson/${lessonId}`);
  };

  const handlePlayAgain = () => {
    setCurrentRound(0);
    setSelectedChoice(null);
    setIsCorrect(null);
    setGameComplete(false);
    setScore(0);
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-gray-300 rounded mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

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
                You've successfully completed all questions
              </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-2">Quiz Complete</h2>
              <p className="text-gray-600">
                You've mastered all {game.total_rounds} questions in this quiz.
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

  const round = game.rounds[currentRound];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center text-gray-600"
            onClick={handleBackToLesson}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lesson
          </Button>
        </div>

        {/* Game Container */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 space-y-6 border border-gray-100 max-w-4xl mx-auto w-full">
          {/* Game Header */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Multiple Choice Quiz
              </h1>
              <p className="text-gray-600">
                Select the correct answer for each question
              </p>
            </div>
            <div className="flex items-center gap-4 w-full">
              <div className="bg-indigo-50 px-4 py-2 rounded-full">
                <p className="text-sm font-medium text-indigo-700">
                  Question {currentRound + 1} of {game.total_rounds}
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

          {/* Question */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-8 mb-8">
            <div className="text-2xl md:text-3xl font-medium text-gray-800 text-center leading-relaxed">
              {round.question}
            </div>
          </div>

          {/* Answer Choices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {round.choices.map((choice) => {
              const isSelected =
                selectedChoice && selectedChoice.id === choice.id;
              // Only show correct answers when the user got it right
              const showCorrect =
                isCorrect === true && (choice.is_correct || choice.isCorrect);
              const showIncorrect = isSelected && isCorrect === false;

              return (
                <div
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice)}
                  className={`
                    p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }
                    ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                    ${showIncorrect ? 'border-red-500 bg-red-50' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }
                      ${showCorrect ? 'bg-green-500 text-white' : ''}
                      ${showIncorrect ? 'bg-red-500 text-white' : ''}
                    `}
                    >
                      {showCorrect && <Check className="h-5 w-5" />}
                      {showIncorrect && <X className="h-5 w-5" />}
                      {!showCorrect && !showIncorrect && (
                        <span className="text-sm font-medium">
                          {String.fromCharCode(
                            65 + round.choices.indexOf(choice)
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-medium">
                      {choice.choice_text || choice.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceGamePlay;
