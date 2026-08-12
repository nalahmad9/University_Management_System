import { useState, useEffect, useCallback, useRef } from 'react'
import { professorApi } from '../api'

export default function useProfessorData() {
  const [data, setData] = useState({
    courses: [], enrollments: [], assignments: [], submissions: [], users: [],
    grades: [], exams: [], announcements: [], attendance: [], notifications: [],
    loading: true,
  })
  const cancelledRef = useRef(false)

  const fullRefresh = useCallback(async () => {
    try {
      const [coursesRes, enrollmentsRes, assignmentsRes, subsRes, usersRes, attendanceRes, announcementsRes, notifsRes] =
        await Promise.allSettled([
          professorApi.getCourses(),
          professorApi.getEnrollments(),
          professorApi.getAssignments(),
          professorApi.getSubmissions(),
          professorApi.getUsers(),
          professorApi.getAttendance(),
          professorApi.getAnnouncements(),
          professorApi.getNotifications(),
        ])

      if (cancelledRef.current) return

      const courses = coursesRes.value?.courses || []
      const enrollments = enrollmentsRes.value?.enrollments || []
      const assignments = assignmentsRes.value?.assignments || []
      const submissions = subsRes.value?.submissions || []
      const users = usersRes.value?.users || []
      const attendance = attendanceRes.value?.records || []
      const announcements = announcementsRes.value?.announcements || []
      const notifications = notifsRes.value?.notifications || []

      setData({ courses, enrollments, assignments, submissions, users, attendance, announcements, notifications, loading: false })
    } catch (e) {
      console.error('useProfessorData error', e)
      if (!cancelledRef.current) setData((d) => ({ ...d, loading: false }))
    }
  }, [])

  const refreshNotifs = useCallback(async () => {
    try {
      const [subsRes, notifsRes] = await Promise.allSettled([
        professorApi.getSubmissions(),
        professorApi.getNotifications(),
      ])
      if (cancelledRef.current) return
      setData((d) => ({
        ...d,
        submissions: subsRes.value?.submissions || d.submissions,
        notifications: notifsRes.value?.notifications || d.notifications,
      }))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    cancelledRef.current = false

    fullRefresh()

    const interval = setInterval(refreshNotifs, 30000)
    return () => { cancelledRef.current = true; clearInterval(interval) }
  }, [fullRefresh, refreshNotifs])

  const saveAttendance = useCallback(async (courseId, attData) => {
    const result = await professorApi.saveAttendance(courseId, attData)
    const newRecord = result.attendance
    setData((d) => ({ ...d, attendance: [newRecord, ...d.attendance] }))
    return result
  }, [])

  const addAnnouncement = useCallback(async (courseId, data) => {
    const result = await professorApi.addAnnouncement(courseId, data)
    const newAnnouncement = result.announcement
    setData((d) => ({ ...d, announcements: [newAnnouncement, ...d.announcements] }))
    return result
  }, [])

  const deleteAnnouncement = useCallback(async (id) => {
    await professorApi.deleteAnnouncement(id)
    setData((d) => ({ ...d, announcements: d.announcements.filter((a) => (a._id || a.id) !== id) }))
  }, [])

  const markNotificationRead = useCallback(async (id) => {
    await professorApi.markNotificationRead(id)
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n) =>
        (n._id || n.id) === id ? { ...n, read: true } : n
      ),
    }))
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    await professorApi.markAllNotificationsRead()
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n) => ({ ...n, read: true })),
    }))
  }, [])

  return { ...data, saveAttendance, addAnnouncement, deleteAnnouncement, markNotificationRead, markAllNotificationsRead, refresh: refreshNotifs }
}
