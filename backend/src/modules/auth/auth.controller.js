import { asyncHandler } from '../../utils/asyncHandler.js'
import { generateToken } from '../../utils/generateToken.js'
import * as svc from './auth.service.js'

export const signup = asyncHandler(async (req, res) => {
  const user = await svc.registerUser(req.body)
  const token = generateToken(user)
  res.status(201).json({ user: user.toJSON(), token })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { user, token } = await svc.loginUser(email, password)
  res.json({ user, token })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toJSON() })
})

export const updateMe = asyncHandler(async (req, res) => {
  const user = await svc.updateMe(req.user._id, req.body)
  res.json({ user: user.toJSON() })
})

export const changePassword = asyncHandler(async (req, res) => {
  await svc.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword)
  res.json({ message: 'Password updated successfully' })
})

export const requestAccount = asyncHandler(async (req, res) => {
  const result = await svc.requestAccount(req.body)
  res.status(201).json(result)
})

export const forgotPassword = asyncHandler(async (req, res) => {
  await svc.forgotPassword(req.body.email)
  res.json({ message: 'Reset link sent to your email' })
})

export const resetPassword = asyncHandler(async (req, res) => {
  await svc.resetPassword(req.params.token, req.body.password)
  res.json({ message: 'Password reset successful' })
})
