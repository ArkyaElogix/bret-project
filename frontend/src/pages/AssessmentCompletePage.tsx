import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearToken } from '../api/client'

export default function AssessmentCompletePage() {
  const navigate = useNavigate()

  useEffect(() => {
    clearToken()
    const timer = window.setTimeout(() => {
      navigate('/login', { replace: true })
    }, 10000)

    return () => window.clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#211E1E] px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Assessment complete</h1>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
          Thank you for completing your assessment. Your personalized report is being sent to you shortly.
        </p>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          You will be redirected to the login page in 10 seconds.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to login
        </Link>
      </div>
    </div>
  )
}