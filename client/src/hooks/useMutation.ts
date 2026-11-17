import { useState } from 'react'
import { request } from '../api/request.ts'
import type { Method } from '../api/request.ts'

// For changes on click: POST, PUT, DELETE.
// The URL is passed when sending, so one hook covers many entries
// (e.g. deleting any session in the list).
//
//   const join = useMutation<ParticipantView>('POST')
//   const result = await join.send(`/api/sessions/${id}/participants`, { name })
//   if (result.error !== null) { return }
//   result.data.id  // data is guaranteed here
export function useMutation<T = void>(method: Method) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(url: string, body?: unknown) {
    setIsLoading(true)
    setError(null)
    const result = await request<T>(method, url, body)
    setIsLoading(false)
    setError(result.error)
    return result
  }

  return { send, isLoading, error }
}
