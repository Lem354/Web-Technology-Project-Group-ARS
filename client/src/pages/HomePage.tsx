import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BASE_URL, createSession } from '../api/sessions.ts'
import { useLocalStorage } from '../hooks/useLocalStorage.ts'
import { useQuery } from '../hooks/useQuery.ts'
import type { SessionSummary } from '../types/index.ts'

export function HomePage() {
  const [name, setName] = useLocalStorage('scrum-poker:name', '')
  const sessions = useQuery<SessionSummary[]>(BASE_URL)
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreate() {
    setIsCreating(true)
    setCreateError(null)
    const result = await createSession()
    setIsCreating(false)
    if (result.error !== null) {
      setCreateError(result.error)
      return
    }
    navigate(`/sessions/${result.data.id}`)
  }

  return (
    <section>
      <h2>Startseite</h2>

      <label>
        Dein Name{' '}
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="z. B. Max"
        />
      </label>
      {name.trim() !== '' && <p>Hallo {name.trim()}!</p>}

      <p>
        <button type="button" onClick={handleCreate} disabled={isCreating}>
          {isCreating ? 'Erstelle …' : 'Neue Session erstellen'}
        </button>
      </p>
      {createError !== null && <p role="alert">{createError}</p>}

      <h3>Offene Sessions</h3>
      {sessions.isLoading && <p>Lade Sessions …</p>}
      {sessions.error !== null && <p role="alert">{sessions.error}</p>}
      {sessions.data !== null && sessions.data.length === 0 && (
        <p>Noch keine Sessions.</p>
      )}
      <ul>
        {sessions.data?.map((session) => (
          <li key={session.id}>
            <Link to={`/sessions/${session.id}`}>Session {session.id}</Link> (
            {session.participantCount} Personen)
          </li>
        ))}
      </ul>
    </section>
  )
}
