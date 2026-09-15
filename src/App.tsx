import { lazy, Suspense } from 'react';
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
  qualityLabRoute,
  fileSizeLabRoute,
  storageSectionRoute,
  memorySizeLabRoute,
} from '@/src/data/syllabus';
import { TextStudioPage } from '@/src/pages/TextStudioPage';
import { SoundStudioPage } from '@/src/pages/SoundStudioPage';
import { Utf16KeyboardPage } from '@/src/pages/Utf16KeyboardPage';

import { SoundJourneyPage } from '@/src/pages/SoundJourneyPage';
import { ImageJourneyPage } from '@/src/pages/ImageJourneyPage';
import { NumberSystemsPage } from '@/src/pages/NumberSystemsPage';
import { StorageSectionPage } from '@/src/pages/StorageSectionPage';
import { HexApplicationsPage } from '@/src/pages/HexApplicationsPage';
import { HexAdvantagesPage } from '@/src/pages/HexAdvantagesPage';
const QualityLabPage = lazy(() =>
  import('@/src/pages/QualityLabPage').then((module) => ({
    default: module.QualityLabPage,
  })),
);
const FileSizeLabPage = lazy(() =>
  import('@/src/pages/FileSizeLabPage').then((module) => ({
    default: module.FileSizeLabPage,
  })),
);
const MemorySizeLabPage = lazy(() =>
  import('@/src/pages/MemorySizeLabPage').then((module) => ({
    default: module.MemorySizeLabPage,
  })),
);

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path={sectionRoute} element={<SectionPage />} />
        <Route path={storageSectionRoute} element={<StorageSectionPage />} />
        <Route
          path={memorySizeLabRoute}
          element={
            <Suspense
              fallback={
                <output className="page-wrap block">
                  Opening Memory Size Lab…
                </output>
              }
            >
              <MemorySizeLabPage />
            </Suspense>
          }
        />
        <Route
          path={qualityLabRoute}
          element={
            <Suspense
              fallback={
                <output className="page-wrap block">
                  Opening Quality Lab…
                </output>
              }
            >
              <QualityLabPage />
            </Suspense>
          }
        />
        <Route
          path={fileSizeLabRoute}
          element={
            <Suspense
              fallback={
                <output className="page-wrap block">
                  Opening File Size Lab…
                </output>
              }
            >
              <FileSizeLabPage />
            </Suspense>
          }
        />
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
