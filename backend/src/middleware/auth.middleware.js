import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'

const secret = process.env.JWT_SECRET || 'dev_secret_change_me'

export async function verifyToken(req, res, next) {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' })
  }
  try {
    const decoded = jwt.verify(token, secret)
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' })
  }
}
