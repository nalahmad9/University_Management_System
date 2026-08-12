import { useState, useMemo, useEffect } from 'react'
import { CalendarCheck, Plus, Save, Check, X, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useProfessorData from '../../hooks/useProfessorData'
import { useToast } from '../../context/ToastContext'
import {
  PageHeader, Card, CardHeader, Button, Avatar, Badge, Select, Modal, FormField,
  Input, EmptyState, LoadingState, SearchInput, DatePicker,
} from '../../components/ui'
import { fullName, formatDate, classNames } from '../../utils/helpers'

export default function ProfessorAttendance() {
  const api = useProfessorData()
  const { loading } = api
  const { currentUser } = useAuth()
  const { toast } = useToast()

  const courses = api.courses
  const users = api.users
  const enrollments = api.enrollments
  const attendance = api.attendance
  const myCourses = courses.filter((c) => c.professorId === currentUser.id)
  const [courseId, setCourseId] = useState(myCourses[0]?.id || '')
  const [studentSearch, setStudentSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [topic, setTopic] = useState('')
  const [present, setPresent] = useState({})

  useEffect(() => {
    if (myCourses.length > 0 && !courseId) setCourseId(myCourses[0].id)
  }, [myCourses, courseId])

  const roster = useMemo(() => {
    const ids = new Set(enrollments.filter((e) => e.courseId === courseId && e.status === 'enrolled').map((e) => e.studentId))
    return users.filter((u) => ids.has(u.id))
  }, [enrollments, users, courseId])

  const records = attendance
    .filter((a) => a.courseId === courseId)
    .sort((a, b) => new Date(b.sessionDate || b.date) - new Date(a.sessionDate || a.date))

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
      const records = roster.map((s) => ({ studentId: s.id, present: !!present[s.id] }))
      await api.saveAttendance(courseId, { date, topic: topic || 'Lecture', records })
      toast('Attendance recorded.', 'success')
      setOpen(false)
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to save attendance', 'error')
    }
  }

  const rate = (rec) => {
    const r = rec.records || []
    if (r.length === 0) return 0
    return Math.round((r.filter((x) => x.present || x.status === 'present').length / r.length) * 100)
  }

  const summary = useMemo(() => {
    return roster.map((s) => {
      let present = 0, total = 0
      records.forEach((rec) => {
        const r = (rec.records || []).find((x) => x.studentId === s.id)
        if (r) { total++; if (r.present || r.status === 'present') present++ }
      })
      return { student: s, present, total, pct: total ? Math.round((present / total) * 100) : null }
    })
  }, [roster, records])

  const sq = studentSearch.toLowerCase()
  const filteredSummary = summary.filter(({ student }) => !sq || fullName(student).toLowerCase().includes(sq))

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Mark attendance per session and track student attendance rates."
        icon={CalendarCheck}
        actions={roster.length > 0 && <Button icon={Plus} onClick={startSession}>Take attendance</Button>}
      />

      <Card className="mb-5 p-4">
        <label className="field-label">Course</label>
        <Select className="sm:w-96" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {myCourses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </Select>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sessions" subtitle={`${records.length} recorded`} icon={CalendarCheck} />
          {records.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No sessions" message="Take attendance to start tracking." action={roster.length > 0 && <Button size="sm" icon={Plus} onClick={startSession}>Take attendance</Button>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {records.map((rec) => (
                <li key={rec._id || rec.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700">{rec.topic || 'Lecture'}</p>
                    <p className="text-xs text-slate-400">{formatDate(rec.sessionDate || rec.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {rec.records?.length || 0} students</p>
                  </div>
                  <Badge tone={rate(rec) >= 80 ? 'emerald' : rate(rec) >= 60 ? 'amber' : 'red'}>{rate(rec)}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Student Attendance" subtitle="Overall rate this semester" icon={Check} />
          {summary.length === 0 ? (
            <EmptyState icon={Check} title="No students" message="Enroll students to track attendance." />
          ) : (
            <div className="px-4 pt-2">
              <SearchInput className="w-full" placeholder="Search student…" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>
          )}
          {summary.length === 0 ? (
            <EmptyState icon={Check} title="No students" message="Enroll students to track attendance." />
          ) : filteredSummary.length === 0 ? (
            <EmptyState icon={Check} title="No students match" message="Try a different search term." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredSummary.map(({ student, present, total, pct }) => (
                <li key={student.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar user={student} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">{fullName(student)}</p>
                    <p className="text-xs text-slate-400">{total ? `${present}/${total} sessions` : 'No records'}</p>
                  </div>
                  {pct != null ? (
                    <Badge tone={pct >= 80 ? 'emerald' : pct >= 60 ? 'amber' : 'red'}>{pct}%</Badge>
                  ) : <span className="text-xs text-slate-300">—</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Take Attendance" size="lg"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button icon={Save} onClick={save}>Save</Button></>}>
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
