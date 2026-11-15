import express from 'express'
import cors from 'cors'
import { sessions } from './store.js'
import { sessionsRouter } from './routes/sessions.js' 

const app = express()
const PORT = 3000

// Dank Vite-Proxy (/api → localhost:3000) eigentlich nicht mehr nötig, schadet aber nicht
app.use(cors())
// Liest JSON aus dem Body von POST/PUT-Anfragen
app.use(express.json())

// Test-Route: Zeigt, ob der Server läuft
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size })
})

// Alle Routen, die mit /api/sessions beginnen, behandelt der sessionsRouter
app.use('/api/sessions', sessionsRouter)

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
})