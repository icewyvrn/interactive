import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Quarter from './pages/Quarter';
import Lessons from './components/lessons';
import LessonDetails from './pages/Lesson';
import { Toaster } from 'sonner';
import DragDropGamePlay from './components/screen-play/drag-drop';
import MatchingGamePlay from './components/screen-play/matching-game';
import MultipleChoiceGamePlay from './components/screen-play/multiple-choice';

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/quarter" element={<Quarter />} />
        <Route path="/quarter/:quarterId" element={<Lessons />} />
        <Route
          path="/quarter/:quarterId/lesson/:lessonId"
          element={<LessonDetails />}
        />
        <Route
          path="/quarter/:quarterId/lesson/:lessonId/game/drag-drop/:gameId"
          element={<DragDropGamePlay />}
        />
        <Route
          path="/quarter/:quarterId/lesson/:lessonId/game/matching/:gameId"
          element={<MatchingGamePlay />}
        />
        <Route
          path="/quarter/:quarterId/lesson/:lessonId/game/multiple-choice/:gameId"
          element={<MultipleChoiceGamePlay />}
        />
      </Routes>
    </>
  );
}

export default App;
