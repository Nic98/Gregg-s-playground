import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/src/components/AppShell';
import { HomePage } from '@/src/pages/HomePage';
import { SectionPage } from '@/src/pages/SectionPage';
import { SimulatorPage } from '@/src/pages/SimulatorPage';
import { sectionRoute, simulatorRoute } from '@/src/data/syllabus';

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path={sectionRoute} element={<SectionPage />} />
        <Route path={simulatorRoute} element={<SimulatorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
