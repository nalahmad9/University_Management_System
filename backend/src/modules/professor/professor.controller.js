import * as svc from './professor.service.js'

export const getDashboard = async (req, res) => {
  try {
    const data = await svc.getDashboard(req.user.id)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCourses = async (req, res) => {
  try {
    const courses = await svc.getCourses(req.user.id)
    res.json({ courses })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCourseDetail = async (req, res) => {
  try {
    const data = await svc.getCourseDetail(req.user.id, req.params.courseId)
    res.json(data)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getMaterials = async (req, res) => {
  try {
    const data = await svc.getMaterials(req.user.id, req.params.courseId)
    res.json(data)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const addMaterial = async (req, res) => {
  try {
    const material = await svc.addMaterial(req.user.id, req.params.courseId, req.body)
    res.status(201).json({ message: 'Material uploaded', material })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error('addMaterial error:', err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

export const deleteMaterial = async (req, res) => {
  try {
    const result = await svc.deleteMaterial(req.user.id, req.params.courseId, req.params.materialId)
    res.json(result)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await svc.getAnnouncements(req.user.id)
    res.json({ announcements })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCourseAnnouncements = async (req, res) => {
  try {
    const announcements = await svc.getCourseAnnouncements(req.user.id, req.params.courseId)
    res.json({ announcements })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const addAnnouncement = async (req, res) => {
  try {
    const announcement = await svc.addAnnouncement(req.user.id, req.params.courseId, req.body)
    res.status(201).json({ message: 'Announcement posted', announcement })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteAnnouncement = async (req, res) => {
  try {
    const result = await svc.deleteAnnouncement(req.user.id, req.params.id)
    res.json(result)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getAssignments = async (req, res) => {
  try {
    const assignments = await svc.getAssignments(req.user.id)
    res.json({ assignments })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCourseAssignments = async (req, res) => {
  try {
    const assignments = await svc.getCourseAssignments(req.user.id, req.params.courseId)
    res.json({ assignments })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const addAssignment = async (req, res) => {
  try {
    const assignment = await svc.addAssignment(req.user.id, req.params.courseId, req.body)
    res.status(201).json({ message: 'Assignment created', assignment })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteAssignment = async (req, res) => {
  try {
    const result = await svc.deleteAssignment(req.user.id, req.params.id)
    res.json(result)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getSubmissions = async (req, res) => {
  try {
    const submissions = await svc.getSubmissions(req.user.id)
    res.json({ submissions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const gradeSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body
    const submission = await svc.gradeSubmission(req.user.id, req.params.id, score, feedback)
    res.json({ message: 'Submission graded', submission })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCourseGrades = async (req, res) => {
  try {
    const data = await svc.getCourseGrades(req.user.id, req.params.courseId)
    res.json(data)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const setFinalGrade = async (req, res) => {
  try {
    const { studentId, score } = req.body
    const grade = await svc.setFinalGrade(req.user.id, req.params.courseId, studentId, score)
    res.json({ message: 'Grade saved', grade })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getAttendance = async (req, res) => {
  try {
    const records = await svc.getAllAttendance(req.user.id)
    res.json({ records })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCourseAttendance = async (req, res) => {
  try {
    const records = await svc.getCourseAttendance(req.user.id, req.params.courseId)
    res.json({ records })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const saveAttendance = async (req, res) => {
  try {
    const attendance = await svc.saveAttendance(req.user.id, req.params.courseId, req.body)
    res.status(201).json({ message: 'Attendance saved', attendance })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getUsers = async (req, res) => {
  try {
    const users = await svc.getUsers()
    res.json({ users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getEnrollments = async (req, res) => {
  try {
    const enrollments = await svc.getEnrollments()
    res.json({ enrollments })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getNotifications = async (req, res) => {
  try {
    const notifications = await svc.getNotifications(req.user.id)
    res.json({ notifications })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await svc.markNotificationRead(req.params.id, req.user.id)
    res.json({ notification })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    res.status(500).json({ message: 'Server error' })
  }
}

export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await svc.markAllNotificationsRead(req.user.id)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}
