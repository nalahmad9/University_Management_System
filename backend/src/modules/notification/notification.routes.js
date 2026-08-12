import { Router } from 'express'
import { verifyToken } from '../../middleware/auth.middleware.js'
import * as c from './notification.controller.js'

const router = Router()
router.use(verifyToken)
router.get('/', c.list)
router.patch('/read-all', c.readAll)
router.patch('/:id/read', c.read)
export default router
