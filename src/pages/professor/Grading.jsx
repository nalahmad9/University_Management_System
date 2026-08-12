import { useState, useMemo } from 'react'
import { PenSquare, FileText, Download, Check, Search } from 'lucide-react'
import { uploadApi, professorApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import useProfessorData from '../../hooks/useProfessorData'
import {
  PageHeader, Card, Button, Avatar, Badge, StatusBadge, Tabs, Modal, FormField,
  Input, Textarea, EmptyState, LoadingState, SearchInput,
} from '../../components/ui'
import { fullName, formatDate, classNames } from '../../utils/helpers'

export default function ProfessorGrading() {
  const api = useProfessorData()
  const { loading } = api
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [grading, setGrading] = useState(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')

  const courses = api.courses
  const assignments = api.assignments
  const submissions = api.submissions
  const users = api.users
  const myCourseIds = new Set(courses.filter((c) => c.professorId === currentUser.id).map((c) => c.id))
  const myAssignments = assignments.filter((a) => myCourseIds.has(a.courseId))
  const myAssignmentIds = new Set(myAssignments.map((a) => a.id))
  const asgById = useMemo(() => Object.fromEntries(assignments.map((a) => [a.id, a])), [assignments])
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])

  const mySubs = submissions.filter((s) => myAssignmentIds.has(s.assignmentId))
  const pending = mySubs.filter((s) => s.status === 'submitted')
  const graded = mySubs.filter((s) => s.status === 'graded')
  const tabList = tab === 'pending' ? pending : tab === 'graded' ? graded : mySubs
  const q = search.toLowerCase()
  const list = tabList.filter((s) => {
    if (!q) return true
    const stu = userById[s.studentId]
    const asg = asgById[s.assignmentId]
    return (stu && fullName(stu).toLowerCase().includes(q)) || (asg && asg.title.toLowerCase().includes(q))
  })

  const openGrade = (s) => {
    setGrading(s)
    setScore(s.score ?? '')
    setFeedback(s.feedback ?? '')
  }

  const submitGrade = async (e) => {
    e.preventDefault()
    const asg = asgById[grading.assignmentId]
    const max = asg?.maxScore || 100
    const num = Number(score)
    if (score === '' || isNaN(num) || num < 0 || num > max) return toast(`Score must be 0–${max}.`, 'error')
    try {
      await professorApi.gradeSubmission(grading.id, num, feedback)
      toast('Submission graded.', 'success')
      setGrading(null)
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to save grade.', 'error')
    }
  }

  const tabs = [
    { value: 'pending', label: 'To Grade', icon: PenSquare, count: pending.length },
    { value: 'graded', label: 'Graded', icon: Check, count: graded.length },
    { value: 'all', label: 'All', icon: FileText, count: mySubs.length },
  ]

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader title="Grade Submissions" subtitle="Review student submissions and assign scores with feedback." icon={PenSquare} />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <Card className="mt-6 mb-4 p-4">
        <SearchInput className="w-full sm:w-96" placeholder="Search student or assignment…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <div>
        {list.length === 0 ? (
          <Card><EmptyState icon={PenSquare} title={tab === 'pending' ? 'Nothing to grade' : 'No submissions'} message={tab === 'pending' ? 'All submissions have been graded.' : 'Submissions will appear here.'} /></Card>
        ) : (
          <div className="space-y-3">
            {list.map((s) => {
              const stu = userById[s.studentId]
              const asg = asgById[s.assignmentId]
              const course = asg ? courseById[asg.courseId] : null
              return (
                <Card key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <Avatar user={stu} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-700">{stu ? fullName(stu) : '—'}</p>
                      {course && <Badge tone="brand">{course.code}</Badge>}
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{asg?.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1"><FileText size={12} /> {s.fileName}</span> · Submitted {formatDate(s.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === 'graded' && (
                      <span className="text-right">
                        <span className="block text-lg font-bold text-slate-800">{s.score}<span className="text-sm font-normal text-slate-400">/{asg?.maxScore}</span></span>
                      </span>
                    )}
                    <Button size="sm" variant={s.status === 'graded' ? 'secondary' : 'primary'} icon={s.status === 'graded' ? PenSquare : Check} onClick={() => openGrade(s)}>
                      {s.status === 'graded' ? 'Edit' : 'Grade'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Grade modal */}
      <Modal
        open={!!grading}
        onClose={() => setGrading(null)}
        title="Grade Submission"
        subtitle={grading ? asgById[grading.assignmentId]?.title : ''}
        footer={<><Button variant="secondary" onClick={() => setGrading(null)}>Cancel</Button><Button onClick={submitGrade} icon={Check}>Save grade</Button></>}
      >
        {grading && (
          <form onSubmit={submitGrade} className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <Avatar user={userById[grading.studentId]} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700">{fullName(userById[grading.studentId])}</p>
                <p className="truncate text-xs text-slate-400"><FileText size={11} className="inline" /> {grading.fileName}</p>
              </div>
              <Button size="sm" variant="ghost" icon={Download} type="button" onClick={() => {
                if (grading.fileName) window.open(uploadApi.getFileUrl(grading.fileName), '_blank')
                else toast('File download not available.', 'info')
              }}>File</Button>
            </div>
            <FormField label={`Score (out of ${asgById[grading.assignmentId]?.maxScore || 100})`} required>
              <Input type="number" min="0" max={asgById[grading.assignmentId]?.maxScore || 100} value={score} onChange={(e) => setScore(e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Feedback">
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Write constructive feedback for the student…" className="min-h-[110px]" />
            </FormField>
          </form>
        )}
      </Modal>
    </div>
  )
}
