import { useState, useEffect, useCallback, useMemo } from 'react'
import { ClipboardList, UserPlus, UserMinus, Users, Search, AlertTriangle, Hourglass, Lock } from 'lucide-react'
import * as adminApi from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import {
  PageHeader, Card, CardHeader, Button, Avatar, Badge, Select, SearchInput,
  EmptyState, ProgressBar, LoadingState,
} from '../../components/ui'
import { fullName, classNames } from '../../utils/helpers'

const EMPTY_ROSTER = { enrolled: [], waitlist: [] }

export default function AdminEnrollment() {
  const { toast } = useToast()
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [courseId, setCourseId] = useState('')
  const [roster, setRoster] = useState(EMPTY_ROSTER)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rosterLoading, setRosterLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadBase = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [c, s] = await Promise.all([adminApi.listCourses(), adminApi.listUsers({ role: 'student' })])
      setCourses(c); setStudents(s)
      // keep the current selection; only default to the first course when nothing is selected
      if (c.length) setCourseId((prev) => (prev && c.some((x) => x.id === prev) ? prev : c[0].id))
    } catch (e) { setError(adminApi.errMsg(e)) }
    finally { setLoading(false) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadBase() }, [loadBase])

  const loadRoster = useCallback(async (id) => {
    if (!id) return
    setRosterLoading(true)
    try { setRoster(await adminApi.getRoster(id)) }
    catch (e) { toast(adminApi.errMsg(e), 'error') }
    finally { setRosterLoading(false) }
  }, [toast])
  useEffect(() => { if (courseId) loadRoster(courseId) }, [courseId, loadRoster])

  const course = courses.find((c) => c.id === courseId)
  const takenIds = useMemo(
    () => new Set([...roster.enrolled, ...roster.waitlist].map((s) => s.id)),
    [roster]
  )
  const available = students.filter((s) => !takenIds.has(s.id)).filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return fullName(s).toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q)
  })

  const capacityPct = course ? Math.round((roster.enrolled.length / course.capacity) * 100) : 0
  const full = course && roster.enrolled.length >= course.capacity
  const prereqs = course?.prerequisites || []

  const add = async (s) => {
    try {
      const res = await adminApi.enrollStudent(s.id, courseId)
      setRoster({ enrolled: res.enrolled || [], waitlist: res.waitlist || [] })
      if (res.waitlisted) toast(`${fullName(s)} added to the waitlist (course is full).`, 'info')
      else toast(`${fullName(s)} enrolled.`, 'success')
      loadBase()
    } catch (e) { toast(adminApi.errMsg(e), 'error') }
  }
  const remove = async (s, fromWaitlist = false) => {
    try {
      setRoster(await adminApi.dropStudent(s.id, courseId))
      toast(fromWaitlist ? `${fullName(s)} removed from the waitlist.` : `${fullName(s)} removed.`, 'info')
      loadBase()
    } catch (e) { toast(adminApi.errMsg(e), 'error') }
  }

  if (loading) return <LoadingState label="Loading enrollment..." />
  if (error) return <Card><EmptyState icon={AlertTriangle} title="Could not load data" message={error} action={<Button onClick={loadBase}>Retry</Button>} /></Card>

  return (
    <div>
      <PageHeader title="Student Enrollment" subtitle="Enroll or remove students, monitor capacity, and manage the waitlist." icon={ClipboardList} />

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="sm:w-96">
            <label className="field-label">Select course</label>
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </Select>
            {prereqs.length > 0 && (
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Lock size={12} className="text-slate-400" /> Prerequisites:
                {prereqs.map((p) => <Badge key={p.id || p} tone="slate">{p.code || p}</Badge>)}
              </p>
            )}
          </div>
          {course && (
            <div className="sm:w-72">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600">Capacity</span>
                <span className={classNames('font-semibold', full ? 'text-red-600' : 'text-slate-700')}>{roster.enrolled.length} / {course.capacity}</span>
              </div>
              <ProgressBar value={capacityPct} tone={full ? 'red' : capacityPct > 80 ? 'amber' : 'brand'} />
              {full && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  Course is full — new students go to the waitlist{roster.waitlist.length > 0 ? ` (${roster.waitlist.length} waiting)` : ''}.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Enrolled Students" subtitle={`${roster.enrolled.length} enrolled`} icon={Users} />
            {rosterLoading ? <LoadingState label="Loading roster..." /> : roster.enrolled.length === 0 ? (
              <EmptyState icon={Users} title="No students enrolled" message="Add students from the panel on the right." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {roster.enrolled.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar user={s} size="sm" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{fullName(s)}</p><p className="truncate text-xs text-slate-400">{s.studentId} - {s.program}</p></div>
                    <Button size="sm" variant="ghost" icon={UserMinus} className="hover:bg-red-50 hover:text-red-600" onClick={() => remove(s)}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Waitlist" subtitle={roster.waitlist.length ? `${roster.waitlist.length} waiting — first in line is enrolled automatically when a seat opens` : 'No one is waiting'} icon={Hourglass} />
            {rosterLoading ? <LoadingState label="Loading waitlist..." /> : roster.waitlist.length === 0 ? (
              <EmptyState icon={Hourglass} title="Waitlist is empty" message="Students added while the course is full appear here in order." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {roster.waitlist.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-6 text-center text-sm font-bold text-amber-500">#{i + 1}</span>
                    <Avatar user={s} size="sm" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{fullName(s)}</p><p className="truncate text-xs text-slate-400">{s.studentId} - {s.program}</p></div>
                    <Badge tone="amber">Waitlisted</Badge>
                    <Button size="sm" variant="ghost" icon={UserMinus} className="hover:bg-red-50 hover:text-red-600" onClick={() => remove(s, true)}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="Add Students" subtitle={`${available.length} not enrolled`} icon={UserPlus} />
          <div className="border-b border-slate-100 p-4"><SearchInput placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          {available.length === 0 ? (
            <EmptyState icon={Search} title="No students to add" message="Everyone is enrolled or no match found." />
          ) : (
            <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
              {available.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar user={s} size="sm" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-700">{fullName(s)}</p><p className="truncate text-xs text-slate-400">{s.studentId} - {s.program}</p></div>
                  {s.status !== 'active' && <Badge tone="amber">{s.status}</Badge>}
                  <Button size="sm" variant="soft" icon={full ? Hourglass : UserPlus} onClick={() => add(s)}>
                    {full ? 'Waitlist' : 'Enroll'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
