import { useState, useEffect, useCallback } from 'react'
import { fetchTasks, createTask, updateTask, deleteTask, completeTask } from '../services/api'
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTasks()
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addTask = async (payload: CreateTaskPayload): Promise<Task> => {
    const task = await createTask(payload)
    setTasks((prev) => [task, ...prev])
    return task
  }

  const editTask = async (id: number, payload: UpdateTaskPayload): Promise<Task> => {
    const updated = await updateTask(id, payload)
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }

  const removeTask = async (id: number): Promise<void> => {
    await deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const markComplete = async (id: number): Promise<void> => {
    const updated = await completeTask(id)
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  return { tasks, loading, error, refetch: load, addTask, editTask, removeTask, markComplete }
}
