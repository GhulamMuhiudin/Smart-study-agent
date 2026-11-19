import { useState, useEffect, useCallback } from 'react'
import { fetchStudyPlans, deleteStudyPlan } from '../services/api'
import type { StudyPlan } from '../types'

export function useStudyPlans() {
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchStudyPlans()
      setPlans(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const removePlan = async (id: number): Promise<void> => {
    await deleteStudyPlan(id)
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  return { plans, loading, error, refetch: load, removePlan }
}
