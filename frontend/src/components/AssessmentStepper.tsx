import { useState, useMemo } from 'react'
import { BehaviouralType } from '../api/behavioralTypes'
import { Question } from '../api/questions'

interface AssessmentStepperProps {
    sections: BehaviouralType[]
    questions: Question[]
    answers: Record<number, 'A' | 'B'>
    savingIds: Set<number>
    saveErrors: Record<number, string>
    onSelect: (questionId: number, option: 'A' | 'B') => void
    onSubmit?: () => void
    submitting?: boolean
    submitError?: string | null
    isPreview?: boolean
}

export default function AssessmentStepper({
    sections,
    questions,
    answers,
    savingIds,
    saveErrors,
    onSelect,
    onSubmit,
    submitting = false,
    submitError = null,
    isPreview = false,
}: AssessmentStepperProps) {
    // -1 is the initial instructions splash, steps.length is the final review page
    const [currentStep, setCurrentStep] = useState(-1)

    const steps = useMemo(() => {
        const generatedSteps: {
            type: 'questions'
            section: BehaviouralType
            sectionLabel: string
            isFirstOfSection: boolean
            questions: Question[]
        }[] = []

        // Sort sections by order_index
        const sortedSections = [...sections].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

        sortedSections.forEach((section, index) => {
            const sectionQuestions = questions
                .filter((q) => q.behavioural_type_id === section.id)
                .sort((a, b) => a.number - b.number)

            if (sectionQuestions.length === 0) return

            // Map positions 0,1,2 to Section A, B, C
            const sectionLabel = `Section ${String.fromCharCode(65 + index)}`

            // Chunk questions into pairs without mixing sections
            for (let i = 0; i < sectionQuestions.length; i += 2) {
                const pair = sectionQuestions.slice(i, i + 2)
                generatedSteps.push({
                    type: 'questions',
                    section,
                    sectionLabel,
                    isFirstOfSection: i === 0,
                    questions: pair,
                })
            }
        })

        return generatedSteps
    }, [sections, questions])

    const totalQuestions = questions.length
    const answeredCount = questions.filter((q) => answers[q.id]).length
    const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions
    const questionStepMeta = useMemo(() => {
        const meta = new Map<number, { stepIndex: number; sectionLabel: string }>()

        steps.forEach((step, stepIndex) => {
            step.questions.forEach((question) => {
                meta.set(question.id, {
                    stepIndex,
                    sectionLabel: step.sectionLabel,
                })
            })
        })

        return meta
    }, [steps])

    const handleNext = () => {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    }

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, -1))
    }

    // --- Splash Screen (-1) ---
    if (currentStep === -1) {
        return (
            <div className="space-y-6">
                {isPreview && (
                    <div className="bg-purple-100 text-purple-800 p-2 text-center text-sm font-bold rounded">
                        Preview Mode - Answers will not be saved
                    </div>
                )}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg dark:bg-yellow-900/30 dark:border-amber-600 mb-6">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Important Disclaimer
                            </h3>
                            <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                                <p>
                                    Please answer honestly based on your true inclinations, not what you think is expected. Your results are confidential and used solely for your personal assessment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-8 dark:bg-gray-800 dark:border dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Welcome to the Assessment</h2>
                    <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold leading-6 mb-4">
                        This Assessment is designed to help you understand your behavioural response to different triggers and situations. It is divided into three sections.
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-6 ml-2">
                        <li><strong>Section A</strong> identifies your key and pre-dominant drivers and Motivators.</li>
                        <li><strong>Section B</strong> identifies your Change and Adaptability quotient through your response to uncertainty.</li>
                        <li><strong>Section C</strong> identifies your Communication style.</li>
                    </ul>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-8">
                        Each section has a set of instructions before the start. Please read and follow the instructions since they are different for each section.
                    </p>

                    <div className="flex justify-end">
                        <button
                            onClick={handleNext}
                            className="bg-blue-600 text-white rounded px-6 py-3 text-sm font-medium hover:bg-blue-700 transition"
                        >
                            Begin Assessment →
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // --- Review Screen (steps.length) ---
    if (currentStep === steps.length) {
        const unansweredQuestions = questions.filter((q) => !answers[q.id])

        return (
            <div className="space-y-6">
                {isPreview && (
                    <div className="bg-purple-100 text-purple-800 p-2 text-center text-sm font-bold rounded">
                        Preview Mode - Answers will not be saved
                    </div>
                )}
                <div className="bg-white shadow rounded-lg p-8 dark:bg-gray-800 dark:border dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Review & Submit</h2>

                    <div className="mb-8">
                        <p className="text-lg text-gray-700 dark:text-gray-300">
                            You have answered <strong className="text-blue-600 dark:text-blue-400">{answeredCount}</strong> out of <strong>{totalQuestions}</strong> choices.
                        </p>

                        {!allAnswered && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/30 dark:border-red-800">
                                <p className="text-sm text-red-700 dark:text-red-400 font-semibold mb-2">
                                    Unanswered choices:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {unansweredQuestions.map(q => {
                                        // Find which step this question belongs to and allow quick jumping
                                        const stepMeta = questionStepMeta.get(q.id)
                                        const stepIdx = stepMeta?.stepIndex ?? steps.findIndex(s => s.questions.some(sq => sq.id === q.id))
                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => setCurrentStep(stepIdx)}
                                                className="bg-white dark:bg-gray-700 border border-red-300 dark:border-red-500 text-red-700 dark:text-red-400 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/50 text-sm transition"
                                            >
                                                {stepMeta?.sectionLabel ?? 'Section ?'} - Q {q.number}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {submitError && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                            {submitError}
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-6">
                        <button
                            onClick={handleBack}
                            className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded px-6 py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={!allAnswered || submitting || isPreview}
                            className="bg-blue-600 text-white rounded px-6 py-3 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // --- Question Pairs (0 to steps.length - 1) ---
    const currentStepData = steps[currentStep]

    return (
        <div className="space-y-6">
            {isPreview && (
                <div className="bg-purple-100 text-purple-800 p-2 text-center text-sm font-bold rounded">
                    Preview Mode - Answers will not be saved
                </div>
            )}

            {/* Top Bar (Static per step) */}
            <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap dark:bg-gray-800 dark:border dark:border-gray-700">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {currentStepData.sectionLabel}
                    </h2>
                </div>
                <div className="flex-1 max-w-sm ml-auto">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{answeredCount} of {totalQuestions} answered</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
                        />
                    </div>
                </div>
                {savingIds.size > 0 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                        Saving...
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800 dark:border dark:border-gray-700">

                {/* Section Instructions Callout (Only on the first pair of the section) */}
                {currentStepData.isFirstOfSection && currentStepData.section.instructions && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 px-6 py-4">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                            {currentStepData.section.instructions}
                        </p>
                    </div>
                )}

                {/* Questions */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {currentStepData.questions.map((question) => {
                        const selected = answers[question.id]
                        const saving = savingIds.has(question.id)
                        return (
                            <div key={question.id} className="p-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {(['A', 'B'] as const).map((opt) => {
                                        const isSel = selected === opt
                                        const text = opt === 'A' ? question.option_a_text : question.option_b_text
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => onSelect(question.id, opt)}
                                                className={`text-left rounded-lg border p-4 transition ${isSel
                                                    ? 'border-green-700 bg-green-100 ring-2 ring-green-300 dark:border-green-300 dark:bg-green-800 dark:ring-green-900 '
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-200 mr-2">
                                                    {question.number} {opt}
                                                </span>
                                                <span className="text-sm text-gray-700 dark:text-gray-200">{text}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="mt-2 h-4">
                                    {saving && <span className="text-xs text-gray-400">Saving...</span>}
                                    {saveErrors[question.id] && (
                                        <span className="text-xs text-red-600">
                                            {saveErrors[question.id]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Navigation Footer */}
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between">
                    <button
                        onClick={handleBack}
                        className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded px-4 py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                        ← Back
                    </button>

                    <button
                        onClick={handleNext}
                        className="bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 rounded px-4 py-2 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition"
                    >
                        {currentStep === steps.length - 1 ? 'Review →' : 'Next →'}
                    </button>
                </div>

            </div>
        </div>
    )
}
