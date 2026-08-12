import { asyncHandler } from '../../utils/asyncHandler.js'
import * as svc from './admin.service.js'

export const dashboard = asyncHandler(async (req, res) => {
  const data = await svc.getDashboardStats()
  res.json(data)
})

export const listUsers = asyncHandler(async (req, res) => {
  const users = await svc.listUsers(req.query)
  res.json(users)
})

export const createUser = asyncHandler(async (req, res) => {
  const user = await svc.createUser(req.body, req.user._id)
  res.status(201).json(user)
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await svc.getUser(req.params.id)
  res.json(user)
})

export const updateUser = asyncHandler(async (req, res) => {
  const user = await svc.updateUser(req.params.id, req.body, req.user._id)
  res.json(user)
})

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await svc.deleteUser(req.params.id, req.user._id)
  res.json({ message: 'User deleted', user })
})

export const approveRequest = asyncHandler(async (req, res) => {
  const { user, tempPassword } = await svc.approveRequest(req.params.id, req.user._id)
  res.json({ message: 'Account approved and activated', user: user.toJSON(), tempPassword })
})

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await svc.setUserStatus(req.params.id, req.body.status, req.user._id)
  res.json(user)
})

export const listCourses = asyncHandler(async (req, res) => {
  const courses = await svc.listCourses()
  res.json(courses)
})

export const createCourse = asyncHandler(async (req, res) => {
  const course = await svc.createCourse(req.body, req.user._id)
  res.status(201).json(course)
})

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await svc.updateCourse(req.params.id, req.body, req.user._id)
  res.json(course)
})

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await svc.deleteCourse(req.params.id, req.user._id)
  res.json({ message: 'Course deleted', course })
})

export const getRoster = asyncHandler(async (req, res) => {
  const roster = await svc.getRoster(req.params.id)
  res.json(roster)
})

export const enroll = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body
  const result = await svc.enrollStudent(studentId, courseId, req.user._id)
  res.json(result)
})

export const drop = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body
  const roster = await svc.dropStudent(studentId, courseId, req.user._id)
  res.json(roster)
})

export const listExams = asyncHandler(async (req, res) => {
  const exams = await svc.listExams()
  res.json(exams)
})

export const createExam = asyncHandler(async (req, res) => {
  const exam = await svc.createExam(req.body, req.user._id)
  res.status(201).json(exam)
})

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await svc.updateExam(req.params.id, req.body, req.user._id)
  res.json(exam)
})

export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await svc.deleteExam(req.params.id, req.user._id)
  res.json({ message: 'Exam deleted', exam })
})

export const listCalendar = asyncHandler(async (req, res) => {
  const events = await svc.listCalendar()
  res.json(events)
})

export const createEvent = asyncHandler(async (req, res) => {
  const ev = await svc.createEvent(req.body, req.user._id)
  res.status(201).json(ev)
})

export const deleteEvent = asyncHandler(async (req, res) => {
  const ev = await svc.deleteEvent(req.params.id, req.user._id)
  res.json({ message: 'Event deleted', event: ev })
})

export const listAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await svc.listAnnouncements()
  res.json(announcements)
})

export const createAnnouncement = asyncHandler(async (req, res) => {
  const ann = await svc.createAnnouncement(req.body, req.user._id)
  res.status(201).json(ann)
})

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const ann = await svc.deleteAnnouncement(req.params.id, req.user._id)
  res.json({ message: 'Announcement deleted', announcement: ann })
})

export const listAudit = asyncHandler(async (req, res) => {
  const logs = await svc.listAudit(req.query)
  res.json(logs)
})

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await svc.getNotifications(req.user._id)
  res.json({ notifications })
})

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await svc.markNotificationRead(req.params.id, req.user._id)
  res.json({ notification })
})

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await svc.markAllNotificationsRead(req.user._id)
  res.json(result)
})
