import { useState, FormEvent, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { ApiError } from '../api/client'

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Real-time password strength validation rules
    const hasMinLength = password.length >= 8
    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasDigit = /[0-9]/.test(password)
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
    const isPasswordStrong = hasMinLength && hasLowercase && hasUppercase && hasDigit && hasSpecialChar

    useEffect(() => {
        if (!token) {
            setError('No reset token provided. Please request a new link.')
        }
    }, [token])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!token) return
        setError(null)

        if (!isPasswordStrong) {
            setError('Password does not meet the strength requirements.')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            await resetPassword(token, password)
            // Navigate to login with success state
            navigate('/login', { state: { message: 'Password reset successfully! Please log in with your new password.' } })
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm space-y-4 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link to="/forgot-password" className="text-blue-600 hover:underline">Request a new link</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm space-y-4">
                <h1 className="text-xl font-semibold text-gray-800">Set New Password</h1>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                {/* Real-time Password Strength checklist UI */}
                <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs space-y-1.5">
                    <p className="font-medium text-gray-600 mb-1">Password Requirements:</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Reset Password'}
                </button>
            </form>
        </div>
    )
}
