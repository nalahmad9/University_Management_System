import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Users, PenSquare, CalendarClock, ArrowRight, Clock, ClipboardList,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { professorApi } from '../../api'
import useProfessorData from '../../hooks/useProfessorData'
import { PageHeader, StatCard, Card, CardHeader, Button, Badge, EmptyState, Avatar, LoadingState } from '../../components/ui'
import CourseCard from '../../components/CourseCard'
import { fullName, formatDate, daysUntil, classNames } from '../../utils/helpers'

export default function ProfessorDashboard() {
  const api = useProfessorData()
  const { loading } = api
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)

  const courses = api.courses
  const enrollments = api.enrollments
  const assignments = api.assignments
  const submissions = api.submissions
  const users = api.users

  const myCourses = courses.filter((c) => c.professorId === currentUser.id)
  const myCourseIds = new Set(myCourses.map((c) => c.id))
  const myAssignmentIds = new Set(assignments.filter((a) => myCourseIds.has(a.courseId)).map((a) => a.id))

  const totalStudents = useMemo(() => {
    const set = new Set(enrollments.filter((e) => myCourseIds.has(e.courseId) && e.status === 'enrolled').map((e) => e.studentId))
    return set.size
  }, [enrollments, myCourses])

  const pendingSubs = submissions.filter((s) => myAssignmentIds.has(s.assignmentId) && s.status === 'submitted')

  const upcoming = assignments
    .filter((a) => myCourseIds.has(a.courseId) && daysUntil(a.dueDate) >= 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)

  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title={`Welcome, ${currentUser.firstName}`}
        subtitle="Your teaching overview for Fall 2026."
        icon={BookOpen}
        actions={<Button icon={PenSquare} onClick={() => navigate('/professor/grading')}>Grade submissions</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="My Courses" value={myCourses.length} sub="This semester" tone="brand" />
        <StatCard icon={Users} label="Total Students" value={totalStudents} sub="Across all courses" tone="emerald" />
        <StatCard icon={PenSquare} label="Pending Grading" value={pendingSubs.length} sub="Submissions to review" tone="amber" />
        <StatCard icon={CalendarClock} label="Upcoming Deadlines" value={upcoming.length} sub="Assignments due" tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* My courses */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">My Courses</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/professor/courses')}>View all <ArrowRight size={14} /></Button>
          </div>
          {myCourses.length === 0 ? (
            <Card><EmptyState icon={BookOpen} title="No courses assigned" message="An administrator will assign courses to you." /></Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {myCourses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  enrolledCount={enrollments.filter((e) => e.courseId === c.id && e.status === 'enrolled').length}
                  onClick={() => navigate(`/professor/courses/${c.id}`)}
                  footer={<Button variant="soft" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); navigate(`/professor/courses/${c.id}`) }}>Open classroom <ArrowRight size={14} /></Button>}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: pending + deadlines */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="To Grade" subtitle={`${pendingSubs.length} pending`} icon={PenSquare}
              action={<Button variant="ghost" size="sm" onClick={() => navigate('/professor/grading')}>All</Button>} />
            {pendingSubs.length === 0 ? (
              <EmptyState icon={PenSquare} title="All caught up" message="No submissions awaiting grades." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingSubs.slice(0, 5).map((s) => {
                  const stu = userById[s.studentId]
                  const asg = assignments.find((a) => a.id === s.assignmentId)
                  return (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar user={stu} size="xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">{stu ? fullName(stu) : '—'}</p>
                        <p className="truncate text-xs text-slate-400">{asg?.title}</p>
                      </div>
                      <Button size="sm" variant="soft" onClick={() => navigate('/professor/grading')}>Grade</Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Upcoming Deadlines" icon={Clock} />
            {upcoming.length === 0 ? (
              <EmptyState icon={Clock} title="No deadlines" message="No upcoming assignment deadlines." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map((a) => {
                  const d = daysUntil(a.dueDate)
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><ClipboardList size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">{a.title}</p>
                        <p className="truncate text-xs text-slate-400">{courseById[a.courseId]?.code} · {formatDate(a.dueDate)}</p>
                      </div>
                      <Badge tone={d <= 3 ? 'red' : d <= 7 ? 'amber' : 'slate'}>{d === 0 ? 'Today' : `${d}d`}</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
