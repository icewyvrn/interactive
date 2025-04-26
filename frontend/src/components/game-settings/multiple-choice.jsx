import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Info, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const MultipleChoiceSettings = ({
  isOpen,
  onClose,
  onBack,
  onSubmit,
  gameToEdit = null,
}) => {
  const { lessonId } = useParams();
  const [totalRounds, setTotalRounds] = useState(
    gameToEdit ? gameToEdit.total_rounds : 3
  );
  const [rounds, setRounds] = useState([]);
  const [isEditMode, setIsEditMode] = useState(!!gameToEdit);
  const [gameId, setGameId] = useState(gameToEdit?.id || null);

  // Load game data if in edit mode
  useEffect(() => {
    if (gameToEdit && gameToEdit.game_type === 'multiple-choice') {
      setIsEditMode(true);
      setGameId(gameToEdit.id);
      setTotalRounds(gameToEdit.total_rounds);

      // If we have the full game data with rounds
      if (gameToEdit.rounds) {
        const formattedRounds = gameToEdit.rounds.map((round) => ({
          question: round.question,
          choices: round.choices.map((choice) => ({
            text: choice.choice_text,
            isCorrect: choice.is_correct,
            displayOrder: choice.display_order,
          })),
        }));
        setRounds(formattedRounds);
      } else {
        // If we only have the game ID, fetch the full game data
        fetchGameData(gameToEdit.id);
      }
    }
  }, [gameToEdit]);

  // Fetch game data for editing
  const fetchGameData = async (id) => {
    try {
      const response = await axios.get(`/api/game/games/multiple-choice/${id}`);
      if (response.data.success) {
        const game = response.data.game;
        if (game.game_type !== 'multiple-choice') {
          toast.error('Invalid game type');
          return;
        }
        setTotalRounds(game.total_rounds);

        const formattedRounds = game.rounds.map((round) => ({
          question: round.question,
          choices: round.choices.map((choice) => ({
            text: choice.choice_text,
            isCorrect: choice.is_correct,
            displayOrder: choice.display_order,
          })),
        }));
        setRounds(formattedRounds);
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
      toast.error('Failed to load game data for editing');
    }
  };

  // Initialize or update rounds when totalRounds changes
  useEffect(() => {
    // Skip this effect if we're in edit mode and already have rounds data
    if (isEditMode && rounds.length > 0) return;

    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      // Add new rounds if needed
      while (newRounds.length < totalRounds) {
        newRounds.push({
          question: '',
          choices: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
        });
      }
      // Remove extra rounds if needed
      while (newRounds.length > totalRounds) {
        newRounds.pop();
      }
      return newRounds;
    });
  }, [totalRounds, isEditMode, rounds.length]);

  const updateQuestion = (roundIndex, question) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex] = {
        ...newRounds[roundIndex],
        question,
      };
      return newRounds;
    });
  };

  const updateChoiceText = (roundIndex, choiceIndex, text) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex].choices[choiceIndex] = {
        ...newRounds[roundIndex].choices[choiceIndex],
        text,
      };
      return newRounds;
    });
  };

  const toggleCorrectAnswer = (roundIndex, choiceIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      // First, set all choices to not correct
      newRounds[roundIndex].choices = newRounds[roundIndex].choices.map(
        (choice, idx) => ({
          ...choice,
          isCorrect: idx === choiceIndex, // Only the clicked one will be correct
        })
      );
      return newRounds;
    });
  };

  const addChoice = (roundIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      if (newRounds[roundIndex].choices.length < 6) {
        // Limit to 6 choices max
        newRounds[roundIndex].choices.push({
          text: '',
          isCorrect: false,
        });
      } else {
        toast.error('Maximum 6 choices allowed per question');
      }
      return newRounds;
    });
  };

  const removeChoice = (roundIndex, choiceIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];

      // Safety check: ensure the round and choices exist
      if (!newRounds[roundIndex] || !newRounds[roundIndex].choices) {
        console.error('Round or choices not found');
        return prevRounds;
      }

      // Check if we have more than the minimum required choices (2)
      if (newRounds[roundIndex].choices.length > 2) {
        // Safety check: ensure the choice exists
        if (!newRounds[roundIndex].choices[choiceIndex]) {
          console.error('Choice not found');
          return prevRounds;
        }

        // Store if the choice being removed was marked as correct
        const wasCorrect = newRounds[roundIndex].choices[choiceIndex].isCorrect;

        // Remove the choice
        newRounds[roundIndex].choices.splice(choiceIndex, 1);

        // If we removed the correct answer and there are remaining choices,
        // set the first choice as correct
        if (wasCorrect && newRounds[roundIndex].choices.length > 0) {
          newRounds[roundIndex].choices[0].isCorrect = true;
        }
      } else {
        toast.error('At least 2 choices are required');
      }
      return newRounds;
    });
  };

  const validateRounds = (rounds) => {
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];

      // Check if question exists
      if (!round.question.trim()) {
        toast.error(`Round ${i + 1}: Question is required`);
        return false;
      }

      // Check if at least 2 choices exist
      if (round.choices.length < 2) {
        toast.error(`Round ${i + 1}: At least 2 choices are required`);
        return false;
      }

      // Check if all choices have text
      const emptyChoices = round.choices.some((choice) => !choice.text.trim());
      if (emptyChoices) {
        toast.error(`Round ${i + 1}: All choices must have text`);
        return false;
      }

      // Check if one choice is marked as correct
      const hasCorrectAnswer = round.choices.some((choice) => choice.isCorrect);
      if (!hasCorrectAnswer) {
        toast.error(`Round ${i + 1}: Must select a correct answer`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      // Validate the rounds
      if (!validateRounds(rounds)) {
        return;
      }

      // Process rounds data
      const processedRounds = rounds.map((round) => {
        return {
          question: round.question.trim(),
          choices: round.choices.map((choice, index) => ({
            text: choice.text.trim(),
            isCorrect: choice.isCorrect,
            displayOrder: choice.displayOrder || index + 1,
          })),
        };
      });

      // Prepare the game data
      const gameData = {
        totalRounds,
        rounds: processedRounds,
      };

      let response;

      if (isEditMode) {
        // Update existing game
        response = await axios.put(
          `/api/game/games/multiple-choice/${gameId}`,
          gameData
        );
        if (response.data.success) {
          toast.success('Game updated successfully!');
          onSubmit(response.data.game);
          onClose();
        } else {
          toast.error('Failed to update game');
        }
      } else {
        // Create new game
        response = await axios.post(
          `/api/game/lessons/${lessonId}/games/multiple-choice`,
          gameData
        );
        if (response.data.success) {
          toast.success('Multiple choice game created successfully!');
          onSubmit(response.data.game);
          onClose();
        } else {
          toast.error('Failed to create game');
        }
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} game:`,
        error
      );
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? 'update' : 'create'} game`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col p-0 gap-0 sm:max-w-[900px] h-[80vh] overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-white rounded-t-lg">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isEditMode ? 'Edit' : 'Create'} Multiple Choice Game
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                {isEditMode
                  ? 'Edit your multiple choice quiz with one correct answer per question.'
                  : 'Create a multiple choice quiz with one correct answer per question.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                Create multiple choice questions with one correct answer per
                question. Students will select the answer they think is correct.
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="rounds">Number of Questions</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="rounds"
                  type="number"
                  min={1}
                  max={10}
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">
                  Maximum 10 questions per game
                </span>
              </div>
            </div>

            <Separator className="my-6" />

            {rounds.map((round, roundIndex) => (
              <div
                key={roundIndex}
                className="space-y-4 p-4 border rounded-lg mb-6"
              >
                <h3 className="font-semibold">Question {roundIndex + 1}</h3>

                <div className="space-y-2">
                  <Label htmlFor={`question-${roundIndex}`}>Question</Label>
                  <Input
                    id={`question-${roundIndex}`}
                    value={round.question}
                    onChange={(e) => updateQuestion(roundIndex, e.target.value)}
                    placeholder="Enter your question here"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <Label>Answer Choices</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addChoice(roundIndex)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Choice
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {round.choices.map((choice, choiceIndex) => (
                      <div
                        key={choiceIndex}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50"
                      >
                        <Checkbox
                          id={`correct-${roundIndex}-${choiceIndex}`}
                          checked={choice.isCorrect}
                          onCheckedChange={() =>
                            toggleCorrectAnswer(roundIndex, choiceIndex)
                          }
                        />
                        <Input
                          value={choice.text}
                          onChange={(e) =>
                            updateChoiceText(
                              roundIndex,
                              choiceIndex,
                              e.target.value
                            )
                          }
                          placeholder={`Choice ${choiceIndex + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChoice(roundIndex, choiceIndex)}
                          disabled={round.choices.length <= 2}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            className="bg-indigo-700 text-white hover:bg-indigo-800"
            onClick={handleSubmit}
          >
            {isEditMode ? 'Update Game' : 'Create Game'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultipleChoiceSettings;
