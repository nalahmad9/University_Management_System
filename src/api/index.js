// Mahmoud (Team Lead) — API service layer. Each page has its own endpoint.
import client from './client'
export { client }

// ----- Auth -----
export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }).then((r) => r.data),
  updateProfile: (data) => client.patch('/auth/profile', data).then((r) => r.data),
}

// ----- Student API (all under /api/student) -----
export const studentApi = {
  getDashboard: () => client.get('/student/dashboard').then((r) => r.data),
  getCatalog: () => client.get('/student/courses').then((r) => r.data),
  enroll: (courseId) => client.post('/student/enrollments', { courseId }).then((r) => r.data),
  drop: (courseId) => client.delete(`/student/enrollments/${courseId}`).then((r) => r.data),
  getMyCourses: () => client.get('/student/my-courses').then((r) => r.data),
  getClassroom: (courseId) => client.get(`/student/courses/${courseId}/classroom`).then((r) => r.data),
  getAssignments: () => client.get('/student/assignments').then((r) => r.data),
  submitAssignment: (assignmentId, fileName) => client.post('/student/submissions', { assignmentId, fileName }).then((r) => r.data),
  getGrades: () => client.get('/student/grades').then((r) => r.data),
  calculateGrade: (courseId) => client.post(`/student/courses/${courseId}/calculate-grade`).then((r) => r.data),
  getTranscript: () => client.get('/student/transcript').then((r) => r.data),
  getExams: () => client.get('/student/exams').then((r) => r.data),
  getNotifications: () => client.get('/student/notifications').then((r) => r.data),
  markNotificationRead: (id) => client.patch(`/student/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => client.patch('/student/notifications/read-all').then((r) => r.data),
  getInit: () => client.get('/student/init').then((r) => r.data),
  getUsers: () => client.get('/student/users').then((r) => r.data),
  getAllCourses: () => client.get('/student/all-courses').then((r) => r.data),
  getEnrollments: () => client.get('/student/enrollments').then((r) => r.data),
}

// ----- Admin API (all under /api/admin) -----
export const adminApi = {
  getUsers: (status) => client.get('/admin/users', { params: { status } }).then((r) => r.data),
  createUser: (data) => client.post('/admin/users', data).then((r) => r.data),
  approveUser: (id, email) => client.post(`/admin/users/${id}/approve`, { email }).then((r) => r.data),
  setUserStatus: (id, status) => client.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),
  deleteUser: (id) => client.delete(`/admin/users/${id}`).then((r) => r.data),
  getNotifications: () => client.get('/admin/notifications').then((r) => r.data),
  markNotificationRead: (id) => client.patch(`/admin/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => client.patch('/admin/notifications/read-all').then((r) => r.data),
}

// ----- File upload -----
export const uploadApi = {
  uploadFile: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return client.post('/upload', fd).then((r) => r.data)
  },
  getFileUrl: (filename) => {
    const token = localStorage.getItem('ums_token')
    return `${client.defaults.baseURL}/files/${filename}?token=${encodeURIComponent(token || '')}`
  },
}

// ----- Professor API (all under /api/professor) -----
export const professorApi = {
  getDashboard: () => client.get('/professor/dashboard').then((r) => r.data),
  getCourses: () => client.get('/professor/courses').then((r) => r.data),
  getCourseDetail: (courseId) => client.get(`/professor/courses/${courseId}`).then((r) => r.data),
  getMaterials: (courseId) => client.get(`/professor/courses/${courseId}/materials`).then((r) => r.data),
  addMaterial: (courseId, data) => client.post(`/professor/courses/${courseId}/materials`, data).then((r) => r.data),
  deleteMaterial: (courseId, materialId) => client.delete(`/professor/courses/${courseId}/materials/${materialId}`).then((r) => r.data),
  getCourseAnnouncements: (courseId) => client.get(`/professor/courses/${courseId}/announcements`).then((r) => r.data),
  addAnnouncement: (courseId, data) => client.post(`/professor/courses/${courseId}/announcements`, data).then((r) => r.data),
  deleteAnnouncement: (id) => client.delete(`/professor/announcements/${id}`).then((r) => r.data),
  getCourseAssignments: (courseId) => client.get(`/professor/courses/${courseId}/assignments`).then((r) => r.data),
  addAssignment: (courseId, data) => client.post(`/professor/courses/${courseId}/assignments`, data).then((r) => r.data),
  deleteAssignment: (id) => client.delete(`/professor/assignments/${id}`).then((r) => r.data),
  getSubmissions: () => client.get('/professor/submissions').then((r) => r.data),
  gradeSubmission: (id, score, feedback) => client.patch(`/professor/submissions/${id}/grade`, { score, feedback }).then((r) => r.data),
  getCourseGrades: (courseId) => client.get(`/professor/courses/${courseId}/grades`).then((r) => r.data),
  setFinalGrade: (courseId, studentId, score) => client.put(`/professor/courses/${courseId}/grades`, { studentId, score }).then((r) => r.data),
  getAttendance: () => client.get('/professor/attendance').then((r) => r.data),
  getCourseAttendance: (courseId) => client.get(`/professor/courses/${courseId}/attendance`).then((r) => r.data),
  saveAttendance: (courseId, data) => client.post(`/professor/courses/${courseId}/attendance`, data).then((r) => r.data),
  getAssignments: () => client.get('/professor/assignments').then((r) => r.data),
  getAnnouncements: () => client.get('/professor/announcements').then((r) => r.data),
  getUsers: () => client.get('/professor/users').then((r) => r.data),
  getEnrollments: () => client.get('/professor/enrollments').then((r) => r.data),
  getNotifications: () => client.get('/professor/notifications').then((r) => r.data),
  markNotificationRead: (id) => client.patch(`/professor/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => client.patch('/professor/notifications/read-all').then((r) => r.data),
}
