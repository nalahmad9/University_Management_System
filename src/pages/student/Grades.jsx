import { useState, useMemo } from 'react'
import { GraduationCap, TrendingUp, Award, FileText, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useStudentData from '../../hooks/useStudentData'
import { PageHeader, Card, CardHeader, StatCard, Badge, StatusBadge, EmptyState, LoadingState, SearchInput } from '../../components/ui'
import { calculateGPA, gradeColor, formatDate, classNames } from '../../utils/helpers'

export default function StudentGrades() {
  const { loading, loaded, courses, enrollments, assignments, grades } = useStudentData()
  const { currentUser } = useAuth()
  const [search, setSearch] = useState('')

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const myCourseIds = new Set(enrollments.filter((e) => e.studentId === currentUser.id && e.status === 'enrolled').map((e) => e.courseId))
  const myCourses = courses.filter((c) => myCourseIds.has(c.id))
  const q = search.toLowerCase()
  const filteredCourses = myCourses.filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  const myGrades = grades.filter((g) => g.studentId === currentUser.id)
  const { gpa, credits } = calculateGPA(myGrades, courseById)
  const finalized = myGrades.filter((g) => g.status === 'final').length

  const subByAsg = useMemo(() => {
    const map = {}
    assignments.forEach((a) => {
      if (a.sub) map[a.id || a._id] = { ...a.sub, assignmentId: a.id || a._id }
    })
    return map
  }, [assignments])

  const gradeFor = (cid) => myGrades.find((g) => g.courseId === cid)

  if (!loaded && loading) return <LoadingState />

  return (
    <div>
      <PageHeader title="Grades & GPA" subtitle="Your academic performance this semester." icon={GraduationCap} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} label="Cumulative GPA" value={gpa.toFixed(2)} sub="Out of 4.00" tone="emerald" />
        <StatCard icon={Award} label="Credits Completed" value={credits} sub={`${finalized} finalized courses`} tone="brand" />
        <StatCard icon={FileText} label="Enrolled Courses" value={myCourses.length} sub="This semester" tone="violet" />
      </div>

      <Card className="mt-5 p-4">
        <SearchInput className="w-full sm:w-96" placeholder="Search course name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {filteredCourses.length === 0 ? (
        <Card className="mt-6"><EmptyState icon={GraduationCap} title={search ? 'No courses match' : 'No grades yet'} message={search ? 'Try a different search term.' : 'Enroll in courses to start tracking your grades.'} /></Card>
      ) : (
        <div className="mt-6 space-y-5">
          {filteredCourses.map((c) => {
            const g = gradeFor(c.id)
            const courseAsgs = assignments.filter((a) => a.courseId === c.id)
            return (
              <Card key={c.id}>
                <CardHeader
                  title={`${c.code} — ${c.name}`}
                  subtitle={`${c.credits} credits`}
                  icon={GraduationCap}
                  action={
                    g && g.status === 'final'
                      ? <span className={classNames('text-2xl font-extrabold', gradeColor(g.letter))}>{g.letter}</span>
                      : <StatusBadge status="in-progress" />
                  }
                />
                {courseAsgs.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">No graded assignments yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="px-5 py-2.5">Assignment</th>
                          <th className="px-5 py-2.5">Due</th>
                          <th className="px-5 py-2.5">Status</th>
                          <th className="px-5 py-2.5 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {courseAsgs.map((a) => {
                          const sub = subByAsg[a.id]
                          return (
                            <tr key={a.id} className="hover:bg-slate-50/60">
                              <td className="px-5 py-2.5 font-medium text-slate-700">{a.title}</td>
                              <td className="px-5 py-2.5 text-slate-500">{formatDate(a.dueDate)}</td>
                              <td className="px-5 py-2.5">{sub ? <StatusBadge status={sub.status} /> : <Badge tone="slate">Not submitted</Badge>}</td>
                              <td className="px-5 py-2.5 text-right">
                                {sub?.status === 'graded'
                                  ? <span className="font-bold text-slate-800">{sub.score}<span className="font-normal text-slate-400">/{a.maxScore}</span></span>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
