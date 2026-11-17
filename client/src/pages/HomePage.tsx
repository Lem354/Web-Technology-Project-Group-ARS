import { useLocalStorage } from '../hooks/useLocalStorage.ts'

export function HomePage() {
  const [name, setName] = useLocalStorage('scrum-poker:name', '')

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
    </section>
  )
}
