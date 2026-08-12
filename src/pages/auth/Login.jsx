import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, GraduationCap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const ORBS = [
  'top-[10%] left-[15%] w-72 h-72 bg-violet-500/15 blur-3xl',
  'top-[60%] right-[10%] w-96 h-96 bg-fuchsia-500/10 blur-3xl',
  'bottom-[15%] left-[50%] w-80 h-80 bg-violet-400/10 blur-3xl',
  'top-[35%] right-[35%] w-64 h-64 bg-fuchsia-400/8 blur-3xl',
]

const DOTS = [
  { top: '22%', left: '25%', delay: '0s' },
  { top: '70%', left: '75%', delay: '1s' },
  { top: '45%', left: '85%', delay: '0.5s' },
  { top: '15%', left: '70%', delay: '1.5s' },
  { top: '80%', left: '20%', delay: '2s' },
  { top: '55%', left: '8%', delay: '0.8s' },
]

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setVisible(true) }, [])

  const doLogin = async (email, password) => {
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password);
      setLoading(false);
      toast(`Welcome back, ${user.firstName}!`, 'success');
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!identifier || !password) {
      setError('Please enter your email/username and password.')
      return
    }
    doLogin(identifier, password)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1a1a2e] flex items-center justify-center px-4 py-10">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#1f1f38] to-[#2a1a3e] animate-gradient-drift bg-[length:200%_200%]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      {/* Floating orbs */}
      {ORBS.map((cls, i) => (
        <div key={i} className={`absolute rounded-full ${cls} animate-float-slow`} style={{ animationDelay: `${i * 1.5}s` }} />
      ))}

      {/* Floating dots */}
      {DOTS.map((dot, i) => (
        <div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-white/20 animate-pulse-soft"
          style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
        />
      ))}

      {/* Card */}
      <div
        className={`relative w-full max-w-md transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="rounded-3xl bg-white px-8 py-10 sm:px-10 sm:py-12 shadow-2xl">
          {/* Brand */}
          <div className={`text-center transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 mb-4">
              <GraduationCap size={26} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">UniHub</h1>
            <p className="mt-1 text-sm text-[#6b6580]">University Management System</p>
          </div>

          {/* Divider */}
          <div className={`my-6 flex items-center gap-3 transition-all duration-700 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="h-px flex-1 bg-[#e8e4e0]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9b94a8]">Sign in</span>
            <div className="h-px flex-1 bg-[#e8e4e0]" />
          </div>

          {/* Error */}
          {error && (
            <div className={`mb-5 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
            <div className={`transition-all duration-500 delay-[400ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label className="block mb-1.5 text-sm font-medium text-[#6b6580]">Email or Username</label>
              <div className="relative group">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a8] transition-colors group-focus-within:text-violet-600" />
                <input
                  className="w-full rounded-xl border border-[#e8e4e0] bg-white px-10 py-3 text-sm text-[#1a1a2e] placeholder:text-[#9b94a8] outline-none transition-all duration-200 focus:border-violet-400 focus:shadow-[0_0_20px_-4px_rgba(99,102,241,0.12)]"
                  placeholder="you@university.edu"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="new-email"
                />
              </div>
            </div>

            <div className={`transition-all duration-500 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label className="block mb-1.5 text-sm font-medium text-[#6b6580]">Password</label>
              <div className="relative group">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b94a8] transition-colors group-focus-within:text-violet-600" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full rounded-xl border border-[#e8e4e0] bg-white px-10 py-3 text-sm text-[#1a1a2e] placeholder:text-[#9b94a8] outline-none transition-all duration-200 focus:border-violet-400 focus:shadow-[0_0_20px_-4px_rgba(99,102,241,0.12)]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9b94a8] transition hover:text-[#6b6580]"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className={`flex items-center justify-between transition-all duration-500 delay-[600ms] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label className="flex items-center gap-2 text-sm text-[#6b6580] cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-[#e8e4e0] text-violet-600 focus:ring-violet-500/30 cursor-pointer" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <div className={`transition-all duration-500 delay-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <button
                type="submit"
                disabled={loading}
                className="relative overflow-hidden w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/30 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="relative inline-flex h-4 w-4">
                      <span className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    </span>
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className={`mt-6 text-center text-sm text-[#6b6580] transition-all duration-500 delay-800 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Don't have an account?{' '}
            <Link to="/register/student" className="font-medium text-violet-600 hover:text-violet-700 transition-colors">
              Register as Student
            </Link>
            {' '}or{' '}
            <Link to="/register/professor" className="font-medium text-violet-600 hover:text-violet-700 transition-colors">
              Professor
            </Link>
          </div>
        </div>

        <p className={`mt-6 text-center text-xs text-white/20 transition-all duration-500 delay-[900ms] ${visible ? 'opacity-100' : 'opacity-0'}`}>
          &copy; 2026 UniHub
        </p>
      </div>
    </div>
  )
}
