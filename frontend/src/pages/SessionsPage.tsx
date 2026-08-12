// This page is for the admin's pov, combining Session tracking and the Privacy Audit Log.
import React, { useEffect, useState } from 'react'
import { listSessions, deleteSession, Session, getSessionResults, SectionResult, resendReportEmail } from '../api/sessions'
import { getSessionActivity, SessionActivity } from '../api/activityLog'
import { getAuditLog, AuditLog } from '../api/users'
import { ApiError } from '../api/client'
import AdminLayout from '../components/AdminLayout'
import { Link } from 'react-router-dom'
import { SessionReportView } from './SessionReportPage'

function formatSessionStatus(status: Session['status']) {
  switch (status) {
    case 'in_progress':
      return 'In progress'
    case 'submitted':
      return 'Submitted'
    default:
      return String(status).replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
  }
}

function formatActiveTime(decimalMinutes: number | undefined) {
  if (decimalMinutes == null) return '0s'
  const totalSeconds = Math.round(decimalMinutes * 60)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'audit'>('sessions')
  const [selectedReportSessionId, setSelectedReportSessionId] = useState<number | null>(null)
  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [errorSessions, setErrorSessions] = useState<string | null>(null)

  // Expanded Session State
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [sessionResults, setSessionResults] = useState<SectionResult[] | null>(null)
  const [sessionActivity, setSessionActivity] = useState<SessionActivity | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [errorAudit, setErrorAudit] = useState<string | null>(null)

  // Initial Load
  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    setLoadingSessions(true)
    setErrorSessions(null)
    try {
      const data = await listSessions()
      setSessions(data)
    } catch (err) {
      setErrorSessions(err instanceof ApiError ? err.message : 'Failed to load sessions.')
    } finally {
      setLoadingSessions(false)
    }
  }

  async function handleResendReport(id: number) {
    try {
      await resendReportEmail(id)
      alert('Report email queued successfully.')
    } catch (err: any) {
      alert(err.message || 'Failed to queue email.')
    }
  }


  async function loadAuditData() {
    setLoadingAudit(true)
    setErrorAudit(null)
    try {
      const data = await getAuditLog({ limit: 200 })
      setAuditLogs(data)
    } catch (err) {
      setErrorAudit(err instanceof ApiError ? err.message : 'Failed to load audit log.')
    } finally {
      setLoadingAudit(false)
    }
  }

  // Fetch details when a row is expanded
  useEffect(() => {
    if (!expandedId) return
    setLoadingDetails(true)
    setSessionResults(null)
    setSessionActivity(null)

    Promise.allSettled([
      getSessionResults(expandedId),
      getSessionActivity(expandedId)
    ]).then(([resResult, actResult]) => {
      if (resResult.status === 'fulfilled') setSessionResults(resResult.value)
      if (actResult.status === 'fulfilled') setSessionActivity(actResult.value)
      setLoadingDetails(false)
    })
  }, [expandedId])

  // Handle Tab Switch
  useEffect(() => {
    if (activeTab === 'audit' && auditLogs.length === 0) {
      loadAuditData()
    }
  }, [activeTab])

  async function handleDelete(id: number) {
    if (!window.confirm('Are you sure you want to completely delete this session? This action cannot be undone.')) return
    try {
      await deleteSession(id)
      setSessions(sessions.filter((s) => s.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete session.')
    }
  }

  return (
    <AdminLayout title="Sessions & Activity">
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`${activeTab === 'sessions' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Assessment Sessions
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`${activeTab === 'audit' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Privacy Audit Log
          </button>
        </nav>
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {errorSessions && <div className="text-red-600 mb-4">{errorSessions}</div>}
          {loadingSessions ? (
            <p className="text-sm text-gray-500">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-500 dark:bg-gray-800 dark:border dark:border-gray-700">No sessions found.</div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Form</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sessions.map((session) => (
                    <React.Fragment key={session.id}>
                      <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${expandedId === session.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`} onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{session.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{session.user_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{session.form_name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                            {formatSessionStatus(session.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(session.id) }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-xs px-2 py-1">Delete</button>
                        </td>
                      </tr>

                      {/* Expanded Details Panel */}
                      {expandedId === session.id && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 p-6 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                            {loadingDetails ? (
                              <p className="text-sm text-gray-500">Loading session details...</p>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                {/* Left Column: Activity & Behavioral Flags */}
                                <div>
                                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Behavioral Activity</h3>

                                  {sessionActivity?.summary.flags && sessionActivity.summary.flags.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                      <p className="text-xs font-medium text-gray-500 uppercase">System Flags</p>
                                      {sessionActivity.summary.flags.map((flag, idx) => (
                                        <div key={idx} className="flex items-start p-3 bg-rose-50 border border-rose-200 rounded-lg dark:bg-rose-900/20 dark:border-rose-800/30">
                                          <span className="text-xl mr-3">⚠️</span>
                                          <div>
                                            <p className="text-sm font-semibold text-rose-800 dark:text-rose-400">{flag.type.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">{flag.message}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                      <p className="text-xs text-gray-500">Active Time</p>
                                      <p className="text-lg font-bold text-gray-800 dark:text-white">{formatActiveTime(sessionActivity?.summary.total_active_minutes)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                      <p className="text-xs text-gray-500">Answers Changed</p>
                                      <p className="text-lg font-bold text-gray-800 dark:text-white">{sessionActivity?.summary.answer_change_count}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                      <p className="text-xs text-gray-500">Sittings</p>
                                      <p className="text-lg font-bold text-gray-800 dark:text-white">
                                        {sessionActivity ? sessionActivity.summary.session_resumes + 1 : '—'}
                                      </p>
                                    </div>
                                  </div>


                                  <div className="bg-white rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700 max-h-96 overflow-y-auto p-4">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-4 sticky top-0 bg-white dark:bg-gray-800 py-1">Timeline ({sessionActivity?.summary.total_events} events)</p>
                                    <div className="space-y-4 border-l-2 border-gray-100 dark:border-gray-700 ml-2 pl-4">
                                      {sessionActivity?.events.map((event) => (
                                        <div key={event.id} className="relative">
                                          <div className="absolute -left-5 top-1.5 h-2 w-2 rounded-full bg-blue-500"></div>
                                          <p className="text-xs text-gray-400">{new Date(event.created_at).toLocaleTimeString()}</p>
                                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{event.action}</p>
                                          {event.detail && <p className="text-xs text-gray-500 font-mono mt-1">{event.detail}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Column: Results Snapshot */}
                                <div>
                                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Results Snapshot</h3>
                                  <div className="flex space-x-3 mb-6">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedReportSessionId(session.id)
                                      }}
                                      className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                                    >
                                      View Report
                                    </button>
                                    <button
                                      onClick={() => handleResendReport(session.id)}
                                      className="border border-blue-600 text-blue-600 px-3 py-1.5 rounded text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-400"
                                    >
                                      Resend Email
                                    </button>
                                  </div>

                                  {session.status !== 'submitted' ? (
                                    <div className="p-4 border border-dashed border-gray-300 rounded text-sm text-gray-500 dark:border-gray-600">Scores are calculated upon final submission.</div>
                                  ) : sessionResults && sessionResults.length > 0 ? (
                                    <div className="space-y-4">
                                      {sessionResults.map(section => (
                                        <div key={section.section_id} className="bg-white p-4 rounded shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">{section.section_code} - {section.section_name}</p>
                                          <div className="space-y-2">
                                            {section.factors.map(factor => (
                                              <div key={factor.factor_id}>
                                                <div className="flex justify-between text-xs mb-1">
                                                  <span className="text-gray-600 dark:text-gray-400">{factor.factor_name}</span>
                                                  <span className="font-semibold text-gray-800 dark:text-gray-200">{factor.percentage}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                  <div className="h-full bg-blue-500" style={{ width: `${factor.percentage}%` }}></div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500">No scoring data available.</p>
                                  )}
                                </div>

                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Privacy and security events (logins, exports, data deletions).</p>
            <button onClick={loadAuditData} className="text-xs border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Refresh</button>
          </div>
          {errorAudit && <div className="text-red-600 mb-4">{errorAudit}</div>}
          {loadingAudit ? (
            <p className="text-sm text-gray-500">Loading audit log...</p>
          ) : auditLogs.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center text-sm text-gray-500 dark:bg-gray-800 dark:border dark:border-gray-700">No audit events recorded yet.</div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/60">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap dark:text-gray-300">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${log.action.includes('DELETE') || log.action.includes('RESET') ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                            log.action.includes('LOGIN') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                              log.action.includes('LOGOUT') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                log.action.includes('CONSENT') || log.action.includes('REGISTER') ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            {log.action}
                          </span>

                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{log.user_id ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono dark:text-gray-400">{log.ip_address ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-500 max-w-xs truncate dark:text-gray-400">{log.detail ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
            </div>
          )}
        </div>
      )}
      {selectedReportSessionId !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div className="relative w-full max-w-7xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Session Report
              </h2>
              <button
                type="button"
                onClick={() => setSelectedReportSessionId(null)}
                className="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100vh-8rem)] overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4">
              <SessionReportView sessionId={selectedReportSessionId} />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
