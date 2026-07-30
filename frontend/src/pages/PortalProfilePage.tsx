import { useEffect, useState } from 'react'
import { getMe } from '../api/auth'
import { ApiError } from '../api/client'
import { User } from '../api/users'
import PortalLayout from '../components/PortalLayout'

export default function PortalProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMe()
      .then((data) => setUser(data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load profile.')
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <PortalLayout title="My Profile">
      <div className="max-w-md space-y-4">
        {loading && (
          <p className="p-6 text-sm text-gray-500 bg-white shadow rounded-lg">Loading profile...</p>
        )}
        {error && (
          <p className="p-6 text-sm text-red-600 bg-white shadow rounded-lg">{error}</p>
        )}
        {!loading && !error && user && (
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
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
      </div>
    </PortalLayout>
  )
}