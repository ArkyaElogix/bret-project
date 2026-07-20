import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, registerCandidate } from '../api/auth'
import { setToken } from '../api/client'
import { ApiError } from '../api/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // async function handleSubmit(e: FormEvent) {
  //   e.preventDefault()
  //   setError(null)
  //   setLoading(true)
  //   try {
  //     const result = await login(email, password)
  //     setToken(result.access_token)
  //     // Candidate login accepts any valid credentials and always goes to the portal.
  //     navigate('/portal')
  //   } catch (err) {
  //     setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const result =
        mode === 'register'
          ? await registerCandidate(name, email, password)
          : await login(email, password)

      setToken(result.access_token)
      navigate('/portal')
    } catch (err) {
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
        <h1 className="text-xl font-semibold text-gray-800">{mode == 'login' ? 'BRET Candidate Login' : 'BRET Candidate Registration'}</h1>
        { mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

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
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? mode === 'register' ? 'Creating account...' : 'Logging in...' : mode=== 'register' ? 'Create account' : 'Log in'}
        </button>

        <button type="button" 
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full bg-gray-200 text-gray-800 rounded py-2 text-sm font-medium hover:bg-gray-300">
          {mode === 'login' ? 'Create candidate account' : 'Back to Login'}
        </button>
        
        <p className="text-center text-xs text-gray-500 pt-2">
          Administrator?{' '}
          <Link to="/admin/login" className="text-blue-600 hover:underline">
            Log in here
          </Link>
        </p>
      </form>
    </div>
  )
}