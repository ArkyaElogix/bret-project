import { Navigate } from 'react-router-dom'
import { getToken, getRoleFromToken } from '../api/client'

/**
 * Gate for ADMIN routes. Redirects to /login if not authenticated, and to
 * /portal if authenticated but not an admin.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (getRoleFromToken() !== 'ADMIN') {
    return <Navigate to="/portal" replace />
  }
  return <>{children}</>
}


export function UserRoute({ children }: { children: React.ReactNode }) {
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  // if (getRoleFromToken() === 'ADMIN') {
  //   return <Navigate to="/forms" replace />
  // }
  return <>{children}</>
}

// Backwards-compatible default export (old code may still import it).
// Equivalent to UserRoute: any authenticated user.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
