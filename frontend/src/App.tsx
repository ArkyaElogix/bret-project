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
      <Route path ="/admin/login" element={<AdminLoginPage />} />
      <Route path="/" element={<Navigate to="/forms" replace />} />
    </Routes>
  )
}