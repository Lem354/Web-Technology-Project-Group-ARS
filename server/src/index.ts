import express from 'express'
import cors from 'cors'
import { sessions } from './store.js'

const app = express()
const PORT = 3000

// Erlaubt Anfragen vom Frontend (Vite läuft auf einem anderen Port)
app.use(cors())
// Liest JSON aus dem Body von POST/PUT-Anfragen
app.use(express.json())

// Test-Route: Zeigt, ob der Server läuft
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size })
})

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
})