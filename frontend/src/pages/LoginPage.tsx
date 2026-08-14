import { useEffect, useState, FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, registerCandidate } from '../api/auth'
import { ApiError, clearToken, requiresProfileCompletion, adminUnlockActive, setToken } from '../api/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [accountType, setAccountType] = useState<'BASIC' | 'EXECUTIVE'>('BASIC')
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [education, setEducation] = useState('')
  const [age, setAge] = useState<number>(0)
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('')
  const [profession, setProfession] = useState('')
  const [incomeRange, setIncomeRange] = useState('')
  const [phone, setPhone] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('next') || '/portal'

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
          ? await registerCandidate(
              name,
              email,
              password,
              accountType,
              consentAccepted,
              education,
              age,
              address,
              country,
              profession,
              incomeRange,
              phone
            )
          : await login(email, password)

      setToken(result.access_token, rememberMe)

      if (requiresProfileCompletion()) {
        navigate('/portal', {
          replace: true,
          state: { notice: 'Complete registration after you start an assessment.' },
        })
        return
      }

      if (adminUnlockActive()) {
        navigate('/portal', {
          replace: true,
          state: { notice: 'Admin has enabled one login. Use it now or it expires.' },
        })
        return
      }

      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#211E1E] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800 dark:text-gray-100"
      >
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {mode === 'login' ? 'BRET Candidate Login' : 'BRET Candidate Registration'}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
            {mode === 'login'
              ? 'Log in with the invitation credentials you were sent.'
              : 'Create a permanent candidate account.'}
          </p>
        </div>

        {mode === 'register' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as 'BASIC' | 'EXECUTIVE')}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="BASIC">BASIC</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Age *</label>
                <input
                  type="number"
                  required
                  value={age || ''}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Country *</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Education *</label>
                <input
                  type="text"
                  required
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Profession *</label>
                <input
                  type="text"
                  required
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Income Range</label>
                <input
                  type="text"
                  value={incomeRange}
                  onChange={(e) => setIncomeRange(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {mode === 'register' && (
          <>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 text-xs space-y-1.5">
              <p className="font-medium text-gray-600 dark:text-gray-200 mb-1">Password Requirements:</p>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${hasMinLength ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasMinLength ? 'text-green-700' : 'text-gray-500'}>At least 8 characters</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${hasLowercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasLowercase ? 'text-green-700' : 'text-gray-500'}>At least 1 lowercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${hasUppercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasUppercase ? 'text-green-700' : 'text-gray-500'}>At least 1 uppercase letter</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${hasDigit ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasDigit ? 'text-green-700' : 'text-gray-500'}>At least 1 digit</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${hasSpecialChar ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className={hasSpecialChar ? 'text-green-700' : 'text-gray-500'}>At least 1 special character</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

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
                I agree that my name, email address, and assessment responses will be stored and processed for the purpose of generating my behavioural report.
                I understand I can export or delete my data at any time from my profile.
                <span className="text-blue-600 font-medium"> This is required to create an account.</span>
              </label>
            </div>
          </>
        )}

        {mode === 'login' && (
          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="text-sm text-gray-700 dark:text-gray-300">
              Remember me on this device
            </label>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? mode === 'register'
              ? 'Creating account...'
              : 'Logging in...'
            : mode === 'register'
              ? 'Create account'
              : 'Log in'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
          className="w-full rounded bg-gray-200 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {mode === 'login' ? 'Create candidate account' : 'Back to Login'}
        </button>

        <div className="flex items-center justify-between pt-1 text-xs">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
          <Link to="/admin/login" className="text-blue-600 hover:underline">
            Admin login
          </Link>
        </div>
      </form>
    </div>
  )
}