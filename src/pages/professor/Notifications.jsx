import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, GraduationCap, ClipboardList, FileText, Megaphone, Info, CalendarClock } from 'lucide-react'
import useProfessorData from '../../hooks/useProfessorData'
import { PageHeader, Card, Button, Tabs, EmptyState } from '../../components/ui'
import { timeAgo, classNames } from '../../utils/helpers'

const TYPE_ICON = {
  grade: GraduationCap,
  assignment: ClipboardList,
  material: FileText,
  announcement: Megaphone,
  submission: FileText,
  exam: CalendarClock,
  system: Info,
}
const TYPE_TONE = {
  grade: 'bg-emerald-50 text-emerald-600',
  assignment: 'bg-amber-50 text-amber-600',
  material: 'bg-brand-50 text-brand-600',
  announcement: 'bg-violet-50 text-violet-600',
  submission: 'bg-sky-50 text-sky-600',
  exam: 'bg-red-50 text-red-600',
  system: 'bg-slate-100 text-slate-600',
}

export default function ProfessorNotifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead, refresh } = useProfessorData()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')

  useEffect(() => { refresh() }, [refresh])

  const mine = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const unread = mine.filter((n) => !n.read)
  const list = tab === 'unread' ? unread : mine

  const open = (n) => {
    markNotificationRead(n._id || n.id)
    if (n.link) navigate(n.link)
  }

  const tabs = [
    { value: 'all', label: 'All', icon: Bell, count: mine.length },
    { value: 'unread', label: 'Unread', icon: CheckCheck, count: unread.length },
  ]

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Alerts for submissions, grades, and course activity."
        icon={Bell}
        actions={unread.length > 0 && <Button variant="secondary" icon={CheckCheck} onClick={markAllNotificationsRead}>Mark all read</Button>}
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="mt-6">
        {list.length === 0 ? (
          <Card><EmptyState icon={Bell} title="No notifications" message={tab === 'unread' ? "You've read everything." : 'Notifications will appear here.'} /></Card>
        ) : (
          <Card className="divide-y divide-slate-100">
            {list.map((n) => {
              const Icon = TYPE_ICON[n.type] || Info
              return (
                <div
                  key={n._id || n.id}
                  className={classNames('group flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50', !n.read && 'bg-brand-50/30')}
                >
                  <button onClick={() => open(n)} className={classNames('grid h-10 w-10 shrink-0 place-items-center rounded-xl', TYPE_TONE[n.type] || TYPE_TONE.system)}>
                    <Icon size={19} />
                  </button>
                  <button onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
                    <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                  </button>
                  {!n.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markNotificationRead(n._id || n.id) }}
                      className="mt-2 shrink-0 rounded p-1 text-xs text-slate-400 opacity-0 transition hover:text-brand-600 group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </Card>
        )}
      </div>
    </div>
  )
}