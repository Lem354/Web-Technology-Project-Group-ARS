# API-Übersicht

Der Server läuft auf `http://localhost:3000`. Alle Daten werden als JSON gesendet und empfangen.
Die Daten liegen nur im Arbeitsspeicher. Nach einem Neustart des Servers sind alle Sessions weg.

## Allgemeine Regeln

- Jede Route, die eine Session verändert, gibt die **komplette aktualisierte Session** zurück.
  So zeigt das Frontend den neuen Stand sofort an, ohne auf das nächste Polling zu warten.
- Fehler kommen immer im Format `{ "error": "Beschreibung" }` zurück (Type `ApiError`).
- Abgeleitete Werte wie Durchschnitt, «alle haben abgestimmt» und Einigkeit liefert der Server
  **nicht**. Das Frontend berechnet sie aus `participants` und `revealed` (Single Source of Truth).

## Statuscodes

| Code | Bedeutung   | Wann                                                                           |
| ---- | ----------- | ------------------------------------------------------------------------------ |
| 200  | OK          | Anfrage erfolgreich, Daten im Body                                             |
| 201  | Created     | Neue Session erstellt                                                          |
| 204  | No Content  | Erfolgreich gelöscht, kein Body                                                |
| 400  | Bad Request | Ungültige Eingabe (z. B. leerer Name, Karte nicht im Deck)                     |
| 404  | Not Found   | Session oder Teilnehmer existiert nicht                                        |
| 409  | Conflict    | Aktion im aktuellen Zustand nicht erlaubt (z. B. abstimmen nach dem Aufdecken) |

## Routen

### Sessions

| Methode | Route           | Body | Antwort                | Fehler |
| ------- | --------------- | ---- | ---------------------- | ------ |
| GET     | `/sessions`     | –    | 200 `SessionSummary[]` | –      |
| POST    | `/sessions`     | –    | 201 `Session`          | –      |
| GET     | `/sessions/:id` | –    | 200 `Session`          | 404    |
| DELETE  | `/sessions/:id` | –    | 204                    | 404    |

- **GET /sessions** liefert für die Home-Seite nur ID und Teilnehmerzahl, nicht die ganze Session.
- **POST /sessions** erzeugt die ID auf dem Server. Neue Sessions starten mit dem Fibonacci-Deck.
- **DELETE /sessions/:id** funktioniert auch, wenn noch Leute in der Session sind.
  Deren nächstes Polling bekommt dann 404 und zeigt eine Fehlermeldung.

### Teilnehmende

| Methode | Route                                       | Body           | Antwort       | Fehler   |
| ------- | ------------------------------------------- | -------------- | ------------- | -------- |
| POST    | `/sessions/:id/participants`                | `{ id, name }` | 200 `Session` | 400, 404 |
| DELETE  | `/sessions/:id/participants/:participantId` | –              | 204           | 404      |

- **POST** ist idempotent: Existiert die `id` schon, wird kein zweiter Eintrag erstellt,
  sondern nur der Name aktualisiert. Grund: React StrictMode führt den Beitritt im
  Dev-Modus doppelt aus. Die `id` erzeugt der Client.
- **DELETE** wird beim Leave-Button und im `useEffect`-Cleanup aufgerufen.

### Spielablauf

| Methode | Route                  | Body                      | Antwort       | Fehler        |
| ------- | ---------------------- | ------------------------- | ------------- | ------------- |
| PUT     | `/sessions/:id/vote`   | `{ participantId, card }` | 200 `Session` | 400, 404, 409 |
| PUT     | `/sessions/:id/deck`   | `{ deckType }`            | 200 `Session` | 400, 404      |
| POST    | `/sessions/:id/reveal` | –                         | 200 `Session` | 404           |
| POST    | `/sessions/:id/reset`  | –                         | 200 `Session` | 404           |

- **vote:** `card` muss im aktiven Deck vorkommen, sonst 400. Nach dem Aufdecken gibt es 409.
  Mit `card: null` kann man seine Stimme zurückziehen.
- **deck:** Wechselt das Deck für alle. Setzt alle Stimmen zurück und deckt die Karten zu,
  weil die alten Karten nicht ins neue Deck passen.
- **reveal:** Deckt alle Karten auf.
- **reset:** Setzt alle Stimmen auf `null` und `revealed` auf `false`. Das Deck bleibt.

## Noch offen

- **Karteileichen (Todo 17):** Wie inaktive Teilnehmende erkannt und entfernt werden,
  legen wir später fest. Vorbereitet ist das Feld `lastSeen` im Type `Participant`.
