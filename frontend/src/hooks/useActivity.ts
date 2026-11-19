import { useState, useEffect, useCallback } from 'react'
import { fetchActivity } from '../services/api'
import type { ActivityEntry } from '../types'

export function useActivity(limit?: number) {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchActivity(limit)
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    load()
  }, [load])

  return { activities, loading, error, refetch: load }
}
