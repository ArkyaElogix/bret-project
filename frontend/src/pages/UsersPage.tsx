import { useEffect, useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  listUsers,
  createUser,
  deleteUser,
  changePassword,
  User,
  changeUserType,
  getAuditLog,
  AuditLog,
  createSingleUseUser,
  unlockSingleUseUser,
} from '../api/users'
import { listSessions, Session } from '../api/sessions'
import { ApiError } from '../api/client'
import AdminLayout from '../components/AdminLayout'

type Role = 'ADMIN' | 'USER'

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  USER: 'bg-blue-100 text-blue-700',
}

const ACCOUNT_TYPE_STYLES: Record<'BASIC' | 'EXECUTIVE', string> = {
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
  const [newAccountType, setNewAccountType] = useState<'BASIC' | 'EXECUTIVE'>('BASIC')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [singleUseName, setSingleUseName] = useState('')
  const [singleUseEmail, setSingleUseEmail] = useState('')
  const [singleUseAccountType, setSingleUseAccountType] = useState<'BASIC' | 'EXECUTIVE'>('BASIC')
  const [creatingSingleUse, setCreatingSingleUse] = useState(false)
  const [singleUseError, setSingleUseError] = useState<string | null>(null)
  const [singleUseSuccess, setSingleUseSuccess] = useState<string | null>(null)

  const [unlockingUserId, setUnlockingUserId] = useState<number | null>(null)
  const [unlockError, setUnlockError] = useState<{ id: number; message: string } | null>(null)

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

  // Audit log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [auditVisible, setAuditVisible] = useState(false)

  function getSingleUseStatusLabel(status?: User['single_use_status']) {
  if (status === 'pending_registration') return 'Pending registration'
  if (status === 'active') return 'Active'
  if (status === 'locked') return 'Locked'
  if (status === 'admin_unlocked') return 'Admin unlocked'
  return 'Single-use'
}

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

  async function loadAuditLog() {
    setAuditLoading(true)
    setAuditError(null)
    try {
      const data = await getAuditLog({ limit: 200 })
      setAuditLogs(data)
      setAuditVisible(true)
    } catch (err) {
      setAuditError(err instanceof ApiError ? err.message : 'Failed to load audit log.')
    } finally {
      setAuditLoading(false)
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
      await createUser(newName, newEmail, newPassword, newRole, newAccountType)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('USER')
      setNewAccountType('BASIC')
      await loadData()
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : 'Failed to create user.'
      )
    } finally {
      setCreating(false)
    }
  }

    async function handleCreateSingleUse(e: FormEvent) {
    e.preventDefault()
    setSingleUseError(null)
    setSingleUseSuccess(null)
    setCreatingSingleUse(true)

    try {
      const created = await createSingleUseUser(
        singleUseEmail,
        singleUseAccountType,
        singleUseName || undefined
      )
      setSingleUseSuccess(`Credentials sent to ${created.email}`)
      setSingleUseName('')
      setSingleUseEmail('')
      setSingleUseAccountType('BASIC')
      await loadData()
    } catch (err) {
      setSingleUseError(err instanceof ApiError ? err.message : 'Failed to create single-use user.')
    } finally {
      setCreatingSingleUse(false)
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

    async function handleUnlockSingleUse(id: number) {
    setUnlockingUserId(id)
    setUnlockError(null)

    try {
      await unlockSingleUseUser(id)
      await loadData()
    } catch (err) {
      setUnlockError({
        id,
        message: err instanceof ApiError ? err.message : 'Failed to unlock single-use user.',
      })
    } finally {
      setUnlockingUserId(null)
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
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
  <span
    className={`text-xs px-2 py-1 rounded-full ${
      user.role === 'ADMIN' ? ROLE_STYLES.ADMIN : ROLE_STYLES.USER
    } dark:text-gray-900`}
  >
    {user.role === 'ADMIN' ? 'Admin' : 'User'}
  </span>

  {user.role === 'USER' && (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        user.account_type === 'EXECUTIVE'
          ? ACCOUNT_TYPE_STYLES.EXECUTIVE
          : ACCOUNT_TYPE_STYLES.BASIC
      } dark:text-gray-900`}
    >
      {user.account_type === 'BASIC' ? 'Basic' : 'Executive'}
    </span>
  )}
                        {user.is_single_use && (
              <>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    user.single_use_status === 'locked'
                      ? 'bg-red-100 text-red-700'
                      : user.single_use_status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : user.single_use_status === 'admin_unlocked'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                  } dark:text-gray-900`}
                >
                  {getSingleUseStatusLabel(user.single_use_status)}
                </span>

                {user.deletion_scheduled_at && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Deletes {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(user.deletion_scheduled_at))}
                  </span>
                )}
              </>
            )}
            {user.is_single_use && user.single_use_status === 'locked' && (
                  <button
                    onClick={() => handleUnlockSingleUse(user.id)}
                    disabled={unlockingUserId === user.id}
                    className="text-xs border border-blue-300 text-blue-600 rounded px-3 py-1 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30 disabled:opacity-50"
                  >
                    {unlockingUserId === user.id ? 'Unlocking...' : 'Unlock'}
                  </button>
                )}
            {!isChangingPassword && (
              <>
                {/* ADD THIS BUTTON FOR PRODUCT TYPE */}
                {user.role === 'USER' && (
                  <button
                    onClick={() => handleChangeType(user.id, user.account_type === 'BASIC' ? 'EXECUTIVE' : 'BASIC')}
                    disabled={updatingTypeUserId === user.id}
                    className="text-xs border border-orange-300 text-orange-700 rounded px-3 py-1 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30 disabled:opacity-50"
                  >
                    {updatingTypeUserId === user.id ? 'Updating...' : `Set as ${user.account_type === 'BASIC' ? 'Executive' : 'Basic'}`}
                  </button>
                )}

                {!isChangingPassword && (
                  <button
                    onClick={() => openPasswordForm(user)}
                    disabled={confirmDeleteId === user.id}
                    className="text-xs border border-slate-300 text-slate-700 rounded px-3 py-1 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Change Password
                  </button>
                )}

                {confirmDeleteId === user.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-medium dark:text-red-300">Delete?</span>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleting || user.role === 'ADMIN'}
                      className="text-xs bg-red-600 text-white rounded px-2.5 py-1 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 disabled:opacity-50"
                    >
                      {deleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDeleteId(null)
                        setDeleteError(null)
                      }}
                      disabled={deleting}
                      className="text-xs border border-gray-300 rounded px-2.5 py-1 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
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
                    className="text-xs border border-red-300 text-red-600 rounded px-3 py-1 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30 disabled:opacity-50"
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
              className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border border-gray-300 rounded px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
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
                {unlockError?.id === user.id && (
          <p className="text-xs text-red-600">{unlockError.message}</p>
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
          className="bg-white shadow rounded-lg p-6 space-y-4 dark:bg-gray-800 dark:border dark:border-gray-700"
        >
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">Create a new user</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Initial password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {newRole === 'USER' && (
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Product Type</label>
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as 'BASIC' | 'EXECUTIVE')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BASIC">Basic</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>
          )}

          {createError && <p className="text-sm text-red-600 dark:text-red-300">{createError}</p>}

          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create user'}
          </button>
        </form>
        <form
          onSubmit={handleCreateSingleUse}
          className="bg-white shadow rounded-lg p-6 space-y-4 dark:bg-gray-800 dark:border dark:border-gray-700"
        >
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Create a single-use candidate
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={singleUseName}
                onChange={(e) => setSingleUseName(e.target.value)}
                placeholder="Optional"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={singleUseEmail}
                onChange={(e) => setSingleUseEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Account Type</label>
            <select
              value={singleUseAccountType}
              onChange={(e) => setSingleUseAccountType(e.target.value as 'BASIC' | 'EXECUTIVE')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BASIC">Basic</option>
              <option value="EXECUTIVE">Executive</option>
            </select>
          </div>

          {singleUseError && <p className="text-sm text-red-600 dark:text-red-300">{singleUseError}</p>}
          {singleUseSuccess && <p className="text-sm text-green-600 dark:text-green-300">{singleUseSuccess}</p>}

          <button
            type="submit"
            disabled={creatingSingleUse}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creatingSingleUse ? 'Sending...' : 'Send invitation'}
          </button>
        </form>
        {/* Loading / error for the whole page */}
        {loading && (
          <p className="p-6 text-sm text-gray-500 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
            Loading users...
          </p>
        )}
        {error && (
          <p className="p-6 text-sm text-red-600 bg-white shadow rounded-lg dark:bg-gray-800 dark:border dark:border-gray-700">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Admins */}
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Admins ({admins.length})
              </h2>
              <div className="bg-white shadow rounded-lg divide-y dark:bg-gray-800 dark:divide-gray-700">
                {admins.length === 0 ? (
                  <p className="p-6 text-sm text-gray-500 dark:text-gray-300">No admins yet.</p>
                ) : (
                  admins.map(renderUserRow)
                )}
              </div>
            </section>

            {/* Regular users */}
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Users ({regularUsers.length})
              </h2>
              <div className="bg-white shadow rounded-lg divide-y dark:bg-gray-800 dark:divide-gray-700">
                {regularUsers.length === 0 ? (
                  <p className="p-6 text-sm text-gray-500 dark:text-gray-300">No users yet.</p>
                ) : (
                  regularUsers.map(renderUserRow)
                )}
              </div>
            </section>

            {/* Active assessment sessions */}
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Active assessment sessions ({activeSessions.length})
              </h2>
              <div className="bg-white shadow rounded-lg divide-y dark:bg-gray-800 dark:divide-gray-700">
                {activeSessions.length === 0 ? (
                  <p className="p-6 text-sm text-gray-500 dark:text-gray-300">
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
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {user ? user.name : `User #${session.user_id}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user ? user.email : '—'} · Form {session.form_id} ·{' '}

                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full dark:bg-yellow-300 dark:text-yellow-900">
                            In Progress
                          </span>
                          <Link
                            to="/sessions"
                            className="text-xs border border-blue-300 text-blue-600 rounded px-3 py-1 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
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
            {/* Audit Log */}
            

          </>
        )}
      </div>
    </AdminLayout>
  )
}
