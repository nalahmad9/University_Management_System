import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useProfessorData from '../../hooks/useProfessorData'
import { PageHeader, Card, Button, EmptyState, LoadingState, SearchInput } from '../../components/ui'
import CourseCard from '../../components/CourseCard'

export default function ProfessorCourses() {
  const api = useProfessorData()
  const { loading } = api
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  if (loading) return <LoadingState />

  const courses = api.courses
  const enrollments = api.enrollments
  const myCourses = courses.filter((c) => c.professorId === currentUser.id)
  const q = search.toLowerCase()
  const filtered = myCourses.filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))

  return (
    <div>
      <PageHeader title="My Courses" subtitle="Courses assigned to you this semester." icon={BookOpen} />

      <Card className="mb-5 p-4">
        <SearchInput className="w-full sm:w-96" placeholder="Search courses by name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={BookOpen} title={search ? 'No courses match your search' : 'No courses assigned'} message={search ? 'Try a different search term.' : 'An administrator will assign courses to you.'} /></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
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
  )
}
