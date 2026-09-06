import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/src/components/AppShell';
import { HomePage } from '@/src/pages/HomePage';
import { SectionPage } from '@/src/pages/SectionPage';
import { SimulatorPage } from '@/src/pages/SimulatorPage';
import {
  sectionRoute,
  simulatorRoute,
  textStudioRoute,
  soundStudioRoute,
  utf16KeyboardRoute,
} from '@/src/data/syllabus';
import { TextStudioPage } from '@/src/pages/TextStudioPage';
import { SoundStudioPage } from '@/src/pages/SoundStudioPage';
import { Utf16KeyboardPage } from '@/src/pages/Utf16KeyboardPage';

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path={sectionRoute} element={<SectionPage />} />
        <Route path={simulatorRoute} element={<SimulatorPage />} />
        <Route path={textStudioRoute} element={<TextStudioPage />} />
        <Route path={soundStudioRoute} element={<SoundStudioPage />} />
        <Route path={utf16KeyboardRoute} element={<Utf16KeyboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
