import { useState, FormEvent, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminLogin } from '../api/auth'
import { setToken, clearToken } from '../api/client'
import { ApiError } from '../api/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await adminLogin(email, password)
      // The backend endpoint only returns success for ADMIN users (403 otherwise),
      // so if we get here the role is guaranteed ADMIN.
      setToken(result.access_token)
      navigate('/forms', { replace: true })
    } catch (err) {
      // 401 = wrong credentials; 403 = valid creds but not an admin.
      // Both surface cleanly as ApiError.message.
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold text-gray-800">BRET Admin Login</h1>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-center text-xs text-gray-500 pt-2">
          <Link to="/login" className="text-blue-600 hover:underline">
            ← Back to candidate login
          </Link>
        </p>
      </form>
    </div>
  )
}