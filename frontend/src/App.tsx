import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Auth } from './pages/Auth'
import MainLayout from './components/layout/MainLayout'
import Overview from './pages/Overview'
import AIAssistant from './pages/AIAssistant'
import StudyPlanner from './pages/StudyPlanner'
import Quizzes from './pages/Quizzes'
import Tasks from './pages/Tasks'
import ActivityHistory from './pages/ActivityHistory'
import Settings from './pages/Settings'

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">Loading workspace...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Auth />
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/assistant" element={<AIAssistant />} />
        <Route path="/planner" element={<StudyPlanner />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/activity" element={<ActivityHistory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
