import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SquareMousePointer, ArrowRightLeft, LayoutList } from 'lucide-react';
import DragDropSettings from './game-settings/drag-drop';
import MatchingGameSettings from './game-settings/matching-game';
import MultipleChoiceSettings from './game-settings/multiple-choice';

const GameSelectionDialog = ({ isOpen, onClose, onSelectGame }) => {
  const [showDragDropSettings, setShowDragDropSettings] = useState(false);
  const [showMatchingSettings, setShowMatchingSettings] = useState(false);
  const [showMultipleChoiceSettings, setShowMultipleChoiceSettings] =
    useState(false);
  const [showGameSelect, setShowGameSelect] = useState(true);

  const games = [
    {
      id: 'drag-and-drop',
      title: 'Drag and Drop',
      description:
        'Create interactive exercises where students drag words or phrases to complete sentences.',
      icon: SquareMousePointer,
    },
    {
      id: 'matching',
      title: 'Matching',
      description:
        'Design matching games where students pair related items together.',
      icon: ArrowRightLeft,
    },
    {
      id: 'multiple-choice',
      title: 'Multiple Choice',
      description: 'Build quiz-style questions with multiple answer choices.',
      icon: LayoutList,
    },
  ];

  const handleGameSelect = (gameId) => {
    setShowGameSelect(false);

    if (gameId === 'drag-and-drop') {
      setShowDragDropSettings(true);
    } else if (gameId === 'matching') {
      setShowMatchingSettings(true);
    } else if (gameId === 'multiple-choice') {
      setShowMultipleChoiceSettings(true);
    } else {
      onSelectGame(gameId);
      onClose();
    }
  };

  const handleBackToGameSelect = () => {
    setShowDragDropSettings(false);
    setShowMatchingSettings(false);
    setShowMultipleChoiceSettings(false);
    setShowGameSelect(true);
  };

  const handleDragDropSubmit = (settings) => {
    onSelectGame('drag-and-drop', settings);
    setShowDragDropSettings(false);
    onClose();
  };

  const handleMatchingSubmit = (settings) => {
    onSelectGame('matching', settings);
    setShowMatchingSettings(false);
    onClose();
  };

  const handleMultipleChoiceSubmit = (settings) => {
    onSelectGame('multiple-choice', settings);
    setShowMultipleChoiceSettings(false);
    onClose();
  };

  return (
    <Dialog open={isOpen && showGameSelect} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] sm:min-h-[400px]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-bold mb-1">
            Select a Game Type
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Choose the type of game you want to create for this lesson. Each
            game type offers different learning interactions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="flex-1 p-6 border-1 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-600 hover:shadow-md transition-all duration-200 group"
              onClick={() => handleGameSelect(game.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                  {React.createElement(game.icon, {
                    className: 'w-7 h-7 text-indigo-600',
                  })}
                </div>
                <h3 className="text-xl font-semibold group-hover:text-indigo-600 transition-colors">
                  {game.title}
                </h3>
              </div>
              <p className="text-gray-500 text-sm">{game.description}</p>
            </div>
          ))}
        </div>
      </DialogContent>

      {/* Drag and Drop settings*/}
      <DragDropSettings
        isOpen={isOpen && showDragDropSettings}
        onClose={onClose}
        onBack={handleBackToGameSelect}
        onSubmit={handleDragDropSubmit}
      />

      {/* Matching Game settings*/}
      <MatchingGameSettings
        isOpen={isOpen && showMatchingSettings}
        onClose={onClose}
        onBack={handleBackToGameSelect}
        onSubmit={handleMatchingSubmit}
      />

      {/* Multiple Choice settings*/}
      <MultipleChoiceSettings
        isOpen={isOpen && showMultipleChoiceSettings}
        onClose={onClose}
        onBack={handleBackToGameSelect}
        onSubmit={handleMultipleChoiceSubmit}
      />
    </Dialog>
  );
};

export default GameSelectionDialog;
