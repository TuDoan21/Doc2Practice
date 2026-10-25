import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/layouts/PublicLayout';
import { AppLayout } from './components/layouts/AppLayout';
import { AuthLayout } from './components/layouts/AuthLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
import { SchoolsManagementPage } from './pages/SchoolsManagementPage';
import { SubjectsManagementPage } from './pages/SubjectsManagementPage';
import { SchoolAdminPage } from './pages/SchoolAdminPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { AIGenerateQuizPage } from './pages/AIGenerateQuizPage';
import { TakeAssessmentPage } from './pages/TakeAssessmentPage';
import { AssessmentResultPage } from './pages/AssessmentResultPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

import { initStorage } from './services/storage';
import { runAuthMigrations } from './services/migration';

function App() {
  // Khởi tạo storage dữ liệu mẫu & chạy migration xác thực bảo mật
  useEffect(() => {
    initStorage();
    runAuthMigrations().catch(console.error);
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Learning Platform App (Protected by Session & RBAC) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="create-quiz" element={<CreateQuizPage />} />
          <Route path="quiz/:id" element={<QuizPlayerPage />} />
          <Route path="quiz-sets" element={<QuizSetsPage />} />
          <Route path="flashcards" element={<FlashcardPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="classes" element={<ClassroomsPage />} />
          <Route path="assessment/:id/take" element={<TakeAssessmentPage />} />
          <Route path="assessment/:id/result" element={<AssessmentResultPage />} />
          <Route path="attempt/:id/result" element={<AssessmentResultPage />} />
          <Route path="question-bank" element={<QuestionBankPage />} />
          <Route path="ai-generate" element={<AIGenerateQuizPage />} />
          <Route path="schools" element={<SchoolsManagementPage />} />
          <Route path="subjects" element={<SubjectsManagementPage />} />
          <Route path="school-admin" element={<SchoolAdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
