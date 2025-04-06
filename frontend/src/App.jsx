import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Quarter from './pages/Quarter';
import Lessons from './components/lessons';
import LessonDetails from './pages/Lesson';
import { Toaster } from 'sonner';
import GamePlay from './components/screen-play/drag-drop';

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/quarter" element={<Quarter />} />
        <Route path="/quarter/:quarterId" element={<Lessons />} />
        <Route
          path="/quarter/:quarterId/lesson/:lessonId"
          element={<LessonDetails />}
        />
        <Route
          path="/quarter/:quarterId/lesson/:lessonId/game/:gameId"
          element={<GamePlay />}
        />
      </Routes>
    </>
  );
}

export default App;
