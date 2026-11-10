import type { Session } from './types.js'

// In-Memory-Speicher: Schlüssel = Session-ID, Wert = Session
// Beim Neustart des Servers sind alle Daten weg 
export const sessions = new Map<string, Session>()