import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { listDuplicateFlags, reviewDuplicateFlag, DuplicateFlag } from '../api/duplicates'

export default function DuplicatesQueuePage() {
    const [flags, setFlags] = useState<DuplicateFlag[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadFlags()
    }, [])

    async function loadFlags() {
        setLoading(true)
        try {
            const data = await listDuplicateFlags('PENDING')
            setFlags(data)
        } catch (err: any) {
            setError(err.message || 'Failed to load duplicates queue')
        } finally {
            setLoading(false)
        }
    }

    async function handleReview(flagId: number, decision: 'APPROVED' | 'REJECTED') {
        const note = prompt(`Enter a note for this ${decision} decision (optional):`)
        try {
            await reviewDuplicateFlag(flagId, decision, note || undefined)
            setFlags(flags.filter(f => f.id !== flagId))
        } catch (err: any) {
            alert(err.message || 'Failed to review flag')
        }
    }

    return (
        <AdminLayout title="Duplicate Review Queue">
            {error && <div className="text-red-600 mb-4">{error}</div>}

            {loading ? (
                <p className="text-gray-500">Loading queue...</p>
            ) : flags.length === 0 ? (
                <div className="bg-white p-6 rounded shadow text-gray-500 dark:bg-gray-800">
                    No pending duplicate flags to review.
                </div>
            ) : (
                <div className="space-y-4">
                    {flags.map(flag => (
                        <div key={flag.id} className="bg-white p-6 rounded shadow border border-rose-200 dark:bg-gray-800 dark:border-rose-900/30">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Duplicate Detected: {flag.match_type.replace('_', ' ')}
                                    </h3>
                                    <p className="text-sm text-gray-500">Confidence: {flag.match_confidence}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleReview(flag.id, 'APPROVED')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Approve</button>
                                    <button onClick={() => handleReview(flag.id, 'REJECTED')} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Reject</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded dark:bg-gray-900/50">
                                <div>
                                    <p className="text-xs font-bold uppercase text-gray-500 mb-2">New Session</p>
                                    <p className="text-sm dark:text-gray-300">Session ID: {flag.new_session_id}</p>
                                    <p className="text-sm dark:text-gray-300">User ID: {flag.new_user_id}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-gray-500 mb-2">Prior Record</p>
                                    <p className="text-sm dark:text-gray-300">Prior Session ID: {flag.prior_session_id}</p>
                                    <p className="text-sm dark:text-gray-300">Prior Registry ID: {flag.prior_registry_id}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    )
}
