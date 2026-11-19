import { useState, useEffect, useCallback } from 'react'
import { fetchQuizzes, fetchQuiz, submitQuiz } from '../services/api'
import type { Quiz, QuizSubmitPayload, QuizResult } from '../types'

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchQuizzes()
      setQuizzes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadQuiz = async (id: number): Promise<Quiz> => {
    return fetchQuiz(id)
  }

  const submit = async (id: number, payload: QuizSubmitPayload): Promise<QuizResult> => {
    const result = await submitQuiz(id, payload)
    // Refresh list to update last_score
    load()
    return result
  }

  return { quizzes, loading, error, refetch: load, loadQuiz, submit }
}
