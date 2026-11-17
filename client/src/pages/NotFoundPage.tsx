import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section>
      <h2>Seite nicht gefunden</h2>
      <p>Diese Seite gibt es leider nicht.</p>
      <Link to="/">Zurück zur Startseite</Link>
    </section>
  )
}
