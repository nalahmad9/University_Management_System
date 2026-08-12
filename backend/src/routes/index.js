import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes.js'
import studentRoutes from '../modules/student/student.routes.js'
import professorRoutes from '../modules/professor/professor.routes.js'
import adminRoutes from '../modules/admin/admin.routes.js'
import notificationRoutes from '../modules/notification/notification.routes.js'
import uploadRoutes from './upload.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/student', studentRoutes)
router.use('/professor', professorRoutes)
router.use('/admin', adminRoutes)
router.use('/notifications', notificationRoutes)
router.use('/', uploadRoutes)

export default router
