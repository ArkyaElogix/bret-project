import { useEffect, useState, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { completeRegistration } from '../api/auth'
import { ApiError, logout } from '../api/client'

export default function CompleteRegistrationPage() {
  const params = useParams()
  const navigate = useNavigate()
  const sessionId = Number(params.sessionId)

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('')
  const [age, setAge] = useState<number>(0)
  const [profession, setProfession] = useState('')
  const [incomeRange, setIncomeRange] = useState('')
  const [consentAccepted, setConsentAccepted] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateDetected, setDuplicateDetected] = useState(false)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setDuplicateDetected(false)
    setLoading(true)

    try {
      await completeRegistration(
        sessionId,
        phone,
        address,
        country,
        age,
        profession,
        incomeRange,
        consentAccepted
      )
      navigate(`/portal/sessions/${sessionId}`, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.message.includes('DUPLICATE_DETECTED')) {
        setDuplicateDetected(true)
        setError('Duplicate detected. This account has been locked.')
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to complete registration.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!Number.isFinite(sessionId) || sessionId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#211E1E] px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Invalid session</h1>
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
            This registration page needs a valid session id.
          </p>
          <Link to="/portal" className="mt-6 inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Go to portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#211E1E]">
      <div className="mx-auto w-full max-w-2xl rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Complete registration</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Finish your profile before continuing into the assessment.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            Do not close this tab or log out until you finish the assessment. If you leave now, the attempt may be lost.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
              <input
                type="number"
                required
                value={age || ''}
                onChange={(e) => setAge(Number(e.target.value) || 0)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Profession</label>
            <input
              type="text"
              required
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Income range</label>
            <input
              type="text"
              required
              value={incomeRange}
              onChange={(e) => setIncomeRange(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I accept that my profile details and assessment data will be stored and processed for this assessment.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {duplicateDetected && (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              Log out and discard this account
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue to assessment'}
          </button>
        </form>
      </div>
    </div>
  )
}