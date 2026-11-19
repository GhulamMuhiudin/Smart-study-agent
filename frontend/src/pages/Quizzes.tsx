import { useState } from 'react'
import {
  ClipboardList,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trophy,
  ArrowLeft,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { useQuizzes } from '../hooks/useQuizzes'

type QuizView = 'list' | 'taking' | 'results'

interface ParsedOption {
  id: string
  text: string
}

function extractOptions(q: any): ParsedOption[] {
  if (Array.isArray(q.options) && q.options.length > 0) {
    return q.options.map((opt: any) => ({
      id: String(opt.id || opt.key || '').toLowerCase(),
      text: opt.text || opt.label || '',
    }))
  }
  const opts: ParsedOption[] = []
  if (q.option_a) opts.push({ id: 'a', text: q.option_a })
  if (q.option_b) opts.push({ id: 'b', text: q.option_b })
  if (q.option_c) opts.push({ id: 'c', text: q.option_c })
  if (q.option_d) opts.push({ id: 'd', text: q.option_d })
  return opts
}

function getQuestionText(q: any): string {
  return q.question_text || q.text || q.question || 'Question'
}

// ─── Quiz List Item ────────────────────────────────────────────────────────────
function QuizListItem({ quiz, onStart }: { quiz: any; onStart: () => void }) {
  const qCount = quiz.num_questions || quiz.question_count || (quiz.questions ? quiz.questions.length : 0)
  const diff = (quiz.difficulty || 'medium').toLowerCase()

  const badgeVariant =
    diff === 'beginner' || diff === 'easy'
      ? 'easy'
      : diff === 'advanced' || diff === 'hard'
      ? 'hard'
      : 'medium'

  return (
    <Card className="flex items-center justify-between gap-4 hover:shadow-md transition-shadow border border-slate-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 text-sm">{quiz.title}</span>
          <Badge variant={badgeVariant} label={diff} />
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-700">{quiz.subject}</span>
          {quiz.topic && <span>• {quiz.topic}</span>}
          <span>• {qCount} questions</span>
          {quiz.last_score != null && (
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Score: {quiz.last_score}%
            </span>
          )}
        </div>
      </div>
      <Button size="sm" onClick={onStart} icon={<ChevronRight size={14} />}>
        Take Quiz
      </Button>
    </Card>
  )
}

// ─── Quiz Taking Interface ────────────────────────────────────────────────────
function QuizTaking({
  quiz,
  onSubmit,
  submitting,
}: {
  quiz: any
  onSubmit: (answers: Record<string, string>) => void
  submitting: boolean
}) {
  const questions: any[] = quiz.questions ?? []
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const answered = Object.keys(answers).length
  const allAnswered = questions.length > 0 && answered === questions.length

  const handleSelect = (questionId: string | number, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: optionId.toLowerCase() }))
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={<AlertCircle size={24} />}
        title="No questions in this quiz"
        description="This quiz doesn't have questions populated."
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">{quiz.title}</h2>
          <p className="text-sm text-slate-500">{quiz.subject} • {quiz.topic || 'General'}</p>
        </div>
        <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          {answered} / {questions.length} answered
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${(answered / questions.length) * 100}%` }}
        />
      </div>

      {questions.map((q, idx) => {
        const qId = q.id ?? idx
        const qText = getQuestionText(q)
        const options = extractOptions(q)
        const selectedOpt = answers[String(qId)]

        return (
          <Card key={qId} className="border border-slate-200 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 mb-3">
              <span className="text-blue-600 font-bold mr-2">Q{idx + 1}.</span>
              {qText}
            </p>
            <div className="space-y-2">
              {options.map((opt) => {
                const isSelected = selectedOpt === opt.id.toLowerCase()
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(qId, opt.id)}
                    className={`w-full text-left text-xs sm:text-sm px-4 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-medium shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold uppercase text-slate-400 mr-2.5">
                        {opt.id}.
                      </span>
                      <span>{opt.text}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </Card>
        )
      })}

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          variant="primary"
          disabled={!allAnswered}
          loading={submitting}
          onClick={() => onSubmit(answers)}
        >
          Submit Quiz ({answered}/{questions.length})
        </Button>
      </div>
    </div>
  )
}

// ─── Quiz Results Interface ───────────────────────────────────────────────────
function QuizResults({ result, onRetry }: { result: any; onRetry: () => void }) {
  const score = result.score ?? 0
  const total = result.total_questions ?? result.total ?? (result.results ? result.results.length : 1)
  const percentage = result.percentage ?? Math.round((score / total) * 100)
  const passed = percentage >= 60
  const questions: any[] = result.results ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Score Banner */}
      <Card
        className={`text-center py-6 border ${
          passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
        }`}
      >
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
            passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}
        >
          <Trophy size={28} />
        </div>
        <div className={`text-4xl font-extrabold ${passed ? 'text-emerald-800' : 'text-rose-800'}`}>
          {percentage}%
        </div>
        <div className="text-sm font-medium text-slate-600 mt-1">
          Scored {score} out of {total} correct
        </div>
        <div
          className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 uppercase tracking-wider ${
            passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {passed ? 'Passed 🎉' : 'Needs Review'}
        </div>
      </Card>

      {/* Breakdown Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 text-sm">Detailed Answers & Explanations</h3>
        <span className="text-xs text-slate-500">{questions.length} questions analyzed</span>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3">
        {questions.map((r, idx) => {
          const isCorrect = r.is_correct ?? (r.your_answer?.toLowerCase() === r.correct_answer?.toLowerCase())
          const qText = r.question_text || r.text || `Question ${idx + 1}`
          const yourAns = r.your_answer || r.selected_option || 'None'
          const correctAns = r.correct_answer || r.correct_option || 'N/A'

          return (
            <Card
              key={r.question_id ?? idx}
              className={`border ${
                isCorrect ? 'border-emerald-200 bg-white' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isCorrect ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <XCircle size={18} className="text-rose-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                    {qText}
                  </p>
                  <div className="mt-2.5 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Your answer:</span>
                      <span
                        className={`font-bold uppercase px-2 py-0.5 rounded ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {yourAns}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Correct answer:</span>
                        <span className="font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {correctAns}
                        </span>
                      </div>
                    )}

                    {r.explanation && (
                      <div className="text-slate-600 bg-slate-50 rounded-lg p-2.5 mt-2 leading-relaxed border border-slate-100">
                        <span className="font-semibold text-slate-700">Explanation: </span>
                        {r.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={onRetry}>
          Take Again
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Quizzes() {
  const { quizzes, loading, error, refetch, loadQuiz, submit } = useQuizzes()
  const [view, setView] = useState<QuizView>('list')
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleStart = async (quiz: any) => {
    setLoadingQuiz(true)
    setActionError(null)
    try {
      const full = await loadQuiz(quiz.id)
      setActiveQuiz(full)
      setView('taking')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoadingQuiz(false)
    }
  }

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!activeQuiz) return
    setSubmitting(true)
    setActionError(null)
    try {
      const res = await submit(activeQuiz.id, { answers: answers as any })
      setResult(res)
      setView('results')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setView('taking')
  }

  if (view === 'taking' && activeQuiz) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('list')}
          icon={<ArrowLeft size={14} />}
        >
          Back to Quizzes
        </Button>
        <QuizTaking quiz={activeQuiz} onSubmit={handleSubmit} submitting={submitting} />
      </div>
    )
  }

  if (view === 'results' && result) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setView('list')
            refetch()
          }}
          icon={<ArrowLeft size={14} />}
        >
          Back to Quizzes
        </Button>
        <QuizResults result={result} onRetry={handleRetry} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quizzes</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Test your knowledge with AI-generated multiple choice questions
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          icon={<RefreshCw size={14} />}
        >
          Refresh
        </Button>
      </div>

      {(error || actionError) && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} />
          {error ?? actionError}
        </div>
      )}

      {loading || loadingQuiz ? (
        <LoadingSpinner className="py-20" />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={30} />}
          title="No quizzes available"
          description="Ask the AI Assistant: 'Generate a 5-question quiz on Cloud Computing' and it will create one automatically!"
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <QuizListItem key={quiz.id} quiz={quiz} onStart={() => handleStart(quiz)} />
          ))}
        </div>
      )}
    </div>
  )
}
