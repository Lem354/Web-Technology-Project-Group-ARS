import { useEffect, useState } from 'react'
import { request } from '../api/request.ts'

type Options = {
  // Optional: reload every pollMs milliseconds (polling).
  pollMs?: number
}

// Loads data with GET as soon as the component mounts (and when url changes).
// - isLoading is true only until the first response, so polling does not flicker.
// - On an error the last data stays, error holds the message.
// - Polling keeps running after an error, so the app recovers.
export function useQuery<T>(url: string, options: Options = {}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Every increment restarts the effect and loads immediately (see refetch).
  const [reloadCount, setReloadCount] = useState(0)
  const pollMs = options.pollMs

  useEffect(() => {
    // Old responses may still arrive after the cleanup. We ignore them.
    let ignore = false

    async function load() {
      const result = await request<T>('GET', url)
      if (ignore) {
        return
      }
      setIsLoading(false)
      setError(result.error)
      if (result.error !== null) {
        return
      }
      setData(result.data)
    }

    load()

    if (pollMs === undefined) {
      return () => {
        ignore = true
      }
    }
    const intervalId = setInterval(load, pollMs)
    return () => {
      ignore = true
      clearInterval(intervalId)
    }
  }, [url, pollMs, reloadCount])

  // Reload immediately, e.g. right after a change (vote, reveal).
  function refetch() {
    setReloadCount((count) => count + 1)
  }

  return { data, error, isLoading, refetch }
}
