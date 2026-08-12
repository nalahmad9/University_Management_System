import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { GraduationCap, Lock, CheckCircle2 } from 'lucide-react'
import { Button, FormField, Input } from '../../components/ui'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
            <GraduationCap size={22} />
          </span>
          <p className="text-lg font-extrabold tracking-tight text-slate-800">UniHub</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          {done ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={30} />
              </span>
              <h2 className="mt-4 text-xl font-bold text-slate-800">Password updated</h2>
              <p className="mt-2 text-sm text-slate-500">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold tracking-tight text-slate-800">Set a new password</h2>
              <p className="mt-1 text-sm text-slate-500">Choose a new password for your account.</p>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <FormField label="New password">
                  <div className="relative">
                    <Lock size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      className="pl-9"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </FormField>
                <FormField label="Confirm new password">
                  <div className="relative">
                    <Lock size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      className="pl-9"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </FormField>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
              <Link to="/login" className="mt-6 flex items-center justify-center text-sm font-semibold text-brand-600 hover:text-brand-700">
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
