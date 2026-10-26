// In-Memory-Speicher: Alle Daten liegen im Arbeitsspeicher.
// Beim Neustart des Servers sind sie weg.
export const sessions = new Map<string, unknown>()