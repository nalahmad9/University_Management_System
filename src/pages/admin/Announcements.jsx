import { useState, useMemo, useEffect } from 'react'
import { Megaphone, Plus, Trash2, Pin, Globe } from 'lucide-react'
import * as adminApi from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import {
  PageHeader, Card, Button, IconButton, Badge, Modal, FormField, Input, Textarea, EmptyState,
} from '../../components/ui'
import { formatDate, timeAgo } from '../../utils/helpers'

export default function AdminAnnouncements() {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', pinned: false })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.listAnnouncements()
      setAnnouncements(Array.isArray(res) ? res : res.announcements || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const systemAnns = useMemo(() =>
    announcements
      .filter((a) => a.scope === 'system')
      .sort((a, b) => (b.pinned - a.pinned) || new Date(b.createdAt) - new Date(a.createdAt)),
    [announcements]
  )

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.body) return toast('Please enter a title and message.', 'error')
    setSaving(true)
    try {
      await adminApi.createAnnouncement({ ...form, scope: 'system' })
      toast('Announcement posted to all users.', 'success')
      setForm({ title: '', body: '', pinned: false })
      setModalOpen(false)
      load()
    } catch (e) {
      toast(adminApi.errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    try {
      await adminApi.deleteAnnouncement(id)
      toast('Announcement deleted.', 'info')
      load()
    } catch (e) {
      toast(adminApi.errMsg(e), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="System Announcements"
        subtitle="Post announcements visible to all users across the platform."
        icon={Megaphone}
        actions={<Button icon={Plus} onClick={() => setModalOpen(true)}>New announcement</Button>}
      />

      {systemAnns.length === 0 ? (
        <Card><EmptyState icon={Megaphone} title="No announcements" message="Post your first system-wide announcement." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>New announcement</Button>} /></Card>
      ) : (
        <div className="space-y-4">
          {systemAnns.map((a) => (
            <Card key={a._id || a.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Globe size={19} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{a.title}</h3>
                      {a.pinned && <Badge tone="amber"><Pin size={11} /> Pinned</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                    <p className="mt-2 text-xs text-slate-400">Posted {formatDate(a.createdAt)} · {timeAgo(a.createdAt)}</p>
                  </div>
                </div>
                <IconButton icon={Trash2} title="Delete" onClick={() => remove(a._id || a.id)} className="hover:text-red-600" />
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New System Announcement" subtitle="This will be visible to every user."
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Posting...' : 'Post announcement'}</Button></>}>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Registration Deadline" /></FormField>
          <FormField label="Message" required><Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Write your announcement..." className="min-h-[120px]" /></FormField>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Pin this announcement to the top
          </label>
        </form>
      </Modal>
    </div>
  )
}
