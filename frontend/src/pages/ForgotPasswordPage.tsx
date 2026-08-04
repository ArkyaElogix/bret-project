import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { ApiError } from '../api/client'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setStatus('loading')
        setMessage(null)

        try {
            const res = await forgotPassword(email)
            setStatus('success')
            setMessage(res.message)
        } catch (err) {
            setStatus('error')
            setMessage(err instanceof ApiError ? err.message : 'Something went wrong.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm space-y-4 dark:bg-gray-800 dark:text-gray-100">
                <h1 className="text-xl font-semibold text-gray-800">Reset Password</h1>

                {status === 'success' ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 rounded p-4 text-sm">
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

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

                        {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>
                )}

                <div className="text-center pt-2">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
