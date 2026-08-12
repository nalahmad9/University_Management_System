import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { GraduationCap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button, FormField, Input } from '../../components/ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setError('')
    setLoading(true)
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
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
          {sent ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={30} />
              </span>
              <h2 className="mt-4 text-xl font-bold text-slate-800">Check your inbox</h2>
              <p className="mt-2 text-sm text-slate-500">
                If an account exists for <span className="font-semibold text-slate-700">{email}</span>, we've sent a
                password reset link. The link expires in 30 minutes.
              </p>
              <Link to="/login" className="mt-6 inline-flex">
                <Button variant="secondary" icon={ArrowLeft}>Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold tracking-tight text-slate-800">Reset your password</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the email linked to your account and we'll send you a reset link.
              </p>
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                  {error}
                </div>
              )}
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <FormField label="Email address">
                  <div className="relative">
                    <Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      className="pl-9"
                      placeholder="you@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </FormField>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
              <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                <ArrowLeft size={16} /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
