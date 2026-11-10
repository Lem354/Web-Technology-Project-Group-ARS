// Gemeinsame Types für Server und Client.
// WICHTIG: Diese Datei muss identisch sein mit client/src/types/index.ts

// Welche Decks es gibt
export type DeckType = 'fibonacci' | 'tshirt'

// Mögliche Karten pro Deck
export type FibonacciCard = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '21' | '?'
export type TShirtCard = 'XS' | 'S' | 'M' | 'L' | 'XL'
export type Card = FibonacciCard | TShirtCard

// Ein Deck mit Name und allen Karten
export interface Deck {
  type: DeckType
  label: string
  cards: Card[]
}

// Eine Person am Pokertisch
export interface Participant {
  id: string          // vom Client erzeugt (wegen StrictMode)
  name: string
  vote: Card | null   // null = hat noch nicht abgestimmt
  lastSeen: number    // Zeitstempel, brauchen wir später für die Karteileichen
}

// Der komplette Zustand einer Session
export interface Session {
  id: string
  deckType: DeckType
  participants: Participant[]
  revealed: boolean   // sind die Karten aufgedeckt?
  createdAt: number   // Zeitpunkt der Erstellung
}

// Kurzform für die Liste auf der Home-Seite
export interface SessionSummary {
  id: string
  participantCount: number
}

// Einheitliche Fehlerantwort vom Server
export interface ApiError {
  error: string
}