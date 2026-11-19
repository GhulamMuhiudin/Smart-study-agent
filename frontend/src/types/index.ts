// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_study_hours: number
  completed_tasks: number
  quiz_avg_score: number
  active_plans: number
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export type TaskStatus = 'pending' | 'completed' | 'overdue'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateTaskPayload {
  title: string
  description: string
  priority: TaskPriority
  due_date?: string
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
}

// ─── Study Plans ──────────────────────────────────────────────────────────────
export type StudyPlanStatus = 'active' | 'completed' | 'paused'

export interface StudyPlanSession {
  topic: string
  duration_minutes: number
  scheduled_time: string
}

export interface StudyPlan {
  id: number
  title: string
  subject: string
  status: StudyPlanStatus
  total_hours: number
  sessions: StudyPlanSession[]
  created_at: string
  updated_at: string
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export type QuizDifficulty = 'easy' | 'medium' | 'hard'
export type QuizStatus = 'available' | 'attempted' | 'completed'

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: number
  text: string
  options: QuizOption[]
}

export interface Quiz {
  id: number
  title: string
  subject: string
  difficulty: QuizDifficulty
  question_count: number
  status: QuizStatus
  last_score: number | null
  questions?: QuizQuestion[]
  created_at: string
}

export interface QuizSubmitPayload {
  answers: Record<number, string>
}

export interface QuizResultQuestion {
  question_id: number
  question_text: string
  selected_option: string
  correct_option: string
  is_correct: boolean
  explanation: string
}

export interface QuizResult {
  quiz_id: number
  score: number
  total: number
  percentage: number
  passed: boolean
  results: QuizResultQuestion[]
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export type ActivityStatus = 'success' | 'failed' | 'pending' | 'running'
export type ActivityType = 'quiz' | 'task' | 'study_plan' | 'chat' | 'system'

export interface ActivityEntry {
  id: number
  type: ActivityType
  description: string
  status: ActivityStatus
  metadata: Record<string, unknown>
  created_at: string
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
}

export interface ChatRequest {
  message: string
  history?: { role: MessageRole; content: string }[]
}

export interface ChatResponse {
  reply?: string
  message?: string
  tool_called?: string
  success?: boolean
  data?: any
  agent_actions?: string[]
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export interface EmailAlertSettings {
  email_alerts_enabled: boolean
  alert_email: string | null
  alert_task_overdue: boolean
  alert_quiz_completed: boolean
  alert_study_plan_created: boolean
}

// ─── Generic API ──────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string
  status_code?: number
}

// ─── Authentication ──────────────────────────────────────────────────────────
export interface UserProfile {
  id: number
  name: string
  email: string
  is_active: boolean
  email_alerts_enabled: boolean
  alert_email: string | null
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: UserProfile
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}
