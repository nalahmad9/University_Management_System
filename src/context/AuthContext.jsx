import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import api from '../api/axios'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const STORAGE_KEY = 'ums_uid'
const TOKEN_KEY = 'ums_token'
const USER_KEY = 'ums_user_profile'

const normalize = (user) => ({
  ...user,
  id: user._id || user.id,
  username: user.username || `${user.firstName} ${user.lastName}`,
})

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [booting, setBooting] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY)
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedUser && savedToken) {
      try { setCurrentUser(JSON.parse(savedUser)) }
      catch {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setBooting(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await axios.post('http://localhost:5000/api/auth/login', { email, password })
    if (response.data && response.data.user) {
      const { user, token } = response.data
      if (user.status === 'pending') throw new Error('Your account is pending activation by an administrator.')
      if (user.status === 'inactive') throw new Error('Your account is inactive. Please contact the administrator.')
      const u = normalize(user)
      setCurrentUser(u)
      localStorage.setItem(STORAGE_KEY, u.id)
      localStorage.setItem(USER_KEY, JSON.stringify(u))
      if (token) localStorage.setItem(TOKEN_KEY, token)
      return u
    }
    throw new Error('Invalid server response structure')
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const updateProfile = useCallback(async (patch) => {
    const { data } = await api.patch('/auth/me', patch)
    const u = normalize(data.user)
    setCurrentUser(u)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    return u
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await api.patch('/auth/password', { currentPassword, newPassword })
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateProfile, changePassword, booting }}>
      {children}
    </AuthContext.Provider>
  )
}
