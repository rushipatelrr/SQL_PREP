import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CoursePage } from '@/pages/CoursePage';
import { LevelReviewPage } from '@/pages/LevelReviewPage';
import { PracticePage } from '@/pages/PracticePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useThemeAccountSync } from '@/hooks/useProgress';

export function App() {
  useThemeAccountSync();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/learn" element={<CoursePage />} />
        <Route path="/levels/:levelId/review" element={<LevelReviewPage />} />
        <Route path="/levels/:levelId/practice" element={<PracticePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
