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
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MatchingGameSettings = ({
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
  // State to track if we're currently processing a match toggle
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!gameToEdit);
  const [gameId, setGameId] = useState(gameToEdit?.id || null);

  // Load game data if in edit mode
  useEffect(() => {
    if (gameToEdit && gameToEdit.game_type === 'matching') {
      setIsEditMode(true);
      setGameId(gameToEdit.id);
      setTotalRounds(gameToEdit.total_rounds);

      // If we have the full game data with rounds
      if (gameToEdit.rounds) {
        const formattedRounds = gameToEdit.rounds.map((round) => {
          // Create a mapping of first choice IDs to their indices
          const firstChoiceIdToIndex = {};
          const firstChoices = round.first_choices.map((choice, index) => {
            firstChoiceIdToIndex[choice.id] = index;
            return {
              id: `first-${round.round_number}-${index}`,
              word: choice.word || '',
              image: choice.image_url || null,
              originalId: choice.id,
            };
          });

          // Create a mapping of second choice IDs to their indices
          const secondChoiceIdToIndex = {};
          const secondChoices = round.second_choices.map((choice, index) => {
            secondChoiceIdToIndex[choice.id] = index;
            return {
              id: `second-${round.round_number}-${index}`,
              word: choice.word || '',
              image: choice.image_url || null,
              originalId: choice.id,
            };
          });

          // Map correct matches using the index mappings
          const matches = [];
          if (round.correct_matches) {
            round.correct_matches.forEach((match) => {
              const firstIndex = firstChoiceIdToIndex[match.first_choice_id];
              const secondIndex = secondChoiceIdToIndex[match.second_choice_id];
              if (firstIndex !== undefined && secondIndex !== undefined) {
                matches.push({ firstIndex, secondIndex });
              }
            });
          }

          return {
            firstChoices,
            secondChoices,
            matches,
          };
        });
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
      const response = await axios.get(`/api/game/games/matching/${id}`);
      if (response.data.success) {
        const game = response.data.game;
        if (game.game_type !== 'matching') {
          toast.error('Invalid game type');
          return;
        }
        setTotalRounds(game.total_rounds);

        const formattedRounds = game.rounds.map((round) => {
          // Create a mapping of first choice IDs to their indices
          const firstChoiceIdToIndex = {};
          const firstChoices = round.first_choices.map((choice, index) => {
            firstChoiceIdToIndex[choice.id] = index;
            return {
              id: `first-${round.round_number}-${index}`,
              word: choice.word || '',
              image: choice.image_url || null,
              originalId: choice.id,
            };
          });

          // Create a mapping of second choice IDs to their indices
          const secondChoiceIdToIndex = {};
          const secondChoices = round.second_choices.map((choice, index) => {
            secondChoiceIdToIndex[choice.id] = index;
            return {
              id: `second-${round.round_number}-${index}`,
              word: choice.word || '',
              image: choice.image_url || null,
              originalId: choice.id,
            };
          });

          // Map correct matches using the index mappings
          const matches = [];
          if (round.correct_matches) {
            round.correct_matches.forEach((match) => {
              const firstIndex = firstChoiceIdToIndex[match.first_choice_id];
              const secondIndex = secondChoiceIdToIndex[match.second_choice_id];
              if (firstIndex !== undefined && secondIndex !== undefined) {
                matches.push({ firstIndex, secondIndex });
              }
            });
          }

          return {
            firstChoices,
            secondChoices,
            matches,
          };
        });
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
          firstChoices: [
            { id: `first-${newRounds.length}-0`, word: '', image: null },
            { id: `first-${newRounds.length}-1`, word: '', image: null },
            { id: `first-${newRounds.length}-2`, word: '', image: null },
          ],
          secondChoices: [
            { id: `second-${newRounds.length}-0`, word: '', image: null },
            { id: `second-${newRounds.length}-1`, word: '', image: null },
            { id: `second-${newRounds.length}-2`, word: '', image: null },
          ],
          matches: [],
        });
      }
      // Remove extra rounds if needed
      while (newRounds.length > totalRounds) {
        newRounds.pop();
      }
      return newRounds;
    });
  }, [totalRounds, isEditMode, rounds.length]);

  const handleFirstChoiceChange = (roundIndex, choiceIndex, field, value) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex].firstChoices[choiceIndex][field] = value;
      return newRounds;
    });
  };

  const handleSecondChoiceChange = (roundIndex, choiceIndex, field, value) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];
      newRounds[roundIndex].secondChoices[choiceIndex][field] = value;
      return newRounds;
    });
  };

  const handleFileUpload = async (roundIndex, side, choiceIndex, file) => {
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
        if (side === 'first') {
          handleFirstChoiceChange(roundIndex, choiceIndex, 'image', fileUrl);
        } else {
          handleSecondChoiceChange(roundIndex, choiceIndex, 'image', fileUrl);
        }

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

  // Add a new item (only one field)
  const addFirstChoice = (roundIndex) => {
    console.log('addFirstChoice called for round', roundIndex);

    // Add a debounce to prevent double calls
    const now = Date.now();
    if (addFirstChoice.lastCall && now - addFirstChoice.lastCall < 500) {
      console.log('Debouncing addFirstChoice call');
      return;
    }
    addFirstChoice.lastCall = now;

    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];

      // Add a new first choice (only one field)
      const newFirstChoiceIndex = newRounds[roundIndex].firstChoices.length;
      console.log('Adding first choice with index', newFirstChoiceIndex);

      newRounds[roundIndex].firstChoices.push({
        id: `first-${roundIndex}-${newFirstChoiceIndex}`,
        word: '',
        image: null,
      });

      return newRounds;
    });
  };

  // Add a new match (only one field)
  const addSecondChoice = (roundIndex) => {
    console.log('addSecondChoice called for round', roundIndex);

    // Add a debounce to prevent double calls
    const now = Date.now();
    if (addSecondChoice.lastCall && now - addSecondChoice.lastCall < 500) {
      console.log('Debouncing addSecondChoice call');
      return;
    }
    addSecondChoice.lastCall = now;

    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];

      // Add a new second choice (only one field)
      const newSecondChoiceIndex = newRounds[roundIndex].secondChoices.length;
      console.log('Adding second choice with index', newSecondChoiceIndex);

      newRounds[roundIndex].secondChoices.push({
        id: `second-${roundIndex}-${newSecondChoiceIndex}`,
        word: '',
        image: null,
      });

      return newRounds;
    });
  };

  const removeFirstChoice = (roundIndex, choiceIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];

      // Don't allow removing if we're at the minimum required number of choices (2)
      if (newRounds[roundIndex].firstChoices.length <= 2) {
        toast.error('Each round must have at least 2 items');
        return prevRounds;
      }

      // Remove the first choice
      newRounds[roundIndex].firstChoices.splice(choiceIndex, 1);

      // Remove any matches involving this choice
      newRounds[roundIndex].matches = newRounds[roundIndex].matches.filter(
        (match) => match.firstIndex !== choiceIndex
      );

      // Update indices for matches with higher indices
      newRounds[roundIndex].matches = newRounds[roundIndex].matches.map(
        (match) => {
          if (match.firstIndex > choiceIndex) {
            return { ...match, firstIndex: match.firstIndex - 1 };
          }
          return match;
        }
      );

      // If we have more second choices than first choices, remove the last second choice
      if (
        newRounds[roundIndex].secondChoices.length >
        newRounds[roundIndex].firstChoices.length
      ) {
        const lastSecondChoiceIndex =
          newRounds[roundIndex].secondChoices.length - 1;

        // Remove any matches involving this second choice
        newRounds[roundIndex].matches = newRounds[roundIndex].matches.filter(
          (match) => match.secondIndex !== lastSecondChoiceIndex
        );

        // Update indices for matches with higher indices
        newRounds[roundIndex].matches = newRounds[roundIndex].matches.map(
          (match) => {
            if (match.secondIndex > lastSecondChoiceIndex) {
              return { ...match, secondIndex: match.secondIndex - 1 };
            }
            return match;
          }
        );

        // Remove the second choice
        newRounds[roundIndex].secondChoices.splice(lastSecondChoiceIndex, 1);
      }

      return newRounds;
    });
  };

  const removeSecondChoice = (roundIndex, choiceIndex) => {
    setRounds((prevRounds) => {
      const newRounds = [...prevRounds];

      // Don't allow removing if we're at the minimum required number of choices (2)
      if (newRounds[roundIndex].secondChoices.length <= 2) {
        toast.error('Each round must have at least 2 matches');
        return prevRounds;
      }

      // Remove the second choice
      newRounds[roundIndex].secondChoices.splice(choiceIndex, 1);

      // Remove any matches involving this choice
      newRounds[roundIndex].matches = newRounds[roundIndex].matches.filter(
        (match) => match.secondIndex !== choiceIndex
      );

      // Update indices for matches with higher indices
      newRounds[roundIndex].matches = newRounds[roundIndex].matches.map(
        (match) => {
          if (match.secondIndex > choiceIndex) {
            return { ...match, secondIndex: match.secondIndex - 1 };
          }
          return match;
        }
      );

      // If we have more first choices than second choices, remove the last first choice
      if (
        newRounds[roundIndex].firstChoices.length >
        newRounds[roundIndex].secondChoices.length
      ) {
        const lastFirstChoiceIndex =
          newRounds[roundIndex].firstChoices.length - 1;

        // Remove any matches involving this first choice
        newRounds[roundIndex].matches = newRounds[roundIndex].matches.filter(
          (match) => match.firstIndex !== lastFirstChoiceIndex
        );

        // Update indices for matches with higher indices
        newRounds[roundIndex].matches = newRounds[roundIndex].matches.map(
          (match) => {
            if (match.firstIndex > lastFirstChoiceIndex) {
              return { ...match, firstIndex: match.firstIndex - 1 };
            }
            return match;
          }
        );

        // Remove the first choice
        newRounds[roundIndex].firstChoices.splice(lastFirstChoiceIndex, 1);
      }

      return newRounds;
    });
  };

  const toggleMatch = (roundIndex, firstIndex, secondIndex) => {
    // Prevent multiple rapid clicks
    if (isProcessingMatch) return;

    setIsProcessingMatch(true);

    try {
      setRounds((prevRounds) => {
        // Create a deep copy to ensure state updates properly
        const newRounds = JSON.parse(JSON.stringify(prevRounds));

        const matchIndex = newRounds[roundIndex].matches.findIndex(
          (match) =>
            match.firstIndex === firstIndex && match.secondIndex === secondIndex
        );

        if (matchIndex >= 0) {
          // Remove match if it exists
          newRounds[roundIndex].matches.splice(matchIndex, 1);
          console.log('Removed match:', firstIndex, secondIndex);
        } else {
          // First, remove any existing matches for this first choice or second choice
          const beforeLength = newRounds[roundIndex].matches.length;
          newRounds[roundIndex].matches = newRounds[roundIndex].matches.filter(
            (match) =>
              match.firstIndex !== firstIndex &&
              match.secondIndex !== secondIndex
          );
          const afterLength = newRounds[roundIndex].matches.length;

          if (beforeLength !== afterLength) {
            console.log(
              'Removed existing matches for',
              firstIndex,
              'or',
              secondIndex
            );
          }

          // Then add the new match
          newRounds[roundIndex].matches.push({ firstIndex, secondIndex });
          console.log('Added new match:', firstIndex, secondIndex);
        }

        return newRounds;
      });
    } catch (error) {
      console.error('Error toggling match:', error);
    } finally {
      // Allow new clicks after a short delay
      setTimeout(() => {
        setIsProcessingMatch(false);
      }, 100);
    }
  };

  const isMatched = (roundIndex, firstIndex, secondIndex) => {
    return rounds[roundIndex].matches.some(
      (match) =>
        match.firstIndex === firstIndex && match.secondIndex === secondIndex
    );
  };

  const validateRounds = (rounds) => {
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];

      // Check if there are at least 2 choices on each side
      if (round.firstChoices.length < 2 || round.secondChoices.length < 2) {
        toast.error(`Round ${i + 1}: Need at least 2 choices on each side`);
        return false;
      }

      // Check if all first choices have either text or image
      const invalidFirstChoices = round.firstChoices.some(
        (choice) => (!choice.word || choice.word.trim() === '') && !choice.image
      );
      if (invalidFirstChoices) {
        toast.error(
          `Round ${i + 1}: All items must have either text or an image`
        );
        return false;
      }

      // Check if all second choices have either text or image
      const invalidSecondChoices = round.secondChoices.some(
        (choice) => (!choice.word || choice.word.trim() === '') && !choice.image
      );
      if (invalidSecondChoices) {
        toast.error(
          `Round ${i + 1}: All matches must have either text or an image`
        );
        return false;
      }

      // Check if all items have a match
      const firstChoicesWithMatch = new Set(
        round.matches.map((m) => m.firstIndex)
      );
      const secondChoicesWithMatch = new Set(
        round.matches.map((m) => m.secondIndex)
      );

      if (firstChoicesWithMatch.size !== round.firstChoices.length) {
        toast.error(`Round ${i + 1}: All items must be matched with something`);
        return false;
      }

      if (secondChoicesWithMatch.size !== round.secondChoices.length) {
        toast.error(`Round ${i + 1}: All matches must be connected to an item`);
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

      // Process rounds data for API
      const processedRounds = rounds.map((round) => {
        return {
          firstChoices: round.firstChoices.map((choice, index) => ({
            word: choice.word.trim() || null,
            imageUrl: choice.image || null,
            displayOrder: index + 1,
          })),
          secondChoices: round.secondChoices.map((choice, index) => ({
            word: choice.word.trim() || null,
            imageUrl: choice.image || null,
            displayOrder: index + 1,
          })),
          matches: round.matches.map((match) => ({
            firstChoiceIndex: match.firstIndex,
            secondChoiceIndex: match.secondIndex,
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
          `/api/game/games/matching/${gameId}`,
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
          `/api/game/lessons/${lessonId}/games/matching`,
          gameData
        );
        if (response.data.success) {
          toast.success('Matching game created successfully!');
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
                {isEditMode ? 'Edit' : 'Create'} Matching Game
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                {isEditMode
                  ? 'Edit your matching game where students connect related items.'
                  : 'Create a matching game where students connect related items.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                Create matching pairs by adding items on both sides and
                connecting them. You can use text, images, or a combination of
                both.
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

                <Tabs defaultValue="items">
                  <TabsList className="mb-4">
                    <TabsTrigger value="items">Items & Matches</TabsTrigger>
                    <TabsTrigger value="connections">Connections</TabsTrigger>
                  </TabsList>

                  <TabsContent value="items" className="space-y-6">
                    {/* First Choices (Left Side) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Items (Left Side)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addFirstChoice(roundIndex)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {round.firstChoices.map((choice, choiceIndex) => (
                        <div
                          key={choice.id}
                          className="flex items-center gap-2 border p-2 rounded"
                        >
                          <div className="flex-1">
                            <Input
                              value={choice.word}
                              onChange={(e) =>
                                handleFirstChoiceChange(
                                  roundIndex,
                                  choiceIndex,
                                  'word',
                                  e.target.value
                                )
                              }
                              placeholder="Text (optional if image is provided)"
                              className="mb-2"
                            />

                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                id={`first-image-${roundIndex}-${choiceIndex}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) =>
                                  handleFileUpload(
                                    roundIndex,
                                    'first',
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
                                      `first-image-${roundIndex}-${choiceIndex}`
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
                          </div>

                          {round.firstChoices.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeFirstChoice(roundIndex, choiceIndex)
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Second Choices (Right Side) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Matches (Right Side)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSecondChoice(roundIndex)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Match
                        </Button>
                      </div>

                      {round.secondChoices.map((choice, choiceIndex) => (
                        <div
                          key={choice.id}
                          className="flex items-center gap-2 border p-2 rounded"
                        >
                          <div className="flex-1">
                            <Input
                              value={choice.word}
                              onChange={(e) =>
                                handleSecondChoiceChange(
                                  roundIndex,
                                  choiceIndex,
                                  'word',
                                  e.target.value
                                )
                              }
                              placeholder="Text (optional if image is provided)"
                              className="mb-2"
                            />

                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                id={`second-image-${roundIndex}-${choiceIndex}`}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) =>
                                  handleFileUpload(
                                    roundIndex,
                                    'second',
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
                                      `second-image-${roundIndex}-${choiceIndex}`
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
                          </div>

                          {round.secondChoices.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeSecondChoice(roundIndex, choiceIndex)
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="connections">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-4">Create Connections</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Click on cells to create matches between items. Each
                        item must be matched with exactly one match.
                      </p>

                      <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-700">
                        <strong>How to use:</strong> Click on a cell to create a
                        match between an item (row) and a match (column). Each
                        item can only be matched with one match, and vice versa.
                        A checkmark (✓) indicates a match.
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="p-2 border bg-gray-100"></th>
                              {round.secondChoices.map(
                                (choice, secondIndex) => (
                                  <th
                                    key={choice.id}
                                    className="p-2 border bg-gray-100 text-sm"
                                  >
                                    <div className="font-medium">
                                      {secondIndex + 1}.
                                    </div>
                                    <div className="text-xs truncate max-w-[100px]">
                                      {choice.word ||
                                        (choice.image
                                          ? 'Image'
                                          : `Match ${secondIndex + 1}`)}
                                    </div>
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {round.firstChoices.map((choice, firstIndex) => (
                              <tr key={choice.id}>
                                <td className="p-2 border bg-gray-100 text-sm font-medium">
                                  <div className="font-medium">
                                    {firstIndex + 1}.
                                  </div>
                                  <div className="text-xs truncate max-w-[100px]">
                                    {choice.word ||
                                      (choice.image
                                        ? 'Image'
                                        : `Item ${firstIndex + 1}`)}
                                  </div>
                                </td>
                                {round.secondChoices.map(
                                  (secondChoice, secondIndex) => {
                                    const matched = isMatched(
                                      roundIndex,
                                      firstIndex,
                                      secondIndex
                                    );
                                    const hasOtherMatch = round.matches.some(
                                      (m) =>
                                        (m.firstIndex === firstIndex &&
                                          m.secondIndex !== secondIndex) ||
                                        (m.firstIndex !== firstIndex &&
                                          m.secondIndex === secondIndex)
                                    );

                                    return (
                                      <td
                                        key={secondChoice.id}
                                        className={`p-2 border text-center cursor-pointer transition-all duration-200 ${
                                          matched
                                            ? 'bg-green-100 border-green-400 hover:bg-green-200'
                                            : hasOtherMatch
                                            ? 'bg-gray-100 text-gray-400'
                                            : 'hover:bg-blue-50'
                                        }`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleMatch(
                                            roundIndex,
                                            firstIndex,
                                            secondIndex
                                          );
                                        }}
                                      >
                                        {matched ? (
                                          <span className="text-green-600 text-lg">
                                            ✓
                                          </span>
                                        ) : hasOtherMatch ? (
                                          ''
                                        ) : (
                                          <span className="text-gray-300 hover:text-blue-400">
                                            ○
                                          </span>
                                        )}
                                      </td>
                                    );
                                  }
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 p-3 border rounded-md bg-white">
                        <h5 className="font-medium mb-2">Current Matches:</h5>
                        <ul className="space-y-1 text-sm">
                          {round.matches.length > 0 ? (
                            round.matches.map((match, idx) => {
                              const firstChoice =
                                round.firstChoices[match.firstIndex];
                              const secondChoice =
                                round.secondChoices[match.secondIndex];
                              return (
                                <li
                                  key={idx}
                                  className="flex items-center gap-2"
                                >
                                  <span className="font-medium">
                                    {match.firstIndex + 1}.
                                  </span>
                                  <span className="text-gray-700">
                                    {firstChoice?.word || 'Image'}
                                  </span>
                                  <span className="text-gray-400 mx-2">→</span>
                                  <span className="font-medium">
                                    {match.secondIndex + 1}.
                                  </span>
                                  <span className="text-gray-700">
                                    {secondChoice?.word || 'Image'}
                                  </span>
                                </li>
                              );
                            })
                          ) : (
                            <li className="text-gray-500">
                              No matches created yet
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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

export default MatchingGameSettings;
