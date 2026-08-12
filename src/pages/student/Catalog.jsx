import { useState, useMemo } from 'react'
import { BookOpen, Check, Plus, Minus, Search, Lock, Hourglass, GraduationCap, Layers } from 'lucide-react'
import useStudentData from '../../hooks/useStudentData'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader, Card, Button, Badge, EmptyState } from '../../components/ui'
import CourseCard from '../../components/CourseCard'
import { fullName, classNames } from '../../utils/helpers'

const FILTERS = [
  { value: 'all', label: 'All courses' },
  { value: 'available', label: 'Available' },
  { value: 'enrolled', label: 'My courses' },
]

export default function StudentCatalog() {
  const { loading, loaded, courses, users, enrollments, grades, enroll, drop } = useStudentData()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const userId = currentUser._id || currentUser.id

  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u._id || u.id, u])), [users])
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c._id || c.id, c])), [courses])
  const completedPrereqs = useMemo(() => {
    const passed = new Set()
    grades.forEach((g) => {
      if (g.status === 'final' && g.letter && g.letter.toUpperCase() !== 'F') passed.add(g.courseId.toString())
    })
    return passed
  }, [grades])
  const myEnrollmentFor = useMemo(() => {
    const map = {}
    enrollments.forEach((e) => { if (e.studentId === userId) map[e.courseId] = e })
    return map
  }, [enrollments, userId])
  const countFor = (cid) => enrollments.filter((e) => e.courseId === cid && e.status === 'enrolled').length
  const waitlistFor = (cid) =>
    enrollments
      .filter((e) => e.courseId === cid && e.status === 'waitlisted')
      .sort((a, b) => new Date(a.waitlistedAt || 0) - new Date(b.waitlistedAt || 0))
  const myWaitlistPosition = (cid) => waitlistFor(cid).findIndex((e) => e.studentId === userId) + 1

  const enrolledCount = enrollments.filter((e) => e.studentId === userId && e.status === 'enrolled').length
  const waitlistedCount = enrollments.filter((e) => e.studentId === userId && e.status === 'waitlisted').length

  const list = courses.filter((c) => {
    if (c.status !== 'active') return false
    const cid = c._id || c.id
    const mine = !!myEnrollmentFor[cid]
    const missingPrereqs = (c.prerequisites || []).filter((pid) => !completedPrereqs.has(pid.toString()))
    if (filter === 'enrolled' && !mine) return false
    if (filter === 'available' && (mine || missingPrereqs.length > 0)) return false
    if (search) {
      const q = search.toLowerCase()
      return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    }
    return true
  })

  const toggle = async (c) => {
    const cid = c._id || c.id
    const mine = myEnrollmentFor[cid]
    if (mine) {
      try {
        await drop(cid)
        toast(mine.status === 'waitlisted' ? `Left the waitlist of ${c.code}.` : `Dropped ${c.code}.`, 'info')
      } catch (e) {
        toast(e?.response?.data?.message || 'Failed to drop course.', 'error')
      }
      return
    }
    try {
      const res = await enroll(cid)
      if (res.status === 'waitlisted') toast(`${c.code} is full — you were added to the waitlist.`, 'info')
      else toast(`Enrolled in ${c.code}!`, 'success')
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || ''
      toast(msg || `Could not enroll in ${c.code}.`, 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Course Catalog" subtitle="Browse and enroll in available courses." icon={GraduationCap} />

      {/* Stats bar */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600">
            <BookOpen size={18} />
          </span>
          <div>
            <p className="text-lg font-bold text-ink">{courses.filter((c) => c.status === 'active').length}</p>
            <p className="text-[11px] font-medium text-ink-muted">Total courses</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600">
            <Check size={18} />
          </span>
          <div>
            <p className="text-lg font-bold text-ink">{enrolledCount}</p>
            <p className="text-[11px] font-medium text-ink-muted">Enrolled</p>
          </div>
        </Card>
        <Card className="col-span-2 sm:col-span-1 flex items-center gap-3 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600">
            <Hourglass size={18} />
          </span>
          <div>
            <p className="text-lg font-bold text-ink">{waitlistedCount}</p>
            <p className="text-[11px] font-medium text-ink-muted">Waitlisted</p>
          </div>
        </Card>
      </div>

      {/* Search + filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            className="field-input h-10 pl-10"
            placeholder="Search courses by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-surface border border-surface-border/60 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={classNames(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                filter === f.value
                  ? 'bg-surface-card text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      {loading && !loaded ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-border border-t-violet-600" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={filter === 'enrolled' ? Layers : Search}
            title={filter === 'enrolled' ? 'Not enrolled in any courses' : 'No courses found'}
            message={
              filter === 'enrolled'
                ? 'Browse the catalog to find and enroll in a course.'
                : search
                  ? 'Try a different search term or filter.'
                  : 'No courses are currently available for enrollment.'
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c, i) => {
            const cid = c._id || c.id
            const mine = myEnrollmentFor[cid]
            const enrolled = mine?.status === 'enrolled'
            const waitlisted = mine?.status === 'waitlisted'
            const full = countFor(cid) >= c.capacity
            const missing = (c.prerequisites || []).filter((pid) => !completedPrereqs.has(pid.toString()))
            const locked = missing.length > 0
            const prereqCodes = missing.map((pid) => courseById[pid]?.code || pid)

            const badge = enrolled ? <Badge tone="emerald"><Check size={11} /> Enrolled</Badge>
              : waitlisted ? <Badge tone="amber"><Hourglass size={11} /> Waitlist #{myWaitlistPosition(cid)}</Badge>
              : locked ? <Badge tone="slate"><Lock size={11} /> Locked</Badge>
              : full ? <Badge tone="red">Full</Badge>
              : null

            const btnLabel = enrolled ? 'Drop course'
              : waitlisted ? 'Leave waitlist'
              : locked ? `Requires ${prereqCodes.join(', ')}`
              : full ? 'Join waitlist'
              : 'Enroll now'
            const btnIcon = enrolled || waitlisted ? Minus : locked ? Lock : full ? Hourglass : Plus

            return (
              <CourseCard
                key={cid}
                course={c}
                index={i}
                professorName={userById[c.professorId] ? fullName(userById[c.professorId]) : 'TBA'}
                enrolledCount={countFor(cid)}
                right={badge}
                footer={
                  <div className="space-y-2">
                    {prereqCodes.length > 0 && (
                      <p className="flex flex-wrap items-center gap-1 text-xs text-ink-faint">
                        <Lock size={11} /> Prerequisite{prereqCodes.length > 1 ? 's' : ''}: {prereqCodes.join(', ')}
                      </p>
                    )}
                    <Button
                      variant={mine ? 'secondary' : locked ? 'ghost' : 'primary'}
                      size="sm"
                      className="w-full"
                      icon={btnIcon}
                      disabled={locked}
                      onClick={() => toggle(c)}
                    >
                      {btnLabel}
                    </Button>
                  </div>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
