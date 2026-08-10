// import { Navigate } from 'react-router-dom'
// import { getToken, getRoleFromToken } from '../api/client'

// /**
//  * Gate for ADMIN routes. Redirects to /login if not authenticated, and to
//  * /portal if authenticated but not an admin.
//  */
// export function AdminRoute({ children }: { children: React.ReactNode }) {
//   const token = getToken()
//   if (!token) {
//     return <Navigate to="/login" replace />
//   }
//   if (getRoleFromToken() !== 'ADMIN') {
//     return <Navigate to="/portal" replace />
//   }
//   return <>{children}</>
// }


// export function UserRoute({ children }: { children: React.ReactNode }) {
//   const token = getToken()
//   if (!token) {
//     return <Navigate to="/login" replace />
//   }
//   // if (getRoleFromToken() === 'ADMIN') {
//   //   return <Navigate to="/forms" replace />
//   // }
//   return <>{children}</>
// }

// // Backwards-compatible default export (old code may still import it).
// // Equivalent to UserRoute: any authenticated user.
// export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const token = getToken()
//   if (!token) {
//     return <Navigate to="/login" replace />
//   }
//   return <>{children}</>
// }

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getAuthChangeEventName,
  getRoleFromToken,
  isTokenValid,
} from '../api/client'
import { getMe } from '../api/auth'

function useAuthGuard(requiredRole?: 'ADMIN' | 'USER') {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  async function checkAuth() {
    if (!isTokenValid()) {
      setAllowed(false)
      return
    }

    if (requiredRole === 'ADMIN' && getRoleFromToken() !== 'ADMIN') {
      setAllowed(false)
      return
    }

    try {
      await getMe()
      setAllowed(true)
    } catch {
      setAllowed(false)
    }
  }

  useEffect(() => {
    checkAuth()

    const handlePageShow = () => checkAuth()
    const handleFocus = () => checkAuth()
    const handlePopState = () => checkAuth()
    const handleAuthChange = () => checkAuth()

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener(getAuthChangeEventName(), handleAuthChange)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener(getAuthChangeEventName(), handleAuthChange)
    }
  }, [requiredRole])
  useEffect(() => {
  function onPageShow(e: PageTransitionEvent) {
    // If restored from bfcache, re-run auth checks by forcing a revalidation reload.
    if ((e as any).persisted) {
      // re-run auth guard logic — simplest: reload to get a fresh runtime state
      // but avoid infinite loops by only reloading once
      if (!sessionStorage.getItem('__bfcache_reloaded')) {
        sessionStorage.setItem('__bfcache_reloaded', '1')
        window.location.reload()
      }
    }
  }
  window.addEventListener('pageshow', onPageShow)
  return () => window.removeEventListener('pageshow', onPageShow)
}, [])

  return allowed
}



export function AdminRoute({ children }: { children: React.ReactNode }) {
  const allowed = useAuthGuard('ADMIN')

  if (allowed === null) return null
  if (!allowed) return <Navigate to="/login" replace />

  return <>{children}</>
}

export function UserRoute({ children }: { children: React.ReactNode }) {
  const allowed = useAuthGuard()

  if (allowed === null) return null
  if (!allowed) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <UserRoute>{children}</UserRoute>
}
