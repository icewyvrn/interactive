import { Route, Routes } from 'react-router-dom';
import QuarterLessons from './pages/quarter-lessons';
import Game from './pages/Game';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<QuarterLessons />} />
        <Route path="/lesson/:quarter/:lesson" element={<Game />} />
      </Routes>
    </>
  );
}

export default App;
