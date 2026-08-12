import { useState, useMemo, useEffect } from 'react'
import { CalendarDays, Plus, Trash2, GraduationCap, Flag, FileClock, PartyPopper } from 'lucide-react'
import * as adminApi from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import {
  PageHeader, Card, CardHeader, Button, IconButton, Badge, Modal, FormField,
  Input, Select, EmptyState,
} from '../../components/ui'
import { formatDate, daysUntil } from '../../utils/helpers'

const TYPE_META = {
  semester: { icon: GraduationCap, tone: 'brand', label: 'Semester', bg: 'bg-brand-50', fg: 'text-brand-600' },
  deadline: { icon: Flag, tone: 'red', label: 'Deadline', bg: 'bg-red-50', fg: 'text-red-600' },
  exam: { icon: FileClock, tone: 'amber', label: 'Exam', bg: 'bg-amber-50', fg: 'text-amber-600' },
  holiday: { icon: PartyPopper, tone: 'emerald', label: 'Holiday', bg: 'bg-emerald-50', fg: 'text-emerald-600' },
}

export default function AdminCalendar() {
  const { toast } = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', type: 'deadline' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.listCalendar()
      setEvents(Array.isArray(res) ? res : res.events || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const sorted = useMemo(() => [...events].sort((a, b) => new Date(a.date) - new Date(b.date)), [events])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.date) return toast('Please enter a title and date.', 'error')
    setSaving(true)
    try {
      await adminApi.createEvent(form)
      toast('Calendar event added.', 'success')
      setForm({ title: '', date: '', type: 'deadline' })
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
      await adminApi.deleteEvent(id)
      toast('Event removed.', 'info')
      load()
    } catch (e) {
      toast(adminApi.errMsg(e), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Academic Calendar"
        subtitle="Define semesters, registration deadlines, exams, and holidays."
        icon={CalendarDays}
        actions={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add event</Button>}
      />

      <Card>
        <CardHeader title="Fall 2026 — Key Dates" subtitle={`${sorted.length} events`} icon={CalendarDays} />
        {sorted.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No events yet" message="Add semester milestones and deadlines." />
        ) : (
          <ol className="relative space-y-1 px-5 py-4">
            {sorted.map((ev) => {
              const meta = TYPE_META[ev.type] || TYPE_META.deadline
              const Icon = meta.icon
              const dLeft = daysUntil(ev.date)
              return (
                <li key={ev._id || ev.id} className="group flex items-center gap-4 rounded-lg px-2 py-2.5 transition hover:bg-slate-50">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.bg}`}>
                    <Icon size={20} className={meta.fg} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-700">{ev.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(ev.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {dLeft >= 0 && dLeft <= 60 && (
                    <span className="hidden text-xs font-medium text-slate-400 sm:block">
                      {dLeft === 0 ? 'Today' : `in ${dLeft}d`}
                    </span>
                  )}
                  <IconButton icon={Trash2} title="Remove" onClick={() => remove(ev._id || ev.id)} className="opacity-0 transition group-hover:opacity-100 hover:text-red-600" />
                </li>
              )
            })}
          </ol>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Calendar Event"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Adding...' : 'Add event'}</Button></>}
      >
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Registration Deadline" /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date" required><Input type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></FormField>
            <FormField label="Type">
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="semester">Semester</option>
                <option value="deadline">Deadline</option>
                <option value="exam">Exam</option>
                <option value="holiday">Holiday</option>
              </Select>
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  )
}
