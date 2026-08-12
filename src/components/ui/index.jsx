import { useState, useEffect } from 'react'
import { X, Search, Inbox, Loader2, UploadCloud } from 'lucide-react'
import { classNames } from '../../utils/helpers'

const BTN_VARIANTS = {
  primary: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-md shadow-violet-500/20 focus:ring-violet-500/40',
  secondary: 'border border-surface-border bg-surface-card text-ink-muted hover:bg-surface-hover hover:text-ink focus:ring-ink-muted/20',
  ghost: 'text-ink-muted hover:bg-surface-hover hover:text-ink focus:ring-ink-muted/15',
  danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-500/20 focus:ring-red-500/40',
  success: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 shadow-md shadow-emerald-500/20 focus:ring-emerald-500/40',
  soft: 'bg-violet-100 text-violet-700 hover:bg-violet-200 focus:ring-violet-500/30',
}
const BTN_SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2',
}
export function Button({ variant = 'primary', size = 'md', icon: Icon, children, className, ...props }) {
  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        BTN_VARIANTS[variant], BTN_SIZES[size], className
      )}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 18} />}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, className, size = 18, ...props }) {
  return (
    <button
      className={classNames('inline-flex items-center justify-center rounded-xl p-2 text-ink-muted transition-all duration-150 hover:bg-surface-hover hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink-muted/15 active:scale-[0.95]', className)}
      {...props}
    >
      <Icon size={size} />
    </button>
  )
}

export function Card({ className, children, ...props }) {
  return (
    <div className={classNames('rounded-2xl bg-surface-card shadow-card ring-1 ring-ink-muted/[0.04]', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, icon: Icon, className }) {
  return (
    <div className={classNames('flex items-center justify-between gap-3 border-b border-surface-border/60 px-5 py-4', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600">
            <Icon size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">{title}</h3>
          {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'from-violet-100 to-fuchsia-100 text-violet-600',
    emerald: 'from-emerald-100 to-green-100 text-emerald-600',
    amber: 'from-amber-100 to-orange-100 text-amber-600',
    rose: 'from-rose-100 to-red-100 text-rose-600',
    sky: 'from-sky-100 to-blue-100 text-sky-600',
    violet: 'from-violet-100 to-purple-100 text-violet-600',
  }
  return (
    <Card className="p-5 transition-all duration-150 hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-ink">{value}</p>
          {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
        </div>
        {Icon && (
          <span className={classNames('grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ring-1 ring-ink-muted/[0.04]', tones[tone])}>
            <Icon size={22} />
          </span>
        )}
      </div>
    </Card>
  )
}

const BADGE_TONES = {
  slate: 'bg-surface-border/60 text-ink-muted',
  brand: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
}
export function Badge({ tone = 'slate', children, className, dot = false }) {
  return (
    <span className={classNames('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider', BADGE_TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    active: { tone: 'emerald', label: 'Active' },
    requested: { tone: 'violet', label: 'Requested' },
    pending: { tone: 'amber', label: 'Pending' },
    inactive: { tone: 'red', label: 'Inactive' },
    enrolled: { tone: 'emerald', label: 'Enrolled' },
    submitted: { tone: 'sky', label: 'Submitted' },
    graded: { tone: 'emerald', label: 'Graded' },
    missing: { tone: 'red', label: 'Missing' },
    'in-progress': { tone: 'amber', label: 'In progress' },
    final: { tone: 'emerald', label: 'Final' },
  }
  const s = map[status] || { tone: 'slate', label: status }
  return <Badge tone={s.tone} dot>{s.label}</Badge>
}

export function Avatar({ user, size = 'md', className }) {
  const sizes = { xs: 'h-7 w-7 text-xs', sm: 'h-9 w-9 text-sm', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }
  const inits = user ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() : '?'
  return (
    <span className={classNames('inline-grid place-items-center rounded-full font-semibold text-white shrink-0 ring-2 ring-white/80', user?.avatarColor || 'bg-gradient-to-br from-violet-500 to-fuchsia-600', sizes[size], className)}>
      {inits}
    </span>
  )
}

export function FormField({ label, error, required, children, hint, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="field-label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

export function Input({ error, className, ...props }) {
  return <input className={classNames('field-input', error && 'field-input-error', className)} {...props} />
}

export function Textarea({ error, className, ...props }) {
  return <textarea className={classNames('field-input min-h-[96px] resize-y', error && 'field-input-error', className)} {...props} />
}

export function Select({ error, className, children, ...props }) {
  return (
    <select className={classNames('field-input appearance-none', error && 'field-input-error', className)} {...props}>
      {children}
    </select>
  )
}

export function SearchInput({ className, ...props }) {
  return (
    <div className={classNames('relative', className)}>
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input className="field-input pl-10" {...props} />
    </div>
  )
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const today = new Date()
const curYear = today.getFullYear()
const curMonth = today.getMonth() + 1
const curDay = today.getDate()
const YEARS = Array.from({ length: 6 }, (_, i) => curYear + i)

export function DatePicker({ value, onChange, className, minDate }) {
  const min = minDate ? new Date(minDate) : today
  const minY = min.getFullYear()
  const minM = min.getMonth() + 1
  const minD = min.getDate()

  const [parts, setParts] = useState(() => {
    const p = value ? value.split('-') : []
    return { y: p[0] || '', m: p[1] || '', d: p[2] || '' }
  })

  useEffect(() => {
    if (!parts.y || !parts.m || !parts.d) { onChange(''); return }
    const maxDay = new Date(Number(parts.y), Number(parts.m), 0).getDate()
    const clamped = Math.min(Number(parts.d), maxDay)
    const iso = `${parts.y}-${String(parts.m).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`
    if (iso !== value) onChange(iso)
  }, [parts.y, parts.m, parts.d])

  useEffect(() => {
    const p = value ? value.split('-') : []
    setParts({ y: p[0] || '', m: p[1] || '', d: p[2] || '' })
  }, [value])

  const selY = Number(parts.y)
  const selM = Number(parts.m)

  return (
    <div className={classNames('flex gap-2', className)}>
      <select className="field-input flex-1" value={parts.m} onChange={(e) => setParts((p) => ({ ...p, m: e.target.value }))}>
        <option value="">Month</option>
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1
          const disabled = parts.y && (selY < minY || (selY === minY && m < minM))
          return <option key={m} disabled={disabled} value={String(m).padStart(2, '0')}>{name}</option>
        })}
      </select>
      <select className="field-input w-20 shrink-0" value={parts.d} onChange={(e) => setParts((p) => ({ ...p, d: e.target.value }))}>
        <option value="">Day</option>
        {DAYS.map((d) => {
          const disabled = parts.y && parts.m && (selY < minY || (selY === minY && selM < minM) || (selY === minY && selM === minM && d < minD))
          return <option key={d} disabled={disabled} value={String(d).padStart(2, '0')}>{d}</option>
        })}
      </select>
      <select className="field-input flex-1" value={parts.y} onChange={(e) => setParts((p) => ({ ...p, y: e.target.value }))}>
        <option value="">Year</option>
        {YEARS.map((y) => <option key={y} disabled={y < minY} value={String(y)}>{y}</option>)}
      </select>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-ink-faint">
        <Icon size={26} />
      </span>
      <h3 className="mt-4 font-semibold text-ink-muted">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-faint">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Spinner({ className, size = 22 }) {
  return <Loader2 size={size} className={classNames('animate-spin text-violet-600', className)} />
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-muted">
      <Spinner /> <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20">
            <Icon size={22} />
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function ProgressBar({ value = 0, tone = 'brand', className }) {
  const tones = { brand: 'bg-gradient-to-r from-violet-500 to-fuchsia-500', emerald: 'bg-gradient-to-r from-emerald-500 to-green-500', amber: 'bg-gradient-to-r from-amber-500 to-orange-500', red: 'bg-gradient-to-r from-red-500 to-rose-500' }
  return (
    <div className={classNames('h-2 w-full overflow-hidden rounded-full bg-surface-border/60', className)}>
      <div className={classNames('h-full rounded-full transition-all duration-500 ease-out', tones[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-surface-border/60">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={classNames(
            'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
            active === t.value ? 'text-violet-700' : 'text-ink-muted hover:text-ink'
          )}
        >
          <span className="flex items-center gap-1.5">
            {t.icon && <t.icon size={16} />}
            {t.label}
            {t.count != null && (
              <span className={classNames('ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold', active === t.value ? 'bg-violet-100 text-violet-700' : 'bg-surface text-ink-muted')}>
                {t.count}
              </span>
            )}
          </span>
          {active === t.value && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />}
        </button>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={classNames('relative z-10 w-full animate-scale-in rounded-2xl bg-surface-card shadow-modal', sizes[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-surface-border/60 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          <IconButton icon={X} onClick={onClose} />
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-surface-border/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'danger' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={tone} onClick={() => { onConfirm?.(); onClose?.() }}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{message}</p>
    </Modal>
  )
}

export function FileDropzone({ onFile, hint = 'PDF, DOCX, PPTX, MP4 — up to 50 MB', fileName, fileObject }) {
  const displayName = fileName || (fileObject?.name ?? '')
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-surface-border bg-surface/50 px-6 py-8 text-center transition-all duration-150 hover:border-violet-400 hover:bg-violet-50/30">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-600">
        <UploadCloud size={22} />
      </span>
      {displayName ? (
        <p className="text-sm font-semibold text-ink">{displayName}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-ink-muted">
            <span className="text-violet-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-ink-faint">{hint}</p>
        </>
      )}
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile?.(f)
        }}
      />
    </label>
  )
}
