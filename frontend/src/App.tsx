import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import FormsPage from './pages/FormsPage'
import { AdminRoute, UserRoute } from './components/ProtectedRoute'
import FormDetailsPage from './pages/FormDetailsPage'
import QuestionsPage from './pages/QuestionsPage'
import UsersPage from './pages/UsersPage'
import SessionsPage from './pages/SessionsPage'
import SessionResultsPage from './pages/SessionResultsPage'
import PortalFormsPage from './pages/PortalFormsPage'
import PortalProfilePage from './pages/PortalProfilePage'
import PortalAssessmentPage from './pages/PortalAssessmentPage'
import PortalResultsPage from './pages/PortalResultsPage'
import { SessionReportPage } from './pages/SessionReportPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DuplicatesQueuePage from './pages/DuplicatesQueuePage'


try {
  localStorage.removeItem('bret_token')
  sessionStorage.removeItem('bret_token')
} catch { }
export default function App() {
  return (
    <Routes>
      {/* Admin portal */}

      <Route
        path="/users"
        element={
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <AdminRoute>
            <SessionsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/sessions/:id/results"
        element={
          <AdminRoute>
            <SessionResultsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/forms"
        element={
          <AdminRoute>
            <FormsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/forms/:id"
        element={
          <AdminRoute>
            <FormDetailsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/forms/:id/edit"
        element={
          <AdminRoute>
            <QuestionsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/duplicates"
        element={
          <AdminRoute>
            <DuplicatesQueuePage />
          </AdminRoute>
        }
      />
      {/* Candidate portal */}
      <Route
        path="/portal"
        element={
          <UserRoute>
            <PortalFormsPage />
          </UserRoute>
        }
      />
      <Route
        path="/portal/profile"
        element={
          <UserRoute>
            <PortalProfilePage />
          </UserRoute>
        }
      />
      <Route path="/sessions/:id/report" element={<SessionReportPage />} />
      <Route
        path="/portal/sessions/:id"
        element={
          <UserRoute>
            <PortalAssessmentPage />
          </UserRoute>
        }
      />
      <Route
        path="/portal/sessions/:id/results"
        element={
          <UserRoute>
            <PortalResultsPage />
          </UserRoute>
        }
      />


      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/" element={<Navigate to="/forms" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  )
}