import { Router } from 'express'
import { signup, login, me, updateMe, changePassword, requestAccount, forgotPassword, resetPassword } from './auth.controller.js'
import { verifyToken } from '../../middleware/auth.middleware.js'

const router = Router()
router.post('/signup', signup)
router.post('/register', signup)
router.post('/login', login)
router.get('/me', verifyToken, me)
router.patch('/me', verifyToken, updateMe)
router.patch('/password', verifyToken, changePassword)
router.post('/request-account', requestAccount)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
export default router
