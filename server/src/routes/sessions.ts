import { Router } from 'express'
import type { Response } from 'express'
import { randomUUID } from 'node:crypto'
import { sessions } from '../store.js'
import type { ApiError, Session, SessionSummary } from '../types.js'

export const sessionsRouter = Router()

// Hilfsfunktion: Schickt einen Fehler immer im gleichen Format { error }
function sendError(res: Response, status: number, message: string) {
  const body: ApiError = { error: message }
  res.status(status).json(body)
}

// Erzeugt eine kurze, eindeutige Session-ID (z. B. "a3f9c2d1")
function createSessionId(): string {
  let id: string
  do {
    id = randomUUID().slice(0, 8)
  } while (sessions.has(id))
  return id
}

// Todo 7: GET /sessions – Liste aller Sessions (nur ID und Teilnehmerzahl)
sessionsRouter.get('/', (_req, res) => {
  const list: SessionSummary[] = [...sessions.values()].map((session) => ({
    id: session.id,
    participantCount: session.participants.length,
  }))
  res.json(list)
})

// Todo 6: POST /sessions – Neue Session erstellen
sessionsRouter.post('/', (_req, res) => {
  const session: Session = {
    id: createSessionId(),
    deckType: 'fibonacci',
    participants: [],
    revealed: false,
    createdAt: Date.now(),
  }
  sessions.set(session.id, session)
  res.status(201).json(session)
})

// Todo 8: GET /sessions/:id – Eine Session abrufen
sessionsRouter.get('/:id', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) {
    sendError(res, 404, 'Session nicht gefunden')
    return
  }
  res.json(session)
})

// Todo 9: DELETE /sessions/:id – Session löschen (auch wenn noch Leute drin sind)
sessionsRouter.delete('/:id', (req, res) => {
  const deleted = sessions.delete(req.params.id)
  if (!deleted) {
    sendError(res, 404, 'Session nicht gefunden')
    return
  }
  res.status(204).end()
})