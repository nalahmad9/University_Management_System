import axios from 'axios'

// Central axios instance for the whole app.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Attach the JWT (saved at login) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ums_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
