import { useState, useEffect, useCallback } from 'react'
import { ScrollText, Search, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import * as adminApi from '../../api/admin'
import { PageHeader, Card, Badge, Avatar, Select, SearchInput, EmptyState, LoadingState, Button } from '../../components/ui'
import { fullName, formatDateTime } from '../../utils/helpers'

const ACTION_META = { create: { tone: 'emerald', icon: Plus }, update: { tone: 'brand', icon: Pencil }, delete: { tone: 'red', icon: Trash2 } }

export default function AdminAudit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setLogs(await adminApi.listAudit()) } catch (e) { setError(adminApi.errMsg(e)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = logs.filter((l) => {
    if (action !== 'all' && l.action !== action) return false
    if (search) { const q = search.toLowerCase(); return (l.detail || '').toLowerCase().includes(q) || (l.entity || '').toLowerCase().includes(q) }
    return true
  })

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Track all create, update, and delete actions." icon={ScrollText} />
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput className="flex-1" placeholder="Search actions..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select className="sm:w-44" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="all">All actions</option><option value="create">Create</option><option value="update">Update</option><option value="delete">Delete</option>
          </Select>
        </div>
      </Card>
      {loading ? <LoadingState label="Loading audit log..." /> : error ? (
        <Card><EmptyState icon={AlertTriangle} title="Could not load audit log" message={error} action={<Button onClick={load}>Retry</Button>} /></Card>
      ) : (
        <Card className="overflow-hidden">
          {filtered.length === 0 ? <EmptyState icon={Search} title="No log entries" message="No actions match your filters." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Action</th><th className="px-5 py-3">Entity</th><th className="px-5 py-3">Details</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Timestamp</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((l) => {
                    const meta = ACTION_META[l.action] || ACTION_META.update
                    const Icon = meta.icon
                    return (
                      <tr key={l.id} className="transition hover:bg-slate-50/60">
                        <td className="px-5 py-3"><Badge tone={meta.tone}><Icon size={11} /> {l.action}</Badge></td>
                        <td className="px-5 py-3 font-medium text-slate-600">{l.entity}</td>
                        <td className="px-5 py-3 text-slate-600">{l.detail}</td>
                        <td className="px-5 py-3"><div className="flex items-center gap-2">{l.actorId && <Avatar user={l.actorId} size="xs" />}<span className="text-slate-600">{l.actorId ? fullName(l.actorId) : 'System'}</span></div></td>
                        <td className="px-5 py-3 whitespace-nowrap text-slate-500">{formatDateTime(l.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      {!loading && !error && <p className="mt-3 text-xs text-slate-400">Showing {filtered.length} of {logs.length} entries</p>}
    </div>
  )
}
