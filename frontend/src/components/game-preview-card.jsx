import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Gamepad2,
  Clock,
  ArrowRight,
  Blocks,
  LayoutList,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const GAME_TYPE_INFO = {
  'drag-drop': {
    title: 'Drag & Drop Game',
    description:
      'Test your knowledge by dragging the correct words into sentence blanks. Perfect for vocabulary and grammar practice.',
    icon: Blocks,
    previewText: 'Fill in the blanks by dragging the correct words',
    color: 'from-blue-500 to-indigo-600',
    stats: (game) => ({
      rounds: `${game.total_rounds} Rounds`,
      questions: 'Word Matching',
    }),
  },
  matching: {
    title: 'Matching Game',
    description:
      'Match related pairs of words or phrases. Great for vocabulary and concept association.',
    icon: ArrowRight,
    previewText: 'Connect matching pairs',
    color: 'from-emerald-500 to-teal-600',
    stats: (game) => ({
      rounds: `${game.total_rounds} Pairs`,
      questions: 'Word Pairs',
    }),
  },
  'multiple-choice': {
    title: 'Multiple Choice Quiz',
    description:
      'Test knowledge with quiz-style questions. Select the correct answer from multiple options.',
    icon: LayoutList,
    previewText: 'Choose the correct answer',
    color: 'from-purple-500 to-pink-600',
    stats: (game) => ({
      rounds: `${game.total_rounds} Questions`,
      questions: 'Quiz Questions',
    }),
  },
  // Add more game types here
};

const GamePreviewCard = ({ game, onPlay, onEdit, onDelete }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const gameInfo =
    GAME_TYPE_INFO[game.game_type] || GAME_TYPE_INFO['drag-drop'];
  const GameIcon = gameInfo.icon;

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete(game);
  };

  return (
    <>
      <Card className="group relative overflow-hidden rounded-xl border-0 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Game Info */}
          <div className="md:w-1/3 p-3 md:pl-6">
            <div
              className={`relative bg-gradient-to-br ${gameInfo.color} p-6 md:min-h-[300px] rounded-xl w-full h-full`}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-4 gap-4 p-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white/20 rounded-lg h-8" />
                  ))}
                </div>
              </div>
              <div className="relative flex flex-col items-center text-center h-full justify-center gap-6">
                <div className="p-4 bg-white/10 rounded-lg">
                  <GameIcon className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {gameInfo.title}
                  </h3>
                  <p className="text-md text-white/90">
                    {gameInfo.previewText}
                  </p>
                </div>
                <div className="mt-4 w-full max-w-[200px] space-y-2">
                  <Button
                    onClick={() => onPlay(game)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:text-white w-full"
                  >
                    <Gamepad2 className="mr-2 h-4 w-4" /> Play Game
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit(game)}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white flex-1"
                      size="sm"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white flex-1"
                      size="sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Game Preview */}
          <div className="p-6 md:w-2/3">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                {gameInfo.title}
              </h4>
              <p className="text-sm text-slate-600">{gameInfo.description}</p>
            </div>

            {/* Game Stats */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Created {new Date(game.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                {gameInfo.stats(game).rounds}
              </div>
              <div className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                {gameInfo.stats(game).questions}
              </div>
            </div>

            {/* Preview of first round */}
            {game.rounds && game.rounds.length > 0 && (
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-4">
                  Preview of Round 1
                </p>

                {game.game_type === 'drag-drop' && (
                  <div className="space-y-4">
                    <p className="text-base text-slate-700 font-medium">
                      {game.rounds[0].question_text.replace('___', '________')}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {game.rounds[0].choices
                        .slice(0, 3)
                        .map((choice, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white text-sm font-medium text-slate-600 rounded-full border border-slate-200"
                          >
                            {choice.word}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {game.game_type === 'matching' && (
                  <div className="flex justify-between">
                    <div className="w-1/2 pr-4">
                      <p className="text-sm text-slate-700 font-medium mb-2">
                        Items:
                      </p>
                      <div className="space-y-2">
                        {game.rounds[0].first_choices
                          .slice(0, 2)
                          .map((choice, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 bg-white text-sm font-medium text-slate-600 rounded border border-slate-200"
                            >
                              {choice.word || (choice.image_url ? 'Image' : '')}
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="w-1/2 pl-4">
                      <p className="text-sm text-slate-700 font-medium mb-2">
                        Matches:
                      </p>
                      <div className="space-y-2">
                        {game.rounds[0].second_choices
                          .slice(0, 2)
                          .map((choice, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 bg-white text-sm font-medium text-slate-600 rounded border border-slate-200"
                            >
                              {choice.word || (choice.image_url ? 'Image' : '')}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {game.game_type === 'multiple-choice' && (
                  <div className="space-y-4">
                    <p className="text-base text-slate-700 font-medium">
                      {game.rounds[0].question}
                    </p>
                    <div className="space-y-2">
                      {game.rounds[0].choices
                        .slice(0, 3)
                        .map((choice, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 text-sm font-medium rounded border bg-white text-slate-600 border-slate-200"
                          >
                            {String.fromCharCode(65 + index)}.{' '}
                            {choice.choice_text}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Game
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {gameInfo.title}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GamePreviewCard;
