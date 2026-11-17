import { useParams } from 'react-router'

export function SessionPage() {
  const { sessionId } = useParams()

  return (
    <section>
      <h2>Session {sessionId}</h2>
    </section>
  )
}
