# API-Übersicht

Der Server läuft auf `http://localhost:3000`. Alle Routen beginnen mit `/api`.
Das Frontend fetcht immer relativ, z. B. `fetch('/api/sessions')`. Der Vite-Dev-Server leitet
alle Requests auf `/api` an den Server weiter (Proxy in `client/vite.config.ts`).
Darum gibt es keine CORS-Probleme, und im Code steht nirgends eine feste Server-Adresse.

Alle Daten werden als JSON gesendet und empfangen.
Die Daten liegen nur im Arbeitsspeicher. Nach einem Neustart des Servers sind alle Sessions weg.

## Allgemeine Regeln

- Jede Route, die eine Session verändert, gibt die **komplette aktualisierte Session** zurück.
  So zeigt das Frontend den neuen Stand sofort an, ohne auf das nächste Polling zu warten.
- Fehler kommen immer im Format `{ "error": "Beschreibung" }` zurück (Type `ApiError`), auch bei
  unbekannten `/api`-Routen (404) und ungültigem JSON im Body (400).
- **Stimmen sind bis zum Aufdecken verdeckt.** Alle Session-Antworten laufen über
  `toSessionView` (Type `SessionView`): Solange `revealed` false ist, ist `vote` bei allen
  Teilnehmenden `null`, auch bei der eigenen Karte. `hasVoted` zeigt, wer schon abgestimmt hat.
  So kann niemand im Netzwerk-Tab des Browsers die Karten der anderen sehen.
  `lastSeen` braucht nur der Server und wird nicht mitgeschickt.
- Abgeleitete Werte wie Durchschnitt, «alle haben abgestimmt» und Einigkeit liefert der Server
  **nicht**. Das Frontend berechnet sie aus `participants` und `revealed` (Single Source of Truth).

## Statuscodes

| Code | Bedeutung   | Wann                                                                           |
| ---- | ----------- | ------------------------------------------------------------------------------ |
| 200  | OK          | Anfrage erfolgreich, Daten im Body                                             |
| 201  | Created     | Neue Session erstellt                                                          |
| 204  | No Content  | Erfolgreich gelöscht, kein Body                                                |
| 400  | Bad Request | Ungültige Eingabe (z. B. leerer Name, Karte nicht im Deck, kaputtes JSON)      |
| 404  | Not Found   | Session, Teilnehmer oder Route existiert nicht                                 |
| 409  | Conflict    | Aktion im aktuellen Zustand nicht erlaubt (z. B. abstimmen nach dem Aufdecken) |
| 500  | Error       | Unerwarteter Fehler im Server (wird im Server-Terminal ausgegeben)             |

## Routen

### Status

| Methode | Route         | Body | Antwort                    | Fehler |
| ------- | ------------- | ---- | -------------------------- | ------ |
| GET     | `/api/health` | –    | 200 `{ status, sessions }` | –      |

- **GET /api/health** zeigt, ob der Server läuft und wie viele Sessions gerade existieren.

### Sessions

| Methode | Route               | Body | Antwort                | Fehler |
| ------- | ------------------- | ---- | ---------------------- | ------ |
| GET     | `/api/sessions`     | –    | 200 `SessionSummary[]` | –      |
| POST    | `/api/sessions`     | –    | 201 `SessionView`          | –      |
| GET     | `/api/sessions/:id` | –    | 200 `SessionView`          | 404    |
| DELETE  | `/api/sessions/:id` | –    | 204                    | 404    |

- **GET /api/sessions** liefert für die Home-Seite nur ID und Teilnehmerzahl, nicht die ganze Session.
- **POST /api/sessions** erzeugt die ID auf dem Server. Neue Sessions starten mit dem Fibonacci-Deck.
- **DELETE /api/sessions/:id** funktioniert auch, wenn noch Leute in der Session sind.
  Deren nächstes Polling bekommt dann 404 und zeigt eine Fehlermeldung.

### Teilnehmende

| Methode | Route                                           | Body           | Antwort       | Fehler   |
| ------- | ----------------------------------------------- | -------------- | ------------- | -------- |
| POST    | `/api/sessions/:id/participants`                | `{ id, name }` | 200 `SessionView` | 400, 404 |
| DELETE  | `/api/sessions/:id/participants/:participantId` | –              | 204           | 404      |

- **POST** ist idempotent: Existiert die `id` schon, wird kein zweiter Eintrag erstellt,
  sondern nur der Name aktualisiert. Grund: React StrictMode führt den Beitritt im
  Dev-Modus doppelt aus. Die `id` erzeugt der Client.
- **DELETE** wird beim Leave-Button und im `useEffect`-Cleanup aufgerufen.

### Spielablauf

| Methode | Route                      | Body                      | Antwort       | Fehler        |
| ------- | -------------------------- | ------------------------- | ------------- | ------------- |
| PUT     | `/api/sessions/:id/vote`   | `{ participantId, card }` | 200 `SessionView` | 400, 404, 409 |
| PUT     | `/api/sessions/:id/deck`   | `{ deckType }`            | 200 `SessionView` | 400, 404      |
| POST    | `/api/sessions/:id/reveal` | –                         | 200 `SessionView` | 404           |
| POST    | `/api/sessions/:id/reset`  | –                         | 200 `SessionView` | 404           |

- **vote:** `card` muss im aktiven Deck vorkommen, sonst 400. Nach dem Aufdecken gibt es 409.
  Mit `card: null` kann man seine Stimme zurückziehen. Die Antwort zeigt beim Abstimmenden
  `hasVoted: true`, aber `vote: null`. Die eigene Karte merkt sich das Frontend selbst.
- **deck:** Wechselt das Deck für alle. Setzt alle Stimmen zurück und deckt die Karten zu,
  weil die alten Karten nicht ins neue Deck passen. Wird dasselbe Deck nochmals gewählt,
  ändert sich nichts (die Stimmen bleiben). Unbekanntes Deck → 400.
- **reveal:** Deckt alle Karten auf. Nochmals aufdecken ist kein Fehler (200), damit es
  nicht stört, wenn zwei Personen fast gleichzeitig klicken.
- **reset:** Setzt alle Stimmen auf `null` und `revealed` auf `false`. Das Deck bleibt.

## Noch offen

- **Karteileichen (Todo 17):** Wie inaktive Teilnehmende erkannt und entfernt werden,
  legen wir später fest. Vorbereitet ist das Feld `lastSeen` im Type `Participant` (nur auf dem Server).

## Types (Antworten)

| Type              | Felder                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| `SessionSummary`  | `id`, `participantCount`                                                 |
| `SessionView`     | `id`, `deckType`, `revealed`, `createdAt`, `participants: ParticipantView[]` |
| `ParticipantView` | `id`, `name`, `hasVoted`, `vote` (Karte oder `null`, bis zum Aufdecken immer `null`) |
| `ApiError`        | `error`                                                                  |

Die Types stehen in `server/src/types.ts` und identisch in `client/src/types/index.ts`.
