import { Router } from 'express'
import type { Response } from 'express'
import { randomUUID } from 'node:crypto'
import { sessions } from '../store.js'
import { DECKS } from '../decks.js'
import type {
  ApiError,
  Card,
  DeckType,
  Participant,
  Session,
  SessionSummary,
} from '../types.js'

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

// Prüft, ob eine Karte zum Deck gehört.
// "card is Card" sagt TypeScript: Wenn true, ist card danach vom Typ Card.
function isCardInDeck(card: string, deckType: DeckType): card is Card {
  return DECKS[deckType].cards.some((c) => c === card)
}

// Prüft, ob ein Wert ein gültiger DeckType ist (z. B. 'fibonacci' oder 'tshirt').
// Object.hasOwn statt "in", damit z. B. 'toString' nicht als Deck durchgeht.
function isDeckType(value: unknown): value is DeckType {
  return typeof value === 'string' && Object.hasOwn(DECKS, value)
}

// Todo 7: GET /api/sessions – Liste aller Sessions (nur ID und Teilnehmerzahl)
sessionsRouter.get('/', (_req, res) => {
  const list: SessionSummary[] = [...sessions.values()].map((session) => ({
    id: session.id,
    participantCount: session.participants.length,
  }))
  res.json(list)
})

// Todo 6: POST /api/sessions – Neue Session erstellen
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

// Todo 8: GET /api/sessions/:id – Eine Session abrufen
sessionsRouter.get('/:id', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) {
    sendError(res, 404, 'Session nicht gefunden')
    return
  }
  res.json(session)
})

// Todo 9: DELETE /api/sessions/:id – Session löschen (auch wenn noch Leute drin sind)
sessionsRouter.delete('/:id', (req, res) => {
  const deleted = sessions.delete(req.params.id)
  if (!deleted) {
    sendError(res, 404, 'Session nicht gefunden')
    return
  }
  res.status(204).end()
})

// Todo 10: POST /api/sessions/:id/participants – Session beitreten
// Idempotent: Existiert die ID schon, wird kein zweiter Eintrag erstellt (wegen StrictMode)
sessionsRouter.post('/:id/participants', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) {
    sendError(res, 404, 'Session nicht gefunden')
    return
  }

  // Body auslesen. Wir wissen noch nicht, ob die Werte stimmen, deshalb "unknown"
  const { id, name } = (req.body ?? {}) as { id?: unknown; name?: unknown }

  if (typeof id !== 'string' || id.trim() === '') {
    sendError(res, 400, 'Teilnehmer-ID fehlt')
    return
  }
  if (typeof name !== 'string' || name.trim() === '') {
    sendError(res, 400, 'Name darf nicht leer sein')
    return
  }

  const existing = session.participants.find((p) => p.id === id)
  if (existing) {
    // Schon in der Session: nur Name und Zeitstempel aktualisieren
    existing.name = name.trim()
    existing.lastSeen = Date.now()
  } else {
    // Neu: Teilnehmer hinzufügen, noch ohne Stimme
    const participant: Participant = {
      id,
      name: name.trim(),
      vote: null,
      lastSeen: Date.now(),
    }
    session.participants.push(participant)
  }

  res.json(session)
})

// Todo 11: DELETE /api/sessions/:id/participants/:participantId – Session verlassen
sessionsRouter.delete('/:id/participants/:participantId', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) {
    sendError(res, 404, 'Session nicht gefunden')
    return
  }

  const countBefore = session.participants.length
  session.participants = session.participants.filter(
    (p) => p.id !== req.params.participantId,
  )

  if (session.participants.length === countBefore) {
    sendError(res, 404, 'Teilnehmer nicht gefunden')
    return
  }

  res.status(204).end()
})

// Todo 12: PUT /api/sessions/:id/vote – Karte wählen (oder mit null zurückziehen)
sessionsRouter.put('/:id/vote', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) {
    sendError(res, 404, 'Session nicht gefunden')
    return
  }

  const { participantId, card } = (req.body ?? {}) as {
    participantId?: unknown
    card?: unknown
  }

  if (typeof participantId !== 'string' || participantId.trim() === '') {
    sendError(res, 400, 'Teilnehmer-ID fehlt')
    return
  }

  // card muss null sein (Stimme zurückziehen) oder eine Karte aus dem aktiven Deck
  if (card !== null && (typeof card !== 'string' || !isCardInDeck(card, session.deckType))) {
    sendError(res, 400, 'Karte gehört nicht zum aktiven Deck')
    return
  }

  const participant = session.participants.find((p) => p.id === participantId)
  if (!participant) {
    sendError(res, 404, 'Teilnehmer nicht gefunden')
    return
  }

  if (session.revealed) {
    sendError(res, 409, 'Karten sind schon aufgedeckt. Zuerst eine neue Runde starten.')
    return
  }

  participant.vote = card
  participant.lastSeen = Date.now()
  res.json(session)
})

// Todo 13: PUT /api/sessions/:id/deck – Deck für alle wechseln
sessionsRouter.put('/:id/deck', (req, res) => {
  const session = sessions.get(req.params.id)
  if (!session) {
    sendError(res, 404, 'Session nicht gefunden')
    return
  }

  const { deckType } = (req.body ?? {}) as { deckType?: unknown }

  if (!isDeckType(deckType)) {
    sendError(res, 400, 'Unbekanntes Deck')
    return
  }

  // Gleiches Deck nochmals gewählt: nichts ändern, damit keine Stimmen verloren gehen
  if (session.deckType === deckType) {
    res.json(session)
    return
  }

  session.deckType = deckType

  // Alte Karten passen nicht ins neue Deck: alle Stimmen löschen und zudecken
  for (const participant of session.participants) {
    participant.vote = null
  }
  session.revealed = false

  res.json(session)
})