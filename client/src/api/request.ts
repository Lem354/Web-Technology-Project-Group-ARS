// One single place for all server requests.
// request() never throws. It always returns a result object:
//   success: { data: ..., error: null }
//   failure: { data: null, error: 'Message for the user' }

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type Result<T> = { data: T; error: null } | { data: null; error: string }

export async function request<T>(
  method: Method,
  url: string,
  body?: unknown,
): Promise<Result<T>> {
  const options: RequestInit = { method }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(url, options)
  } catch {
    // fetch only throws when no response arrives at all (e.g. no network).
    return { data: null, error: 'Server not reachable.' }
  }

  if (!response.ok) {
    const message = await readErrorMessage(response)
    return { data: null, error: message }
  }

  // 204 No Content: success, but without a body (e.g. DELETE).
  if (response.status === 204) {
    return { data: undefined as T, error: null }
  }

  const data = (await response.json()) as T
  return { data, error: null }
}

// Our server sends errors as { "error": "..." }.
// If the server is not running at all, the Vite proxy answers without a JSON body.
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Server not reachable (status ${response.status}).`
  try {
    const body: unknown = await response.json()
    const hasError =
      typeof body === 'object' && body !== null && 'error' in body
    if (hasError && typeof body.error === 'string') {
      return body.error
    }
    return fallback
  } catch {
    return fallback
  }
}
