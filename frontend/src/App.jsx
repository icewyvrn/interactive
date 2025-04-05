import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Quarter from './pages/Quarter';
import Lessons from './components/lessons';
import LessonDetails from './pages/Lesson';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/quarter" element={<Quarter />} />
        <Route path="/quarter/:quarterId" element={<Lessons />} />
        <Route
          path="/quarter/:quarterId/lesson/:lessonId"
          element={<LessonDetails />}
        />
      </Routes>
    </>
  );
}

export default App;
