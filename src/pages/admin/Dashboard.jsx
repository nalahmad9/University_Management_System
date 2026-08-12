import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, GraduationCap, BookOpen, ClipboardList, UserCheck, UserX, ArrowRight, Plus, ScrollText, AlertTriangle } from 'lucide-react'
import * as adminApi from '../../api/admin'
import { useToast } from '../../context/ToastContext'
import { PageHeader, StatCard, Card, CardHeader, Button, IconButton, Avatar, Badge, EmptyState, LoadingState } from '../../components/ui'
import { fullName, timeAgo, classNames } from '../../utils/helpers'

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.capacity), 1)
  if (data.length === 0) return <p className="px-5 py-8 text-center text-sm text-slate-400">No courses yet.</p>
  return (
    <div className="space-y-3 p-5">
      {data.map((d) => {
        const enrolledPct = (d.students / max) * 100
        const capPct = (d.capacity / max) * 100
        return (
          <div key={d.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">{d.name}</span>
              <span className="text-slate-400">{d.students}/{d.capacity}</span>
            </div>
            <div className="relative h-6 w-full overflow-hidden rounded-lg bg-slate-100">
              <div className="absolute inset-y-0 left-0 rounded-lg bg-brand-100" style={{ width: `${capPct}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-lg bg-brand-600 transition-all" style={{ width: `${enrolledPct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Donut({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  const radius = 60
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:justify-center sm:gap-8">
      <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="18" />
        {segments.map((s, i) => {
          const len = (s.value / total) * circumference
          const seg = (
            <circle key={i} cx="80" cy="80" r={radius} fill="none" stroke={s.color} strokeWidth="18"
              strokeDasharray={`${len} ${circumference - len}`} strokeDashoffset={-offset} />
          )
          offset += len
          return seg
        })}
        <text x="80" y="80" transform="rotate(90 80 80)" textAnchor="middle" dominantBaseline="central" className="fill-slate-800 text-2xl font-extrabold">{total}</text>
      </svg>
      <ul className="space-y-2">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-medium text-slate-600">{s.name}</span>
            <span className="font-bold text-slate-800">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setStats(await adminApi.getDashboardStats())
    } catch (e) {
      setError(adminApi.errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApproveRequest = async (id) => {
    try {
      await adminApi.approveRequest(id)
      toast('Account approved and credentials sent to personal email.', 'success')
      load()
    } catch (e) {
      toast(adminApi.errMsg(e), 'error')
    }
  }

  const handleSetStatus = async (id, status) => {
    try {
      await adminApi.setUserStatus(id, status)
      toast(status === 'active' ? 'Account activated.' : 'Account deactivated.', status === 'active' ? 'success' : 'info')
      load()
    } catch (e) {
      toast(adminApi.errMsg(e), 'error')
    }
  }

  if (loading) return <LoadingState label="Loading dashboard..." />
  if (error) return (
    <Card><EmptyState icon={AlertTriangle} title="Could not load data" message={error} action={<Button onClick={load}>Retry</Button>} /></Card>
  )

  const { counts, statusBreakdown, pending, enrollmentByCourse, recentActivity } = stats
  
  // Support both 'pending' and 'requested' statuses from the backend/database models
  const pendingCount = (statusBreakdown.pending || 0) + (statusBreakdown.requested || 0)
  
  const barData = enrollmentByCourse.map((c) => ({ name: c.code, students: c.students, capacity: c.capacity }))
  const segments = [
    { name: 'Active', value: statusBreakdown.active || 0, color: '#10b981' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Inactive', value: statusBreakdown.inactive || 0, color: '#ef4444' },
  ].filter((s) => s.value > 0)

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Live data from the database." icon={Users}
        actions={<>
          <Button variant="secondary" icon={BookOpen} onClick={() => navigate('/admin/courses')}>Courses</Button>
          <Button icon={Plus} onClick={() => navigate('/admin/users')}>Add user</Button>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={GraduationCap} label="Total Students" value={counts.students} tone="brand" />
        <StatCard icon={Users} label="Professors" value={counts.professors} tone="emerald" />
        <StatCard icon={BookOpen} label="Courses" value={counts.courses} sub={`${counts.totalCredits} total credits`} tone="violet" />
        <StatCard icon={ClipboardList} label="Enrollments" value={counts.enrollments} sub="This semester" tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Enrollment by Course" subtitle="Students enrolled vs. capacity" icon={BookOpen} />
          <BarChart data={barData} />
        </Card>
        <Card>
          <CardHeader title="Accounts by Status" icon={UserCheck} />
          {segments.length ? <Donut segments={segments} /> : <EmptyState icon={UserCheck} title="No accounts" message="No user accounts yet." />}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pending Activations" subtitle={`${pending.length} awaiting approval`} icon={UserCheck}
            action={<Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>View all <ArrowRight size={14} /></Button>} />
          {pending.length === 0 ? (
            <EmptyState icon={UserCheck} title="No pending accounts" message="All accounts are activated." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.map((u) => {
                const userId = u._id || u.id
                const isRequested = u.status === 'requested'
                const isActive = u.status === 'active'

                return (
                  <li key={userId} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar user={u} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-700">{fullName(u)}</p>
                      <p className="truncate text-xs text-slate-400">{u.email}</p>
                    </div>
                    <Badge tone="brand" className="hidden sm:inline-flex">{u.role}</Badge>
                    <div className="flex items-center gap-1">
                      {isRequested ? (
                        <IconButton 
                          icon={UserCheck} 
                          title="Approve request" 
                          onClick={() => handleApproveRequest(userId)} 
                          className="hover:text-violet-600" 
                        />
                      ) : isActive ? (
                        <IconButton 
                          icon={UserX} 
                          title="Deactivate" 
                          onClick={() => handleSetStatus(userId, 'inactive')} 
                          className="hover:text-amber-600" 
                        />
                      ) : (
                        <IconButton 
                          icon={UserCheck} 
                          title="Activate" 
                          onClick={() => handleSetStatus(userId, 'active')} 
                          className="hover:text-emerald-600" 
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest actions" icon={ScrollText}
            action={<Button variant="ghost" size="sm" onClick={() => navigate('/admin/audit')}>Audit log <ArrowRight size={14} /></Button>} />
          {recentActivity.length === 0 ? (
            <EmptyState icon={ScrollText} title="No activity yet" message="Actions will show up here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={classNames('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.action === 'create' ? 'bg-emerald-500' : a.action === 'delete' ? 'bg-red-500' : 'bg-brand-500')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{a.detail}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{a.actorId ? fullName(a.actorId) : 'System'} - {timeAgo(a.createdAt)}</p>
                  </div>
                  <Badge tone={a.action === 'create' ? 'emerald' : a.action === 'delete' ? 'red' : 'brand'}>{a.action}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}