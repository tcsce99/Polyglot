import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from '../core/store';
import { Tutor } from '../features/conversation/Tutor';
import { ExamHub, ExamRun } from '../features/exam/ExamPages';
import { Learn } from '../features/lessons/Learn';
import { UnitPage } from '../features/lessons/UnitPage';
import { Home } from '../features/onboarding/Home';
import { Placement } from '../features/onboarding/Placement';
import { ReadHub, ReadUnit } from '../features/reading/Read';
import { RunPage } from '../features/review/RunPage';
import { CreditsPage, Settings } from './Settings';

// The dashboard pulls in the charting library, so it loads on demand (and is precached for offline use).
const Progress = lazy(() => import('../features/progress/Progress').then((m) => ({ default: m.Progress })));

export function App() {
  const fontScale = useStore((s) => s.fontScale);
  useEffect(() => { document.documentElement.style.setProperty('--scale', String(fontScale)); }, [fontScale]);
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/:lang" element={<Learn />} />
        <Route path="/:lang/unit/:unitId" element={<UnitPage />} />
        <Route path="/:lang/run/:mode" element={<RunPage />} />
        <Route path="/:lang/placement" element={<Placement />} />
        <Route path="/:lang/exam" element={<ExamHub />} />
        <Route path="/:lang/exam/:level" element={<ExamRun />} />
        <Route path="/:lang/read" element={<ReadHub />} />
        <Route path="/:lang/read/:unitId" element={<ReadUnit />} />
        <Route path="/:lang/tutor" element={<Tutor />} />
        <Route path="/:lang/progress" element={<Suspense fallback={null}><Progress /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
