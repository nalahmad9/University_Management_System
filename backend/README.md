# UMS Backend (Node.js + Express + MongoDB)

REST API for the University Management System. ES modules, Mongoose, JWT auth.
The Auth module and the full Admin module are implemented; Professor/Student are next.

## Getting started

1. Make sure MongoDB is running. Either:
   - Local: install MongoDB Community and keep the default `mongodb://127.0.0.1:27017`, or
   - Cloud: create a free MongoDB Atlas cluster and put its URI in `.env` (MONGO_URI).
2. cd backend
3. npm install
4. (the .env file is already created; change JWT_SECRET for production)
5. npm run seed      # creates demo users, courses, enrollments, exams, etc.
6. npm run dev       # starts the API on http://localhost:5000

Keep the frontend running too (npm run dev in the project root on port 5173).

## Demo accounts (after seeding)

| Role      | Email                    | Password    |
|-----------|--------------------------|-------------|
| Admin     | admin.account@unihub.edu     | Admin@123   |
| Professor | professor.account@unihub.edu | Professor@123    |
| Student   | student.account@unihub.edu   | Student@123 |

## Auth API (public)

- POST   /api/auth/signup     { firstName, lastName, email, password, role } -> { user, token }
- POST   /api/auth/register   (alias of signup)
- POST   /api/auth/login      { email, password } -> { user, token }
- GET    /api/auth/me         (Bearer token) -> { user }

## Admin API  (all require: Bearer token + role "admin")

Dashboard
- GET    /api/admin/dashboard/stats     counts, status breakdown, pending users, enrollment-by-course, recent activity

User management
- GET    /api/admin/users               ?role=&status=&search=
- POST   /api/admin/users               create user (starts as pending)
- GET    /api/admin/users/:id
- PUT    /api/admin/users/:id           edit
- DELETE /api/admin/users/:id           delete (also removes their enrollments)
- PATCH  /api/admin/users/:id/status    { status: active | pending | inactive }

Course management
- GET    /api/admin/courses
- POST   /api/admin/courses             create (assign professorId, capacity, ...)
- PUT    /api/admin/courses/:id
- DELETE /api/admin/courses/:id         delete (cascades enrollments + exams)
- GET    /api/admin/courses/:id/roster  enrolled students

Enrollment
- POST   /api/admin/enrollments         { studentId, courseId }  (checks capacity)
- DELETE /api/admin/enrollments         { studentId, courseId }

Exam scheduling
- GET    /api/admin/exams
- POST   /api/admin/exams               { courseId, title, type, date, startTime, endTime, room }
- PUT    /api/admin/exams/:id
- DELETE /api/admin/exams/:id

Academic calendar
- GET    /api/admin/calendar
- POST   /api/admin/calendar            { title, date, type }
- DELETE /api/admin/calendar/:id

System announcements
- GET    /api/admin/announcements
- POST   /api/admin/announcements       { title, body, pinned }
- DELETE /api/admin/announcements/:id

Audit log
- GET    /api/admin/audit               ?action=&search=

## Quick test (after npm run dev)

    # 1) login as admin -> copy the token from the response
    curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@university.edu\",\"password\":\"Admin@123\"}"

    # 2) call an admin endpoint with the token
    curl http://localhost:5000/api/admin/dashboard/stats -H "Authorization: Bearer PASTE_TOKEN_HERE"

## Structure (role-based)

src/
  config/          env + MongoDB connection
  models/          User, Course, Enrollment, Exam, Announcement, CalendarEvent,
                   AuditLog (implemented) ; Material, Assignment, Submission, Grade,
                   Attendance, Notification (stubs for professor/student)
  middleware/      auth (JWT), role (RBAC), validate, error, notFound
  utils/           ApiError, asyncHandler, generateToken, audit, logger
  routes/index.js  mounts /api/auth (public) and /api/admin (admin only)
  modules/
    auth/          signup / login / me
    admin/         dashboard, users, courses, enrollment, exams, calendar, announcements, audit
    professor/     (stubs - next)
    student/       (stubs - next)
  seed.js          demo data for every admin page
