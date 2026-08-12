import {
  LayoutDashboard, Users, BookOpen, ClipboardList, CalendarClock, CalendarDays,
  Megaphone, ScrollText, GraduationCap, CalendarCheck, PenSquare, Compass,
  FileText, Bell, UserCog,
} from 'lucide-react'

export const NAV = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/enrollment', label: 'Enrollment', icon: ClipboardList },
    { to: '/admin/exams', label: 'Exam Scheduling', icon: CalendarClock },
    { to: '/admin/calendar', label: 'Academic Calendar', icon: CalendarDays },
    { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/admin/audit', label: 'Audit Log', icon: ScrollText },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  ],
  professor: [
    { to: '/professor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/professor/courses', label: 'My Courses', icon: BookOpen },
    { to: '/professor/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/professor/grading', label: 'Grade Submissions', icon: PenSquare },
    { to: '/professor/grades', label: 'Final Grades', icon: GraduationCap },
    { to: '/professor/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/professor/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/professor/notifications', label: 'Notifications', icon: Bell },
  ],
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/catalog', label: 'Course Catalog', icon: Compass },
    { to: '/student/courses', label: 'My Courses', icon: BookOpen },
    { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/student/grades', label: 'Grades & GPA', icon: GraduationCap },
    { to: '/student/transcript', label: 'Transcript', icon: FileText },
    { to: '/student/exams', label: 'Exam Timetable', icon: CalendarClock },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
  ],
}

export const ROLE_LABEL = {
  admin: 'Administrator',
  professor: 'Professor',
  student: 'Student',
}

export const PROFILE_LINK = {
  admin: '/admin/profile',
  professor: '/professor/profile',
  student: '/student/profile',
}

export { UserCog }
