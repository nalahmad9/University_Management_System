import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import User from '../../models/User.js'
import Course from '../../models/Course.js'
import Enrollment from '../../models/Enrollment.js'
import Grade from '../../models/Grade.js'
import Exam from '../../models/Exam.js'
import Announcement from '../../models/Announcement.js'
import CalendarEvent from '../../models/CalendarEvent.js'
import AuditLog from '../../models/AuditLog.js'
import Notification from '../../models/Notification.js'
import ApiError from '../../utils/ApiError.js'
import { logAudit } from '../../utils/audit.js'
import { notify, notifyAdmins } from '../../utils/notify.js'
import { sendCredentialsEmail, sendNotificationEmail } from '../../utils/mailer.js'

const name = (u) => (u ? `${u.firstName} ${u.lastName}` : 'unknown')
const UNIVERSITY_DOMAIN = process.env.UNIVERSITY_DOMAIN || 'unihub.edu'

function generateTempPassword() {
  return crypto.randomBytes(6).toString('hex')
}

function generateUniversityEmail(firstName, lastName, suffix) {
  const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
  const s = suffix ? `${base}${suffix}` : base
  return `${s}@${UNIVERSITY_DOMAIN}`
}

async function findAvailableEmail(firstName, lastName) {
  let suffix = 0
  let email
  do {
    email = generateUniversityEmail(firstName, lastName, suffix > 0 ? suffix : null)
    const exists = await User.findOne({ email })
    if (!exists) return email
    suffix++
  } while (true)
}

// ------------------------------ Dashboard ------------------------------
export async function getDashboardStats() {
  const [students, professors, courseCount, enrollments, pending] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'professor' }),
    Course.countDocuments(),
    Enrollment.countDocuments({ status: 'enrolled' }),
    User.find({ status: 'requested' }).sort({ createdAt: -1 }).limit(10),
  ])

  const statusAgg = await User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  const statusBreakdown = { active: 0, pending: 0, inactive: 0, requested: 0 }
  statusAgg.forEach((s) => { if (s._id) statusBreakdown[s._id] = s.count })

  const courses = await Course.find().select('code capacity')
  const counts = await Enrollment.aggregate([
    { $match: { status: 'enrolled' } },
    { $group: { _id: '$courseId', count: { $sum: 1 } } },
  ])
  const countMap = {}
  counts.forEach((c) => { countMap[String(c._id)] = c.count })
  const enrollmentByCourse = courses.map((c) => ({
    code: c.code,
    students: countMap[String(c._id)] || 0,
    capacity: c.capacity,
  }))

  const creditsAgg = await Course.aggregate([{ $group: { _id: null, total: { $sum: '$credits' } } }])
  const totalCredits = creditsAgg[0]?.total || 0

  const recentActivity = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('actorId', 'firstName lastName')

  return {
    counts: { students, professors, courses: courseCount, enrollments, totalCredits },
    statusBreakdown,
    pending,
    enrollmentByCourse,
    recentActivity,
  }
}

// ------------------------------ Users ------------------------------
export async function listUsers({ role, status, search } = {}) {
  const q = {}
  if (role && role !== 'all') q.role = role
  if (status && status !== 'all') q.status = status
  if (search) {
    q.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { personalEmail: new RegExp(search, 'i') },
      { studentId: new RegExp(search, 'i') },
    ]
  }
  return User.find(q).sort({ createdAt: -1 })
}

export async function createUser(data, actorId) {
  const exists = await User.findOne({ email: String(data.email || '').toLowerCase() })
  if (exists) throw new ApiError(409, 'Email is already registered.')
  const user = await User.create({ status: 'pending', ...data })
  await logAudit(actorId, 'create', 'User', `Created ${user.role} account "${name(user)}"`)
  return user
}

export async function getUser(id) {
  const user = await User.findById(id)
  if (!user) throw new ApiError(404, 'User not found')
  return user
}

export async function updateUser(id, data, actorId) {
  const patch = { ...data }
  delete patch.password
  if (patch.email) {
    const dup = await User.findOne({ email: String(patch.email).toLowerCase(), _id: { $ne: id } })
    if (dup) throw new ApiError(409, 'Email is already registered to another account.')
  }
  if (patch.username) {
    const dup = await User.findOne({ username: patch.username, _id: { $ne: id } })
    if (dup) throw new ApiError(409, 'Username is already taken.')
  }
  const user = await User.findByIdAndUpdate(id, patch, { new: true, runValidators: true })
  if (!user) throw new ApiError(404, 'User not found')
  await logAudit(actorId, 'update', 'User', `Updated account "${name(user)}"`)
  return user
}

export async function deleteUser(id, actorId) {
  const user = await User.findByIdAndDelete(id)
  if (!user) throw new ApiError(404, 'User not found')
  await Enrollment.deleteMany({ studentId: id })
  await Grade.deleteMany({ studentId: id })
  await logAudit(actorId, 'delete', 'User', `Deleted account "${name(user)}"`)
  return user
}

export async function setUserStatus(id, status, actorId) {
  if (!['active', 'pending', 'inactive', 'requested'].includes(status)) throw new ApiError(422, 'Invalid status')
  const user = await User.findByIdAndUpdate(id, { status }, { new: true })
  if (!user) throw new ApiError(404, 'User not found')
  const label = status === 'active' ? 'Activated' : status === 'inactive' ? 'Deactivated' : 'Set pending'
  await logAudit(actorId, 'update', 'User', `${label} account "${name(user)}"`)
  if (status === 'active') {
    await notify(user._id, { type: 'activation', title: 'Account activated', body: 'Your account has been activated. Welcome!', link: `/${user.role}/dashboard` })
  }
  return user
}

export async function approveRequest(userId, actorId) {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'Request not found')
  if (user.status !== 'requested') throw new ApiError(400, 'Account is not in requested status')

  const email = await findAvailableEmail(user.firstName, user.lastName)
  const tempPassword = generateTempPassword()

  user.email = email
  user.password = tempPassword
  user.status = 'active'
  await user.save()

  await sendCredentialsEmail({
    to: user.personalEmail,
    firstName: user.firstName,
    universityEmail: email,
    password: tempPassword,
    role: user.role,
  })

  await Notification.create({
    userId: user._id,
    type: 'activation',
    title: 'Account activated',
    body: `Your ${user.role} account has been activated. Check your personal email for login credentials.`,
    link: '/login',
  })

  await logAudit(actorId, 'update', 'User', `Approved and activated account "${name(user)}"`)
  return { user, tempPassword }
}

// ------------------------------ Courses ------------------------------
export async function listCourses() {
  const courses = await Course.find().sort({ code: 1 })
    .populate('professorId', 'firstName lastName department')
    .populate('prerequisites', 'code name')
  const counts = await Enrollment.aggregate([
    { $match: { status: { $in: ['enrolled', 'waitlisted'] } } },
    { $group: { _id: { courseId: '$courseId', status: '$status' }, count: { $sum: 1 } } },
  ])
  const enrolledMap = {}, waitlistMap = {}
  counts.forEach((c) => {
    const key = String(c._id.courseId)
    if (c._id.status === 'enrolled') enrolledMap[key] = c.count
    else waitlistMap[key] = c.count
  })
  return courses.map((c) => ({
    ...c.toJSON(),
    enrolledCount: enrolledMap[String(c._id)] || 0,
    waitlistCount: waitlistMap[String(c._id)] || 0,
  }))
}

function cleanPrereqs(data, ownId = null) {
  if (!Array.isArray(data.prerequisites)) return data
  const seen = new Set()
  data.prerequisites = data.prerequisites.filter((p) => {
    const id = String(p)
    if (!id || (ownId && id === String(ownId)) || seen.has(id)) return false
    seen.add(id)
    return true
  })
  return data
}

export async function createCourse(data, actorId) {
  if (data.code) {
    const exists = await Course.findOne({ code: String(data.code).toUpperCase() })
    if (exists) throw new ApiError(409, 'Course code already exists.')
  }
  const course = await Course.create(cleanPrereqs(data))
  await logAudit(actorId, 'create', 'Course', `Created course ${course.code} - ${course.name}`)
  return course.populate([
    { path: 'professorId', select: 'firstName lastName department' },
    { path: 'prerequisites', select: 'code name' },
  ])
}

export async function updateCourse(id, data, actorId) {
  if (data.code) {
    const dup = await Course.findOne({ code: String(data.code).toUpperCase(), _id: { $ne: id } })
    if (dup) throw new ApiError(409, 'Course code already exists.')
  }
  const course = await Course.findByIdAndUpdate(id, cleanPrereqs(data, id), { new: true, runValidators: true })
    .populate('professorId', 'firstName lastName department')
    .populate('prerequisites', 'code name')
  if (!course) throw new ApiError(404, 'Course not found')
  await logAudit(actorId, 'update', 'Course', `Updated course ${course.code}`)
  await promoteFromWaitlist(course._id)
  return course
}

export async function deleteCourse(id, actorId) {
  const course = await Course.findByIdAndDelete(id)
  if (!course) throw new ApiError(404, 'Course not found')
  await Enrollment.deleteMany({ courseId: id })
  await Exam.deleteMany({ courseId: id })
  await Grade.deleteMany({ courseId: id })
  await Course.updateMany({ prerequisites: id }, { $pull: { prerequisites: id } })
  await logAudit(actorId, 'delete', 'Course', `Deleted course ${course.code}`)
  return course
}

// ------------------------------ Enrollment ------------------------------
const ROSTER_FIELDS = 'firstName lastName email studentId program status avatarColor'

export async function getRoster(courseId) {
  const [enrolledRows, waitlistRows] = await Promise.all([
    Enrollment.find({ courseId, status: 'enrolled' }).populate('studentId', ROSTER_FIELDS),
    Enrollment.find({ courseId, status: 'waitlisted' }).sort({ waitlistedAt: 1 }).populate('studentId', ROSTER_FIELDS),
  ])
  return {
    enrolled: enrolledRows.map((r) => r.studentId).filter(Boolean),
    waitlist: waitlistRows.map((r) => r.studentId).filter(Boolean),
  }
}

async function hasPassed(studentId, courseId) {
  const g = await Grade.findOne({ studentId, courseId, status: 'final' })
  return !!g && !!g.letter && g.letter.toUpperCase() !== 'F'
}

export async function missingPrerequisites(studentId, course) {
  const missing = []
  for (const prereqId of course.prerequisites || []) {
    if (!(await hasPassed(studentId, prereqId))) {
      const p = await Course.findById(prereqId).select('code name')
      if (p) missing.push(p)
    }
  }
  return missing
}

export async function promoteFromWaitlist(courseId) {
  const course = await Course.findById(courseId)
  if (!course) return []
  const enrolled = await Enrollment.countDocuments({ courseId, status: 'enrolled' })
  let free = course.capacity - enrolled
  if (free <= 0) return []
  const next = await Enrollment.find({ courseId, status: 'waitlisted' }).sort({ waitlistedAt: 1 }).limit(free)
  const promoted = []
  for (const row of next) {
    row.status = 'enrolled'
    row.waitlistedAt = null
    row.enrolledAt = new Date()
    await row.save()
    promoted.push(row.studentId)
    await notify(row.studentId, {
      type: 'enrollment',
      title: `Enrolled in ${course.code}`,
      body: `A seat opened up in ${course.code} - ${course.name}. You have been moved from the waitlist and are now enrolled.`,
      link: '/student/courses',
    })
    await logAudit(null, 'update', 'Enrollment', `Promoted a student from the waitlist of ${course.code}`)
  }
  return promoted
}

export async function enrollStudent(studentId, courseId, actorId) {
  const course = await Course.findById(courseId)
  if (!course) throw new ApiError(404, 'Course not found')

  const existing = await Enrollment.findOne({ studentId, courseId })
  if (existing && existing.status === 'enrolled') throw new ApiError(409, 'Student is already enrolled.')
  if (existing && existing.status === 'waitlisted') throw new ApiError(409, 'Student is already on the waitlist.')

  const missing = await missingPrerequisites(studentId, course)
  if (missing.length) {
    throw new ApiError(400, `Missing prerequisite${missing.length > 1 ? 's' : ''}: ${missing.map((m) => m.code).join(', ')}. The student must pass ${missing.length > 1 ? 'these courses' : 'this course'} first.`)
  }

  const enrolled = await Enrollment.countDocuments({ courseId, status: 'enrolled' })
  const isFull = enrolled >= course.capacity
  const status = isFull ? 'waitlisted' : 'enrolled'

  if (existing) {
    existing.status = status
    existing.waitlistedAt = isFull ? new Date() : null
    existing.enrolledAt = new Date()
    await existing.save()
  } else {
    await Enrollment.create({ studentId, courseId, status, waitlistedAt: isFull ? new Date() : null })
  }

  if (isFull) {
    await notify(studentId, {
      type: 'enrollment',
      title: `Waitlisted for ${course.code}`,
      body: `${course.code} is at full capacity. You have been added to the waitlist and will be enrolled automatically when a seat opens.`,
      link: '/student/catalog',
    })
  }
  await logAudit(actorId, 'create', 'Enrollment', isFull
    ? `Added a student to the waitlist of ${course.code} (course full)`
    : `Enrolled a student in ${course.code}`)
  return { ...(await getRoster(courseId)), waitlisted: isFull }
}

export async function dropStudent(studentId, courseId, actorId) {
  const removed = await Enrollment.findOneAndDelete({ studentId, courseId })
  const course = await Course.findById(courseId)
  await logAudit(actorId, 'delete', 'Enrollment', `Removed a student from ${course ? course.code : 'a course'}`)
  if (removed && removed.status === 'enrolled') await promoteFromWaitlist(courseId)
  return getRoster(courseId)
}

// ------------------------------ Exams ------------------------------
export async function listExams() {
  return Exam.find().sort({ date: 1 }).populate('courseId', 'code name')
}
export async function createExam(data, actorId) {
  const exam = await Exam.create(data)
  await exam.populate({ path: 'courseId', select: 'code name professorId' })

  const courseId = exam.courseId?._id || exam.courseId
  if (courseId) {
    const course = exam.courseId
    const professorId = course.professorId
    const dateStr = exam.date ? new Date(exam.date).toISOString().slice(0, 10) : 'TBD'

    const notifications = [{ userId: professorId, type: 'exam', title: 'Exam scheduled', body: `${course.code}: "${exam.title}" on ${dateStr}`, link: `/professor/courses/${courseId}` }]

    const enrollments = await Enrollment.find({ courseId, status: 'enrolled' })
    enrollments.forEach((e) => {
      notifications.push({ userId: e.studentId, type: 'exam', title: 'Exam scheduled', body: `${course.code}: "${exam.title}" on ${dateStr}`, link: `/student/courses/${courseId}` })
    })

    await Notification.insertMany(notifications)

    const allIds = [professorId, ...enrollments.map((e) => e.studentId)]
    const recipients = await User.find({ _id: { $in: allIds } }).select('personalEmail email')
    recipients.forEach((u) => {
      sendNotificationEmail({ to: u.personalEmail || u.email, subject: 'Exam scheduled', body: `${course.code}: "${exam.title}" is scheduled on ${dateStr}.`, link: `/courses/${courseId}` })
    })
  }

  await logAudit(actorId, 'create', 'Exam', `Scheduled exam "${exam.title}"`)
  return exam.populate({ path: 'courseId', select: 'code name' })
}
export async function updateExam(id, data, actorId) {
  const exam = await Exam.findByIdAndUpdate(id, data, { new: true }).populate('courseId', 'code name')
  if (!exam) throw new ApiError(404, 'Exam not found')
  await logAudit(actorId, 'update', 'Exam', `Updated exam "${exam.title}"`)
  return exam
}
export async function deleteExam(id, actorId) {
  const exam = await Exam.findByIdAndDelete(id)
  if (!exam) throw new ApiError(404, 'Exam not found')
  await logAudit(actorId, 'delete', 'Exam', 'Deleted an exam')
  return exam
}

// ------------------------------ Calendar ------------------------------
export async function listCalendar() {
  return CalendarEvent.find().sort({ date: 1 })
}
export async function createEvent(data, actorId) {
  const ev = await CalendarEvent.create(data)
  await logAudit(actorId, 'create', 'Calendar', `Added calendar event "${ev.title}"`)
  return ev
}
export async function deleteEvent(id, actorId) {
  const ev = await CalendarEvent.findByIdAndDelete(id)
  if (!ev) throw new ApiError(404, 'Event not found')
  await logAudit(actorId, 'delete', 'Calendar', 'Removed a calendar event')
  return ev
}

// ------------------------------ Announcements (system) ------------------------------
export async function listAnnouncements() {
  return Announcement.find({ scope: 'system' }).sort({ pinned: -1, createdAt: -1 }).populate('authorId', 'firstName lastName')
}
export async function createAnnouncement(data, actorId) {
  const ann = await Announcement.create({ ...data, scope: 'system', authorId: actorId })
  await logAudit(actorId, 'create', 'Announcement', `Posted announcement "${ann.title}"`)
  return ann.populate({ path: 'authorId', select: 'firstName lastName' })
}
export async function deleteAnnouncement(id, actorId) {
  const ann = await Announcement.findByIdAndDelete(id)
  if (!ann) throw new ApiError(404, 'Announcement not found')
  await logAudit(actorId, 'delete', 'Announcement', 'Deleted an announcement')
  return ann
}

// ------------------------------ Audit ------------------------------
export async function listAudit({ action, search } = {}) {
  const q = {}
  if (action && action !== 'all') q.action = action
  if (search) q.detail = new RegExp(search, 'i')
  return AuditLog.find(q).sort({ createdAt: -1 }).limit(200).populate('actorId', 'firstName lastName')
}

// ------------------------------ Notifications ------------------------------
export async function getNotifications(userId) {
  return Notification.find({ userId }).sort({ createdAt: -1 })
}

export async function markNotificationRead(notificationId, userId) {
  const notification = await Notification.findOne({ _id: notificationId, userId })
  if (!notification) throw new ApiError(404, 'Notification not found')
  notification.read = true
  await notification.save()
  return notification
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany({ userId, read: false }, { read: true })
  return { message: 'All notifications marked as read' }
}