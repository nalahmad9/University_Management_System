import { Router } from 'express'
import { verifyToken } from '../../middleware/auth.middleware.js'
import { authorize } from '../../middleware/role.middleware.js'
import * as c from './professor.controller.js'

const router = Router()

router.use(verifyToken, authorize('professor'))

router.get('/dashboard', c.getDashboard)
router.get('/courses', c.getCourses)
router.get('/courses/:courseId', c.getCourseDetail)

router.get('/courses/:courseId/materials', c.getMaterials)
router.post('/courses/:courseId/materials', c.addMaterial)
router.delete('/courses/:courseId/materials/:materialId', c.deleteMaterial)

router.get('/courses/:courseId/announcements', c.getCourseAnnouncements)
router.post('/courses/:courseId/announcements', c.addAnnouncement)
router.delete('/announcements/:id', c.deleteAnnouncement)

router.get('/courses/:courseId/assignments', c.getCourseAssignments)
router.post('/courses/:courseId/assignments', c.addAssignment)
router.delete('/assignments/:id', c.deleteAssignment)

router.get('/submissions', c.getSubmissions)
router.patch('/submissions/:id/grade', c.gradeSubmission)

router.get('/courses/:courseId/grades', c.getCourseGrades)
router.put('/courses/:courseId/grades', c.setFinalGrade)

router.get('/attendance', c.getAttendance)
router.get('/courses/:courseId/attendance', c.getCourseAttendance)
router.post('/courses/:courseId/attendance', c.saveAttendance)

router.get('/assignments', c.getAssignments)
router.get('/announcements', c.getAnnouncements)
router.get('/users', c.getUsers)
router.get('/enrollments', c.getEnrollments)

router.get('/notifications', c.getNotifications)
router.patch('/notifications/:id/read', c.markNotificationRead)
router.patch('/notifications/read-all', c.markAllNotificationsRead)

export default router
