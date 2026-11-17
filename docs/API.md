# API-Übersicht

Backend: Dozenten-Vorlage `scrum-poker-hwz-server` (Express 5, TypeScript).
Der Server läuft unter `http://localhost:3000`. Das Frontend erreicht ihn über den Vite-Proxy, darum wird im Frontend immer relativ gefetcht (z. B. `/api/sessions`).

## Allgemeine Regeln

- Alle Pfade beginnen mit `/api`.
- Bodies werden als JSON geschickt (`Content-Type: application/json`).
- Fehler kommen immer als JSON im Format `{ "error": "..." }`.
- Die Session-ID und die Teilnehmer-ID erzeugt der Server (UUID), nicht der Client.
- Vor dem Aufdecken ist `vote` immer `null`, auch für die eigene Karte. `hasVoted` zeigt nur, ob jemand abgestimmt hat.
- Die Daten liegen nur im Arbeitsspeicher. Nach einem Neustart des Servers sind alle Sessions weg.

## Statuscodes

| Code | Bedeutung   | Wann                                                                      |
| ---- | ----------- | ------------------------------------------------------------------------- |
| 200  | OK          | Anfrage erfolgreich, Daten im Body                                        |
| 201  | Created     | Neue Session oder neuer Teilnehmer erstellt                               |
| 204  | No Content  | Erfolgreich gelöscht, kein Body                                           |
| 400  | Bad Request | Ungültige Eingabe (z. B. leerer Name, Karte nicht im Deck, kaputtes JSON) |
| 404  | Not Found   | Session, Teilnehmer oder Route existiert nicht                            |
| 409  | Conflict    | Aktion passt nicht zum Zustand (abstimmen nach dem Aufdecken)             |
| 500  | Error       | Unerwarteter Fehler im Server (wird im Server-Terminal ausgegeben)        |

## Routen

### Sessions

| Methode | Pfad                       | Body | Antwort                | Fehler                |
| ------- | -------------------------- | ---- | ---------------------- | --------------------- |
| GET     | `/api/sessions`            | –    | 200 `SessionSummary[]` | –                     |
| POST    | `/api/sessions`            | –    | 201 `SessionView`      | –                     |
| GET     | `/api/sessions/:sessionId` | –    | 200 `SessionView`      | 404 Session unbekannt |
| DELETE  | `/api/sessions/:sessionId` | –    | 204                    | 404 Session unbekannt |

- `GET /api/sessions` liefert die Liste für die Startseite (ID und Anzahl Teilnehmende).
- `GET /api/sessions/:sessionId` ruft das Frontend regelmässig ab (Polling).
- `DELETE` löscht die Session auch dann, wenn noch Teilnehmende drin sind.

### Teilnehmende

| Methode | Pfad                                                   | Body              | Antwort                                                            | Fehler                                                     |
| ------- | ------------------------------------------------------ | ----------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| POST    | `/api/sessions/:sessionId/participants`                | `{ "name": "…" }` | 201 `ParticipantView` (neu), 200 `ParticipantView` (Name schon da) | 400 Name fehlt, kein Text oder leer; 404 Session unbekannt |
| DELETE  | `/api/sessions/:sessionId/participants/:participantId` | –                 | 204                                                                | 404 Session oder Teilnehmer unbekannt                      |

- Beitreten ist idempotent: Wer mit demselben Namen nochmals beitritt (z. B. nach einem Reload), bekommt denselben Teilnehmer zurück (200) statt eines Duplikats.

### Spielablauf

| Methode | Pfad                                                        | Body                                      | Antwort               | Fehler                                                                               |
| ------- | ----------------------------------------------------------- | ----------------------------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| PUT     | `/api/sessions/:sessionId/participants/:participantId/vote` | `{ "vote": "5" }` oder `{ "vote": null }` | 200 `ParticipantView` | 400 Karte nicht im Deck; 404 Session oder Teilnehmer unbekannt; 409 schon aufgedeckt |
| PUT     | `/api/sessions/:sessionId/revealed`                         | `{ "revealed": true }` oder `false`       | 200 `SessionView`     | 400 kein Boolean; 404 Session unbekannt                                              |
| PUT     | `/api/sessions/:sessionId/deck`                             | `{ "deck": "tshirt" }`                    | 200 `SessionView`     | 400 Deck unbekannt; 404 Session unbekannt                                            |

- `vote: null` zieht die eigene Karte zurück.
- `revealed: true` deckt die Karten auf. `revealed: false` startet eine neue Runde: Alle Stimmen werden gelöscht.
- Ein Deck-Wechsel startet immer eine neue, verdeckte Runde, weil alte Stimmen nicht zum neuen Deck passen.
- Decks: `fibonacci` und `tshirt`.

## Types (Antworten)

| Type              | Felder                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `SessionSummary`  | `id`, `participantCount`                                                                    |
| `SessionView`     | `id`, `deck` (`'fibonacci'` oder `'tshirt'`), `revealed`, `participants: ParticipantView[]` |
| `ParticipantView` | `id`, `name`, `hasVoted`, `vote` (`string` oder `null`)                                     |
| `ErrorResponse`   | `error`                                                                                     |

Im Frontend stehen diese Types in `client/src/types/api.ts`.
