import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'https://university-management-system-one-topaz.vercel.app/api'
const client = axios.create({ baseURL: API_BASE })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ums_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
