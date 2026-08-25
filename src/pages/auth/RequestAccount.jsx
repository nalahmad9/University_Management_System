import { useState } from 'react'
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom'
import { Mail, Sparkles, ArrowRight } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { authApi } from '../../api'

const ROLE_LABELS = {
  student: 'Student',
  professor: 'Professor'
}

export default function RequestAccount() {
  const { role } = useParams()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    personalEmail: '',
    dateOfBirth: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!ROLE_LABELS[role]) {
    return <Navigate to="/login" replace />
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.requestAccount({
        ...formData,
        role
      })
      toast('Request submitted successfully! Pending admin review.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1a1a2e] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#1f1f38] to-[#2a1a3e] animate-gradient-drift bg-[length:200%_200%]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-violet-500/15 blur-3xl animate-float-slow" />
      <div className="absolute top-[60%] right-[10%] w-96 h-96 bg-fuchsia-500/10 blur-3xl animate-float-slow" style={{ animationDelay: '1.5s' }} />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-white px-8 py-10 sm:px-10 sm:py-12 shadow-2xl">
          <div className="text-center mb-6">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 mb-4">
              <Sparkles size={26} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Create Account</h1>
            <p className="mt-1 text-sm text-[#6b6580]">Register as a {ROLE_LABELS[role]}</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-[#6b6580]">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full rounded-xl border border-[#e8e4e0] bg-white px-3.5 py-2.5 text-sm text-[#1a1a2e] placeholder:text-[#9b94a8] outline-none transition focus:border-violet-400 focus:shadow-[0_0_20px_-4px_rgba(99,102,241,0.12)]" required />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-[#6b6580]">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full rounded-xl border border-[#e8e4e0] bg-white px-3.5 py-2.5 text-sm text-[#1a1a2e] placeholder:text-[#9b94a8] outline-none transition focus:border-violet-400 focus:shadow-[0_0_20px_-4px_rgba(99,102,241,0.12)]" required />
              </div>
            </div>

            <div className="field-label mb-1.5 text-sm font-medium text-[#6b6580]">Email Address</div>
            <div className="relative mb-4">
              <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a8]" />
              <input
                type="email"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="new-email"
                className="w-full rounded-xl border border-[#e8e4e0] bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#1a1a2e] placeholder:text-[#9b94a8] outline-none transition focus:border-violet-400 focus:shadow-[0_0_20px_-4px_rgba(99,102,241,0.12)]"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block mb-1.5 text-sm font-medium text-[#6b6580]">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full rounded-xl border border-[#e8e4e0] bg-white px-3.5 py-2.5 text-sm text-[#1a1a2e] outline-none transition focus:border-violet-400 focus:shadow-[0_0_20px_-4px_rgba(99,102,241,0.12)]" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="relative inline-flex h-4 w-4">
                    <span className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  </span>
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create account
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#6b6580]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}