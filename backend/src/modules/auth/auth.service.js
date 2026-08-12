import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import User from '../../models/User.js'
import Notification from '../../models/Notification.js'
import ApiError from '../../utils/ApiError.js'
import { generateToken } from '../../utils/generateToken.js'
import { notifyAdmins } from '../../utils/notify.js'
import { sendCredentialsEmail, sendResetEmail } from '../../utils/mailer.js'

export async function registerUser(data) {
  const { firstName, lastName, email, password, role } = data
  if (!firstName || !lastName || !email || !password) {
    throw new ApiError(422, 'firstName, lastName, email and password are required')
  }
  const exists = await User.findOne({ email: String(email).toLowerCase() })
  if (exists) throw new ApiError(409, 'Email is already registered.')

  const user = await User.create({
    firstName, lastName, email, password,
    role: role || 'student',
    status: 'active',
    username: `${firstName} ${lastName}`.trim(),
  })
  await notifyAdmins({
    type: 'system',
    title: 'New user registered',
    body: `${firstName} ${lastName} (${user.role}) just created an account.`,
    link: '/admin/users',
  })
  return user
}

export async function loginUser(identifier, password) {
  if (!identifier || !password) throw new ApiError(422, 'Email and password are required')
  const id = String(identifier).toLowerCase()
  const user = await User.findOne({ $or: [{ email: id }, { username: identifier }] }).select('+password')
  if (!user || !user.password) throw new ApiError(401, 'Invalid email or password.')

  if (user.status === 'requested') {
    throw new ApiError(403, 'Your account request is still pending admin review.')
  }
  if (user.status === 'inactive') {
    throw new ApiError(403, 'Your account has been deactivated. Contact an administrator.')
  }

  const match = await user.matchPassword(password)
  if (!match) throw new ApiError(401, 'Invalid email or password.')

  const token = generateToken(user)
  return { user: user.toJSON(), token }
}

export async function updateMe(userId, data) {
  const allowed = ['firstName', 'lastName', 'email', 'phone', 'department', 'title', 'program', 'studentId', 'username']
  const patch = {}
  for (const k of allowed) if (data[k] !== undefined) patch[k] = data[k]
  if (patch.email) {
    const exists = await User.findOne({ email: String(patch.email).toLowerCase(), _id: { $ne: userId } })
    if (exists) throw new ApiError(409, 'Email is already in use.')
  }
  const user = await User.findByIdAndUpdate(userId, patch, { new: true, runValidators: true })
  if (!user) throw new ApiError(404, 'User not found')
  return user
}

export async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) throw new ApiError(422, 'Current and new password are required')
  if (String(newPassword).length < 6) throw new ApiError(422, 'New password must be at least 6 characters')
  const user = await User.findById(userId).select('+password')
  if (!user) throw new ApiError(404, 'User not found')
  const ok = await user.matchPassword(currentPassword)
  if (!ok) throw new ApiError(401, 'Current password is incorrect')
  user.password = newPassword
  await user.save()
  return true
}

export async function requestAccount(data) {
  const { firstName, lastName, personalEmail, role, dateOfBirth } = data
  if (!firstName || !lastName || !personalEmail || !role) {
    throw new ApiError(422, 'firstName, lastName, personalEmail and role are required')
  }

  const existing = await User.findOne({ personalEmail: String(personalEmail).toLowerCase() })
  if (existing) {
    throw new ApiError(400, 'A request or account already exists for this email.')
  }

  const request = await User.create({
    firstName,
    lastName,
    personalEmail,
    role,
    dateOfBirth,
    status: 'requested',
  })

  await notifyAdmins({
    type: 'request',
    title: 'New account request',
    body: `${firstName} ${lastName} has requested a ${role} account.`,
    link: '/admin/users',
  })

  return {
    message: 'Registration successful! Your request is pending admin review. Once approved, your login credentials will be sent to your email.',
    requestId: request._id,
  }
}

export async function forgotPassword(email) {
  if (!email) throw new ApiError(422, 'Email is required')
  const id = String(email).toLowerCase()
  const user = await User.findOne({ $or: [{ email: id }, { personalEmail: id }] })
  if (!user) {
    return
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  user.resetPasswordToken = resetToken
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000
  await user.save()

  const recipient = user.personalEmail || user.email
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
  await sendResetEmail({ to: recipient, resetLink })
}

export async function resetPassword(token, password) {
  if (!token || !password) throw new ApiError(422, 'Token and password are required')
  if (String(password).length < 6) throw new ApiError(422, 'Password must be at least 6 characters')

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires')

  if (!user) throw new ApiError(400, 'Invalid or expired reset token')

  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save()
}