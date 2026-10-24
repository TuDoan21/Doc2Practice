import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/layouts/PublicLayout';
import { AppLayout } from './components/layouts/AppLayout';
import { AuthLayout } from './components/layouts/AuthLayout';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateQuizPage } from './pages/CreateQuizPage';
import { QuizPlayerPage } from './pages/QuizPlayerPage';
import { QuizSetsPage } from './pages/QuizSetsPage';
import { FlashcardPage } from './pages/FlashcardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClassroomsPage } from './pages/ClassroomsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { initStorage } from './services/storage';

function App() {
  // Khởi tạo storage dữ liệu mẫu khi app load
  useEffect(() => {
    initStorage();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Authentication Pages */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Learning Platform App */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="create-quiz" element={<CreateQuizPage />} />
          <Route path="quiz/:id" element={<QuizPlayerPage />} />
          <Route path="quiz-sets" element={<QuizSetsPage />} />
          <Route path="flashcards" element={<FlashcardPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="classes" element={<ClassroomsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
