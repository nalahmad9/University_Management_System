import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Plus, Pencil, Trash2, Search, AlertTriangle, Archive } from 'lucide-react'
import * as adminApi from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import {
  PageHeader, Card, Button, IconButton, Badge, Modal, ConfirmDialog, FormField, Input,
  Textarea, Select, SearchInput, EmptyState, LoadingState,
} from '../../components/ui'
import CourseCard from '../../components/CourseCard'
import { fullName } from '../../utils/helpers'

const COLORS = ['bg-brand-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-violet-500', 'bg-teal-500']
const EMPTY = { code: '', name: '', description: '', credits: 3, capacity: 30, professorId: '', schedule: '', room: '', color: 'bg-brand-500', prerequisites: [] }

// Prerequisites may arrive populated ({id, code, name}) or as raw ids.
const prereqId = (p) => p?.id || p?._id || p
const prereqIds = (list) => (list || []).map(prereqId).filter(Boolean)

function CourseFormModal({ open, onClose, onSave, initial, professors, courses, saving }) {
  const start = initial
    ? { ...initial, professorId: initial.professorId?.id || initial.professorId?._id || initial.professorId || '', prerequisites: prereqIds(initial.prerequisites) }
    : EMPTY
  const [form, setForm] = useState(start)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Courses that can be selected as prerequisites (any course except itself)
  const prereqOptions = courses.filter((c) => !initial || c.id !== initial.id)
  const togglePrereq = (id) =>
    setForm((f) => ({
      ...f,
      prerequisites: f.prerequisites.includes(id)
        ? f.prerequisites.filter((p) => p !== id)
        : [...f.prerequisites, id],
    }))

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.code) err.code = 'Required'
    if (!form.name) err.name = 'Required'
    if (!form.professorId) err.professorId = 'Assign a professor'
    setErrors(err)
    if (Object.keys(err).length) return
    onSave({ ...form, credits: Number(form.credits), capacity: Number(form.capacity) })
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Course' : 'Create Course'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : (initial ? 'Save changes' : 'Create course')}</Button></>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Course code" required error={errors.code}><Input value={form.code} onChange={set('code')} placeholder="CS101" error={errors.code} /></FormField>
          <FormField label="Course name" required error={errors.name} className="sm:col-span-2"><Input value={form.name} onChange={set('name')} placeholder="Introduction to Programming" error={errors.name} /></FormField>
        </div>
        <FormField label="Description"><Textarea value={form.description} onChange={set('description')} placeholder="Short course description..." /></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Credits"><Select value={form.credits} onChange={set('credits')}>{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}</Select></FormField>
          <FormField label="Capacity"><Input type="number" min="1" value={form.capacity} onChange={set('capacity')} /></FormField>
        </div>
        <FormField label="Assigned professor" required error={errors.professorId}>
          <Select value={form.professorId} onChange={set('professorId')} error={errors.professorId}>
            <option value="">Select a professor...</option>
            {professors.map((p) => <option key={p.id} value={p.id}>{fullName(p)}{p.department ? ` - ${p.department}` : ''}</option>)}
          </Select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Schedule"><Input value={form.schedule} onChange={set('schedule')} placeholder="Mon & Wed - 09:00-10:30" /></FormField>
          <FormField label="Room"><Input value={form.room} onChange={set('room')} placeholder="Hall A-101" /></FormField>
        </div>
        <FormField label="Prerequisites" hint="Students must pass these courses before they can enroll.">
          {prereqOptions.length === 0 ? (
            <p className="text-sm text-slate-400">No other courses available.</p>
          ) : (
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {prereqOptions.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={form.prerequisites.includes(c.id)}
                    onChange={() => togglePrereq(c.id)}
                  />
                  <span className="font-medium text-slate-700">{c.code}</span>
                  <span className="truncate text-slate-500">{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </FormField>
        <FormField label="Accent color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={`h-8 w-8 rounded-lg ${c} ${form.color === c ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`} />
            ))}
          </div>
        </FormField>
      </form>
    </Modal>
  )
}

export default function AdminCourses() {
  const { toast } = useToast()
  const [courses, setCourses] = useState([])
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [c, profs] = await Promise.all([adminApi.listCourses(), adminApi.listUsers({ role: 'professor' })])
      setCourses(c); setProfessors(profs)
    } catch (e) { setError(adminApi.errMsg(e)) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = courses.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.code || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
  })

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); setModalOpen(true) }

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editing) { await adminApi.updateCourse(editing.id, form); toast('Course updated.', 'success') }
      else { await adminApi.createCourse(form); toast('Course created.', 'success') }
      setModalOpen(false); load()
    } catch (e) { toast(adminApi.errMsg(e), 'error') }
    finally { setSaving(false) }
  }

  const doDelete = async () => {
    try { await adminApi.deleteCourse(confirmDel.id); toast('Course deleted.', 'info'); load() }
    catch (e) { toast(adminApi.errMsg(e), 'error') }
  }

  const archive = async (c) => {
    try {
      await adminApi.updateCourse(c.id, { status: c.status === 'archived' ? 'active' : 'archived' })
      toast(c.status === 'archived' ? 'Course unarchived.' : 'Course archived.', 'info')
      load()
    } catch (e) { toast(adminApi.errMsg(e), 'error') }
  }

  return (
    <div>
      <PageHeader title="Course Management" subtitle="Create courses, set capacity, and assign professors." icon={BookOpen}
        actions={<Button icon={Plus} onClick={openCreate}>New course</Button>} />

      <Card className="mb-5 p-4">
        <SearchInput placeholder="Search courses by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {loading ? <LoadingState label="Loading courses..." /> : error ? (
        <Card><EmptyState icon={AlertTriangle} title="Could not load courses" message={error} action={<Button onClick={load}>Retry</Button>} /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={Search} title="No courses found" message="Create a course or adjust your search." action={<Button icon={Plus} onClick={openCreate}>New course</Button>} /></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c}
              professorName={c.professorId ? fullName(c.professorId) : 'Unassigned'}
              enrolledCount={c.enrolledCount}
              right={c.status === 'archived' ? <Badge tone="slate">Archived</Badge> : c.waitlistCount > 0 ? <Badge tone="amber">{c.waitlistCount} waitlisted</Badge> : null}
              footer={<div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  {(c.prerequisites || []).length > 0 && <span className="text-xs text-slate-400">Prereq:</span>}
                  {(c.prerequisites || []).map((p) => <Badge key={p.id || p} tone="slate">{p.code || p}</Badge>)}
                </div>
                <div className="flex shrink-0 items-center justify-end gap-1">
                  <IconButton icon={Archive} title={c.status === 'archived' ? 'Unarchive' : 'Archive'} onClick={() => archive(c)} className="hover:text-amber-600" />
                  <IconButton icon={Pencil} title="Edit" onClick={() => openEdit(c)} className="hover:text-brand-600" />
                  <IconButton icon={Trash2} title="Delete" onClick={() => setConfirmDel(c)} className="hover:text-red-600" />
                </div>
              </div>} />
          ))}
        </div>
      )}

      {modalOpen && <CourseFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initial={editing} professors={professors} courses={courses} saving={saving} />}
      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={doDelete}
        title="Delete course?" message={confirmDel ? `This removes ${confirmDel.code} - ${confirmDel.name} and all its enrollments.` : ''} confirmLabel="Delete" />
    </div>
  )
}
