import { Deck, DeckType } from './types.js'

// Alle verfügbaren Decks. Der Schlüssel ist der DeckType.
// Record<DeckType, Deck> sorgt dafür, dass für JEDEN DeckType ein Deck existiert
export const DECKS: Record<DeckType, Deck> = {
    fibonacci: { 
        type: 'fibonacci',
        label: 'Fibonacci',
        cards: ['0', '1', '2', '3', '5', '8', '13', '21', '?'],
    },
    tshirt: {
        type: 'tshirt',
        label: 'T-Shirt-Grössen',
    cards: ['XS', 'S', 'M', 'L', 'XL'],
  },
}