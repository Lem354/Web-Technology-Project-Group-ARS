import { useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored === null ? initialValue : (JSON.parse(stored) as T)
    } catch {
      return initialValue
    }
  })

  function setStoredValue(newValue: T) {
    setValue(newValue)
    try {
      localStorage.setItem(key, JSON.stringify(newValue))
    } catch {
      // localStorage nicht verfügbar (z. B. privater Modus): Wert bleibt nur im State
    }
  }

  return [value, setStoredValue] as const
}
