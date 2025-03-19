import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DragAndDrop from './Syllables';

const FirstQuarter = () => {
  const { quarter, lesson } = useParams();
  const [gameStarted, setGameStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activitiesCompleted, setActivitiesCompleted] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // Start timer when game starts
  const startGame = () => {
    setGameStarted(true);
    // Start tracking time
    const startTime = Date.now();

    // Update time spent every minute
    const timeInterval = setInterval(() => {
      const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
      setTimeSpent(elapsedMinutes);
    }, 60000);

    // Clean up interval when component unmounts
    return () => clearInterval(timeInterval);
  };

  // Handle game completion
  const handleGameComplete = () => {
    setGameStarted(false);
    setActivitiesCompleted(1);
    setProgress(25); // Assuming this is the first of 4 activities (25%)
  };

  return (
    <div className="max-w-5xl mx-auto">
      {gameStarted ? (
        // Show the DragAndDrop game component when game is started
        <div className="h-[70vh]">
          <DragAndDrop onComplete={handleGameComplete} />
        </div>
      ) : (
        // Show the intro screen when game is not started
        <>
          {/* Game content preview */}
          <Card className="mb-8 border border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Syllable Drop Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-accent/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎮</div>
                  <h2 className="text-2xl font-medium mb-2">
                    Word Syllables - Drag & Drop
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Learn about syllables in words by completing our interactive
                    drag and drop activity. Match words with the correct number
                    of syllables!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Game Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc pl-5">
                  <li>Identify words based on their syllable count</li>
                  <li>Drag the correct word to the boxes at the bottom</li>
                  <li>Complete all 3 rounds to finish the activity</li>
                  <li>Each round will have a different syllable count</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Lesson completion</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full">
                      <div
                        className="h-2 bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Activities completed: {activitiesCompleted}/4</span>
                    <span>Time spent: {timeSpent} mins</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button size="lg" className="px-8" onClick={startGame}>
              Start Activity 1
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default FirstQuarter;
