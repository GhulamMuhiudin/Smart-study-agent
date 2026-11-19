import { useState, useEffect } from 'react'
import {
  Bell,
  Mail,
  Bot,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  Cpu,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import api from '../services/api'

interface EmailAlertSettings {
  email_alerts_enabled: boolean
  alert_email: string | null
  alert_task_overdue: boolean
  alert_quiz_completed: boolean
  alert_study_plan_created: boolean
}

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form fields
  const [enabled, setEnabled] = useState(false)
  const [email, setEmail] = useState('')
  const [overdueAlert, setOverdueAlert] = useState(true)
  const [quizAlert, setQuizAlert] = useState(true)
  const [planAlert, setPlanAlert] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await api.get<EmailAlertSettings>('/settings/email-alerts')
      setEnabled(res.data.email_alerts_enabled)
      setEmail(res.data.alert_email || '')
      setOverdueAlert(res.data.alert_task_overdue)
      setQuizAlert(res.data.alert_quiz_completed)
      setPlanAlert(res.data.alert_study_plan_created)
    } catch (err) {
      console.error('Failed to load settings', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setNotification(null)

    try {
      await api.patch('/settings/email-alerts', {
        email_alerts_enabled: enabled,
        alert_email: email.trim() || null,
        alert_task_overdue: overdueAlert,
        alert_quiz_completed: quizAlert,
        alert_study_plan_created: planAlert,
      })
      setNotification({
        type: 'success',
        message: 'Email alert automation preferences saved successfully!',
      })
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save settings',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!email.trim()) {
      setNotification({
        type: 'error',
        message: 'Please provide and save an email address first before sending a test alert.',
      })
      return
    }

    setTestingEmail(true)
    setNotification(null)

    try {
      const res = await api.post<{ message: string }>('/settings/test-email')
      setNotification({
        type: 'success',
        message: res.data.message || 'Test alert email sent successfully! Please check your inbox.',
      })
    } catch (err) {
      setNotification({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to send test email. Ensure SMTP credentials are set in backend .env',
      })
    } finally {
      setTestingEmail(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Platform Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure automated email alerts, AI assistant preferences, and system parameters
        </p>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl text-sm border transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{notification.message}</div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="space-y-6">
          {/* Email Alert Automation Card */}
          <Card className="border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Automated Email Alerts & Notifications
                </h3>
                <p className="text-xs text-slate-500">
                  Background scheduled workers automatically trigger email alerts for important deadlines
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="pt-4 space-y-5">
              {/* Master toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">
                    Enable Background Email Automation
                  </span>
                  <span className="text-xs text-slate-500">
                    When active, APScheduler continuously tracks your tasks and sends automated notifications
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Alert Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Recipient Email Address
                </label>
                <div className="relative max-w-md">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Alerts will be dispatched via your configured SMTP service (Gmail / AWS SES).
                </p>
              </div>

              {/* Trigger Checkboxes */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Automated Triggers (Select all that apply):
                </span>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50/60 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overdueAlert}
                    onChange={(e) => setOverdueAlert(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-800 block">
                      ⏰ Overdue Task Alerts (Hourly Check)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      The automated scheduler marks expired tasks as overdue and emails you an alert.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50/60 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quizAlert}
                    onChange={(e) => setQuizAlert(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-800 block">
                      🎯 Quiz Completion Reports
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Sends your score, percentage, and topic performance summary immediately after submission.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50/60 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planAlert}
                    onChange={(e) => setPlanAlert(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-800 block">
                      📅 New Study Plan Generation Alert
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Dispatches your full multi-day study schedule to your inbox whenever generated by AI.
                    </span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={saving}
                  icon={<Save size={15} />}
                >
                  Save Alert Settings
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={testingEmail}
                  onClick={handleTestEmail}
                  icon={<Send size={15} />}
                >
                  Send Test Alert Email
                </Button>
              </div>
            </form>
          </Card>

          {/* AI Configuration Info */}
          <Card className="border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">AI Assistant Architecture</h3>
                <p className="text-xs text-slate-500">
                  Configured through environment variables for production security
                </p>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-medium mb-1">Provider Engine</span>
                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Cpu size={14} className="text-purple-600" />
                  OpenAI / Gemini API
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Configured via AI_PROVIDER in .env
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-medium mb-1">Function Calling</span>
                <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Native Tool Calling Enabled
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tools: create_plan, quiz, task, lists
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-medium mb-1">Database Engine</span>
                <span className="text-sm font-semibold text-blue-700 flex items-center gap-1.5">
                  <Database size={14} className="text-blue-600" />
                  PostgreSQL 15
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Persistent relational storage
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
              <span className="font-semibold">Security Note:</span> To change your API keys or database password, edit the{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[11px]">
                backend/.env
              </code>{' '}
              file on your server and restart the backend service. Never hardcode keys into the frontend.
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
