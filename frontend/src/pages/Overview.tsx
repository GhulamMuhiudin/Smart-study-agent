import { useNavigate } from 'react-router-dom'
import { useState, KeyboardEvent } from 'react'
import {
  Clock,
  CheckSquare,
  Star,
  BookOpen,
  ArrowRight,
  Send,
  ClipboardList,
  Activity,
  AlertCircle,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { useStats } from '../hooks/useStats'
import { useTasks } from '../hooks/useTasks'
import { useStudyPlans } from '../hooks/useStudyPlans'
import { useActivity } from '../hooks/useActivity'
import type { TaskStatus, ActivityStatus } from '../types'

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  unit?: string
  color: string
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-800 leading-none">
          {value}
          {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </Card>
  )
}

const taskBadgeVariant = (status: TaskStatus) => {
  if (status === 'completed') return 'completed'
  if (status === 'overdue') return 'overdue'
  return 'pending'
}

const activityBadgeVariant = (status: ActivityStatus) => {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'failed'
  if (status === 'running') return 'running'
  return 'pending'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Overview() {
  const navigate = useNavigate()
  const [quickMsg, setQuickMsg] = useState('')

  const { stats, loading: statsLoading } = useStats()
  const { tasks, loading: tasksLoading } = useTasks()
  const { plans, loading: plansLoading } = useStudyPlans()
  const { activities, loading: actLoading } = useActivity(5)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const upcomingTasks = (tasks || [])
    .filter((t) => t.status !== 'completed')
    .slice(0, 4)

  const activePlan = (plans || []).find((p) => p.status === 'active') || (plans && plans.length > 0 ? plans[0] : null)
  const recentActs = (activities || []).slice(0, 5)

  const handleQuickSend = () => {
    if (!quickMsg.trim()) return
    navigate('/assistant', { state: { initialMessage: quickMsg.trim() } })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleQuickSend()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Good day! 👋</h2>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {/* Stat Cards */}
      {statsLoading ? (
        <LoadingSpinner className="py-10" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Clock size={20} className="text-blue-600" />}
            label="Total Study Hours"
            value={stats?.total_study_hours ?? 0}
            unit="hrs"
            color="bg-blue-50"
          />
          <StatCard
            icon={<CheckSquare size={20} className="text-green-600" />}
            label="Completed Tasks"
            value={stats?.completed_tasks ?? 0}
            color="bg-green-50"
          />
          <StatCard
            icon={<Star size={20} className="text-amber-600" />}
            label="Quiz Avg Score"
            value={
              stats?.quiz_avg_score != null
                ? `${stats.quiz_avg_score}%`
                : '0%'
            }
            color="bg-amber-50"
          />
          <StatCard
            icon={<BookOpen size={20} className="text-purple-600" />}
            label="Active Plans"
            value={stats?.active_plans ?? 0}
            color="bg-purple-50"
          />
        </div>
      )}

      {/* Quick AI + Today's Plan */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Quick AI Assistant */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 text-sm">Quick AI Assistant</h3>
            <button
              onClick={() => navigate('/assistant')}
              className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition"
            >
              Open <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={quickMsg}
              onChange={(e) => setQuickMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your studies..."
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400"
            />
            <button
              onClick={handleQuickSend}
              disabled={!quickMsg.trim()}
              className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-lg transition flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </div>
        </Card>

        {/* Today's Study Plan */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 text-sm">Today's Study Plan</h3>
            <button
              onClick={() => navigate('/planner')}
              className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition"
            >
              All plans <ArrowRight size={12} />
            </button>
          </div>
          {plansLoading ? (
            <LoadingSpinner size="sm" className="py-4" />
          ) : activePlan ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{activePlan.title}</div>
                  <div className="text-xs text-slate-500">
                    {Array.isArray((activePlan as any).subjects)
                      ? (activePlan as any).subjects.join(', ')
                      : activePlan.subject || 'All Subjects'}
                  </div>
                </div>
                <Badge variant="active" label="Active" />
              </div>
              {((activePlan as any).sessions || []).slice(0, 2).map((s: any, i: number) => {
                const duration = s.duration_hours
                  ? `${s.duration_hours}h`
                  : s.duration_minutes
                  ? `${s.duration_minutes}m`
                  : '1h'
                return (
                  <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="font-medium truncate">{s.topic || s.subject || `Session ${i + 1}`}</span>
                    <span className="text-slate-400 ml-2 flex-shrink-0 font-mono text-[11px]">{duration}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen size={22} />}
              title="No active plan"
              description="Ask the AI assistant to generate a study plan."
            />
          )}
        </Card>
      </div>

      {/* Upcoming Tasks + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upcoming Tasks */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-semibold text-slate-700 text-sm">Upcoming Tasks</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition"
            >
              All tasks <ArrowRight size={12} />
            </button>
          </div>
          {tasksLoading ? (
            <LoadingSpinner size="sm" className="py-6" />
          ) : upcomingTasks.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={22} />}
              title="No pending tasks"
              description="All caught up!"
            />
          ) : (
            <ul className="divide-y divide-slate-100 pb-2">
              {upcomingTasks.map((task) => {
                const due = task.due_date || (task as any).deadline
                return (
                  <li key={task.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{task.title}</div>
                      {due && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Due {formatDate(due)}
                        </div>
                      )}
                    </div>
                    <Badge variant={taskBadgeVariant(task.status)} />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Recent Agent Activity */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-semibold text-slate-700 text-sm">Recent Agent Activity</h3>
            <button
              onClick={() => navigate('/activity')}
              className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition"
            >
              Full log <ArrowRight size={12} />
            </button>
          </div>
          {actLoading ? (
            <LoadingSpinner size="sm" className="py-6" />
          ) : recentActs.length === 0 ? (
            <EmptyState
              icon={<Activity size={22} />}
              title="No activity yet"
              description="Completed actions will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100 pb-2">
              {recentActs.map((act) => {
                const desc = act.description || (act as any).user_instruction || (act as any).result_summary || 'Agent action'
                const toolType = ((act as any).tool_name || act.type || 'assistant').replace('_', ' ')
                return (
                  <li key={act.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-700 truncate">{desc}</div>
                      <div className="text-xs text-slate-400 mt-0.5 capitalize">{toolType}</div>
                    </div>
                    <Badge variant={activityBadgeVariant(act.status)} />
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Error fallback hint */}
      {!statsLoading && !stats && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          <span>Could not connect to backend — showing 0 values.</span>
        </div>
      )}
    </div>
  )
}
