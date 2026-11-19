import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export default function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200/80 ${
        padding ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
