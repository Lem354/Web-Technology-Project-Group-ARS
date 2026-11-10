export type DeckType = 'fibonacci' | 'tshirt' 

export type FibonacciCard = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '21' 
export type TShirtCard = 'XS' | 'S' | 'M' | 'L' | 'XL'
export type Card = FibonacciCard | TShirtCard

export interface Deck {
    type: DeckType
    label: string
    cards: Card[]
}

export interface Participant {
    id: string 
    name: string
    vote: Card | null
    lastSeen: number 
}

export interface Session {
    id: string 
    deckType: DeckType
    participants: Participant []
    revealed: boolean
    createAt: Number
}

export interface SessionSummary {
    id: string
  participantCount: number
}

export interface ApiError {
  error: string
}
