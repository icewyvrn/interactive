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
import { Info, ChevronLeft, Plus, Trash2, Image, Link2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const DragDropSettings = ({
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
    if (gameToEdit && gameToEdit.game_type === 'drag-drop') {
      setIsEditMode(true);
      setGameId(gameToEdit.id);
      setTotalRounds(gameToEdit.total_rounds);

      // If we have the full game data with rounds
      if (gameToEdit.rounds) {
        const formattedRounds = gameToEdit.rounds.map((round) => ({
          questionText: round.question_text,
          blankPosition: round.blank_position,
          choices: round.choices.map((choice) => ({
            word: choice.word || '',
            image: choice.image_url || null,
            isCorrect: choice.is_correct,
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
      const response = await axios.get(`/api/game/games/drag-drop/${id}`);
      if (response.data.success) {
        const game = response.data.game;
        if (game.game_type !== 'drag-drop') {
          toast.error('Invalid game type');
          return;
        }
        setTotalRounds(game.total_rounds);

        const formattedRounds = game.rounds.map((round) => ({
          questionText: round.question_text,
          blankPosition: round.blank_position,
          choices: round.choices.map((choice) => ({
            word: choice.word,
            isCorrect: choice.is_correct,
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
          questionText: '',
          blankPosition: 0,
          choices: [
            { word: '', image: null, isCorrect: false },
            { word: '', image: null, isCorrect: false },
            { word: '', image: null, isCorrect: false },
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

  const addChoice = (roundIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex].choices.push({
        word: '',
        image: null,
        isCorrect: false,
      });
      return newRounds;
    });
  };

  const handleFileUpload = async (roundIndex, choiceIndex, file) => {
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF)');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should be less than 2MB');
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Uploading image...');

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`/api/game/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.data.success) {
        const fileUrl = response.data.imageUrl;

        // Update the choice with the file URL
        setRounds((prevRounds) => {
          const newRounds = [...prevRounds];
          newRounds[roundIndex].choices[choiceIndex].image = fileUrl;
          return newRounds;
        });

        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(
        'Failed to upload image: ' +
          (error.response?.data?.message || error.message)
      );
    }
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

      // Check if all choices have either words or images
      const invalidChoices = round.choices.some(
        (choice) => !choice.word.trim() && !choice.image
      );
      if (invalidChoices) {
        toast.error(
          `Round ${i + 1}: All choices must have either text or an image`
        );
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
            word: choice.word.trim() || null,
            imageUrl: choice.image || null,
            isCorrect: choice.isCorrect,
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
          `/api/game/games/drag-drop/${gameId}`,
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
                {isEditMode ? 'Edit' : 'Create'} Drag and Drop Game
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                {isEditMode
                  ? 'Edit your drag and drop game settings and rounds.'
                  : 'Configure your drag and drop game settings before creating the rounds.'}
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
                    <div
                      key={choiceIndex}
                      className="space-y-2 border p-3 rounded-md"
                    >
                      <div className="flex items-center gap-2">
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
                            onClick={() =>
                              removeChoice(roundIndex, choiceIndex)
                            }
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`image-${roundIndex}-${choiceIndex}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileUpload(
                                roundIndex,
                                choiceIndex,
                                e.target.files[0]
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document
                                .getElementById(
                                  `image-${roundIndex}-${choiceIndex}`
                                )
                                .click()
                            }
                          >
                            <Image className="w-4 h-4 mr-1" />
                            {choice.image ? 'Change Image' : 'Add Image'}
                          </Button>

                          {choice.image && (
                            <span className="text-xs text-green-600 flex items-center">
                              <Link2 className="w-3 h-3 mr-1" />
                              Image uploaded
                            </span>
                          )}
                        </div>

                        {choice.image && (
                          <div className="flex items-center gap-2">
                            <img
                              src={`/uploads/${choice.image}`}
                              alt="Choice image"
                              className="h-10 w-auto object-contain"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRounds((prevRounds) => {
                                  const newRounds = [...prevRounds];
                                  newRounds[roundIndex].choices[
                                    choiceIndex
                                  ].image = null;
                                  return newRounds;
                                });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
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
            {isEditMode ? 'Update Game' : 'Create Game'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DragDropSettings;
