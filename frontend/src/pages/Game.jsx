import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FirstQuarterLesson1 from '../components/First-Quarter-Game/Lesson-1';
import FirstQuarterLesson2 from '../components/First-Quarter-Game/Lesson-2';

// Game components for different quarters and lessons
const QUARTER_LESSONS = {
  1: {
    1: FirstQuarterLesson1,
    2: FirstQuarterLesson2,
    // 3: FirstQuarterLesson3,
    // 4: FirstQuarterLesson4,
  },
  // Template for other quarters
  // 2: {
  //   1: SecondQuarterLesson1,
  //   2: SecondQuarterLesson2,
  //   // ... other lessons
  // },
};

const Game = () => {
  const { quarter, lesson } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const currentQuarter = parseInt(quarter);
  const currentLesson = parseInt(lesson);

  // Simulate loading content
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  // Get ordinal suffix for quarter
  const getOrdinalSuffix = (number) => {
    const num = parseInt(number);
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  };

  // Get the appropriate game component
  const GameComponent = QUARTER_LESSONS[currentQuarter]?.[currentLesson];

  return (
    <div className="bg-background text-foreground min-h-screen py-8 px-4 dark">
      <div className="flex items-center mb-8 max-w-5xl mx-auto">
        <Button variant="outline" onClick={handleBack} className="mr-4">
          ← Back to Lessons
        </Button>
        <h1 className="text-2xl font-semibold">
          {quarter}
          {getOrdinalSuffix(quarter)} Quarter - Lesson {lesson}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-pulse text-xl">Loading content...</div>
        </div>
      ) : GameComponent ? (
        <GameComponent />
      ) : (
        // Coming Soon for unavailable content
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center h-[60vh]">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle className="text-3xl">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8">
                <div className="text-6xl mb-6">🚧</div>
                <p className="text-xl mb-2">
                  Quarter {quarter} - Lesson {lesson} content is currently under
                  development
                </p>
                <p className="text-muted-foreground">
                  We're working hard to bring you exciting new content for this
                  lesson. Please check back later!
                </p>
              </div>
            </CardContent>
            <div className="pb-6">
              <Button variant="outline" onClick={handleBack} size="lg">
                Return to Quarter Selection
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Game;
