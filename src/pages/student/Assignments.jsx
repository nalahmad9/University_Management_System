import { useState, useMemo } from 'react'
import { ClipboardList, Clock, Upload, Download, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { uploadApi } from '../../api'
import useStudentData from '../../hooks/useStudentData'
import {
  PageHeader, Card, Button, Badge, StatusBadge, Tabs, Modal, FileDropzone, EmptyState, LoadingState,
} from '../../components/ui'
import { formatDate, daysUntil } from '../../utils/helpers'

export default function StudentAssignments() {
  const { loading, loaded, courses, enrollments, assignments, submitAssignment } = useStudentData()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('todo')
  const [submitFor, setSubmitFor] = useState(null)
  const [file, setFile] = useState(null)

  const myCourseIds = new Set(enrollments.filter((e) => e.studentId === currentUser.id && e.status === 'enrolled').map((e) => e.courseId))
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])
  const mySub = (aid) => {
    const asg = assignments.find((a) => (a.id || a._id) === aid)
    return asg ? asg.sub : null
  }

  const mine = assignments
    .filter((a) => myCourseIds.has(a.courseId))
    .map((a) => ({ ...a, sub: mySub(a.id || a._id) }))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const todo = mine.filter((a) => !a.sub && daysUntil(a.dueDate) >= 0)
  const submitted = mine.filter((a) => a.sub && a.sub.status === 'submitted')
  const graded = mine.filter((a) => a.sub && a.sub.status === 'graded')
  const list = tab === 'todo' ? todo : tab === 'submitted' ? submitted : tab === 'graded' ? graded : mine

  const doSubmit = async () => {
    if (!file) return toast('Attach a file to submit.', 'error')
    try {
      await submitAssignment(submitFor.id || submitFor._id, file)
      toast('Assignment submitted!', 'success')
      setSubmitFor(null)
      setFile(null)
    } catch (err) {
      toast('Failed to submit', 'error')
    }
  }

  const tabs = [
    { value: 'todo', label: 'To Do', icon: Clock, count: todo.length },
    { value: 'submitted', label: 'Submitted', icon: Upload, count: submitted.length },
    { value: 'graded', label: 'Graded', icon: CheckCircle2, count: graded.length },
    { value: 'all', label: 'All', icon: ClipboardList, count: mine.length },
  ]

  if (!loaded && loading) return <LoadingState />

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Submit your work and track scores across all courses." icon={ClipboardList} />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="mt-6 space-y-4">
        {list.length === 0 ? (
          <Card><EmptyState icon={ClipboardList} title={tab === 'todo' ? 'Nothing to do' : 'Nothing here'} message={tab === 'todo' ? 'You have no pending assignments.' : 'No assignments in this view.'} /></Card>
        ) : (
          list.map((a) => {
            const d = daysUntil(a.dueDate)
            const closed = d < 0
            return (
              <Card key={a.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{courseById[a.courseId]?.code}</Badge>
                      <h3 className="font-bold text-slate-800">{a.title}</h3>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone={closed ? 'slate' : d <= 3 ? 'red' : 'amber'}><Clock size={11} /> {closed ? 'Closed' : d === 0 ? 'Due today' : `Due ${formatDate(a.dueDate)} · ${d}d`}</Badge>
                      <Badge tone="slate">{a.maxScore} pts</Badge>
                      {a.attachedFileUrl && (
                        <button onClick={() => window.open(uploadApi.getFileUrl(a.attachedFileUrl), '_blank')} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
                          <Download size={11} /> Attachment
                        </button>
                      )}
                      {a.sub && <StatusBadge status={a.sub.status} />}
                    </div>
                    {a.sub?.status === 'graded' && (
                      <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm">
                        <p className="font-semibold text-emerald-800">Score: {a.sub.score}/{a.maxScore}</p>
                        {a.sub.feedback && <p className="mt-1 text-emerald-700">“{a.sub.feedback}”</p>}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {a.sub ? (
                      <Button variant="secondary" size="sm" icon={Upload} disabled={closed || a.sub.status === 'graded'} onClick={() => { setSubmitFor(a); setFileName('') }}>
                        {a.sub.status === 'graded' ? 'Graded' : 'Resubmit'}
                      </Button>
                    ) : (
                      <Button size="sm" icon={Upload} disabled={closed} onClick={() => { setSubmitFor(a); setFileName('') }}>{closed ? 'Closed' : 'Submit'}</Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Modal
        open={!!submitFor}
        onClose={() => setSubmitFor(null)}
        title="Submit Assignment"
        subtitle={submitFor ? `${courseById[submitFor.courseId]?.code} · ${submitFor.title}` : ''}
        footer={<><Button variant="secondary" onClick={() => setSubmitFor(null)}>Cancel</Button><Button icon={CheckCircle2} onClick={doSubmit}>Submit</Button></>}
      >
        <div className="space-y-4">
          {submitFor && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Due {formatDate(submitFor.dueDate)} · {submitFor.maxScore} points</p>
            </div>
          )}
          <FileDropzone fileName={file?.name} fileObject={file} onFile={setFile} hint="PDF, DOCX, ZIP — up to 50 MB" />
        </div>
      </Modal>
    </div>
  )
}
