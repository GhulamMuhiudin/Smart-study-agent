import axios from 'axios'
import type {
  DashboardStats,
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  StudyPlan,
  Quiz,
  QuizSubmitPayload,
  QuizResult,
  ActivityEntry,
  ChatRequest,
  ChatResponse,
  EmailAlertSettings,
  UserProfile,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Attach Bearer token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for uniform error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Auto-clear invalid token
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'An unknown error occurred'
    return Promise.reject(new Error(message))
  }
)

// ─── Authentication ──────────────────────────────────────────────────────────
export const loginApi = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}

export const registerApi = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  return data
}

export const demoLoginApi = async (): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/demo')
  return data
}

export const fetchCurrentUserApi = async (): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>('/auth/me')
  return data
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const fetchTasks = async (): Promise<Task[]> => {
  const { data } = await api.get<Task[]>('/tasks')
  return data
}

export const fetchTask = async (id: number): Promise<Task> => {
  const { data } = await api.get<Task>(`/tasks/${id}`)
  return data
}

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const { data } = await api.post<Task>('/tasks', payload)
  return data
}

export const updateTask = async (id: number, payload: UpdateTaskPayload): Promise<Task> => {
  const { data } = await api.patch<Task>(`/tasks/${id}`, payload)
  return data
}

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`)
}

export const completeTask = async (id: number): Promise<Task> => {
  const { data } = await api.patch<Task>(`/tasks/${id}`, { status: 'completed' })
  return data
}

// ─── Study Plans ──────────────────────────────────────────────────────────────
export const fetchStudyPlans = async (): Promise<StudyPlan[]> => {
  const { data } = await api.get<StudyPlan[]>('/study-plans')
  return data
}

export const fetchStudyPlan = async (id: number): Promise<StudyPlan> => {
  const { data } = await api.get<StudyPlan>(`/study-plans/${id}`)
  return data
}

export const deleteStudyPlan = async (id: number): Promise<void> => {
  await api.delete(`/study-plans/${id}`)
}

export const fetchTodayStudyPlan = async (): Promise<StudyPlan | null> => {
  try {
    const { data } = await api.get<StudyPlan>('/study-plans/today')
    return data
  } catch {
    return null
  }
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const fetchQuizzes = async (): Promise<Quiz[]> => {
  const { data } = await api.get<Quiz[]>('/quizzes')
  return data
}

export const fetchQuiz = async (id: number): Promise<Quiz> => {
  const { data } = await api.get<Quiz>(`/quizzes/${id}`)
  return data
}

export const submitQuiz = async (id: number, payload: QuizSubmitPayload): Promise<QuizResult> => {
  const { data } = await api.post<QuizResult>(`/quizzes/${id}/submit`, payload)
  return data
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export const fetchActivity = async (limit?: number): Promise<ActivityEntry[]> => {
  const { data } = await api.get<ActivityEntry[]>('/activity', {
    params: limit ? { limit } : undefined,
  })
  return data
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────
export const sendChatMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const { data } = await api.post<ChatResponse>('/agent/chat', payload)
  return data
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export const fetchEmailAlertSettings = async (): Promise<EmailAlertSettings> => {
  const { data } = await api.get<EmailAlertSettings>('/settings/email-alerts')
  return data
}

export const updateEmailAlertSettings = async (
  payload: Partial<EmailAlertSettings>
): Promise<EmailAlertSettings> => {
  const { data } = await api.patch<EmailAlertSettings>('/settings/email-alerts', payload)
  return data
}

export default api
