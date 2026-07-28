import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  listUsers,
  createUser,
  deleteUser,
  changePassword,
  User,
  changeUserType,
} from '../api/users'
import { listSessions, Session } from '../api/sessions'
import { ApiError } from '../api/client'
import AdminLayout from '../components/AdminLayout'

type Role = 'ADMIN' | 'USER'

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  USER: 'bg-blue-100 text-blue-700',
}

const PRODUCT_TYPE_STYLES: Record<'BASIC' | 'EXECUTIVE', string> = {
  BASIC: 'bg-green-100 text-green-700',
  EXECUTIVE: 'bg-orange-100 text-orange-700',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [activeSessions, setActiveSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create-user form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<Role>('USER')
  const [newProductType, setNewProductType] = useState<'BASIC' | 'EXECUTIVE'>('BASIC')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Inline delete confirmation (mirrors FormsPage)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<{
    id: number
    message: string
  } | null>(null)
  const [updatingTypeUserId, setUpdatingTypeUserId] = useState<number | null>(null)
  const [typeUpdateError, setTypeUpdateError] = useState<{ id: number; message: string } | null>(null)

  // Inline change-password form
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null)
  const [passwordValue, setPasswordValue] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<{
    id: number
    message: string
  } | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [usersData, sessionsData] = await Promise.all([
        listUsers(),
        listSessions({ status_filter: 'in_progress' }),
      ])
      setUsers(usersData)
      setActiveSessions(sessionsData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      await createUser(newName, newEmail, newPassword, newRole, newProductType)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('USER')
      setNewProductType('BASIC')
      await loadData()
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : 'Failed to create user.'
      )
    } finally {
      setCreating(false)
    }
  }
  async function handleChangeType(id: number, newType: 'BASIC' | 'EXECUTIVE') {
    setUpdatingTypeUserId(id)
    setTypeUpdateError(null)
    try {
      await changeUserType(id, newType)
      await loadData()
    } catch (err) {
      setTypeUpdateError({
        id,
        message: err instanceof ApiError ? err.message : 'Failed to change user type.',
      })
    } finally {
      setUpdatingTypeUserId(null)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteUser(id)
      setConfirmDeleteId(null)
      await loadData()
    } catch (err) {
      setDeleteError({
        id,
        message: err instanceof ApiError ? err.message : 'Failed to delete user.',
      })
    } finally {
      setDeleting(false)
    }
  }

  async function handleChangePassword(e: FormEvent, id: number) {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordError(null)
    try {
      await changePassword(id, passwordValue)
      setPasswordUserId(null)
      setPasswordValue('')
    } catch (err) {
      setPasswordError({
        id,
        message:
          err instanceof ApiError
            ? err.message
            : 'Failed to change password.',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  function openPasswordForm(user: User) {
    setPasswordUserId(user.id)
    setPasswordValue('')
    setPasswordError(null)
  }

  function closePasswordForm() {
    setPasswordUserId(null)
    setPasswordValue('')
    setPasswordError(null)
  }

  const admins = users.filter((u) => u.role === 'ADMIN')
  const regularUsers = users.filter((u) => u.role === 'USER')

  // Map user_id -> user for the active-sessions panel
  const userById = new Map(users.map((u) => [u.id, u]))

  function renderUserRow(user: User) {
    const isChangingPassword = passwordUserId === user.id
    return (
      <div key={user.id} className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-1 rounded-full ${ROLE_STYLES[user.role]}`}
            >
              {user.role === 'ADMIN' ? 'Admin' : 'User'}
            </span>

            {user.role === 'USER' && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${PRODUCT_TYPE_STYLES[user.product_type]}`}
              >
                {user.product_type === 'BASIC' ? 'Basic' : 'Executive'}
              </span>
            )}
            {!isChangingPassword && (
              <>
                {/* ADD THIS BUTTON FOR PRODUCT TYPE */}
                {user.role === 'USER' && (
                  <button
                    onClick={() => handleChangeType(user.id, user.product_type === 'BASIC' ? 'EXECUTIVE' : 'BASIC')}
                    disabled={updatingTypeUserId === user.id}
                    className="text-xs border border-orange-300 text-orange-700 rounded px-3 py-1 hover:bg-orange-50 disabled:opacity-50"
                  >
                    {updatingTypeUserId === user.id ? 'Updating...' : `Set as ${user.product_type === 'BASIC' ? 'Executive' : 'Basic'}`}
                  </button>
                )}

                {!isChangingPassword && (
                  <button
                    onClick={() => openPasswordForm(user)}
                    disabled={confirmDeleteId === user.id}
                    className="text-xs border border-slate-300 text-slate-700 rounded px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Change Password
                  </button>
                )}

                {confirmDeleteId === user.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-medium">Delete?</span>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleting || user.role === 'ADMIN'}
                      className="text-xs bg-red-600 text-white rounded px-2.5 py-1 hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDeleteId(null)
                        setDeleteError(null)
                      }}
                      disabled={deleting}
                      className="text-xs border border-gray-300 rounded px-2.5 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmDeleteId(user.id)
                      setDeleteError(null)
                      closePasswordForm()
                    }}
                    disabled={isChangingPassword || user.role === 'ADMIN'}
                    className="text-xs border border-red-300 text-red-600 rounded px-3 py-1 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Inline change-password form */}
        {isChangingPassword && (
          <form
            onSubmit={(e) => handleChangePassword(e, user.id)}
            className="flex items-center gap-2 flex-wrap pt-1"
          >
            <input
              type="password"
              required
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              placeholder="New password"
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={savingPassword}
              className="bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {savingPassword ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closePasswordForm}
              disabled={savingPassword}
              className="border border-gray-300 rounded px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            {passwordError?.id === user.id && (
              <p className="text-xs text-red-600 w-full">
                {passwordError.message}
              </p>
            )}
          </form>
        )}

        {deleteError?.id === user.id && (
          <p className="text-xs text-red-600">{deleteError.message}</p>
        )}
      </div>
    )
  }

        return (
        <AdminLayout title="Users">
          <div className="max-w-4xl space-y-8">

            {/* Create-user form */}
            <form
              onSubmit={handleCreate}
              className="bg-white shadow rounded-lg p-6 space-y-4"
            >
              <h2 className="text-sm font-medium text-gray-700">Create a new user</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Initial password"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              {newRole === 'USER' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Product Type</label>
                  <select
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value as 'BASIC' | 'EXECUTIVE')}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BASIC">Basic</option>
                    <option value="EXECUTIVE">Executive</option>
                  </select>
                </div>
              )}

              {createError && <p className="text-sm text-red-600">{createError}</p>}

              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create user'}
              </button>
            </form>

            {/* Loading / error for the whole page */}
            {loading && (
              <p className="p-6 text-sm text-gray-500 bg-white shadow rounded-lg">
                Loading users...
              </p>
            )}
            {error && (
              <p className="p-6 text-sm text-red-600 bg-white shadow rounded-lg">
                {error}
              </p>
            )}

            {!loading && !error && (
              <>
                {/* Admins */}
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Admins ({admins.length})
                  </h2>
                  <div className="bg-white shadow rounded-lg divide-y">
                    {admins.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500">No admins yet.</p>
                    ) : (
                      admins.map(renderUserRow)
                    )}
                  </div>
                </section>

                {/* Regular users */}
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Users ({regularUsers.length})
                  </h2>
                  <div className="bg-white shadow rounded-lg divide-y">
                    {regularUsers.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500">No users yet.</p>
                    ) : (
                      regularUsers.map(renderUserRow)
                    )}
                  </div>
                </section>

                {/* Active assessment sessions */}
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-gray-700">
                    Active assessment sessions ({activeSessions.length})
                  </h2>
                  <div className="bg-white shadow rounded-lg divide-y">
                    {activeSessions.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500">
                        No active assessment sessions right now.
                      </p>
                    ) : (
                      activeSessions.map((session) => {
                        const user = userById.get(session.user_id)
                        return (
                          <div
                            key={session.id}
                            className="p-4 flex items-center justify-between gap-2 flex-wrap"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {user ? user.name : `User #${session.user_id}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user ? user.email : '—'} · Form {session.form_id} ·{' '}

                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                In Progress
                              </span>
                              <Link
                                to="/sessions"
                                className="text-xs border border-blue-300 text-blue-600 rounded px-3 py-1 hover:bg-blue-50"
                              >
                                View in Sessions
                              </Link>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </AdminLayout>
        )
}
