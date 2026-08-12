import api from './axios'
const data = (r) => r.data

export const updateMe = (payload) => api.patch('/auth/me', payload).then(data)
export const changePassword = (currentPassword, newPassword) =>
  api.patch('/auth/password', { currentPassword, newPassword }).then(data)
