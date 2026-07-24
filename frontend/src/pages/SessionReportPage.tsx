import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSessionReport, SessionReport } from '../api/sessions';

export function SessionReportPage() {
    const { id } = useParams<{ id: string }>();
    const [report, setReport] = useState<SessionReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            getSessionReport(Number(id))
                .then(setReport)
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading report...</div>;
    if (!report) return <div className="p-8 text-center text-red-500">Report not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg my-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">BRET Assessment Report</h1>
                    <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                        <p>Candidate: <span className="font-semibold text-gray-900">{report.user.name}</span></p>
                        <p>Product Type: <span className="font-semibold text-gray-900">{report.user.product_type}</span></p>
                        <p>Form: <span className="font-semibold text-gray-900">{report.form.name}</span></p>
                        <p>Date: <span className="font-semibold text-gray-900">{new Date(report.session.submitted_at || '').toLocaleDateString()}</span></p>
                    </div>
                    <div className='mt-2'>
                        <Link
                            to={`/portal/sessions/${id}/results`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                        >
                            ← Back to results
                        </Link>
                    </div>
                    <div className='mt-2'>
                        <Link
                            to={`/portal`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                        >
                            ← Back to Questionnaire
                        </Link>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="mt-4 sm:mt-0 bg-blue-600 text-white px-5 py-2 rounded-md shadow hover:bg-blue-700 transition print:hidden"
                >
                    Print Report
                </button>
            </div>

            {/* Sections */}
            <div className="space-y-12">
                {report.sections.map(section => (
                    <div key={section.section_id} className="pt-2">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-blue-600 pl-3">
                            {section.section_code}: {section.section_name}
                        </h2>

                        <div className="space-y-6">
                            {section.factors.map(factor => (
                                <div key={factor.factor_id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-semibold text-gray-900">{factor.factor_name}</h3>
                                        <div className="text-right">
                                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                                Score: {factor.score}/5
                                            </span>
                                            {factor.score_label && (
                                                <p className="text-sm text-gray-500 mt-1 font-medium">{factor.score_label}</p>
                                            )}
                                        </div>
                                    </div>

                                    {factor.statement_title && (
                                        <h4 className="text-lg font-medium text-gray-800 mb-2">{factor.statement_title}</h4>
                                    )}

                                    {factor.statement ? (
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{factor.statement}</p>
                                    ) : (
                                        <p className="text-gray-400 italic text-sm">No report statement configured for this score.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
