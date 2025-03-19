import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Substitute from './Substitute';

const Lesson2 = () => {
  const { quarter, lesson } = useParams();
  const [gameStarted, setGameStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activitiesCompleted, setActivitiesCompleted] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // Start timer when game starts
  const startGame = () => {
    setGameStarted(true);
    const startTime = Date.now();

    const timeInterval = setInterval(() => {
      const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
      setTimeSpent(elapsedMinutes);
    }, 60000);

    return () => clearInterval(timeInterval);
  };

  // Handle game completion
  const handleGameComplete = () => {
    setGameStarted(false);
    setActivitiesCompleted(1);
    setProgress(25); // First of 4 activities (25%)
  };

  return (
    <div className="max-w-5xl mx-auto">
      {gameStarted ? (
        <div className="h-[70vh]">
          <Substitute onComplete={handleGameComplete} />
        </div>
      ) : (
        <>
          <Card className="mb-8 border border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Word Substitution Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-accent/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h2 className="text-2xl font-medium mb-2">
                    Letter Swap Challenge
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Replace letters to create new words! Drag the correct letter
                    to form meaningful words in this interactive challenge.
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
                  <li>Look at the word in the boxes</li>
                  <li>Choose one letter from the options below</li>
                  <li>Drag it to the highlighted box to form a new word</li>
                  <li>Complete all 3 rounds with different word lengths</li>
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
              Start Activity 2
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Lesson2;
