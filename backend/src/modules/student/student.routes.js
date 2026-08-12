import { Router } from 'express'
import { verifyToken } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/role.middleware.js'
import * as c from './student.controller.js'

const router = Router()

router.use(verifyToken, authorize('student'))

router.get('/dashboard', c.getDashboard)
router.get('/courses', c.getCatalog)
router.post('/enrollments', c.enroll)
router.delete('/enrollments/:courseId', c.drop)
router.get('/my-courses', c.getMyCourses)
router.get('/courses/:courseId/classroom', c.getClassroom)
router.get('/assignments', c.getAssignments)
router.post('/submissions', c.submitAssignment)
router.get('/grades', c.getGrades)
router.post('/courses/:courseId/calculate-grade', c.calculateGrade)
router.get('/transcript', c.getTranscript)
router.get('/exams', c.getExams)
router.get('/notifications', c.getNotifications)
router.patch('/notifications/:id/read', c.markNotificationRead)
router.patch('/notifications/read-all', c.markAllNotificationsRead)
router.get('/users', c.getUsers)
router.get('/init', c.init)
router.get('/all-courses', c.getAllCourses)
router.get('/enrollments', c.getEnrollments)

export default router
