import express from 'express'
import type { ErrorRequestHandler } from 'express'
import cors from 'cors'
import { sessions } from './store.js'
import { sessionsRouter } from './routes/sessions.js'
import type { ApiError } from './types.js'

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

// Todo 16: Unbekannte /api-Route → 404 als JSON statt HTML-Fehlerseite.
// Steht NACH allen Routen: Kommt eine Anfrage bis hierher, hat keine Route gepasst.
app.use('/api', (_req, res) => {
  const body: ApiError = { error: 'Route nicht gefunden' }
  res.status(404).json(body)
})

// Todo 16: Zentraler Fehler-Handler. Express erkennt ihn an den 4 Parametern.
// Fängt z. B. kaputtes JSON im Body ab, das express.json() nicht lesen kann.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isJsonError = err instanceof SyntaxError && 'body' in err
  const status = isJsonError ? 400 : 500
  const message = isJsonError ? 'Ungültiges JSON im Body' : 'Interner Serverfehler'

  // Unerwartete Fehler im Terminal ausgeben, damit wir sie finden
  if (!isJsonError) {
    console.error(err)
  }

  const body: ApiError = { error: message }
  res.status(status).json(body)
}
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
})