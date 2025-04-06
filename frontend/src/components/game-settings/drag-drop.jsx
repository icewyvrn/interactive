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

const DragDropSettings = ({ isOpen, onClose, onBack, onSubmit }) => {
  const { lessonId } = useParams();
  const [totalRounds, setTotalRounds] = useState(3);
  const [rounds, setRounds] = useState([]);

  // Initialize or update rounds when totalRounds changes
  useEffect(() => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      // Add new rounds if needed
      while (newRounds.length < totalRounds) {
        newRounds.push({
          questionText: '',
          blankPosition: 0,
          choices: [
            { word: '', isCorrect: false },
            { word: '', isCorrect: false },
            { word: '', isCorrect: false },
          ],
        });
      }
      // Remove extra rounds if needed
      while (newRounds.length > totalRounds) {
        newRounds.pop();
      }
      return newRounds;
    });
  }, [totalRounds]);

  const handleQuestionChange = (roundIndex, value) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex].questionText = value;
      return newRounds;
    });
  };

  const handleChoiceChange = (roundIndex, choiceIndex, value) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex].choices[choiceIndex].word = value;
      return newRounds;
    });
  };

  const handleCorrectAnswerChange = (roundIndex, choiceIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      // Reset all choices to false first
      newRounds[roundIndex].choices.forEach(
        (choice) => (choice.isCorrect = false)
      );
      // Set the selected choice to true
      newRounds[roundIndex].choices[choiceIndex].isCorrect = true;
      return newRounds;
    });
  };

  const addChoice = React.useCallback((roundIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex] = {
        ...newRounds[roundIndex],
        choices: [
          ...newRounds[roundIndex].choices,
          { word: '', isCorrect: false },
        ],
      };
      return newRounds;
    });
  }, []);

  const removeChoice = (roundIndex, choiceIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex].choices.splice(choiceIndex, 1);
      return newRounds;
    });
  };

  const validateRounds = (rounds) => {
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];

      // Check if question text exists and contains underscore
      if (!round.questionText || !round.questionText.includes('_')) {
        toast.error(
          `Round ${
            i + 1
          }: Question must include an underscore (_) for the blank`
        );
        return false;
      }

      // Check if at least one choice is marked as correct
      const hasCorrectAnswer = round.choices.some((choice) => choice.isCorrect);
      if (!hasCorrectAnswer) {
        toast.error(`Round ${i + 1}: Must select a correct answer`);
        return false;
      }

      // Check if all choices have words
      const emptyChoices = round.choices.some((choice) => !choice.word.trim());
      if (emptyChoices) {
        toast.error(`Round ${i + 1}: All choices must have text`);
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
        const blankPosition = round.questionText.indexOf('_');
        return {
          questionText: round.questionText,
          blankPosition,
          choices: round.choices.map((choice) => ({
            word: choice.word.trim(),
            isCorrect: choice.isCorrect,
          })),
        };
      });

      // Prepare the game data
      const gameData = {
        totalRounds,
        rounds: processedRounds,
      };

      // Updated API endpoint to match backend route
      const response = await axios.post(
        `/api/game/lessons/${lessonId}/games/drag-drop`,
        gameData
      );

      if (response.data.success) {
        toast.success('Game created successfully!');
        onSubmit(response.data.game);
        onClose();
      } else {
        toast.error('Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error(error.response?.data?.message || 'Failed to create game');
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
                Drag and Drop Game Settings
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Configure your drag and drop game settings before creating the
                rounds.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                You'll be able to create individual rounds after setting up the
                game. Each round will have a sentence with a blank space and
                multiple word choices.
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="rounds">Number of Rounds</Label>
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
                  Maximum 10 rounds per game
                </span>
              </div>
            </div>

            <Separator className="my-6" />

            {rounds.map((round, roundIndex) => (
              <div key={roundIndex} className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Round {roundIndex + 1}</h3>

                <div className="space-y-2">
                  <Label>Question Text (use _ for blank)</Label>
                  <Input
                    value={round.questionText}
                    onChange={(e) =>
                      handleQuestionChange(roundIndex, e.target.value)
                    }
                    placeholder="Enter question text with _ for blank (e.g., The cat _ on the mat)"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Choices</Label>
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

                  {round.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`correct-${roundIndex}-${choiceIndex}`}
                          checked={choice.isCorrect}
                          onCheckedChange={() =>
                            handleCorrectAnswerChange(roundIndex, choiceIndex)
                          }
                        />
                        <Label
                          htmlFor={`correct-${roundIndex}-${choiceIndex}`}
                          className="text-sm text-gray-600"
                        >
                          Correct Answer
                        </Label>
                      </div>
                      <Input
                        value={choice.word}
                        onChange={(e) =>
                          handleChoiceChange(
                            roundIndex,
                            choiceIndex,
                            e.target.value
                          )
                        }
                        placeholder={`Choice ${choiceIndex + 1}`}
                        className="flex-1"
                      />
                      {round.choices.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChoice(roundIndex, choiceIndex)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-white rounded-b-lg">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-indigo-700 text-white hover:bg-indigo-800"
          >
            Create Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DragDropSettings;
