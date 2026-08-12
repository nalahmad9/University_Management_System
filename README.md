# UniHub - University Management System (MERN)

A full-stack University Management System built with the MERN stack
(MongoDB, Express, React, Node.js). It provides three role-based portals -
Admin, Professor, and Student - with a clean, modern academic (blue/indigo) UI.

The project has two parts:

- Frontend (this repo root): React + Tailwind CSS client - DONE and runnable.
- Backend (`backend/` folder): Node.js + Express + MongoDB REST API - structure scaffolded.

## Status

- [x] Frontend: all pages for Admin, Professor, and Student (React + Tailwind), fully clickable with mock data
- [x] Git repository on GitHub
- [ ] Backend: role-based folder structure ready; implementation in progress
- [ ] Frontend connected to the real API
- [ ] Deployment

## Demo Login Accounts (frontend)

| Role      | Username | Email                    | Password    |
|-----------|----------|--------------------------|-------------|
| Admin     | admin    | admin@university.edu     | Admin@123   |
| Professor | j.smith  | professor@university.edu | Prof@123    |
| Student   | s.jane   | student@university.edu   | Student@123 |

Sign in with the username or the email, or click a demo card on the login screen
to sign in instantly. (Accounts marked "pending" are blocked until an Admin activates them.)

## Tech Stack

- Frontend: React 18, Vite, React Router v6, Tailwind CSS, lucide-react
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt

## Getting Started

### Frontend (project root)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
```

### Backend (backend/ folder)

```bash
cd backend
npm install
# copy .env.example to .env and fill in the values
npm run dev        # http://localhost:5000
```

## Project Structure

Frontend (root):

```
src/
  components/    UI primitives + layout (Sidebar, Topbar, ProtectedRoute)
  context/       AuthContext, DataContext (mock store), ToastContext
  data/          mockData.js (seed data)
  pages/         auth/ , admin/ , professor/ , student/ , Profile, NotFound
  utils/         helpers (dates, GPA, grades)
  App.jsx        routes
  main.jsx       entry + providers
```

Backend (backend/), split by role:

```
src/
  config/          env + MongoDB connection
  models/          SHARED Mongoose schemas (used by all roles):
                   User, Course, Enrollment, Assignment, Submission, Grade,
                   Exam, Announcement, Attendance, Material, Notification, AuditLog
  middleware/      auth (JWT), role (RBAC), validate, error, notFound
  utils/           ApiError, asyncHandler, generateToken, logger
  routes/index.js  mounts /api/auth, /api/admin, /api/professor, /api/student
  modules/         role-based modules (each: routes + controller + service)
    auth/          shared login / register / me / password  (all roles)
    admin/         users, courses, enrollment, exams, calendar, announcements, audit, stats
    professor/     courses, materials, assignments, grading, grades, attendance, announcements
    student/       catalog, enrollment, classroom, submissions, grades, transcript, exams, notifications
```

## API Overview (planned)

```
POST /api/auth/login , /api/auth/register , GET /api/auth/me
/api/admin/...        (admin only)
/api/professor/...    (professor only)
/api/student/...      (student only)
```

Every request first passes JWT verification, then a role guard
(authorize("admin" | "professor" | "student")) protects each module.

## Notes

- Frontend data is currently in-memory mock data (resets on refresh). It will be
  replaced by real API calls once the backend is implemented.
- The design theme colors live in tailwind.config.js (the "brand" palette).
- Models stay shared (not split per role) because all roles use the same data;
  only the routes/controllers/services are split by role.
