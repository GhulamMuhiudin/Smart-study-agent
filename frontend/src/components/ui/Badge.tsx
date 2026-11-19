type BadgeVariant =
  | 'pending'
  | 'completed'
  | 'overdue'
  | 'active'
  | 'paused'
  | 'success'
  | 'failed'
  | 'running'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'default'

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  children?: string
}

const styles: Record<BadgeVariant, string> = {
  pending:   'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  overdue:   'bg-red-100 text-red-700',
  active:    'bg-blue-100 text-blue-700',
  paused:    'bg-slate-100 text-slate-600',
  success:   'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
  running:   'bg-blue-100 text-blue-700',
  easy:      'bg-green-100 text-green-700',
  medium:    'bg-amber-100 text-amber-700',
  hard:      'bg-red-100 text-red-700',
  default:   'bg-slate-100 text-slate-600',
}

export default function Badge({ variant, label, children }: BadgeProps) {
  const text = label ?? children ?? variant
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[variant]}`}
    >
      {text}
    </span>
  )
}
