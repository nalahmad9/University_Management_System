import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

// Auth
import Login from './pages/auth/Login'
import RequestAccount from './pages/auth/RequestAccount'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Shared
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminCourses from './pages/admin/Courses'
import AdminEnrollment from './pages/admin/Enrollment'
import AdminExams from './pages/admin/Exams'
import AdminCalendar from './pages/admin/Calendar'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminAudit from './pages/admin/Audit'
import AdminNotifications from './pages/admin/Notifications'

// Professor
import ProfessorDashboard from './pages/professor/Dashboard'
import ProfessorCourses from './pages/professor/Courses'
import ProfessorClassroom from './pages/professor/Classroom'
import ProfessorAssignments from './pages/professor/Assignments'
import ProfessorGrading from './pages/professor/Grading'
import ProfessorGrades from './pages/professor/Grades'
import ProfessorAttendance from './pages/professor/Attendance'
import ProfessorAnnouncements from './pages/professor/Announcements'
import ProfessorNotifications from './pages/professor/Notifications'

// Student
import StudentDashboard from './pages/student/Dashboard'
import StudentCatalog from './pages/student/Catalog'
import StudentCourses from './pages/student/Courses'
import StudentClassroom from './pages/student/Classroom'
import StudentAssignments from './pages/student/Assignments'
import StudentGrades from './pages/student/Grades'
import StudentTranscript from './pages/student/Transcript'
import StudentExams from './pages/student/Exams'
import StudentNotifications from './pages/student/Notifications'

function HomeRedirect() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  return <Navigate to={`/${currentUser.role}/dashboard`} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register/:role" element={<RequestAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="enrollment" element={<AdminEnrollment />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Professor */}
      <Route
        path="/professor"
        element={
          <ProtectedRoute role="professor">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ProfessorDashboard />} />
        <Route path="courses" element={<ProfessorCourses />} />
        <Route path="courses/:courseId" element={<ProfessorClassroom />} />
        <Route path="assignments" element={<ProfessorAssignments />} />
        <Route path="grading" element={<ProfessorGrading />} />
        <Route path="grades" element={<ProfessorGrades />} />
        <Route path="attendance" element={<ProfessorAttendance />} />
        <Route path="announcements" element={<ProfessorAnnouncements />} />
        <Route path="notifications" element={<ProfessorNotifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="catalog" element={<StudentCatalog />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="courses/:courseId" element={<StudentClassroom />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="grades" element={<StudentGrades />} />
        <Route path="transcript" element={<StudentTranscript />} />
        <Route path="exams" element={<StudentExams />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Fallbacks */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
