import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import { verifyToken } from '../middleware/auth.middleware.js'
import { authorize } from '../middleware/role.middleware.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
    cb(null, uniqueName)
  },
})

const upload = multer({ storage })

const router = Router()

router.get('/files/:filename', (req, res) => {
  try {
    const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET || 'dev_secret_change_me')
    if (!decoded) return res.status(401).json({ message: 'Invalid token' })
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
  const filePath = path.join(uploadDir, req.params.filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' })
  res.download(filePath)
})

router.use(verifyToken)

router.post('/upload', authorize('professor', 'student'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    url: `/api/files/${req.file.filename}`,
  })
})

export default router
