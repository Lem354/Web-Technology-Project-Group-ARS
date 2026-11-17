import { request } from './request.ts'
import type {
  Card,
  DeckType,
  SessionSummary,
  SessionView,
} from '../types/index.ts'

export const BASE_URL = '/api/sessions'

// URL einer Session, wird auch für useQuery (Polling) gebraucht
export function sessionUrl(sessionId: string) {
  return `${BASE_URL}/${encodeURIComponent(sessionId)}`
}

// GET /api/sessions → alle Sessions als Kurzform
export function listSessions() {
  return request<SessionSummary[]>('GET', BASE_URL)
}

// POST /api/sessions → neue Session
export function createSession() {
  return request<SessionView>('POST', BASE_URL)
}

// GET /api/sessions/:id → eine Session
export function getSession(sessionId: string) {
  return request<SessionView>('GET', sessionUrl(sessionId))
}

// DELETE /api/sessions/:id → 204 ohne Body
export function deleteSession(sessionId: string) {
  return request<void>('DELETE', sessionUrl(sessionId))
}

// POST /api/sessions/:id/participants → beitreten (ID kommt vom Client)
export function joinSession(
  sessionId: string,
  participantId: string,
  name: string,
) {
  return request<SessionView>('POST', `${sessionUrl(sessionId)}/participants`, {
    id: participantId,
    name,
  })
}

// DELETE /api/sessions/:id/participants/:participantId → verlassen
export function leaveSession(sessionId: string, participantId: string) {
  return request<void>(
    'DELETE',
    `${sessionUrl(sessionId)}/participants/${encodeURIComponent(participantId)}`,
  )
}

// PUT /api/sessions/:id/vote → Karte wählen (null = Stimme zurückziehen)
export function vote(
  sessionId: string,
  participantId: string,
  card: Card | null,
) {
  return request<SessionView>('PUT', `${sessionUrl(sessionId)}/vote`, {
    participantId,
    card,
  })
}

// PUT /api/sessions/:id/deck → Deck wechseln
export function changeDeck(sessionId: string, deckType: DeckType) {
  return request<SessionView>('PUT', `${sessionUrl(sessionId)}/deck`, {
    deckType,
  })
}

// POST /api/sessions/:id/reveal → Karten aufdecken
export function revealVotes(sessionId: string) {
  return request<SessionView>('POST', `${sessionUrl(sessionId)}/reveal`)
}

// POST /api/sessions/:id/reset → neue Runde
export function resetRound(sessionId: string) {
  return request<SessionView>('POST', `${sessionUrl(sessionId)}/reset`)
}
