import { useState, useEffect, useCallback, useRef } from 'react'
import { studentApi, uploadApi } from '../api'

const CACHE = { data: null, promise: null }

function initState(overrides = {}) {
  return {
    courses: [], users: [], enrollments: [],
    assignments: [], grades: [], exams: [], notifications: [], announcements: [],
    loaded: false, loading: true,
    ...overrides,
  }
}

export default function useStudentData() {
  const [data, setData] = useState(() => CACHE.data ? { ...CACHE.data, loading: false } : initState())
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (CACHE.data) return

    async function load() {
      try {
        const res = CACHE.promise ? await CACHE.promise : await (CACHE.promise = studentApi.getInit())
        CACHE.data = {
          courses: res.courses || [],
          enrollments: res.enrollments || [],
          users: res.users || [],
          assignments: res.assignments || [],
          grades: res.grades || [],
          exams: res.exams || [],
          notifications: res.notifications || [],
          announcements: res.announcements || [],
        }
        if (mounted.current) setData({ ...CACHE.data, loaded: true, loading: false })
      } catch (e) {
        console.error('useStudentData error', e)
        if (mounted.current) setData((d) => ({ ...d, loaded: false, loading: false }))
      }
    }

    load()

    const interval = setInterval(async () => {
      try {
        const res = await studentApi.getInit()
        CACHE.data = {
          courses: res.courses || [],
          enrollments: res.enrollments || [],
          users: res.users || [],
          assignments: res.assignments || [],
          grades: res.grades || [],
          exams: res.exams || [],
          notifications: res.notifications || [],
          announcements: res.announcements || [],
        }
        if (mounted.current) setData((d) => ({
          ...d,
          ...CACHE.data,
          loaded: true,
          loading: false,
        }))
      } catch { /* ignore */ }
    }, 30000)

    return () => { mounted.current = false; clearInterval(interval) }
  }, [])

  const enroll = useCallback(async (courseId) => {
    const result = await studentApi.enroll(courseId)
    const enrollment = result.enrollment
    setData((d) => ({ ...d, enrollments: [...d.enrollments, enrollment] }))
    if (CACHE.data) CACHE.data.enrollments = [...CACHE.data.enrollments, enrollment]
    return result
  }, [])

  const drop = useCallback(async (courseId) => {
    await studentApi.drop(courseId)
    const cid = String(courseId)
    setData((d) => ({ ...d, enrollments: d.enrollments.filter((e) => String(e.courseId) !== cid) }))
    if (CACHE.data) CACHE.data.enrollments = CACHE.data.enrollments.filter((e) => String(e.courseId) !== cid)
  }, [])

  const submitAssignment = useCallback(async (assignmentId, file) => {
    const uploadRes = await uploadApi.uploadFile(file)
    const result = await studentApi.submitAssignment(assignmentId, uploadRes.filename)
    const submission = result.submission
    const updated = (d) => d.assignments.map((a) =>
      (a.id || a._id) === assignmentId
        ? { ...a, sub: { ...submission, id: submission._id || submission.id, assignmentId, status: 'submitted', fileName: submission.fileUrl } }
        : a
    )
    setData((d) => ({ ...d, assignments: updated(d) }))
    if (CACHE.data) CACHE.data.assignments = CACHE.data.assignments.map((a) =>
      (a.id || a._id) === assignmentId
        ? { ...a, sub: { ...submission, id: submission._id || submission.id, assignmentId, status: 'submitted', fileName: submission.fileUrl } }
        : a
    )
    return result
  }, [])

  const markNotificationRead = useCallback(async (id) => {
    await studentApi.markNotificationRead(id)
    const markRead = (arr) => arr.map((n) => (n._id || n.id) === id ? { ...n, read: true } : n)
    setData((d) => ({ ...d, notifications: markRead(d.notifications) }))
    if (CACHE.data) CACHE.data.notifications = markRead(CACHE.data.notifications)
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    await studentApi.markAllNotificationsRead()
    const allRead = (arr) => arr.map((n) => ({ ...n, read: true }))
    setData((d) => ({ ...d, notifications: allRead(d.notifications) }))
    if (CACHE.data) CACHE.data.notifications = allRead(CACHE.data.notifications)
  }, [])

  const calculateGrade = useCallback(async (courseId) => {
    return studentApi.calculateGrade(courseId)
  }, [])

  const refresh = useCallback(async () => {
    CACHE.data = null
    CACHE.promise = null
    try {
      const res = await studentApi.getInit()
      CACHE.data = {
        courses: res.courses || [],
        enrollments: res.enrollments || [],
        users: res.users || [],
        assignments: res.assignments || [],
        grades: res.grades || [],
        exams: res.exams || [],
        notifications: res.notifications || [],
        announcements: res.announcements || [],
      }
      if (mounted.current) setData({ ...CACHE.data, loaded: true, loading: false })
    } catch (e) {
      console.error('refresh error', e)
      if (mounted.current) setData((d) => ({ ...d, loaded: false, loading: false }))
    }
  }, [])

  return { ...data, enroll, drop, submitAssignment, markNotificationRead, markAllNotificationsRead, calculateGrade, refresh }
}
