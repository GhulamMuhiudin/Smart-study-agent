import { useState } from 'react'
import {
  BookOpen,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { useStudyPlans } from '../hooks/useStudyPlans'

function PlanCard({ plan, onDelete }: { plan: any; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const sessions: any[] = plan.sessions || []
  const subjectsStr = Array.isArray(plan.subjects)
    ? plan.subjects.join(', ')
    : plan.subject || 'All Subjects'
  const totalHours =
    plan.total_hours ??
    (plan.total_days && plan.hours_per_day ? plan.total_days * plan.hours_per_day : 0)

  return (
    <Card className="transition-all hover:shadow-md border border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 text-sm">{plan.title}</h3>
            <Badge variant="active" label="Active" />
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">{subjectsStr}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Clock size={12} className="text-blue-600" />
              {totalHours}h total ({plan.hours_per_day || 2}h/day)
            </span>
            <span className="flex items-center gap-1">
              <Layers size={12} className="text-slate-400" />
              {sessions.length || plan.total_days || 0} sessions
            </span>
            {plan.start_date && (
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                {plan.start_date} to {plan.end_date || 'Ongoing'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {sessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((p) => !p)}
              icon={expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            >
              {expanded ? 'Hide' : 'Sessions'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(plan.id)}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {expanded && sessions.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
          {sessions.map((session, i) => {
            const duration = session.duration_hours
              ? `${session.duration_hours}h`
              : session.duration_minutes
              ? `${session.duration_minutes}m`
              : '1h'
            const timeInfo = session.start_time
              ? `${session.start_time} - ${session.end_time || ''}`
              : session.date || `Day ${session.day_number || i + 1}`

            return (
              <div
                key={session.id || i}
                className="flex items-center justify-between gap-3 text-xs bg-slate-50/80 rounded-lg px-3 py-2 border border-slate-100"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {session.topic || session.subject || `Study Session ${i + 1}`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Day {session.day_number || i + 1} • {session.subject || subjectsStr}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-slate-500 font-mono text-[11px]">
                  <span>{timeInfo}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-sans font-medium text-blue-700">
                    {duration}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default function StudyPlanner() {
  const { plans, loading, error, refetch, removePlan } = useStudyPlans()
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (deleteTarget === null) return
    setDeleting(true)
    try {
      await removePlan(deleteTarget)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Study Planner</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Organized schedules and structured study routines created by your AI assistant
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch} icon={<Clock size={14} />}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={30} />}
          title="No study plans found"
          description="Ask the AI Assistant: 'Create a 5-day study plan for Cloud Computing, 2 hours per day' to generate one automatically!"
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Study Plan"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this study plan and its scheduled sessions?
        </p>
      </Modal>
    </div>
  )
}
