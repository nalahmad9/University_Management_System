import * as svc from './student.service.js'

export const getDashboard = async (req, res) => {
  try {
    const data = await svc.getDashboard(req.user.id)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCatalog = async (req, res) => {
  try {
    const courses = await svc.getCatalog()
    res.json({ courses })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const enroll = async (req, res) => {
  try {
    const enrollment = await svc.enroll(req.user.id, req.body.courseId)
    res.status(201).json({ message: 'Enrolled successfully', enrollment })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const drop = async (req, res) => {
  try {
    await svc.drop(req.user.id, req.params.courseId)
    res.json({ message: 'Dropped successfully' })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getMyCourses = async (req, res) => {
  try {
    const courses = await svc.getMyCourses(req.user.id)
    res.json({ courses })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getClassroom = async (req, res) => {
  try {
    const data = await svc.getClassroom(req.user.id, req.params.courseId)
    res.json(data)
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

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, fileName } = req.body
    const submission = await svc.submitAssignment(req.user.id, assignmentId, fileName)
    res.status(201).json({ message: 'Assignment submitted', submission })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getGrades = async (req, res) => {
  try {
    const data = await svc.getGrades(req.user.id)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const calculateGrade = async (req, res) => {
  try {
    const result = await svc.calculateGrade(req.user.id, req.params.courseId)
    res.json(result)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getTranscript = async (req, res) => {
  try {
    const data = await svc.getTranscript(req.user.id)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getExams = async (req, res) => {
  try {
    const exams = await svc.getExams(req.user.id)
    res.json({ exams })
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
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await svc.markAllNotificationsRead(req.user.id)
    res.json(result)
  } catch (err) {
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

export const init = async (req, res) => {
  try {
    const data = await svc.getInitData(req.user.id)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getAllCourses = async (req, res) => {
  try {
    const courses = await svc.getAllCourses()
    res.json({ courses })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getEnrollments = async (req, res) => {
  try {
    const enrollments = await svc.getEnrollments(req.user.id)
    res.json({ enrollments })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}
