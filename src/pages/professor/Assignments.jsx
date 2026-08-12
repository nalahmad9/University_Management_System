import { useState, useMemo, useEffect } from 'react'
import { ClipboardList, Plus, Clock, Trash2, PenSquare, Download, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useProfessorData from '../../hooks/useProfessorData'
import { professorApi, uploadApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import {
  PageHeader, Card, Button, IconButton, Badge, Modal, ConfirmDialog, FormField,
  Input, Textarea, Select, EmptyState, FileDropzone, LoadingState, SearchInput, DatePicker,
} from '../../components/ui'
import { formatDate, daysUntil } from '../../utils/helpers'

export default function ProfessorAssignments() {
  const api = useProfessorData()
  const { loading: hookLoading } = api
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [del, setDel] = useState(null)
  const [courseFilter, setCourseFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ courseId: '', title: '', description: '', dueDate: '', maxScore: 100, file: null })

  const courses = api.courses
  const myCourses = courses.filter((c) => c.professorId === currentUser.id)
  const myCourseIds = new Set(myCourses.map((c) => c.id))
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])

  useEffect(() => {
    professorApi.getAssignments()
      .then((data) => {
        const list = (data.assignments || []).map((a) => ({
          ...a, id: a._id || a.id, dueDate: a.deadline || a.dueDate, maxScore: a.maxScore || 100,
        }))
        setItems(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const q = search.toLowerCase()
  const visible = items
    .filter((a) => myCourseIds.has(a.courseId))
    .filter((a) => courseFilter === 'all' || a.courseId === courseFilter)
    .filter((a) => !q || a.title.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.courseId || !form.title || !form.dueDate) return toast('Course, title, and due date are required.', 'error')
    try {
      let attachment = null
      if (form.file) {
        const uploadRes = await uploadApi.uploadFile(form.file)
        attachment = uploadRes.filename
      }
      await professorApi.addAssignment(form.courseId, {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        attachment,
      })
      const data = await professorApi.getAssignments()
      setItems((data.assignments || []).map((a) => ({
        ...a, id: a._id || a.id, dueDate: a.deadline || a.dueDate, maxScore: a.maxScore || 100,
      })))
      toast('Assignment created.', 'success')
      setForm({ courseId: '', title: '', description: '', dueDate: '', maxScore: 100, file: null })
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
    } catch {
      toast('Delete failed.', 'error')
    }
  }

  if (hookLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="All assignments across your courses."
        icon={ClipboardList}
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>Create assignment</Button>}
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select className="sm:w-72" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">All my courses</option>
            {myCourses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </Select>
          <SearchInput className="min-w-[200px] flex-1" placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <Card><EmptyState icon={ClipboardList} title="Loading assignments..." message="Please wait" /></Card>
      ) : visible.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="No assignments" message="Create your first assignment." action={<Button icon={Plus} onClick={() => setOpen(true)}>Create assignment</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {visible.map((a) => {
            const d = daysUntil(a.dueDate)
            return (
              <Card key={a.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{courseById[a.courseId]?.code}</Badge>
                      <h3 className="font-bold text-slate-800">{a.title}</h3>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone={d < 0 ? 'slate' : d <= 3 ? 'red' : 'amber'}><Clock size={11} /> {d < 0 ? 'Closed' : d === 0 ? 'Due today' : `Due ${formatDate(a.dueDate)}`}</Badge>
                      {a.attachedFileUrl && (
                        <button onClick={() => window.open(uploadApi.getFileUrl(a.attachedFileUrl), '_blank')} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200">
                          <Download size={11} /> Attachment
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="soft" icon={PenSquare} onClick={() => navigate('/professor/grading')}>Grade</Button>
                    <IconButton icon={Trash2} title="Delete" onClick={() => setDel(a)} className="hover:text-red-600" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Assignment" size="lg"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Create</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Course" required>
            <Select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}>
              <option value="">Select a course…</option>
              {myCourses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
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
        title="Delete assignment?" message={del ? `Remove "${del.title}"?` : ''} confirmLabel="Delete" />
    </div>
  )
}
