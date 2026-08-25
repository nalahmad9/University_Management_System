import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import routes from './routes/index.js'
import { notFound } from './middleware/notFound.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

// Define allowed origins with local fallback
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://university-management-system-one-topaz.vercel.app'
].filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)

app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => res.json({ name: 'UMS API', status: 'running' }))
app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app