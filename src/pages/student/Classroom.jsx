import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, FileText, Megaphone, ClipboardList, Download, Link as LinkIcon,
  Clock, Upload, CheckCircle2, Pin, Award,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import useStudentData from '../../hooks/useStudentData'
import { studentApi, uploadApi } from '../../api'
import {
  Card, CardHeader, Button, IconButton, Badge, StatusBadge, Tabs, Modal, FileDropzone,
  EmptyState, LoadingState,
} from '../../components/ui'
import { fullName, formatDate, timeAgo, daysUntil, fileTypeMeta, classNames } from '../../utils/helpers'

export default function StudentClassroom() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, loaded, courses, users, enrollments, announcements, assignments, submitAssignment } = useStudentData()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const course = courses.find((c) => c.id === courseId)
  const requestedTab = new URLSearchParams(location.search).get('tab')
  const [tab, setTab] = useState(() => {
    if (requestedTab && ['materials', 'announcements', 'assignments'].includes(requestedTab)) {
      return requestedTab
    }
    return 'materials'
  })
  const [submitFor, setSubmitFor] = useState(null)
  const [fileObj, setFileObj] = useState(null)
  const [classroom, setClassroom] = useState(null)
  const [loadingClassroom, setLoadingClassroom] = useState(true)

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    setLoadingClassroom(true)
    studentApi.getClassroom(courseId).then((res) => {
      if (!cancelled) { setClassroom(res); setLoadingClassroom(false) }
    }).catch(() => { if (!cancelled) setLoadingClassroom(false) })
    return () => { cancelled = true }
  }, [courseId])

  const isEnrolled = enrollments.some((e) => e.studentId === currentUser.id && e.courseId === courseId && e.status === 'enrolled')
  const professor = course ? users.find((u) => u.id === course.professorId) : null

  const materials = classroom?.materials || []
  const courseAnns = (classroom?.announcements || announcements)
    .filter((a) => a.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const courseAssignments = classroom?.assignments?.length
    ? classroom.assignments
    : assignments.filter((a) => a.courseId === courseId)
  const submissions = classroom?.submissions || []
  const mySub = (aid) => submissions.find((s) => s.assignmentId === aid && s.studentId === currentUser.id)

  useEffect(() => {
    if (requestedTab && ['materials', 'announcements', 'assignments'].includes(requestedTab)) {
      setTab(requestedTab)
    } else {
      setTab('materials')
    }
  }, [requestedTab])

  const byWeek = useMemo(() => {
    const g = {}
    materials.forEach((m) => { (g[m.week] = g[m.week] || []).push(m) })
    return g
  }, [materials])

  const handleTabChange = (nextTab) => {
    setTab(nextTab)
    navigate({ pathname: `/student/courses/${courseId}`, search: `?tab=${nextTab}` }, { replace: true })
  }

  if (!loaded && loading) return <LoadingState />
  if (!course || !isEnrolled) {
    return <Card><EmptyState icon={FileText} title="Course unavailable" message="You are not enrolled in this course." action={<Button onClick={() => navigate('/student/courses')}>Back to my courses</Button>} /></Card>
  }

  const doSubmit = async () => {
    if (!fileObj) return toast('Attach a file to submit.', 'error')
    try {
      await submitAssignment(submitFor.id || submitFor._id, fileObj)
      toast('Assignment submitted!', 'success')
      setSubmitFor(null)
      setFileObj(null)
    } catch (err) {
      toast('Failed to submit', 'error')
    }
  }

  const tabs = [
    { value: 'materials', label: 'Materials', icon: FileText, count: materials.length },
    { value: 'announcements', label: 'Announcements', icon: Megaphone, count: courseAnns.length },
    { value: 'assignments', label: 'Assignments', icon: ClipboardList, count: courseAssignments.length },
  ]

  return (
    <div>
      <button onClick={() => navigate('/student/courses')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={16} /> Back to My Courses
      </button>

      <Card className="mb-6 overflow-hidden">
        <div className={classNames('h-2 w-full', course.color)} />
        <div className="p-6">
          <div className="flex items-center gap-2">
            <Badge tone="brand">{course.code}</Badge>
            <span className="text-xs text-slate-400">{course.credits} credits</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{course.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Award size={14} /> {professor ? fullName(professor) : 'TBA'}</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {course.schedule}</span>
            <span>{course.room}</span>
          </p>
        </div>
      </Card>

      <Tabs tabs={tabs} active={tab} onChange={handleTabChange} />

      <div className="mt-6">
        {/* Materials */}
        {tab === 'materials' && (
          loadingClassroom ? (
            <Card><LoadingState label="Loading materials…" /></Card>
          ) : materials.length === 0 ? (
            <Card><EmptyState icon={FileText} title="No materials yet" message="Your professor hasn't uploaded materials for this course." /></Card>
          ) : (
            <div className="space-y-5">
              {Object.entries(byWeek).map(([week, list]) => (
                <Card key={week}>
                  <CardHeader title={week} subtitle={`${list.length} item${list.length !== 1 ? 's' : ''}`} icon={FileText} />
                  <ul className="divide-y divide-slate-100">
                    {list.map((m) => {
                      const meta = fileTypeMeta(m.type)
                      return (
                        <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                          <span className={classNames('rounded-lg px-2 py-1 text-[10px] font-bold', meta.color)}>{meta.label}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700">{m.title}</p>
                            <p className="truncate text-xs text-slate-400">{m.fileName || m.link} {m.size ? `· ${m.size}` : ''}</p>
                          </div>
                          <Button size="sm" variant="soft" icon={m.type === 'link' ? LinkIcon : Download} onClick={() => {
                            if (m.type === 'link' && m.link) window.open(m.link, '_blank', 'noopener')
                            else if (m.fileUrl) window.open(uploadApi.getFileUrl(m.fileUrl), '_blank')
                            else toast('Re-upload this material from the professor panel to enable download.', 'error')
                          }}>
                            {m.type === 'link' ? 'Open' : 'Download'}
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Announcements */}
        {tab === 'announcements' && (
          loadingClassroom ? (
            <Card><LoadingState label="Loading announcements…" /></Card>
          ) : courseAnns.length === 0 ? (
            <Card><EmptyState icon={Megaphone} title="No announcements" message="No course announcements yet." /></Card>
          ) : (
            <div className="space-y-4">
              {courseAnns.map((a) => (
                <Card key={a.id} className="p-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{a.title}</h3>
                    {a.pinned && <Badge tone="amber"><Pin size={11} /> Pinned</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{a.body}</p>
                  <p className="mt-2 text-xs text-slate-400">{professor ? fullName(professor) : 'Professor'} · {timeAgo(a.createdAt)}</p>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Assignments */}
        {tab === 'assignments' && (
          loadingClassroom ? (
            <Card><LoadingState label="Loading assignments…" /></Card>
          ) : courseAssignments.length === 0 ? (
            <Card><EmptyState icon={ClipboardList} title="No assignments" message="No assignments have been posted yet." /></Card>
          ) : (
            <div className="space-y-4">
              {courseAssignments.map((a) => {
                const sub = mySub(a.id)
                const d = daysUntil(a.dueDate)
                const closed = d < 0
                return (
                  <Card key={a.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800">{a.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{a.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          <Badge tone={closed ? 'slate' : d <= 3 ? 'red' : 'amber'}><Clock size={11} /> {closed ? 'Closed' : d === 0 ? 'Due today' : `Due ${formatDate(a.dueDate)}`}</Badge>
                          <Badge tone="slate">{a.maxScore} pts</Badge>
                          {a.attachedFileUrl && (
                            <button onClick={() => window.open(uploadApi.getFileUrl(a.attachedFileUrl), '_blank')} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
                              <Download size={11} /> Attachment
                            </button>
                          )}
                          {sub && <StatusBadge status={sub.status} />}
                        </div>
                        {sub?.status === 'graded' && (
                          <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm">
                            <p className="font-semibold text-emerald-800">Score: {sub.score}/{a.maxScore}</p>
                            {sub.feedback && <p className="mt-1 text-emerald-700">“{sub.feedback}”</p>}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {sub ? (
                          <Button variant="secondary" size="sm" icon={Upload} disabled={closed} onClick={() => { setSubmitFor(a); setFileObj(null) }}>
                            {sub.status === 'graded' ? 'Graded' : 'Resubmit'}
                          </Button>
                        ) : (
                          <Button size="sm" icon={Upload} disabled={closed} onClick={() => { setSubmitFor(a); setFileObj(null) }}>
                            {closed ? 'Closed' : 'Submit'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Submit modal */}
      <Modal
        open={!!submitFor}
        onClose={() => setSubmitFor(null)}
        title="Submit Assignment"
        subtitle={submitFor?.title}
        footer={<><Button variant="secondary" onClick={() => setSubmitFor(null)}>Cancel</Button><Button icon={CheckCircle2} onClick={doSubmit}>Submit</Button></>}
      >
        <div className="space-y-4">
          {submitFor && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Due {formatDate(submitFor.dueDate)} · {submitFor.maxScore} points</p>
            </div>
          )}
          <FileDropzone fileName={fileObj?.name} fileObject={fileObj} onFile={setFileObj} hint="PDF, DOCX, ZIP — up to 50 MB" />
        </div>
      </Modal>
    </div>
  )
}
