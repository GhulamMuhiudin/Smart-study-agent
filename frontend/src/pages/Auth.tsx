import React, { useState } from 'react'
import { GraduationCap, Mail, Lock, User as UserIcon, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const Auth: React.FC = () => {
  const { login, register, demoLogin } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Please enter your full name')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        await register({ name, email, password })
      } else {
        await login({ email, password })
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setError(null)
    setLoading(true)
    try {
      await demoLogin()
    } catch (err: any) {
      setError(err.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-100 -z-10" />

      <div className="w-full max-w-md">
        {/* App Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Smart Study Agent
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-Powered University Study Assistant & Planner
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                setError(null)
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                !isRegister
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true)
                setError(null)
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                isRegister
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-sm flex items-start gap-2.5">
                <span className="font-semibold text-red-800">Error:</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                  />
                </div>
                {isRegister && (
                  <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegister ? 'Register & Enter Dashboard' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-xs text-slate-400 uppercase tracking-wider">
                Or quick test
              </span>
            </div>

            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 font-medium text-sm transition-all flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Instant Demo Login (student@studyagent.local)</span>
            </button>
          </div>

          {/* Card Footer Features */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Private Data Isolation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Personalized AI Agent
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
