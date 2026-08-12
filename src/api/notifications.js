import api from './axios'
const data = (r) => r.data

export const listMine = () => api.get('/notifications').then(data)
export const markRead = (id) => api.patch(`/notifications/${id}/read`).then(data)
export const markAllRead = () => api.patch('/notifications/read-all').then(data)
