import { Users, Clock, MapPin, User } from 'lucide-react'
import { Card } from './ui'
import { classNames } from '../utils/helpers'

const ACCENT_COLORS = [
  'from-violet-500 to-fuchsia-500',
  'from-emerald-500 to-green-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-red-500',
  'from-sky-500 to-blue-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-teal-500',
  'from-orange-500 to-red-500',
]

export default function CourseCard({ course, professorName, enrolledCount, footer, onClick, right, index = 0 }) {
  const accent = ACCENT_COLORS[course.code?.length % ACCENT_COLORS.length]
  const fill = enrolledCount != null ? (enrolledCount / course.capacity) * 100 : 0
  const almostFull = fill >= 80

  return (
    <Card
      className={classNames(
        'group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className={classNames('h-1.5 w-full bg-gradient-to-r', course.color || accent)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            {course.code}
          </span>
          {right}
        </div>

        <h3 className="mt-3 text-base font-bold text-ink group-hover:text-violet-600 transition-colors">
          {course.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-ink-faint">{course.credits} credits</p>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{course.description}</p>

        <div className="mt-4 space-y-1.5 text-xs text-ink-muted">
          {professorName && (
            <span className="flex items-center gap-1.5">
              <User size={13} className="shrink-0 text-ink-faint" />
              <span className="truncate">{professorName}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="shrink-0 text-ink-faint" />
            <span className="truncate">{course.schedule || 'TBD'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0 text-ink-faint" />
            <span className="truncate">{course.room || 'TBD'}</span>
          </span>
        </div>

        {enrolledCount != null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium text-ink-muted">
                <Users size={13} /> {enrolledCount}/{course.capacity}
              </span>
              <span className={classNames('font-semibold', almostFull ? 'text-red-600' : 'text-emerald-600')}>
                {Math.round(fill)}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-border/60">
              <div
                className={classNames(
                  'h-full rounded-full transition-all duration-500',
                  almostFull ? 'bg-gradient-to-r from-red-500 to-rose-500' : fill > 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-green-500'
                )}
                style={{ width: `${Math.min(100, Math.max(0, fill))}%` }}
              />
            </div>
          </div>
        )}

        {footer && <div className="mt-4 border-t border-surface-border/60 pt-4">{footer}</div>}
      </div>
    </Card>
  )
}
