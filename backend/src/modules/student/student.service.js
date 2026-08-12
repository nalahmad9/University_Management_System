import User from '../../models/User.js'
import Course from '../../models/Course.js'
import Enrollment from '../../models/Enrollment.js'
import Assignment from '../../models/Assignment.js'
import Submission from '../../models/Submission.js'
import Grade from '../../models/Grade.js'
import Exam from '../../models/Exam.js'
import Announcement from '../../models/Announcement.js'
import Notification from '../../models/Notification.js'
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

// ---- Dashboard ----
export async function getDashboard(userId) {
  const enrollments = await Enrollment.find({ studentId: userId, status: 'enrolled' })
  const myCourseIds = enrollments.map((e) => e.courseId)

  const myCourses = await Course.find({ _id: { $in: myCourseIds } })
  const myGrades = await Grade.find({ studentId: userId })

  const allAssignments = await Assignment.find({ courseId: { $in: myCourseIds } })
  const mySubmissions = await Submission.find({ studentId: userId })
  const submittedIds = mySubmissions.map((s) => s.assignmentId.toString())
  const now = new Date()

  const pendingAssignments = allAssignments
    .filter((a) => !submittedIds.includes(a._id.toString()) && new Date(a.deadline) >= now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  const allExams = await Exam.find({ courseId: { $in: myCourseIds } })
  const upcomingExams = allExams
    .filter((x) => new Date(x.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const announcements = await Announcement.find({
    $or: [
      { courseId: { $in: myCourseIds } },
      { scope: 'system' },
    ],
  }).sort({ createdAt: -1 }).limit(4)

  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(4)

  const courseById = {}
  myCourses.forEach((c) => { courseById[c._id.toString()] = c })

  let gpa = 0, totalCredits = 0, totalPoints = 0
  myGrades.forEach((g) => {
    if (g.status === 'final' && g.points != null) {
      const course = courseById[g.courseId.toString()]
      const credits = course ? course.credits : 0
      totalPoints += g.points * credits
      totalCredits += credits
    }
  })
  if (totalCredits > 0) gpa = +(totalPoints / totalCredits).toFixed(2)

  return {
    enrolledCoursesCount: myCourses.length,
    totalCredits: myCourses.reduce((a, c) => a + c.credits, 0),
    gpa,
    pendingAssignments: pendingAssignments.length,
    upcomingExamsCount: upcomingExams.length,
    myCourses,
    pendingAssignmentsList: pendingAssignments.slice(0, 5),
    upcomingExams: upcomingExams.slice(0, 5),
    announcements,
    notifications,
  }
}

// ---- Catalog ----
export async function getCatalog() {
  const courses = await Course.find().populate('professorId', 'firstName lastName')
  const enrollments = await Enrollment.find({ status: 'enrolled' })
  const countMap = {}
  enrollments.forEach((e) => {
    const key = e.courseId.toString()
    countMap[key] = (countMap[key] || 0) + 1
  })
  return courses.map((c) => {
    const obj = c.toObject({ virtuals: true })
    return {
      ...obj,
      name: obj.name || obj.title,
      id: c._id.toString(),
      professorName: c.professorId ? `${c.professorId.firstName} ${c.professorId.lastName}` : 'TBA',
      professorId: c.professorId?._id?.toString() || c.professorId?.toString(),
      enrolledCount: countMap[c._id.toString()] || 0,
    }
  })
}

// ---- Enroll ----
export async function enroll(userId, courseId) {
  const course = await Course.findById(courseId)
  if (!course) throw { status: 404, message: 'Course not found' }

  if (course.prerequisites && course.prerequisites.length > 0) {
    const passed = await Grade.find({ studentId: userId, courseId: { $in: course.prerequisites }, status: 'final' })
    const passedIds = new Set(passed.map((g) => g.courseId.toString()))
    const failedPrereqs = (course.prerequisites || [])
      .filter((pid) => !passedIds.has(pid.toString()))
      .map((pid) => pid.toString())
    if (failedPrereqs.length > 0) {
      const names = await Course.find({ _id: { $in: failedPrereqs } }, 'code name')
      throw { status: 400, message: `You must complete ${names.map((c) => c.code || c.name).join(', ')} before enrolling.` }
    }
  }

  const enrolled = await Enrollment.countDocuments({ courseId, status: 'enrolled' })
  if (enrolled >= course.capacity) throw { status: 400, message: 'Course is full' }

  const existing = await Enrollment.findOne({ studentId: userId, courseId })
  if (existing) {
    if (existing.status === 'dropped') {
      existing.status = 'enrolled'
      await existing.save()
      return existing
    }
    throw { status: 400, message: 'Already enrolled' }
  }

  const enrollment = await Enrollment.create({ studentId: userId, courseId, status: 'enrolled' })
  await Grade.create({ studentId: userId, courseId, status: 'in-progress' })
  return enrollment
}

// ---- Drop ----
export async function drop(userId, courseId) {
  const enrollment = await Enrollment.findOne({ studentId: userId, courseId, status: 'enrolled' })
  if (!enrollment) throw { status: 404, message: 'Enrollment not found' }

  enrollment.status = 'dropped'
  await enrollment.save()
  await Grade.deleteOne({ studentId: userId, courseId, status: 'in-progress' })
  return enrollment
}

// ---- My Courses ----
export async function getMyCourses(userId) {
  const enrollments = await Enrollment.find({ studentId: userId, status: 'enrolled' })
  const courseIds = enrollments.map((e) => e.courseId)
  const courses = await Course.find({ _id: { $in: courseIds } }).populate('professorId', 'firstName lastName')
  const allEnrollments = await Enrollment.find({ courseId: { $in: courseIds }, status: 'enrolled' })
  const countMap = {}
  allEnrollments.forEach((e) => {
    const key = e.courseId.toString()
    countMap[key] = (countMap[key] || 0) + 1
  })

  return courses.map((c) => {
    const obj = c.toObject({ virtuals: true })
    return {
      ...obj,
      name: obj.name || obj.title,
      id: c._id.toString(),
      professorName: c.professorId ? `${c.professorId.firstName} ${c.professorId.lastName}` : 'TBA',
      professorId: c.professorId?._id?.toString() || c.professorId?.toString(),
      enrolledCount: countMap[c._id.toString()] || 0,
    }
  })
}

// ---- Classroom ----
export async function getClassroom(userId, courseId) {
  const enrollment = await Enrollment.findOne({ studentId: userId, courseId, status: 'enrolled' })
  if (!enrollment) throw { status: 403, message: 'Not enrolled in this course' }

  const course = await Course.findById(courseId).populate('professorId', 'firstName lastName email')
  if (!course) throw { status: 404, message: 'Course not found' }

  const materials = await Material.find({ courseId })
  const announcements = await Announcement.find({ courseId }).sort({ createdAt: -1 })
  const assignments = await Assignment.find({ courseId }).sort({ createdAt: -1 })
  const submissions = await Submission.find({ studentId: userId, assignmentId: { $in: assignments.map((a) => a._id) } })

  const subMap = {}
  submissions.forEach((s) => {
    subMap[s.assignmentId.toString()] = {
      id: s._id.toString(),
      assignmentId: s.assignmentId.toString(),
      studentId: s.studentId.toString(),
      submittedAt: s.submittedAt,
      fileName: s.fileUrl,
      status: s.grade != null ? 'graded' : 'submitted',
      score: s.grade ? Number(s.grade) : null,
      feedback: s.feedback,
    }
  })

  return {
    course: { ...course.toObject({ virtuals: true }), id: course._id.toString(), professor: course.professorId, name: course.name || course.title },
    materials,
    announcements: announcements.map((a) => ({ ...a.toObject(), id: a._id.toString() })),
    assignments: assignments.map((a) => ({
      ...a.toObject(), id: a._id.toString(),
      dueDate: a.deadline,
      maxScore: 100,
      sub: subMap[a._id.toString()] || null,
    })),
  }
}

// ---- Assignments ----
export async function getAssignments(userId) {
  const enrollments = await Enrollment.find({ studentId: userId, status: 'enrolled' })
  const courseIds = enrollments.map((e) => e.courseId)
  const [courses, assignments, submissions] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }),
    Assignment.find({ courseId: { $in: courseIds } }).sort({ deadline: 1 }),
    Submission.find({ studentId: userId }),
  ])
  const courseMap = {}
  courses.forEach((c) => { courseMap[c._id.toString()] = { code: c.code, name: c.name } })

  const subMap = {}
  submissions.forEach((s) => {
    subMap[s.assignmentId.toString()] = {
      id: s._id.toString(),
      assignmentId: s.assignmentId.toString(),
      submittedAt: s.submittedAt,
      fileName: s.fileUrl,
      status: s.grade != null ? 'graded' : 'submitted',
      score: s.grade ? Number(s.grade) : null,
      feedback: s.feedback,
    }
  })

  return assignments.map((a) => ({
    ...a.toObject(),
    id: a._id.toString(),
    dueDate: a.deadline,
    maxScore: 100,
    courseCode: courseMap[a.courseId.toString()]?.code,
    courseName: courseMap[a.courseId.toString()]?.name,
    sub: subMap[a._id.toString()] || null,
  }))
}

// ---- Submit Assignment ----
export async function submitAssignment(userId, assignmentId, fileName) {
  const assignment = await Assignment.findById(assignmentId)
  if (!assignment) throw { status: 404, message: 'Assignment not found' }

  if (new Date(assignment.deadline) < new Date()) {
    throw { status: 400, message: 'This assignment is past its due date and no longer accepts submissions.' }
  }

  const enrollment = await Enrollment.findOne({ studentId: userId, courseId: assignment.courseId, status: 'enrolled' })
  if (!enrollment) throw { status: 403, message: 'Not enrolled in this course' }

  const user = await User.findById(userId).select('firstName lastName')
  const course = await Course.findById(assignment.courseId).select('code title professorId name')

  const existing = await Submission.findOne({ assignmentId, studentId: userId })
  if (existing) {
    existing.fileUrl = fileName
    existing.grade = undefined
    existing.feedback = undefined
    existing.submittedAt = new Date()
    await existing.save()

    await Notification.create({
      userId: course.professorId,
      type: 'submission',
      title: 'Assignment resubmitted',
      body: `${user.firstName} ${user.lastName} resubmitted "${assignment.title}" in ${course.code}.`,
      link: '/professor/grading',
    })

    const professor = await User.findById(course.professorId).select('personalEmail email')
    if (professor) {
      sendNotificationEmail({
        to: professor.personalEmail || professor.email,
        subject: 'Assignment resubmitted',
        body: `${user.firstName} ${user.lastName} resubmitted "${assignment.title}" in ${course.code}.`,
        link: '/professor/grading',
      })
    }

    return existing
  }

  const submission = await Submission.create({ assignmentId, studentId: userId, fileUrl: fileName })

  await Notification.create({
    userId: course.professorId,
    type: 'submission',
    title: 'New assignment submission',
    body: `${user.firstName} ${user.lastName} submitted "${assignment.title}" in ${course.code}.`,
    link: '/professor/grading',
  })

  const professor = await User.findById(course.professorId).select('personalEmail email')
  if (professor) {
    sendNotificationEmail({
      to: professor.personalEmail || professor.email,
      subject: 'New assignment submission',
      body: `${user.firstName} ${user.lastName} submitted "${assignment.title}" in ${course.code}.`,
      link: '/professor/grading',
    })
  }

  return submission
}

// ---- Grades ----
export async function getGrades(userId) {
  const enrollments = await Enrollment.find({ studentId: userId, status: 'enrolled' })
  const courseIds = enrollments.map((e) => e.courseId)
  const [courses, grades, assignments, submissions] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }),
    Grade.find({ studentId: userId }),
    Assignment.find({ courseId: { $in: courseIds } }),
    Submission.find({ studentId: userId }),
  ])
  const courseMap = {}
  courses.forEach((c) => { courseMap[c._id.toString()] = c })

  const subByAsg = {}
  submissions.forEach((s) => {
    subByAsg[s.assignmentId.toString()] = {
      id: s._id.toString(),
      assignmentId: s.assignmentId.toString(),
      status: s.grade != null ? 'graded' : 'submitted',
      score: s.grade ? Number(s.grade) : null,
      feedback: s.feedback,
    }
  })

  let gpa = 0, totalCredits = 0, totalPoints = 0
  grades.forEach((g) => {
    if (g.status === 'final' && g.points != null) {
      const c = courseMap[g.courseId.toString()]
      const credits = c ? c.credits : 0
      totalPoints += g.points * credits
      totalCredits += credits
    }
  })
  if (totalCredits > 0) gpa = +(totalPoints / totalCredits).toFixed(2)
  const finalized = grades.filter((g) => g.status === 'final').length

  const courseGrades = courses.map((c) => {
    const g = grades.find((gr) => gr.courseId.toString() === c._id.toString())
    const courseAsgs = assignments
      .filter((a) => a.courseId.toString() === c._id.toString())
      .map((a) => ({
        id: a._id.toString(),
        title: a.title,
        dueDate: a.deadline,
        maxScore: 100,
        sub: subByAsg[a._id.toString()] || null,
      }))
    return {
      course: { ...c.toObject(), id: c._id.toString() },
      grade: g ? { ...g.toObject(), id: g._id.toString() } : null,
      assignments: courseAsgs,
    }
  })

  const gradesList = grades.map((g) => ({ ...g.toObject(), id: g._id.toString(), courseId: g.courseId.toString(), studentId: g.studentId.toString() }))
  return { gpa, credits: totalCredits, finalized, courseGrades, grades: gradesList }
}

// ---- Calculate Grade ----
export async function calculateGrade(userId, courseId) {
  const submissions = await Submission.find({ studentId: userId }).populate('assignmentId')
  const courseSubs = submissions.filter(
    (s) => s.assignmentId && s.assignmentId.courseId.toString() === courseId.toString()
  )
  const graded = courseSubs.filter((s) => s.grade != null)
  if (graded.length === 0) return { score: null, letter: null, points: null }

  const totalScore = graded.reduce((sum, s) => sum + Number(s.grade), 0)
  const avgScore = Math.round(totalScore / graded.length)

  const letter = scoreToLetter(avgScore)
  const points = scoreToPoints(avgScore)

  let grade = await Grade.findOne({ studentId: userId, courseId })
  if (!grade) {
    grade = await Grade.create({ studentId: userId, courseId, score: avgScore, letter, points, status: 'in-progress' })
  } else {
    grade.score = avgScore
    grade.letter = letter
    grade.points = points
    await grade.save()
  }

  return { score: avgScore, letter, points }
}

// ---- Transcript ----
export async function getTranscript(userId) {
  const enrollments = await Enrollment.find({ studentId: userId })
  const allCourseIds = enrollments.map((e) => e.courseId.toString())
  const courses = await Course.find({ _id: { $in: allCourseIds } }).populate('professorId', 'firstName lastName')
  const courseMap = {}
  courses.forEach((c) => { courseMap[c._id.toString()] = c })

  const grades = await Grade.find({ studentId: userId })
  const gradeMap = {}
  grades.forEach((g) => { gradeMap[g.courseId.toString()] = g })

  let gpa = 0, totalCredits = 0, totalPoints = 0
  grades.forEach((g) => {
    if (g.status === 'final' && g.points != null) {
      const c = courseMap[g.courseId.toString()]
      const credits = c ? c.credits : 0
      totalPoints += g.points * credits
      totalCredits += credits
    }
  })
  if (totalCredits > 0) gpa = +(totalPoints / totalCredits).toFixed(2)

  const rows = allCourseIds.map((cid) => {
    const c = courseMap[cid]
    const g = gradeMap[cid]
    return {
      course: c ? { ...c.toObject(), id: c._id.toString(), professorName: c.professorId ? `${c.professorId.firstName} ${c.professorId.lastName}` : 'TBA' } : null,
      grade: g ? { letter: g.letter, points: g.points, status: g.status } : null,
    }
  }).filter((r) => r.course)

  return { rows, gpa, totalCredits, completedCredits: totalCredits }
}

// ---- Exams ----
export async function getExams(userId) {
  const enrollments = await Enrollment.find({ studentId: userId, status: 'enrolled' })
  const courseIds = enrollments.map((e) => e.courseId)
  const courses = await Course.find({ _id: { $in: courseIds } })
  const courseMap = {}
  courses.forEach((c) => { courseMap[c._id.toString()] = { code: c.code, name: c.name } })

  const exams = await Exam.find({ courseId: { $in: courseIds } }).sort({ date: 1 })
  return exams.map((x) => ({
    ...x.toObject(),
    id: x._id.toString(),
    date: x.date,
    type: x.type || 'Other',
    startTime: x.startTime || '09:00',
    endTime: x.endTime || '11:00',
    courseCode: courseMap[x.courseId.toString()]?.code,
    courseName: courseMap[x.courseId.toString()]?.name,
  }))
}

// ---- Notifications ----
export async function getNotifications(userId) {
  return Notification.find({ userId }).sort({ createdAt: -1 })
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

// ---- Users ----
export async function getUsers() {
  const users = await User.find().select('-password')
  return users.map((u) => ({ ...u.toObject(), id: u._id.toString() }))
}

// ---- Enrollments ----
export async function getEnrollments(userId) {
  return Enrollment.find({ studentId: userId })
}

// ---- Init (all data in one lightweight call) ----
export async function getInitData(userId) {
  const [courses, enrollments, users, assignments, gradesData, exams, notifications, announcements] = await Promise.all([
    getAllCourses(),
    getEnrollments(userId),
    getUsers(),
    getAssignments(userId),
    getGrades(userId),
    getExams(userId),
    getNotifications(userId),
    Announcement.find({ scope: 'system' }).sort({ createdAt: -1 }).limit(10),
  ])
  return { courses, enrollments, users, assignments, grades: gradesData.grades, exams, notifications, announcements }
}

// ---- All Courses (without enrollment data) ----
export async function getAllCourses() {
  const courses = await Course.find().populate('professorId', 'firstName lastName')
  const enrollments = await Enrollment.find({ status: 'enrolled' })
  const countMap = {}
  enrollments.forEach((e) => {
    const key = e.courseId.toString()
    countMap[key] = (countMap[key] || 0) + 1
  })
  return courses.map((c) => {
    const obj = c.toObject({ virtuals: true })
    return {
      ...obj,
      name: obj.name || obj.title,
      id: c._id.toString(),
      professorName: c.professorId ? `${c.professorId.firstName} ${c.professorId.lastName}` : 'TBA',
      professorId: c.professorId?._id?.toString() || c.professorId?.toString(),
      enrolledCount: countMap[c._id.toString()] || 0,
    }
  })
}
