import axios from 'axios'

// Ensure local development uses localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const client = axios.create({ 
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ums_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default client