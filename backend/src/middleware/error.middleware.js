// Central error handler: turns errors into JSON { message }.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = err.statusCode || 500
  let message = err.message || 'Server error'

  if (err.code === 11000) {
    status = 409
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0]
    const labels = {
      email: 'Email is already registered.',
      username: 'Username is already taken.',
      code: 'Course code already exists.',
      studentId: 'Student ID already exists.',
    }
    message = labels[field] || `Duplicate value for "${field || 'a unique field'}".`
  }
  if (err.name === 'ValidationError') {
    status = 422
    message = Object.values(err.errors).map((e) => e.message).join(', ')
  }
  res.status(status).json({ message })
}
