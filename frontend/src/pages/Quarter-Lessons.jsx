import { useState } from 'react';
import {
  LessonSelector,
  QuarterSelector,
} from '../components/teacher/Quarter-Lesson';

// Main App Component
const QuarterLessons = () => {
  const [selectedQuarter, setSelectedQuarter] = useState(null);

  const handleSelectQuarter = (quarter) => {
    setSelectedQuarter(quarter);
  };

  const handleBack = () => {
    setSelectedQuarter(null);
  };

  return (
    <div className="min-h-svh bg-background py-8 dark font-sans">
      {selectedQuarter === null ? (
        <QuarterSelector onQuarterSelect={handleSelectQuarter} />
      ) : (
        <LessonSelector selectedQuarter={selectedQuarter} onBack={handleBack} />
      )}
    </div>
  );
};

export default QuarterLessons;
