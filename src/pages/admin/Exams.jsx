import { useState, useMemo, useEffect } from 'react'
import { CalendarClock, Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react'
import * as adminApi from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import {
  PageHeader, Card, Button, IconButton, Badge, Modal, ConfirmDialog, FormField,
  Input, Select, EmptyState,
} from '../../components/ui'
import { formatDate } from '../../utils/helpers'

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')
const EMPTY = { courseId: '', title: '', type: 'Midterm', date: '', startTime: '09:00', endTime: '11:00', room: '' }

function ExamFormModal({ open, onClose, onSave, initial, courses, saving }) {
  const start = initial
    ? { ...initial, courseId: initial.courseId?.id || initial.courseId || '', date: toDateInput(initial.date) }
    : EMPTY
  const [form, setForm] = useState(start)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.courseId) err.courseId = 'Select a course'
    if (!form.title) err.title = 'Required'
    if (!form.date) err.date = 'Required'
    if (!form.room) err.room = 'Required'
    if (form.startTime && form.endTime && form.endTime <= form.startTime) err.endTime = 'Must be after the start time'
    setErrors(err); if (Object.keys(err).length) return
    onSave(form)
  }
  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Exam' : 'Schedule Exam'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : (initial ? 'Save changes' : 'Schedule')}</Button></>}>
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Course" required error={errors.courseId}>
          <Select value={form.courseId} onChange={set('courseId')} error={errors.courseId}>
            <option value="">Select a course...</option>
            {courses.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.code} - {c.name}</option>)}
          </Select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Exam title" required error={errors.title} className="sm:col-span-2"><Input value={form.title} onChange={set('title')} placeholder="CS101 Midterm" error={errors.title} /></FormField>
          <FormField label="Type"><Select value={form.type} onChange={set('type')}><option>Quiz</option><option>Midterm</option><option>Final</option></Select></FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date" required error={errors.date}><Input type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v.target.value }))} /></FormField>
          <FormField label="Room" required error={errors.room}><Input value={form.room} onChange={set('room')} placeholder="Exam Hall 1" error={errors.room} /></FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Start time"><Input type="time" value={form.startTime} onChange={set('startTime')} /></FormField>
          <FormField label="End time" error={errors.endTime}><Input type="time" value={form.endTime} onChange={set('endTime')} error={errors.endTime} /></FormField>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminExams() {
  const { toast } = useToast()
  const [exams, setExams] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [examsRes, coursesRes] = await Promise.all([
        adminApi.listExams(),
        adminApi.listCourses(),
      ])
      setExams(Array.isArray(examsRes) ? examsRes : examsRes.exams || [])
      setCourses(Array.isArray(coursesRes) ? coursesRes : coursesRes.courses || [])
    } catch (e) {
      setError(adminApi.errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const courseById = useMemo(() => Object.fromEntries(courses.map((c) => [c._id || c.id, c])), [courses])
  const sorted = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date))

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (x) => { setEditing(x); setModalOpen(true) }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editing) { await adminApi.updateExam(editing._id || editing.id, form); toast('Exam updated.', 'success') }
      else { await adminApi.createExam(form); toast('Exam scheduled.', 'success') }
      setModalOpen(false); load()
    } catch (e) { toast(adminApi.errMsg(e), 'error') } finally { setSaving(false) }
  }

  const doDelete = async () => {
    try { await adminApi.deleteExam(confirmDel._id || confirmDel.id); toast('Exam deleted.', 'info'); setConfirmDel(null); load() }
    catch (e) { toast(adminApi.errMsg(e), 'error') }
  }

  const typeTone = { Midterm: 'amber', Final: 'red', Quiz: 'sky' }

  return (
    <div>
      <PageHeader
        title="Exam Scheduling"
        subtitle="Create and manage the examination timetable."
        icon={CalendarClock}
        actions={<Button icon={Plus} onClick={openCreate}>Schedule exam</Button>}
      />

      <Card className="overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No exams scheduled" message="Schedule your first exam to build the timetable." action={<Button icon={Plus} onClick={openCreate}>Schedule exam</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Exam</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((x) => {
                  const c = courseById[x.courseId]
                  return (
                    <tr key={x._id || x.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-700">{x.title}</td>
                      <td className="px-5 py-3"><Badge tone="brand">{c?.code || '-'}</Badge></td>
                      <td className="px-5 py-3"><Badge tone={typeTone[x.type] || 'slate'}>{x.type}</Badge></td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(x.date, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                      <td className="px-5 py-3 text-slate-600"><span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-slate-400" />{x.startTime}–{x.endTime}</span></td>
                      <td className="px-5 py-3 text-slate-600"><span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" />{x.room}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton icon={Pencil} title="Edit" onClick={() => openEdit(x)} className="hover:text-brand-600" />
                          <IconButton icon={Trash2} title="Delete" onClick={() => setConfirmDel(x)} className="hover:text-red-600" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen && <ExamFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initial={editing} courses={courses} saving={saving} />}
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={doDelete}
        title="Delete exam?"
        message={confirmDel ? `Remove "${confirmDel.title}" from the timetable?` : ''}
        confirmLabel="Delete"
      />
    </div>
  )
}
