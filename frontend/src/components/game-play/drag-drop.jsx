import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Clock, CalendarDays, Play } from 'lucide-react';

const DragDropGame = ({ game }) => {
  const navigate = useNavigate();
  const { quarterId, lessonId } = useParams();

  const handlePlayClick = () => {
    navigate(`/quarter/${quarterId}/lesson/${lessonId}/game/${game.id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-600" />
            <span className="capitalize">{game.game_type}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-indigo-600 hover:text-indigo-700"
            onClick={handlePlayClick}
          >
            <Play className="w-4 h-4 mr-1" />
            Play Game
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span>{game.total_rounds} Rounds</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <CalendarDays className="w-4 h-4 mr-2" />
            <span>
              Created {new Date(game.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DragDropGame;
