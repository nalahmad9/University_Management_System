import { Link } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const { currentUser } = useAuth()
  const home = currentUser ? `/${currentUser.role}/dashboard` : '/login'
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg">
        <Compass size={32} />
      </span>
      <p className="mt-6 text-6xl font-extrabold tracking-tight text-slate-800">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-700">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to={home} className="mt-6">
        <Button icon={ArrowLeft}>Back to {currentUser ? 'dashboard' : 'sign in'}</Button>
      </Link>
    </div>
  )
}
