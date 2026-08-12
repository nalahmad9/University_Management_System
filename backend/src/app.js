import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import routes from './routes/index.js'
import { notFound } from './middleware/notFound.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
app.use(cors({ origin: clientUrl, credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => res.json({ name: 'UMS API', status: 'running' }))
app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
