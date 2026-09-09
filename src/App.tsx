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
  soundJourneyRoute,
  imageJourneyRoute,
  utf16KeyboardRoute,
  numberSectionRoute,
  hexApplicationsRoute,
  hexAdvantagesRoute,
} from '@/src/data/syllabus';
import { TextStudioPage } from '@/src/pages/TextStudioPage';
import { SoundStudioPage } from '@/src/pages/SoundStudioPage';
import { Utf16KeyboardPage } from '@/src/pages/Utf16KeyboardPage';

import { SoundJourneyPage } from '@/src/pages/SoundJourneyPage';
import { ImageJourneyPage } from '@/src/pages/ImageJourneyPage';
import { NumberSystemsPage } from '@/src/pages/NumberSystemsPage';
import { HexApplicationsPage } from '@/src/pages/HexApplicationsPage';
import { HexAdvantagesPage } from '@/src/pages/HexAdvantagesPage';

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path={sectionRoute} element={<SectionPage />} />
        <Route path={numberSectionRoute} element={<NumberSystemsPage />} />
        <Route path={hexApplicationsRoute} element={<HexApplicationsPage />} />
        <Route path={hexAdvantagesRoute} element={<HexAdvantagesPage />} />
        <Route path={simulatorRoute} element={<SimulatorPage />} />
        <Route path={textStudioRoute} element={<TextStudioPage />} />
        <Route path={soundJourneyRoute} element={<SoundJourneyPage />} />
        <Route path={imageJourneyRoute} element={<ImageJourneyPage />} />
        <Route path={soundStudioRoute} element={<SoundStudioPage />} />
        <Route path={utf16KeyboardRoute} element={<Utf16KeyboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
