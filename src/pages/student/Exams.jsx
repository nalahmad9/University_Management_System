import { useState, useMemo } from 'react'
import { CalendarClock, MapPin, Clock, CalendarDays, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useStudentData from '../../hooks/useStudentData'
import { PageHeader, Card, CardHeader, Badge, EmptyState, LoadingState, SearchInput } from '../../components/ui'
import { formatDate, daysUntil, classNames } from '../../utils/helpers'

export default function StudentExams() {
  const { loading, loaded, courses, enrollments, exams } = useStudentData()
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const myCourseIds = new Set(enrollments.filter((e) => e.studentId === currentUser.id && e.status === 'enrolled').map((e) => e.courseId))

  const myExams = exams.filter((x) => myCourseIds.has(x.courseId)).sort((a, b) => new Date(a.date || a.examDate) - new Date(b.date || b.examDate))
  const q = search.toLowerCase()
  const filteredExams = myExams.filter((x) => !q || x.title.toLowerCase().includes(q) || (courseById[x.courseId]?.name || '').toLowerCase().includes(q))
  const upcoming = filteredExams.filter((x) => daysUntil(x.date) >= 0)
  const past = filteredExams.filter((x) => daysUntil(x.date) < 0)

  const typeTone = { Midterm: 'amber', Final: 'red', Quiz: 'sky' }
  const next = upcoming[0]

  const ExamRow = ({ x, dim }) => {
    const c = courseById[x.courseId]
    const d = daysUntil(x.date)
    return (
      <li className={classNames('flex items-center gap-4 px-5 py-4', dim && 'opacity-60')}>
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <span className="text-[10px] font-bold uppercase">{formatDate(x.date, { month: 'short' })}</span>
          <span className="text-lg font-extrabold leading-none">{new Date(x.date).getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-800">{x.title}</p>
            <Badge tone={typeTone[x.type] || 'slate'}>{x.type}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{c?.code} — {c?.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1"><Clock size={12} /> {x.startTime}–{x.endTime}</span>
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {x.room}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDate(x.date, { weekday: 'long' })}</span>
          </div>
        </div>
        {!dim && d >= 0 && (
          <Badge tone={d <= 3 ? 'red' : d <= 7 ? 'amber' : 'slate'}>{d === 0 ? 'Today' : `${d}d`}</Badge>
        )}
      </li>
    )
  }

  if (!loaded && loading) return <LoadingState />

  return (
    <div>
      <PageHeader title="Exam Timetable" subtitle="Your personalized examination schedule." icon={CalendarClock} />

      <Card className="mb-5 p-4">
        <SearchInput className="w-full sm:w-96" placeholder="Search exams by title or course…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {next && (
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 to-indigo-700 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Next Exam</p>
            <h2 className="mt-1 text-2xl font-bold">{next.title}</h2>
            <p className="mt-1 text-white/80">{courseById[next.courseId]?.name}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} /> {formatDate(next.date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={16} /> {next.startTime}–{next.endTime}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={16} /> {next.room}</span>
            </div>
          </div>
        </Card>
      )}

      {filteredExams.length === 0 ? (
        <Card><EmptyState icon={CalendarClock} title={search ? 'No exams match' : 'No exams scheduled'} message={search ? 'Try a different search term.' : 'Exams for your enrolled courses will appear here.'} /></Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming Exams" subtitle={`${upcoming.length} scheduled`} icon={CalendarClock} />
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No upcoming exams" message="You have no exams coming up." />
            ) : (
              <ul className="divide-y divide-slate-100">{upcoming.map((x) => <ExamRow key={x.id} x={x} />)}</ul>
            )}
          </Card>

          {past.length > 0 && (
            <Card>
              <CardHeader title="Past Exams" subtitle={`${past.length} completed`} icon={CalendarDays} />
              <ul className="divide-y divide-slate-100">{past.map((x) => <ExamRow key={x.id} x={x} dim />)}</ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
