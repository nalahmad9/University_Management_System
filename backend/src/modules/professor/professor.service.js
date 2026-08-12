import User from '../../models/User.js'
import Course from '../../models/Course.js'
import Enrollment from '../../models/Enrollment.js'
import Assignment from '../../models/Assignment.js'
import Submission from '../../models/Submission.js'
import Grade from '../../models/Grade.js'
import Announcement from '../../models/Announcement.js'
import Notification from '../../models/Notification.js'
import Attendance from '../../models/Attendance.js'
import Material from '../../models/Material.js'
import { sendNotificationEmail } from '../../utils/mailer.js'

const GRADE_SCALE = [
  { letter: 'A', min: 93, points: 4.0 },
  { letter: 'A-', min: 90, points: 3.7 },
  { letter: 'B+', min: 87, points: 3.3 },
  { letter: 'B', min: 83, points: 3.0 },
  { letter: 'B-', min: 80, points: 2.7 },
  { letter: 'C+', min: 77, points: 2.3 },
  { letter: 'C', min: 73, points: 2.0 },
  { letter: 'C-', min: 70, points: 1.7 },
  { letter: 'D', min: 60, points: 1.0 },
  { letter: 'F', min: 0, points: 0.0 },
]

function scoreToLetter(score) {
  if (score == null) return null
  const row = GRADE_SCALE.find((g) => score >= g.min)
  return row ? row.letter : 'F'
}

function scoreToPoints(score) {
  if (score == null) return null
  const row = GRADE_SCALE.find((g) => score >= g.min)
  return row ? row.points : 0
}

async function getMyCourseIds(professorId) {
  const courses = await Course.find({ professorId })
  return courses.map((c) => c._id.toString())
}

// ---- Dashboard ----
export async function getDashboard(professorId) {
  const courses = await Course.find({ professorId })
  const courseIds = courses.map((c) => c._id)

  const enrollments = await Enrollment.find({ courseId: { $in: courseIds }, status: 'enrolled' })
  const studentSet = new Set(enrollments.map((e) => e.studentId.toString()))

  const assignments = await Assignment.find({ courseId: { $in: courseIds } })
  const assignmentIds = assignments.map((a) => a._id)
  const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
  const pendingSubs = submissions.filter((s) => s.grade == null)

  const now = new Date()
  const upcoming = assignments
    .filter((a) => new Date(a.deadline) >= now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5)

  return {
    myCoursesCount: courses.length,
    totalStudents: studentSet.size,
    pendingGrading: pendingSubs.length,
    upcomingDeadlines: upcoming.length,
    courses,
    pendingSubmissions: pendingSubs.slice(0, 5).map((s) => ({
      ...s.toObject(),
      id: s._id.toString(),
      studentId: s.studentId.toString(),
      assignmentId: s.assignmentId.toString(),
    })),
    upcomingAssignments: upcoming,
  }
}

// ---- Courses ----
export async function getCourses(professorId) {
  const courses = await Course.find({ professorId })
  const courseIds = courses.map((c) => c._id)
  const enrollments = await Enrollment.find({ courseId: { $in: courseIds }, status: 'enrolled' })
  const countMap = {}
  enrollments.forEach((e) => {
    const key = e.courseId.toString()
    countMap[key] = (countMap[key] || 0) + 1
  })
  return courses.map((c) => ({
    ...c.toObject({ virtuals: true }),
    name: c.name || c.title,
    id: c._id.toString(),
    enrolledCount: countMap[c._id.toString()] || 0,
  }))
}

// ---- Course Detail (with roster) ----
export async function getCourseDetail(professorId, courseId) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const enrollments = await Enrollment.find({ courseId, status: 'enrolled' })
  const studentIds = enrollments.map((e) => e.studentId)
  const students = await User.find({ _id: { $in: studentIds } }).select('-password')

  return {
    course: { ...course.toObject({ virtuals: true }), name: course.name || course.title, id: course._id.toString() },
    roster: students.map((s) => ({ ...s.toObject(), id: s._id.toString() })),
    enrolledCount: enrollments.length,
  }
}

// ---- Materials ----
export async function getMaterials(professorId, courseId) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const materials = await Material.find({ courseId }).sort({ createdAt: -1 })
  return {
    materials: materials.map((m) => ({ ...m.toObject(), id: m._id.toString() })),
  }
}

export async function addMaterial(professorId, courseId, data) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const material = await Material.create({
    courseId,
    week: data.week || 'Week 1',
    title: data.title,
    type: data.type || 'file',
    fileName: data.fileName || null,
    fileUrl: data.fileUrl || null,
    size: data.size || null,
  })

  const enrollments = await Enrollment.find({ courseId, status: 'enrolled' })
  const notifications = enrollments.map((e) => ({
    userId: e.studentId,
    type: 'material',
    title: 'New material uploaded',
    body: `${course.code}: "${data.title}" is now available.`,
    link: `/student/courses/${courseId}?tab=materials`,
  }))
  if (notifications.length > 0) {
    await Notification.insertMany(notifications)
    const studentIds = enrollments.map((e) => e.studentId)
    const students = await User.find({ _id: { $in: studentIds } }).select('personalEmail email')
    students.forEach((s) => {
      sendNotificationEmail({
        to: s.personalEmail || s.email,
        subject: 'New material uploaded',
        body: `${course.code}: "${data.title}" is now available.`,
        link: `/student/courses/${courseId}?tab=materials`,
      })
    })
  }

  return { ...material.toObject(), id: material._id.toString() }
}

export async function deleteMaterial(professorId, courseId, materialId) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const material = await Material.findOne({ _id: materialId, courseId })
  if (!material) throw { status: 404, message: 'Material not found' }

  await material.deleteOne()
  return { message: 'Material deleted' }
}

// ---- Announcements ----
export async function getAnnouncements(professorId) {
  const courseIds = await getMyCourseIds(professorId)
  return Announcement.find({ courseId: { $in: courseIds } }).sort({ createdAt: -1 })
}

export async function getCourseAnnouncements(professorId, courseId) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }
  return Announcement.find({ courseId }).sort({ createdAt: -1 })
}

export async function addAnnouncement(professorId, courseId, data) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const announcement = await Announcement.create({
    scope: 'course',
    courseId,
    authorId: professorId,
    title: data.title,
    body: data.body || data.message,
  })

  const enrollments = await Enrollment.find({ courseId, status: 'enrolled' })
  const notifications = enrollments.map((e) => ({
    userId: e.studentId,
    type: 'announcement',
    title: 'Course announcement',
    body: `${course.code}: ${data.title}`,
    link: `/student/courses/${courseId}?tab=announcements`,
  }))
  notifications.push({
    userId: professorId,
    type: 'announcement',
    title: 'Announcement posted',
    body: `Your announcement "${data.title}" was posted to ${course.code}.`,
    link: `/professor/courses/${courseId}?tab=announcements`,
  })
  await Notification.insertMany(notifications)
  if (enrollments.length > 0) {
    const studentIds = enrollments.map((e) => e.studentId)
    const students = await User.find({ _id: { $in: studentIds } }).select('personalEmail email')
    students.forEach((s) => {
      sendNotificationEmail({
        to: s.personalEmail || s.email,
        subject: 'Course announcement',
        body: `${course.code}: ${data.title}`,
        link: `/student/courses/${courseId}?tab=announcements`,
      })
    })
  }

  return announcement
}

export async function deleteAnnouncement(professorId, announcementId) {
  const announcement = await Announcement.findOne({ _id: announcementId, authorId: professorId })
  if (!announcement) throw { status: 404, message: 'Announcement not found' }
  await announcement.deleteOne()
  return { message: 'Deleted' }
}

// ---- Assignments ----
export async function getAssignments(professorId) {
  const courseIds = await getMyCourseIds(professorId)
  const assignments = await Assignment.find({ courseId: { $in: courseIds } }).sort({ deadline: -1 })
  const assignmentIds = assignments.map((a) => a._id)
  const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })

  return assignments.map((a) => {
    const subs = submissions.filter((s) => s.assignmentId.toString() === a._id.toString())
    return {
      ...a.toObject(),
      id: a._id.toString(),
      dueDate: a.deadline,
      maxScore: 100,
      submittedCount: subs.length,
      gradedCount: subs.filter((s) => s.grade != null).length,
    }
  })
}

export async function getCourseAssignments(professorId, courseId) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }
  const assignments = await Assignment.find({ courseId }).sort({ deadline: -1 })
  return assignments.map((a) => ({
    ...a.toObject(), id: a._id.toString(),
    dueDate: a.deadline,
    maxScore: 100,
  }))
}

export async function addAssignment(professorId, courseId, data) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const assignment = await Assignment.create({
    courseId,
    title: data.title,
    description: data.description || '',
    deadline: data.dueDate || data.deadline,
    attachedFileUrl: data.attachment || null,
  })

  const enrollments = await Enrollment.find({ courseId, status: 'enrolled' })
  const notifications = enrollments.map((e) => ({
    userId: e.studentId,
    type: 'assignment',
    title: 'New assignment posted',
    body: `${course.code}: "${data.title}" is due ${assignment.deadline.toISOString().slice(0, 10)}.`,
    link: '/student/assignments',
  }))
  if (notifications.length > 0) {
    await Notification.insertMany(notifications)
    const studentIds = enrollments.map((e) => e.studentId)
    const students = await User.find({ _id: { $in: studentIds } }).select('personalEmail email')
    students.forEach((s) => {
      sendNotificationEmail({
        to: s.personalEmail || s.email,
        subject: 'New assignment posted',
        body: `${course.code}: "${data.title}" is due ${assignment.deadline.toISOString().slice(0, 10)}.`,
        link: '/student/assignments',
      })
    })
  }

  return assignment
}

export async function deleteAssignment(professorId, assignmentId) {
  const assignment = await Assignment.findById(assignmentId)
  if (!assignment) throw { status: 404, message: 'Assignment not found' }

  const course = await Course.findOne({ _id: assignment.courseId, professorId })
  if (!course) throw { status: 403, message: 'Not authorized' }

  await Submission.deleteMany({ assignmentId })
  await assignment.deleteOne()
  return { message: 'Deleted' }
}

// ---- Submissions ----
export async function getSubmissions(professorId) {
  const courseIds = await getMyCourseIds(professorId)
  const assignments = await Assignment.find({ courseId: { $in: courseIds } })
  const assignmentIds = assignments.map((a) => a._id)
  const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })

  const asgMap = {}
  assignments.forEach((a) => { asgMap[a._id.toString()] = a })

  return submissions.map((s) => ({
    id: s._id.toString(),
    assignmentId: s.assignmentId.toString(),
    studentId: s.studentId.toString(),
    submittedAt: s.submittedAt,
    fileName: s.fileUrl,
    score: s.grade ? Number(s.grade) : null,
    feedback: s.feedback,
    status: s.grade != null ? 'graded' : 'submitted',
    maxScore: 100,
  }))
}

export async function gradeSubmission(professorId, submissionId, score, feedback) {
  const submission = await Submission.findById(submissionId).populate('assignmentId')
  if (!submission) throw { status: 404, message: 'Submission not found' }
  if (!submission.assignmentId) throw { status: 400, message: 'Orphaned submission' }

  const course = await Course.findOne({ _id: submission.assignmentId.courseId, professorId })
  if (!course) throw { status: 403, message: 'Not authorized' }

  submission.grade = String(score)
  submission.feedback = feedback || ''
  await submission.save()

  await Notification.create({
    userId: submission.studentId,
    type: 'grade',
    title: 'New grade posted',
    body: `Your grade for "${submission.assignmentId.title}" is available: ${score}/100.`,
    link: '/student/grades',
  })

  const student = await User.findById(submission.studentId).select('personalEmail email')
  if (student) {
    sendNotificationEmail({
      to: student.personalEmail || student.email,
      subject: 'New grade posted',
      body: `Your grade for "${submission.assignmentId.title}" is available: ${score}/100.`,
      link: '/student/grades',
    })
  }

  return submission
}

// ---- Final Grades ----
export async function getCourseGrades(professorId, courseId) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const enrollments = await Enrollment.find({ courseId, status: 'enrolled' })
  const studentIds = enrollments.map((e) => e.studentId)
  const students = await User.find({ _id: { $in: studentIds } }).select('-password')
  const grades = await Grade.find({ courseId })

  const gradeMap = {}
  grades.forEach((g) => { gradeMap[g.studentId.toString()] = g })

  return {
    course: { ...course.toObject(), id: course._id.toString() },
    roster: students.map((s) => ({
      ...s.toObject(),
      id: s._id.toString(),
      grade: gradeMap[s._id.toString()] ? {
        id: gradeMap[s._id.toString()]._id.toString(),
        score: gradeMap[s._id.toString()].score,
        letter: gradeMap[s._id.toString()].letter,
        points: gradeMap[s._id.toString()].points,
        status: gradeMap[s._id.toString()].status,
      } : null,
    })),
  }
}

export async function setFinalGrade(professorId, courseId, studentId, score) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const enrollment = await Enrollment.findOne({ courseId, studentId, status: 'enrolled' })
  if (!enrollment) throw { status: 400, message: 'Student not enrolled in this course' }

  const letter = scoreToLetter(Number(score))
  const points = scoreToPoints(Number(score))

  let grade = await Grade.findOne({ studentId, courseId })
  if (!grade) {
    grade = await Grade.create({ studentId, courseId, score: Number(score), letter, points, status: 'final' })
  } else {
    grade.score = Number(score)
    grade.letter = letter
    grade.points = points
    grade.status = 'final'
    await grade.save()
  }

  await Notification.create({
    userId: studentId,
    type: 'grade',
    title: 'Final grade posted',
    body: `Your final grade for ${course.code} is ${letter} (${score}%).`,
    link: '/student/grades',
  })

  const student = await User.findById(studentId).select('personalEmail email')
  if (student) {
    sendNotificationEmail({
      to: student.personalEmail || student.email,
      subject: 'Final grade posted',
      body: `Your final grade for ${course.code} is ${letter} (${score}%).`,
      link: '/student/grades',
    })
  }

  return grade
}

// ---- Attendance ----
export async function getAllAttendance(professorId) {
  const courseIds = await getMyCourseIds(professorId)
  return Attendance.find({ courseId: { $in: courseIds } }).sort({ sessionDate: -1 })
}

export async function getCourseAttendance(professorId, courseId) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  return Attendance.find({ courseId }).sort({ sessionDate: -1 })
}

export async function saveAttendance(professorId, courseId, data) {
  const course = await Course.findOne({ _id: courseId, professorId })
  if (!course) throw { status: 404, message: 'Course not found' }

  const attendance = await Attendance.create({
    courseId,
    sessionDate: data.date || new Date(),
    topic: data.topic || 'Lecture',
    records: data.records.map((r) => ({
      studentId: r.studentId,
      status: r.present ? 'present' : 'absent',
    })),
  })

  return attendance
}

// ---- Users (helper) ----
export async function getUsers() {
  const users = await User.find().select('-password')
  return users.map((u) => ({ ...u.toObject(), id: u._id.toString() }))
}

// ---- Enrollments (helper) ----
export async function getEnrollments() {
  const enrollments = await Enrollment.find({ status: 'enrolled' })
  return enrollments.map((e) => ({ ...e.toObject(), id: e._id.toString() }))
}

// ---- Notifications ----
export async function getNotifications(professorId) {
  return Notification.find({ userId: professorId }).sort({ createdAt: -1 })
}

export async function markNotificationRead(notificationId, userId) {
  const notification = await Notification.findOne({ _id: notificationId, userId })
  if (!notification) throw { status: 404, message: 'Notification not found' }
  notification.read = true
  await notification.save()
  return notification
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany({ userId, read: false }, { read: true })
  return { message: 'All notifications marked as read' }
}
