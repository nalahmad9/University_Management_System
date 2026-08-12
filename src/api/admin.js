import api from './axios'

const data = (r) => r.data

// Dashboard
export const getDashboardStats = () => api.get('/admin/dashboard/stats').then(data)

// Users
export const listUsers = (params) => api.get('/admin/users', { params }).then(data)
export const createUser = (payload) => api.post('/admin/users', payload).then(data)
export const updateUser = (id, payload) => api.put(`/admin/users/${id}`, payload).then(data)
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then(data)
export const setUserStatus = (id, status) => api.patch(`/admin/users/${id}/status`, { status }).then(data)
export const approveRequest = (id) => api.patch(`/admin/users/${id}/approve`).then(data)

// Courses
export const listCourses = () => api.get('/admin/courses').then(data)
export const createCourse = (payload) => api.post('/admin/courses', payload).then(data)
export const updateCourse = (id, payload) => api.put(`/admin/courses/${id}`, payload).then(data)
export const deleteCourse = (id) => api.delete(`/admin/courses/${id}`).then(data)
export const getRoster = (id) => api.get(`/admin/courses/${id}/roster`).then(data)

// Enrollment
export const enrollStudent = (studentId, courseId) => api.post('/admin/enrollments', { studentId, courseId }).then(data)
export const dropStudent = (studentId, courseId) => api.delete('/admin/enrollments', { data: { studentId, courseId } }).then(data)

// Exams
export const listExams = () => api.get('/admin/exams').then(data)
export const createExam = (payload) => api.post('/admin/exams', payload).then(data)
export const updateExam = (id, payload) => api.put(`/admin/exams/${id}`, payload).then(data)
export const deleteExam = (id) => api.delete(`/admin/exams/${id}`).then(data)

// Calendar
export const listCalendar = () => api.get('/admin/calendar').then(data)
export const createEvent = (payload) => api.post('/admin/calendar', payload).then(data)
export const deleteEvent = (id) => api.delete(`/admin/calendar/${id}`).then(data)

// Announcements
export const listAnnouncements = () => api.get('/admin/announcements').then(data)
export const createAnnouncement = (payload) => api.post('/admin/announcements', payload).then(data)
export const deleteAnnouncement = (id) => api.delete(`/admin/announcements/${id}`).then(data)

// Audit
export const listAudit = (params) => api.get('/admin/audit', { params }).then(data)

// Helper to surface a readable error message from an axios error
export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong'
