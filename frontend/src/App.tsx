import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import FormsPage from './pages/FormsPage'
import ProtectedRoute from './components/ProtectedRoute'
import FormDetailsPage from './pages/FormDetailsPage'
import QuestionsPage from './pages/QuestionsPage'
import BehaviouralFactorsPage from './pages/BehavioralFactorsPage'
import UsersPage from './pages/UsersPage'
import SessionsPage from './pages/SessionsPage'
import SessionResultsPage from './pages/SessionResultsPage'

export default function App() {
  return (
    <Routes>
      <Route
        path="/behavioural-factors"
        element={
          <ProtectedRoute>
            <BehaviouralFactorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <SessionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions/:id/results"
        element={
          <ProtectedRoute>
            <SessionResultsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/forms"
        element={
          <ProtectedRoute>
            <FormsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id"
        element={
          <ProtectedRoute>
            <FormDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/edit"
        element={
          <ProtectedRoute>
            <QuestionsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/forms" replace />} />
    </Routes>
  )
}