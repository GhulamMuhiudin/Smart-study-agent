import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Terminal,
  AlertTriangle,
  Info,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import api from '../services/api'

interface ExecutionRecord {
  id: number
  user_id: number
  user_instruction: string
  tool_name: string | null
  status: string
  result_summary: string | null
  error_details: string | null
  created_at: string
}

export default function ActivityHistory() {
  const [records, setRecords] = useState<ExecutionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<ExecutionRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get<ExecutionRecord[]>('/activity', { params: { limit: 100 } })
      setRecords(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const filteredRecords = records.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter
    const matchesSearch =
      searchQuery === '' ||
      r.user_instruction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.tool_name && r.tool_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.result_summary && r.result_summary.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'success') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-500" />
          Success
        </span>
      )
    }
    if (s === 'error' || s === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={12} className="text-rose-500" />
          Failed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} className="text-amber-500" />
        Pending
      </span>
    )
  }

  const formatToolName = (name: string | null) => {
    if (!name) return <span className="text-slate-400 italic">Conversational (No Tool)</span>
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
        <Terminal size={11} />
        {name}
      </span>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Agent Activity History</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time audit log of user instructions, AI function calls, and backend executions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecords}
            loading={loading}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search instructions or tools..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setStatusFilter('success')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              statusFilter === 'success'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Success
          </button>
          <button
            onClick={() => setStatusFilter('error')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              statusFilter === 'error'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={<Activity size={32} />}
          title="No agent activity recorded"
          description="Whenever you interact with the AI Assistant or trigger automated jobs, execution traces will appear here."
        />
      ) : (
        <Card padding={false} className="overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User Instruction</th>
                  <th className="py-3 px-4">Tool Executed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {new Date(r.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {r.user_instruction}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {formatToolName(r.tool_name)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3 px-4 max-w-sm truncate text-slate-500">
                      {r.result_summary || (r.status === 'error' ? r.error_details : '—')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline"
                      >
                        <Info size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Inspection Modal */}
      <Modal
        open={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        title="Agent Execution Details"
        size="lg"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setSelectedRecord(null)}>
            Close
          </Button>
        }
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Timestamp & ID
              </span>
              <p className="text-slate-800 font-mono">
                Log #{selectedRecord.id} • {new Date(selectedRecord.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1">
                User Instruction
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-medium">
                "{selectedRecord.user_instruction}"
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Selected Tool
                </span>
                <div>{formatToolName(selectedRecord.tool_name)}</div>
              </div>
              <div>
                <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Execution Status
                </span>
                <div>{getStatusBadge(selectedRecord.status)}</div>
              </div>
            </div>

            {selectedRecord.result_summary && (
              <div>
                <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Result Summary
                </span>
                <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-3 text-emerald-900 whitespace-pre-wrap leading-relaxed">
                  {selectedRecord.result_summary}
                </div>
              </div>
            )}

            {selectedRecord.error_details && (
              <div>
                <span className="block text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Error Details
                </span>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 font-mono whitespace-pre-wrap">
                  {selectedRecord.error_details}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
