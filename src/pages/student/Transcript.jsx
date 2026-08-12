import { useMemo } from 'react'
import { FileText, Download, GraduationCap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useStudentData from '../../hooks/useStudentData'
import { PageHeader, Card, Button, LoadingState } from '../../components/ui'
import { fullName, calculateGPA, gradeColor, classNames } from '../../utils/helpers'

export default function StudentTranscript() {
  const { loading, loaded, courses, users, enrollments, grades } = useStudentData()
  const { currentUser } = useAuth()

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])
  const myCourseIds = new Set(enrollments.filter((e) => e.studentId === currentUser.id && e.status === 'enrolled').map((e) => e.courseId))
  const myGrades = grades.filter((g) => g.studentId === currentUser.id)
  const { gpa, credits } = calculateGPA(myGrades, courseById)

  // rows: enrolled courses with their grade record
  const rows = [...myCourseIds].map((cid) => {
    const c = courseById[cid]
    const g = myGrades.find((x) => x.courseId === cid)
    return { course: c, grade: g }
  }).filter((r) => r.course)

  const totalCredits = rows.reduce((a, r) => a + (r.course.credits || 0), 0)

  if (!loaded && loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Academic Transcript"
        subtitle="Your official academic record. Download or print as PDF."
        icon={FileText}
        actions={<Button icon={Download} onClick={() => window.print()}>Download PDF</Button>}
      />

      <Card id="transcript" className="mx-auto max-w-3xl p-8 sm:p-10">
        {/* Letterhead */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-brand-600 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
              <GraduationCap size={26} />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-800">UniHub University</p>
              <p className="text-xs text-slate-500">Office of the Registrar · Official Transcript</p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Fall 2026</p>
            <p>Issued {new Date('2026-10-06').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Student info */}
        <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Student</p>
            <p className="font-semibold text-slate-800">{fullName(currentUser)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Student ID</p>
            <p className="font-semibold text-slate-800">{currentUser.studentId}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Program</p>
            <p className="font-semibold text-slate-800">{currentUser.program}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Year</p>
            <p className="font-semibold text-slate-800">Year {currentUser.year}</p>
          </div>
        </div>

        {/* Grades table */}
        <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-2.5">Code</th>
              <th className="py-2.5">Course Title</th>
              <th className="py-2.5">Professor</th>
              <th className="py-2.5 text-center">Credits</th>
              <th className="py-2.5 text-center">Grade</th>
              <th className="py-2.5 text-center">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ course, grade }) => (
              <tr key={course.id}>
                <td className="py-2.5 font-medium text-slate-700">{course.code}</td>
                <td className="py-2.5 text-slate-700">{course.name}</td>
                <td className="py-2.5 text-slate-500">{userById[course.professorId] ? fullName(userById[course.professorId]) : 'TBA'}</td>
                <td className="py-2.5 text-center text-slate-600">{course.credits}</td>
                <td className={classNames('py-2.5 text-center font-bold', grade?.letter ? gradeColor(grade.letter) : 'text-slate-400')}>
                  {grade?.status === 'final' ? grade.letter : 'IP'}
                </td>
                <td className="py-2.5 text-center text-slate-600">{grade?.status === 'final' ? grade.points.toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Summary */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 px-5 py-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Credits</p>
              <p className="text-lg font-bold text-slate-800">{totalCredits}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed</p>
              <p className="text-lg font-bold text-slate-800">{credits}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cumulative GPA</p>
            <p className="text-3xl font-extrabold text-brand-600">{gpa.toFixed(2)}</p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          IP = In Progress. This is a system-generated document for demonstration purposes.<br />
          UniHub University · Office of the Registrar · Not valid without official seal.
        </p>
      </Card>
    </div>
  )
}
