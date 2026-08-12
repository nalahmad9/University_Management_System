import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, GraduationCap, ClipboardList, CalendarClock, ArrowRight, Clock,
  Megaphone, Bell, Compass,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useStudentData from '../../hooks/useStudentData'
import { PageHeader, StatCard, Card, CardHeader, Button, Badge, EmptyState, LoadingState } from '../../components/ui'
import CourseCard from '../../components/CourseCard'
import { fullName, formatDate, timeAgo, daysUntil, calculateGPA, classNames } from '../../utils/helpers'

export default function StudentDashboard() {
  const { loading, loaded, courses, users, enrollments, assignments, grades, exams, announcements, notifications } = useStudentData()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const myEnrollments = enrollments.filter((e) => e.studentId === currentUser.id && e.status === 'enrolled')
  const myCourseIds = new Set(myEnrollments.map((e) => e.courseId))
  const myCourses = courses.filter((c) => myCourseIds.has(c.id))
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])

  const myGrades = grades.filter((g) => g.studentId === currentUser.id)
  const { gpa } = calculateGPA(myGrades, courseById)

  const submittedAsgIds = new Set()
  assignments.forEach((a) => {
    if (a.sub && a.sub.status) submittedAsgIds.add(a.id || a._id)
  })
  const pendingAssignments = assignments
    .filter((a) => myCourseIds.has(a.courseId) && !submittedAsgIds.has(a.id || a._id) && daysUntil(a.dueDate) >= 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const upcomingExams = exams
    .filter((x) => myCourseIds.has(x.courseId) && daysUntil(x.date || x.examDate) >= 0)
    .sort((a, b) => new Date(a.date || a.examDate) - new Date(b.date || b.examDate))

  const feed = announcements
    .filter((a) => !a.courseId || myCourseIds.has(a.courseId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)

  const myNotifs = notifications.slice(0, 4)

  if (!loaded && loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title={`Hi, ${currentUser.firstName}`}
        subtitle="Here's what's happening with your studies."
        icon={GraduationCap}
        actions={<Button icon={Compass} onClick={() => navigate('/student/catalog')}>Browse courses</Button>}
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Enrolled Courses" value={myCourses.length} sub={`${myCourses.reduce((a, c) => a + c.credits, 0)} credits`} tone="brand" />
        <StatCard icon={GraduationCap} label="Current GPA" value={gpa.toFixed(2)} sub="Out of 4.00" tone="emerald" />
        <StatCard icon={ClipboardList} label="Pending Work" value={pendingAssignments.length} sub="Assignments due" tone="amber" />
        <StatCard icon={CalendarClock} label="Upcoming Exams" value={upcomingExams.length} sub="This semester" tone="violet" />
      </div>

      <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Courses */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-ink">My Courses</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/courses')}>View all <ArrowRight size={14} /></Button>
          </div>
          {myCourses.length === 0 ? (
            <Card><EmptyState icon={Compass} title="Not enrolled yet" message="Browse the catalog to enroll in courses." action={<Button icon={Compass} onClick={() => navigate('/student/catalog')}>Browse catalog</Button>} /></Card>
          ) : (
            <div className="grid gap-3 sm:gap-5 sm:grid-cols-2">
              {myCourses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  professorName={userById[c.professorId] ? fullName(userById[c.professorId]) : 'TBA'}
                  onClick={() => navigate(`/student/courses/${c.id}`)}
                  footer={<Button variant="soft" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); navigate(`/student/courses/${c.id}`) }}>Open classroom <ArrowRight size={14} /></Button>}
                />
              ))}
            </div>
          )}

          {/* Deadlines */}
          <Card className="mt-4 sm:mt-6">
            <CardHeader title="Upcoming Deadlines" icon={Clock}
              action={<Button variant="ghost" size="sm" onClick={() => navigate('/student/assignments')}>All</Button>} />
            {pendingAssignments.length === 0 ? (
              <EmptyState icon={Clock} title="You're all caught up" message="No pending assignments right now." />
            ) : (
              <ul className="divide-y divide-surface-border/60">
                {pendingAssignments.slice(0, 5).map((a) => {
                  const d = daysUntil(a.dueDate)
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600"><ClipboardList size={16} /></span>
                      <div className="min-w-0 flex-1 basis-[120px]">
                        <p className="truncate text-sm font-semibold text-ink">{a.title}</p>
                        <p className="truncate text-xs text-ink-muted">{courseById[a.courseId]?.code} · Due {formatDate(a.dueDate)}</p>
                      </div>
                      <Badge tone={d <= 3 ? 'red' : d <= 7 ? 'amber' : 'slate'}>{d === 0 ? 'Today' : `${d}d left`}</Badge>
                      <Button size="sm" variant="soft" onClick={() => navigate('/student/assignments')}>Submit</Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader title="Announcements" icon={Megaphone} />
            {feed.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements" message="You're up to date." />
            ) : (
              <ul className="divide-y divide-surface-border/60">
                {feed.map((a) => (
                  <li key={a.id} className="px-4 sm:px-5 py-3 sm:py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={a.scope === 'system' ? 'brand' : 'violet'}>{a.scope === 'system' ? 'Campus' : courseById[a.courseId]?.code}</Badge>
                      <p className="truncate text-sm font-semibold text-ink">{a.title}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{a.body}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">{timeAgo(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Recent Notifications" icon={Bell}
              action={<Button variant="ghost" size="sm" onClick={() => navigate('/student/notifications')}>All</Button>} />
            {myNotifs.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications" message="Nothing new right now." />
            ) : (
              <ul className="divide-y divide-surface-border/60">
                {myNotifs.map((n) => (
                  <li key={n.id} className={classNames('flex items-start gap-3 px-4 sm:px-5 py-3', !n.read && 'bg-violet-50/40')}>
                    <span className={classNames('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-surface-border' : 'bg-violet-500')} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <p className="truncate text-xs text-ink-muted">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">{timeAgo(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
