import { useState, useEffect } from 'react'
import { fetchDashboardStats } from '../services/api'
import type { DashboardStats } from '../types'

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDashboardStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
      setStats({
        total_study_hours: 0,
        completed_tasks: 0,
        quiz_avg_score: 0,
        active_plans: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return { stats, loading, error, refetch: load }
}
