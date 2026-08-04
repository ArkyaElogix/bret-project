import { useEffect, useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login, registerCandidate } from '../api/auth'
import { setToken, clearToken } from '../api/client'
import { ApiError } from '../api/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.message
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [productType, setProductType] = useState<'BASIC' | 'EXECUTIVE'>('BASIC')
  const [consentAccepted, setConsentAccepted] = useState(false)

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Real-time password strength validation rules
  const hasMinLength = password.length >= 8
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const isPasswordStrong = hasMinLength && hasLowercase && hasUppercase && hasDigit && hasSpecialChar

  useEffect(() => {
    clearToken()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    // Apply strict validation blocks if in register mode
    if (mode === 'register') {
      if (!isPasswordStrong) {
        setError('Password does not meet the strength requirements.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (!consentAccepted) {
        setError('You must accept the privacy notice to create an account.')
        return
      }
    }

    setLoading(true)
    try {
      const result =
        mode === 'register'
          ? await registerCandidate(name, email, password, productType, consentAccepted)
          : await login(email, password)

      setToken(result.access_token)
      navigate('/portal', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#211E1E]">

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 w-full max-w-sm space-y-4"
      >
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded p-4 text-sm mb-4">
            {successMessage}
          </div>
        )}
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {mode === 'login' ? 'BRET Candidate Login' : 'BRET Candidate Registration'}
        </h1>

        {mode === 'register' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as 'BASIC' | 'EXECUTIVE')}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BASIC">BASIC</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mode === 'login' && (
          <div className="mt-1 text-right">
            <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        )}


        {mode === 'register' && (
          <>
            {/* Real-time Password Strength checklist UI */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-xs space-y-1.5">
              <p className="font-medium text-gray-600 dark:text-gray-200 mb-1">Password Requirements:</p>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${hasMinLength ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasMinLength ? 'text-green-700 transition-colors duration-200' : 'text-gray-500 transition-colors duration-200'}>At least 8 characters</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${hasLowercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasLowercase ? 'text-green-700 transition-colors duration-200' : 'text-gray-500 transition-colors duration-200'}>At least 1 lowercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${hasUppercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasUppercase ? 'text-green-700 transition-colors duration-200' : 'text-gray-500 transition-colors duration-200'}>At least 1 uppercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${hasDigit ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasDigit ? 'text-green-700 transition-colors duration-200' : 'text-gray-500 transition-colors duration-200'}>At least 1 digit</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${hasSpecialChar ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasSpecialChar ? 'text-green-700 transition-colors duration-200' : 'text-gray-500 transition-colors duration-200'}>At least 1 special character</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>


        )}
        {mode === 'register' && (
          <div className="flex items-start space-x-3 pt-1">
            <input
              id="consent-checkbox"
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="consent-checkbox"
              className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer"
            >
              I agree that my name, email address, and assessment responses will be
              stored and processed for the purpose of generating my behavioural report.
              I understand I can export or delete my data at any time from my profile.{' '}
              <span className="text-blue-600 font-medium">
                This is required to create an account.
              </span>
            </label>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (mode === 'register' ? 'Creating account...' : 'Logging in...') : (mode === 'register' ? 'Create account' : 'Log in')}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
          className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
        >
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