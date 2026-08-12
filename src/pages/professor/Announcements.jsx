import { useState, useMemo } from 'react'
import { Megaphone, Plus, Trash2, Pin, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useProfessorData from '../../hooks/useProfessorData'
import { useToast } from '../../context/ToastContext'
import {
  PageHeader, Card, Button, IconButton, Badge, Modal, FormField, Input, Textarea,
  Select, EmptyState, LoadingState, SearchInput,
} from '../../components/ui'
import { formatDate, timeAgo } from '../../utils/helpers'

export default function ProfessorAnnouncements() {
  const api = useProfessorData()
  const { loading } = api
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [form, setForm] = useState({ courseId: '', title: '', body: '' })

  const courses = api.courses
  const announcements = api.announcements
  const myCourses = courses.filter((c) => c.professorId === currentUser.id)
  const myCourseIds = new Set(myCourses.map((c) => c.id))
  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses])

  const q = search.toLowerCase()
  const items = announcements
    .filter((a) => myCourseIds.has(a.courseId))
    .filter((a) => courseFilter === 'all' || a.courseId === courseFilter)
    .filter((a) => !q || a.title.toLowerCase().includes(q) || (a.body || a.message || '').toLowerCase().includes(q))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.courseId || !form.title || !form.body) return toast('Course, title, and message are required.', 'error')
    try {
      await api.addAnnouncement(form.courseId, { title: form.title, body: form.body })
      toast('Announcement posted.', 'success')
      setForm({ courseId: '', title: '', body: '' })
      setOpen(false)
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to post announcement', 'error')
    }
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Course Announcements"
        subtitle="Post announcements to students in your courses."
        icon={Megaphone}
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>New announcement</Button>}
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select className="sm:w-72" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">All courses</option>
            {myCourses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </Select>
          <SearchInput className="min-w-[200px] flex-1" placeholder="Search announcements…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      {items.length === 0 ? (
        <Card><EmptyState icon={Megaphone} title={search || courseFilter !== 'all' ? 'No announcements match' : 'No announcements'} message={search || courseFilter !== 'all' ? 'Try different filters.' : 'Post updates for your enrolled students.'} action={search || courseFilter !== 'all' ? null : <Button icon={Plus} onClick={() => setOpen(true)}>New announcement</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex-wrap flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{courseById[a.courseId]?.code}</Badge>
                    <h3 className="font-bold text-slate-800">{a.title}</h3>
                    {a.pinned && <Badge tone="amber"><Pin size={11} /> Pinned</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{a.message || a.body}</p>
                  <p className="mt-2 text-xs text-slate-400">Posted {formatDate(a.createdAt)} · {timeAgo(a.createdAt)}</p>
                </div>
                <IconButton icon={Trash2} title="Delete" onClick={async () => { try { await api.deleteAnnouncement(a._id || a.id); toast('Deleted.', 'info') } catch (err) { toast('Failed to delete', 'error') } }} className="hover:text-red-600" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Course Announcement"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Post</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Course" required>
            <Select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}>
              <option value="">Select a course…</option>
              {myCourses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
          <FormField label="Message" required><Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="min-h-[120px]" /></FormField>
        </form>
      </Modal>
    </div>
  )
}
