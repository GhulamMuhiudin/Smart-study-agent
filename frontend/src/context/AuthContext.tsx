import React, { createContext, useContext, useState, useEffect } from 'react'
import type { UserProfile, LoginPayload, RegisterPayload } from '../types'
import { loginApi, registerApi, demoLoginApi, fetchCurrentUserApi } from '../services/api'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  demoLogin: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('token')
      if (!savedToken) {
        setIsLoading(false)
        return
      }
      try {
        const profile = await fetchCurrentUserApi()
        setUser(profile)
        localStorage.setItem('user', JSON.stringify(profile))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }
    verifyToken()
  }, [])

  const handleAuthSuccess = (accessToken: string, userProfile: UserProfile) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(userProfile))
    setToken(accessToken)
    setUser(userProfile)
  }

  const login = async (payload: LoginPayload) => {
    const res = await loginApi(payload)
    handleAuthSuccess(res.access_token, res.user)
  }

  const register = async (payload: RegisterPayload) => {
    const res = await registerApi(payload)
    handleAuthSuccess(res.access_token, res.user)
  }

  const demoLogin = async () => {
    const res = await demoLoginApi()
    handleAuthSuccess(res.access_token, res.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
