import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Guards routes by authentication + role. `role` can be a string or array.
export default function ProtectedRoute({ role, children }) {
  const { currentUser, booting } = useAuth()
  const location = useLocation()

  if (booting) return null

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const allowed = Array.isArray(role) ? role : role ? [role] : null
  if (allowed && !allowed.includes(currentUser.role)) {
    // Logged in but wrong role — send to their own dashboard
    return <Navigate to={`/${currentUser.role}/dashboard`} replace />
  }

  return children
}
