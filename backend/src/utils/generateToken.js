import jwt from 'jsonwebtoken'

export function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn })
}
