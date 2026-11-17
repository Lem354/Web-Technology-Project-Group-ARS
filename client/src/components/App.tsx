import { Route, Routes } from 'react-router'
import { HomePage } from '../pages/HomePage.tsx'
import { SessionPage } from '../pages/SessionPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import './App.css'

export function App() {
  return (
    <main className="layout">
      <h1>Scrum Poker</h1>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sessions/:sessionId" element={<SessionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  )
}
