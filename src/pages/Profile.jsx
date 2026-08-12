import { useState } from 'react'
import { UserCog, Mail, Phone, Shield, Lock, Save, IdCard, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageHeader, Card, CardHeader, Avatar, Button, FormField, Input } from '../components/ui'
import { ROLE_LABEL } from '../components/layout/navConfig'
import { fullName } from '../utils/helpers'
import { errMsg } from '../api/admin'

export default function Profile() {
  const { currentUser, updateProfile, changePassword } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
    phone: currentUser.phone || '',
  })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try { await updateProfile(form); toast('Profile updated successfully.', 'success') }
    catch (er) { toast(errMsg(er), 'error') }
    finally { setSavingProfile(false) }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (!pw.current || !pw.next) return toast('Fill in all password fields.', 'error')
    if (pw.next !== pw.confirm) return toast('New passwords do not match.', 'error')
    if (pw.next.length < 6) return toast('Password must be at least 6 characters.', 'error')
    setSavingPw(true)
    try {
      await changePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      toast('Password changed successfully.', 'success')
    } catch (er) { toast(errMsg(er), 'error') }
    finally { setSavingPw(false) }
  }

  const isStudent = currentUser.role === 'student'

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information and password." icon={UserCog} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar user={currentUser} size="lg" />
            <h2 className="mt-3 text-lg font-bold text-slate-800">{fullName(currentUser)}</h2>
            <p className="text-sm text-slate-500">{ROLE_LABEL[currentUser.role]}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Shield size={13} /> {currentUser.status === 'active' ? 'Active account' : currentUser.status}
            </span>
          </div>
          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
            <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400" /><span className="truncate text-slate-600">{currentUser.email}</span></div>
            <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /><span className="text-slate-600">{currentUser.phone || '-'}</span></div>
            {isStudent ? (
              <>
                <div className="flex items-center gap-3"><IdCard size={16} className="text-slate-400" /><span className="text-slate-600">{currentUser.studentId || '-'}</span></div>
                <div className="flex items-center gap-3"><Building2 size={16} className="text-slate-400" /><span className="text-slate-600">{currentUser.program || '-'}</span></div>
              </>
            ) : (
              <div className="flex items-center gap-3"><Building2 size={16} className="text-slate-400" /><span className="text-slate-600">{currentUser.department || '-'}{currentUser.title ? ` - ${currentUser.title}` : ''}</span></div>
            )}
          </dl>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Personal Information" icon={UserCog} />
            <form onSubmit={saveProfile} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First name"><Input value={form.firstName} onChange={set('firstName')} /></FormField>
                <FormField label="Last name"><Input value={form.lastName} onChange={set('lastName')} /></FormField>
              </div>
              <FormField label="Email"><Input type="email" value={form.email} onChange={set('email')} /></FormField>
              <FormField label="Phone"><Input value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" /></FormField>
              <div className="flex justify-end"><Button type="submit" icon={Save} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save changes'}</Button></div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Change Password" icon={Lock} />
            <form onSubmit={savePassword} className="space-y-4 p-5">
              <FormField label="Current password"><Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="********" /></FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="New password"><Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="********" /></FormField>
                <FormField label="Confirm new password"><Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="********" /></FormField>
              </div>
              <div className="flex justify-end"><Button type="submit" variant="secondary" icon={Lock} disabled={savingPw}>{savingPw ? 'Updating...' : 'Update password'}</Button></div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
