import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Users, Megaphone, ClipboardList, CalendarCheck, GraduationCap,
  Plus, Trash2, Download, Link as LinkIcon, Clock, Save, Check, X, Pin,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { professorApi, uploadApi } from '../../api'
import useProfessorData from '../../hooks/useProfessorData'
import { useToast } from '../../context/ToastContext'
import {
  Card, CardHeader, Button, IconButton, Badge, StatusBadge, Avatar, Tabs, Modal,
  ConfirmDialog, FormField, Input, Textarea, Select, EmptyState, LoadingState, FileDropzone, DatePicker,
} from '../../components/ui'
import {
  fullName, formatDate, timeAgo, fileTypeMeta, scoreToLetter, gradeColor, classNames,
} from '../../utils/helpers'

export default function ProfessorClassroom() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const api = useProfessorData()
  const { currentUser } = useAuth()
  const course = api.courses.find((c) => c.id === courseId)
  const [tab, setTab] = useState('materials')

  const roster = useMemo(() => {
    const ids = new Set(api.enrollments.filter((e) => e.courseId === courseId && e.status === 'enrolled').map((e) => e.studentId))
    return api.users.filter((u) => ids.has(u.id))
  }, [api.enrollments, api.users, courseId])

  const courseAssignments = api.assignments.filter((a) => a.courseId === courseId)

  if (api.loading) return <LoadingState label="Loading course…" />
  if (!course) {
    return (
      <Card><EmptyState icon={FileText} title="Course not found" message="This course may have been removed." action={<Button onClick={() => navigate('/professor/courses')}>Back to courses</Button>} /></Card>
    )
  }

  const tabs = [
    { value: 'materials', label: 'Materials', icon: FileText },
    { value: 'roster', label: 'Roster', icon: Users, count: roster.length },
    { value: 'announcements', label: 'Announcements', icon: Megaphone },
    { value: 'assignments', label: 'Assignments', icon: ClipboardList, count: courseAssignments.length },
    { value: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { value: 'grades', label: 'Grades', icon: GraduationCap },
  ]

  return (
    <div>
      <button onClick={() => navigate('/professor/courses')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={16} /> Back to My Courses
      </button>

      {/* Course banner */}
      <Card className="mb-6 overflow-hidden">
        <div className={classNames('h-2 w-full', course.color)} />
        <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="brand">{course.code}</Badge>
              <span className="text-xs text-slate-400">{course.credits} credits · {course.room}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{course.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{course.schedule} · {roster.length} students enrolled</p>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'materials' && <MaterialsTab course={course} />}
        {tab === 'roster' && <RosterTab roster={roster} />}
        {tab === 'announcements' && <AnnouncementsTab course={course} author={currentUser} />}
        {tab === 'assignments' && <AssignmentsTab course={course} />}
        {tab === 'attendance' && <AttendanceTab course={course} roster={roster} />}
        {tab === 'grades' && <GradesTab course={course} roster={roster} />}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- Materials */
function MaterialsTab({ course }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [del, setDel] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ week: 'Week 1', title: '', type: 'pdf', file: null, link: '' })

  useEffect(() => {
    professorApi.getMaterials(course.id)
      .then((data) => { setMaterials(data.materials || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [course.id])

  const byWeek = useMemo(() => {
    const g = {}
    materials.forEach((m) => { (g[m.weekTopic || m.week] = g[m.weekTopic || m.week] || []).push(m) })
    return g
  }, [materials])

  const handleDownload = (m) => {
    if (m.type === 'link' && m.link) {
      window.open(m.link, '_blank', 'noopener')
    } else if (m.fileUrl) {
      window.open(uploadApi.getFileUrl(m.fileUrl), '_blank')
    } else {
      toast('Re-upload this material to enable download.', 'error')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title) return toast('Enter a title.', 'error')
    if (form.type === 'link' && !form.link) return toast('Enter a link URL.', 'error')
    if (form.type !== 'link' && !form.file) return toast('Attach a file.', 'error')

    try {
      let fileUrl = null
      let fileName = null
      let fileSize = null
      if (form.type !== 'link' && form.file) {
        const uploadRes = await uploadApi.uploadFile(form.file)
        fileUrl = uploadRes.filename
        fileName = form.file.name
        fileSize = form.file.size ? `${(form.file.size / 1024 / 1024).toFixed(1)} MB` : null
      }

      await professorApi.addMaterial(course.id, {
        week: form.week,
        title: form.title,
        type: form.type,
        fileUrl,
        fileName,
        size: fileSize,
        link: form.type === 'link' ? form.link : null,
      })

      const data = await professorApi.getMaterials(course.id)
      setMaterials(data.materials || [])
      toast('Material uploaded.', 'success')
      setForm({ week: 'Week 1', title: '', type: 'pdf', file: null, link: '' })
      setOpen(false)
    } catch (err) {
      console.error('Upload error:', err)
      const msg = err?.response?.data?.message || err?.message || 'Upload failed'
      toast(msg, 'error')
    }
  }

  const deleteMaterial = async () => {
    if (!del) return
    try {
      await professorApi.deleteMaterial(course.id, del.id)
      const data = await professorApi.getMaterials(course.id)
      setMaterials(data.materials || [])
      toast('Material deleted.', 'info')
      setDel(null)
    } catch (err) {
      toast('Delete failed.', 'error')
    }
  }

  if (loading) return <LoadingState label="Loading materials…" />

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button icon={Plus} onClick={() => setOpen(true)}>Upload material</Button>
      </div>
      {materials.length === 0 ? (
        <Card><EmptyState icon={FileText} title="No materials yet" message="Upload lecture slides, PDFs, or links for your students." action={<Button icon={Plus} onClick={() => setOpen(true)}>Upload material</Button>} /></Card>
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
                        <p className="truncate text-xs text-slate-400">{m.fileName || m.link} {m.size ? `· ${m.size}` : ''} · {formatDate(m.uploadedAt)}</p>
                      </div>
                      <IconButton icon={m.type === 'link' ? LinkIcon : Download} title="Download" onClick={() => handleDownload(m)} />
                      <IconButton icon={Trash2} title="Delete" onClick={() => setDel(m)} className="hover:text-red-600" />
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Upload Material"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Upload</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Week / Topic">
              <Select value={form.week} onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))}>
                {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'].map((w) => <option key={w}>{w}</option>)}
              </Select>
            </FormField>
            <FormField label="Type">
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="pdf">PDF</option>
                <option value="pptx">Slides (PPTX)</option>
                <option value="docx">Document (DOCX)</option>
                <option value="mp4">Video (MP4)</option>
                <option value="link">Web Link</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Lecture 3 — React Hooks" /></FormField>
          {form.type === 'link' ? (
            <FormField label="URL"><Input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://…" /></FormField>
          ) : (
            <FileDropzone fileName={form.file?.name} fileObject={form.file} onFile={(f) => setForm((prev) => ({ ...prev, file: f }))} />
          )}
        </form>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={deleteMaterial}
        title="Delete material?" message={del ? `Remove "${del.title}"?` : ''} confirmLabel="Delete" />
    </div>
  )
}

/* ----------------------------------------------------------------- Roster */
function RosterTab({ roster }) {
  if (roster.length === 0) return <Card><EmptyState icon={Users} title="No students enrolled" message="Students enrolled in this course will appear here." /></Card>
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Enrolled Students" subtitle={`${roster.length} students`} icon={Users} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Student</th><th className="px-5 py-3">Student ID</th>
              <th className="px-5 py-3">Program</th><th className="px-5 py-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roster.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar user={s} size="sm" /><span className="font-semibold text-slate-700">{fullName(s)}</span></div></td>
                <td className="px-5 py-3 text-slate-600">{s.studentId}</td>
                <td className="px-5 py-3 text-slate-600">{s.program}</td>
                <td className="px-5 py-3 text-slate-500">{s.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ----------------------------------------------------------------- Announcements */
function AnnouncementsTab({ course }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })

  useEffect(() => {
    professorApi.getCourseAnnouncements(course.id)
      .then((data) => {
        const mapped = (data.announcements || data || []).map((a) => ({
          ...a, id: a._id || a.id, body: a.message || a.body, scope: 'course', pinned: false,
        }))
        setItems(mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [course.id])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.body) return toast('Enter a title and message.', 'error')
    setPosting(true)
    try {
      await professorApi.addAnnouncement(course.id, { title: form.title, body: form.body })
      const data = await professorApi.getCourseAnnouncements(course.id)
      const mapped = (data.announcements || data || []).map((a) => ({
        ...a, id: a._id || a.id, body: a.message || a.body, scope: 'course', pinned: false,
      }))
      setItems(mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      toast('Announcement posted.', 'success')
      setForm({ title: '', body: '' })
      setOpen(false)
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to post.', 'error')
    } finally {
      setPosting(false)
    }
  }

  const doDelete = async (id) => {
    try {
      await professorApi.deleteAnnouncement(id)
      setItems((prev) => prev.filter((a) => a.id !== id))
      toast('Deleted.', 'info')
    } catch (err) {
      toast('Delete failed.', 'error')
    }
  }

  if (loading) return <LoadingState label="Loading announcements…" />

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button icon={Plus} onClick={() => setOpen(true)}>Post announcement</Button></div>
      {items.length === 0 ? (
        <Card><EmptyState icon={Megaphone} title="No announcements" message="Post updates visible to students in this course." action={<Button icon={Plus} onClick={() => setOpen(true)}>Post announcement</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex-wrap flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-bold text-slate-800">{a.title}</h3>{a.pinned && <Badge tone="amber"><Pin size={11} /> Pinned</Badge>}</div>
                  <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                  <p className="mt-2 text-xs text-slate-400">{timeAgo(a.createdAt)}</p>
                </div>
                <IconButton icon={Trash2} title="Delete" onClick={() => doDelete(a.id)} className="hover:text-red-600" />
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={`Announcement — ${course.code}`} subtitle="Visible to enrolled students only."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={posting}>{posting ? 'Posting…' : 'Post'}</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Message" required><Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="min-h-[120px]" /></FormField>
        </form>
      </Modal>
    </div>
  )
}

/* ----------------------------------------------------------------- Assignments */
function AssignmentsTab({ course }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [del, setDel] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', maxScore: 100, file: null })

  useEffect(() => {
    professorApi.getCourseAssignments(course.id)
      .then((data) => {
        const list = (data.assignments || data || []).map((a) => ({
          ...a, id: a._id || a.id, dueDate: a.deadline || a.dueDate, maxScore: a.maxScore || 100,
        }))
        setItems(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [course.id])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.dueDate) return toast('Enter a title and due date.', 'error')
    try {
      let attachment = null
      if (form.file) {
        const uploadRes = await uploadApi.uploadFile(form.file)
        attachment = uploadRes.filename
      }
      await professorApi.addAssignment(course.id, {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        attachment,
      })
      const data = await professorApi.getCourseAssignments(course.id)
      const list = (data.assignments || data || []).map((a) => ({
        ...a, id: a._id || a.id, dueDate: a.deadline || a.dueDate, maxScore: a.maxScore || 100,
      }))
      setItems(list)
      toast('Assignment created.', 'success')
      setForm({ title: '', description: '', dueDate: '', maxScore: 100, file: null })
      setOpen(false)
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to create.', 'error')
    }
  }

  const doDelete = async () => {
    if (!del) return
    try {
      await professorApi.deleteAssignment(del.id)
      setItems((prev) => prev.filter((a) => a.id !== del.id))
      toast('Deleted.', 'info')
      setDel(null)
    } catch (err) {
      toast('Delete failed.', 'error')
    }
  }

  if (loading) return <LoadingState label="Loading assignments…" />

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button icon={Plus} onClick={() => setOpen(true)}>Create assignment</Button></div>
      {items.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="No assignments" message="Create assignments with deadlines for this course." action={<Button icon={Plus} onClick={() => setOpen(true)}>Create assignment</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => {
            const d = Math.round((new Date(a.dueDate) - new Date()) / 86400000)
            return (
              <Card key={a.id} className="p-5">
                <div className="flex-wrap flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800">{a.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone={d < 0 ? 'slate' : d <= 3 ? 'red' : 'amber'}><Clock size={11} /> Due {formatDate(a.dueDate)}</Badge>
                      <Badge tone="slate">{a.maxScore} pts</Badge>
                      {a.attachedFileUrl && (
                        <button onClick={() => window.open(uploadApi.getFileUrl(a.attachedFileUrl), '_blank')} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
                          <Download size={11} /> Attachment
                        </button>
                      )}
                    </div>
                  </div>
                  <IconButton icon={Trash2} title="Delete" onClick={() => setDel(a)} className="hover:text-red-600" />
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={`New Assignment — ${course.code}`} size="lg"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Create</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Build a REST API" /></FormField>
          <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Due date" required><DatePicker value={form.dueDate} onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))} /></FormField>
            <FormField label="Max score"><Input type="number" value={form.maxScore} onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))} /></FormField>
          </div>
          <FormField label="Attachment (optional)">
            <FileDropzone fileName={form.file?.name} fileObject={form.file} onFile={(f) => setForm((prev) => ({ ...prev, file: f }))} hint="PDF, DOCX, ZIP — up to 50 MB" />
          </FormField>
        </form>
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={doDelete}
        title="Delete assignment?" message={del ? `Remove "${del.title}" and its submissions?` : ''} confirmLabel="Delete" />
    </div>
  )
}

/* ----------------------------------------------------------------- Attendance */
function AttendanceTab({ course, roster }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [topic, setTopic] = useState('')
  const [present, setPresent] = useState({})

  useEffect(() => {
    professorApi.getCourseAttendance(course.id)
      .then((data) => {
        const list = (data.records || data || []).map((r) => ({
          ...r, id: r._id || r.id, date: r.sessionDate || r.date,
          records: (r.records || []).map((rr) => ({
            studentId: rr.studentId?.toString ? rr.studentId.toString() : rr.studentId,
            present: rr.status === 'present',
          })),
        }))
        setRecords(list.sort((a, b) => new Date(b.date) - new Date(a.date)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [course.id])

  const startSession = () => {
    setDate(new Date().toISOString().slice(0, 10))
    setTopic('')
    setPresent(Object.fromEntries(roster.map((s) => [s.id, true])))
    setOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!date) return toast('Pick a date.', 'error')
    try {
      await professorApi.saveAttendance(course.id, {
        date,
        records: roster.map((s) => ({ studentId: s.id, present: !!present[s.id] })),
      })
      const data = await professorApi.getCourseAttendance(course.id)
      const list = (data.records || data || []).map((r) => ({
        ...r, id: r._id || r.id, date: r.sessionDate || r.date,
        records: (r.records || []).map((rr) => ({
          studentId: rr.studentId?.toString ? rr.studentId.toString() : rr.studentId,
          present: rr.status === 'present',
        })),
      }))
      setRecords(list.sort((a, b) => new Date(b.date) - new Date(a.date)))
      toast('Attendance recorded.', 'success')
      setOpen(false)
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to save.', 'error')
    }
  }

  const rate = (rec) => {
    if (!rec.records?.length) return 0
    const p = rec.records.filter((r) => r.present).length
    return Math.round((p / rec.records.length) * 100)
  }

  if (loading) return <LoadingState label="Loading attendance…" />

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button icon={Plus} onClick={startSession} disabled={roster.length === 0}>Take attendance</Button></div>
      {records.length === 0 ? (
        <Card><EmptyState icon={CalendarCheck} title="No attendance records" message="Record attendance after each lecture session." action={roster.length > 0 && <Button icon={Plus} onClick={startSession}>Take attendance</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <Card key={rec.id} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{rec.topic || 'Lecture'}</p>
                  <p className="text-xs text-slate-400">{formatDate(rec.date, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
                <Badge tone={rate(rec) >= 80 ? 'emerald' : rate(rec) >= 60 ? 'amber' : 'red'}>{rate(rec)}% present</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {rec.records.map((r) => {
                  const stu = roster.find((s) => s.id === r.studentId)
                  return (
                    <span key={r.studentId} className={classNames('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', r.present ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
                      {r.present ? <Check size={12} /> : <X size={12} />} {stu ? stu.firstName + ' ' + stu.lastName[0] + '.' : 'Student'}
                    </span>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Attendance — ${course.code}`} size="lg"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button icon={Save} onClick={save}>Save attendance</Button></>}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date"><DatePicker value={date} onChange={(v) => setDate(v)} /></FormField>
            <FormField label="Topic"><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Lecture topic" /></FormField>
          </div>
          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-600">{roster.length} students</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPresent(Object.fromEntries(roster.map((s) => [s.id, true])))} className="text-xs font-semibold text-emerald-600">All present</button>
                <button type="button" onClick={() => setPresent(Object.fromEntries(roster.map((s) => [s.id, false])))} className="text-xs font-semibold text-red-600">All absent</button>
              </div>
            </div>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {roster.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar user={s} size="xs" />
                  <span className="flex-1 text-sm font-medium text-slate-700">{fullName(s)}</span>
                  <button type="button" onClick={() => setPresent((p) => ({ ...p, [s.id]: !p[s.id] }))}
                    className={classNames('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition', present[s.id] ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600')}>
                    {present[s.id] ? <><Check size={13} /> Present</> : <><X size={13} /> Absent</>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ----------------------------------------------------------------- Grades */
function GradesTab({ course, roster }) {
  const { toast } = useToast()
  const [scores, setScores] = useState({})
  const [gradeMap, setGradeMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    professorApi.getCourseGrades(course.id)
      .then((data) => {
        const map = {}
        ;(data.roster || []).forEach((s) => {
          if (s.grade) map[s.id] = s.grade
        })
        setGradeMap(map)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [course.id])

  const save = async (sid) => {
    const val = scores[sid]
    if (val === undefined || val === '') return toast('Enter a score.', 'error')
    const num = Number(val)
    if (isNaN(num) || num < 0 || num > 100) return toast('Score must be 0–100.', 'error')
    try {
      await professorApi.setFinalGrade(course.id, sid, num)
      const data = await professorApi.getCourseGrades(course.id)
      const map = {}
      ;(data.roster || []).forEach((s) => {
        if (s.grade) map[s.id] = s.grade
      })
      setGradeMap(map)
      toast('Final grade saved.', 'success')
      setScores((s) => ({ ...s, [sid]: '' }))
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to save.', 'error')
    }
  }

  if (loading) return <LoadingState label="Loading grades…" />
  if (roster.length === 0) return <Card><EmptyState icon={GraduationCap} title="No students" message="Enroll students to enter grades." /></Card>

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Final Grade Entry" subtitle="Enter or update final grades (0–100). Letter & GPA points are computed automatically." icon={GraduationCap} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Student</th><th className="px-5 py-3">Current</th>
              <th className="px-5 py-3">New score</th><th className="px-5 py-3">Letter</th><th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roster.map((s) => {
              const g = gradeMap[s.id]
              const preview = scores[s.id] !== undefined && scores[s.id] !== '' ? scoreToLetter(Number(scores[s.id])) : null
              return (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar user={s} size="sm" /><div><p className="font-semibold text-slate-700">{fullName(s)}</p><p className="text-xs text-slate-400">{s.studentId}</p></div></div></td>
                  <td className="px-5 py-3">
                    {g && g.status === 'final' ? (
                      <span className={classNames('font-bold', gradeColor(g.letter))}>{g.letter} · {g.score}</span>
                    ) : <StatusBadge status="in-progress" />}
                  </td>
                  <td className="px-5 py-3">
                    <input type="number" min="0" max="100" value={scores[s.id] ?? ''} onChange={(e) => setScores((sc) => ({ ...sc, [s.id]: e.target.value }))}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" placeholder="0–100" />
                  </td>
                  <td className="px-5 py-3">{preview ? <span className={classNames('font-bold', gradeColor(preview))}>{preview}</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-right"><Button size="sm" icon={Save} onClick={() => save(s.id)}>Save</Button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
