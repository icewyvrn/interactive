import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

// Helper function to get ordinal suffix (1st, 2nd, 3rd, 4th)
const getOrdinalSuffix = (number) => {
  if (number === 1) return 'st';
  if (number === 2) return 'nd';
  if (number === 3) return 'rd';
  return 'th';
};

// Quarter Selection Component
export const QuarterSelector = ({ onQuarterSelect }) => {
  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-semibold text-white mb-2">
          Select Quarter
        </h1>
        <div className="h-1 w-24 bg-primary mx-auto"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
        {[1, 2, 3, 4].map((quarter) => (
          <Card
            key={quarter}
            className="border border-border hover:border-primary hover:shadow-lg transition-all cursor-pointer"
            onClick={() => onQuarterSelect(quarter)}
          >
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xl font-medium">
                {quarter}
                {getOrdinalSuffix(quarter)} Quarter
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-2xl font-semibold text-secondary-foreground">
                    {quarter}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Quarter {quarter} curriculum and materials
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>View Content</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Lesson Selection Component
export const LessonSelector = ({ selectedQuarter, onBack }) => {
  const navigate = useNavigate();

  const handleStartLesson = (lesson) => {
    navigate(`/lesson/${selectedQuarter}/${lesson}`);
  };

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-10 max-w-4xl mx-auto w-full">
        <Button
          variant="outline"
          onClick={onBack}
          size="sm"
          className="mb-4 sm:mb-0 text-white"
        >
          ← Back
        </Button>
        <div className="text-center flex-grow">
          <h1 className="text-3xl font-semibold text-white px-4">
            {selectedQuarter}
            {getOrdinalSuffix(selectedQuarter)} Quarter Lessons
          </h1>
          <div className="h-1 w-24 bg-primary mx-auto mt-2"></div>
        </div>
        <div className="w-16 hidden sm:block"></div>{' '}
        {/* Spacer for alignment */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
        {[1, 2, 3, 4].map((lesson) => (
          <Card
            key={lesson}
            className="border border-border hover:border-accent hover:shadow-lg transition-all cursor-pointer"
          >
            <CardHeader className="pb-2 border-b border-border flex justify-between items-center">
              <CardTitle className="text-xl font-medium">
                Lesson {lesson}
              </CardTitle>
              <span className="px-2 py-1 bg-accent/20 text-accent-foreground text-sm rounded-full">
                45 min
              </span>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-xl font-semibold text-accent-foreground">
                    {lesson}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Lesson {lesson} materials and activities
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-secondary/20">
              <span className="text-sm text-muted-foreground">
                4 activities
              </span>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90 font-medium transition-all px-6"
                onClick={() => handleStartLesson(lesson)}
              >
                Start Lesson
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
