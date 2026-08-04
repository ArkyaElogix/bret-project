import { useEffect, useState } from 'react'
import { getMe } from '../api/auth'
import { ApiError } from '../api/client'
import { User, exportMyData, deleteMe } from '../api/users'
import PortalLayout from '../components/PortalLayout'
import { useNavigate } from 'react-router-dom'

export default function PortalProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getMe()
      .then((data) => setUser(data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load profile.')
      )
      .finally(() => setLoading(false))
  }, [])

  const handleExportData = async () => {
    try {
      const data = await exportMyData()
      // Create a downloadable JSON file in the browser
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `my-assessment-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to export data.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.')
      return
    }
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteMe(deletePassword)
      // On success, clear local auth and kick to login
      localStorage.removeItem('token')
      navigate('/login')
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete account.')
      setIsDeleting(false)
    }
  }


  return (
    <PortalLayout title="My Profile">
      <div className="max-w-md space-y-4">
        {loading && (
          <p className="p-6 text-sm text-gray-500 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">Loading profile...</p>
        )}
        {error && (
          <p className="p-6 text-sm text-red-600 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">{error}</p>
        )}
        {!loading && !error && user && (
          <div className="bg-white shadow rounded-lg p-6 space-y-4 dark:bg-gray-800 dark:border dark:border-gray-700">
            <p className="text-sm text-gray-500">
              This is the information we have on file for your account.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-red-600">Email (your username)</p>
                <p className="text-sm font-medium text-gray-800 break-all">{user.email}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-red-600">Account Name</p>
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-red-950">Assessment Tier</p>
                <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  {user.product_type === 'EXECUTIVE' ? 'Executive' : 'Basic'}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-red-950">Account type</p>
                <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {user.role === 'ADMIN' ? 'Admin' : 'Candidate'}
                </span>
              </div>
            </div>
          </div>
        )}
        {!loading && !error && user && (
          <div className="bg-white shadow rounded-lg p-6 space-y-4 border border-red-100 mt-6 dark:bg-gray-800 dark:border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900">Privacy & Data Control</h3>
            <p className="text-sm text-gray-500">
              Manage your personal data in accordance with our privacy policy.
            </p>

            <div className="pt-4 border-t border-gray-100 flex flex-col space-y-4">
              <button
                onClick={handleExportData}
                className="self-start text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium transition-colors"
              >
                Export My Data
              </button>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="self-start text-sm bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded font-medium transition-colors"
                >
                  Delete Account permanently
                </button>
              ) : (
                <div className="bg-red-50 p-4 rounded-md space-y-3 border border-red-200 mt-2">
                  <p className="text-sm font-medium text-red-800">
                    Warning: This will deactivate your account immediately and schedule your data for deletion. You will be logged out and will not be able to log back in.
                  </p>
                  <input
                    type="password"
                    placeholder="Enter password to confirm"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-3 py-2 border"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                  {deleteError && <p className="text-sm text-red-600 font-semibold">{deleteError}</p>}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteError(null)
                        setDeletePassword('')
                      }}
                      disabled={isDeleting}
                      className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
