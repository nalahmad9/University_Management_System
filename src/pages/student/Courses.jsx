import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, Compass } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useStudentData from '../../hooks/useStudentData'
import { PageHeader, Card, Button, EmptyState, LoadingState, SearchInput } from '../../components/ui'
import CourseCard from '../../components/CourseCard'
import { fullName } from '../../utils/helpers'

export default function StudentCourses() {
  const { loading, loaded, courses, users, enrollments } = useStudentData()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])
  const myCourseIds = new Set(enrollments.filter((e) => e.studentId === currentUser.id && e.status === 'enrolled').map((e) => e.courseId))
  const myCourses = courses.filter((c) => myCourseIds.has(c.id))
  const q = search.toLowerCase()
  const filtered = myCourses.filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))

  if (!loaded && loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="My Courses"
        subtitle="Courses you're enrolled in this semester."
        icon={BookOpen}
        actions={<Button variant="secondary" icon={Compass} onClick={() => navigate('/student/catalog')}>Browse catalog</Button>}
      />

      <Card className="mb-5 p-4">
        <SearchInput className="w-full sm:w-96" placeholder="Search courses by name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Compass} title={search ? 'No courses match' : 'Not enrolled yet'} message={search ? 'Try a different search term.' : 'Browse the catalog to enroll in courses.'} action={search ? null : <Button icon={Compass} onClick={() => navigate('/student/catalog')}>Browse catalog</Button>} /></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              professorName={userById[c.professorId] ? fullName(userById[c.professorId]) : 'TBA'}
              enrolledCount={enrollments.filter((e) => e.courseId === c.id && e.status === 'enrolled').length}
              onClick={() => navigate(`/student/courses/${c.id}`)}
              footer={<Button variant="soft" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); navigate(`/student/courses/${c.id}`) }}>Open classroom <ArrowRight size={14} /></Button>}
            />
          ))}
        </div>
      )}
    </div>
  )
}
