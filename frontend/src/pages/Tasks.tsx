import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { useTasks } from '../hooks/useTasks'
import type { Task, TaskStatus, TaskPriority, CreateTaskPayload } from '../types'

export default function Tasks() {
  const { tasks, loading, error, refetch, addTask, editTask, removeTask, markComplete } = useTasks()

  const [filter, setFilter] = useState<'all' | TaskStatus>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const openCreateModal = () => {
    setEditingTask(null)
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority('medium')
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setTitle(task.title)
    setDescription(task.description || '')
    setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    setPriority(task.priority || 'medium')
    setFormError(null)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Task title is required.')
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      if (editingTask) {
        await editTask(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
          due_date: dueDate ? `${dueDate}T23:59:59` : null,
        })
      } else {
        const payload: CreateTaskPayload = {
          title: title.trim(),
          description: description.trim(),
          priority,
          due_date: dueDate ? `${dueDate}T23:59:59` : undefined,
        }
        await addTask(payload)
      }
      setModalOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (deleteTarget === null) return
    try {
      await removeTask(deleteTarget)
    } finally {
      setDeleteTarget(null)
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true
    return t.status === filter
  })

  const pendingCount = tasks.filter((t) => t.status === 'pending').length
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length
  const completedCount = tasks.filter((t) => t.status === 'completed').length

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="completed" label="Completed" />
      case 'overdue':
        return <Badge variant="overdue" label="Overdue" />
      default:
        return <Badge variant="pending" label="Pending" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Tasks</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Keep track of your study deadlines, assignments, and goals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refetch} icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateModal} icon={<Plus size={16} />}>
            New Task
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'pending'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          Overdue ({overdueCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            filter === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} />}
          title={filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
          description={
            filter === 'all'
              ? 'Create a new task or tell the AI Assistant: "Add a task to complete my assignment tomorrow"'
              : 'Everything looks clear in this category!'
          }
          action={
            filter === 'all' ? (
              <Button size="sm" onClick={openCreateModal} icon={<Plus size={14} />}>
                Add Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed'
            const isOverdue = task.status === 'overdue'

            return (
              <Card
                key={task.id}
                className={`transition-all hover:shadow-md border ${
                  isOverdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : isCompleted
                    ? 'border-slate-100 bg-slate-50/40 opacity-75'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => markComplete(task.id)}
                      className={`mt-0.5 text-slate-400 hover:text-emerald-600 transition flex-shrink-0 ${
                        isCompleted ? 'text-emerald-600' : ''
                      }`}
                      title={isCompleted ? 'Completed' : 'Mark completed'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={18} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </span>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        {task.due_date && (
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              isOverdue ? 'text-rose-600' : 'text-slate-500'
                            }`}
                          >
                            <Calendar size={12} />
                            Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Added {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit task"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Task Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={submitting} onClick={handleSave}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Operating Systems Chapter 4 Notes"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key objectives, links, or notes..."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Task"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to permanently delete this task?
        </p>
      </Modal>
    </div>
  )
}
