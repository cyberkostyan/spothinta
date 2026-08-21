"use client"

import { useCallback, useState, useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

// Reads a persistent "dismissed" flag from localStorage without effects.
// The server snapshot reports "dismissed" so nothing flashes during SSR/hydration.
export function useDismissedFlag(storageKey: string) {
  const storedDismissed = useSyncExternalStore(
    emptySubscribe,
    () => localStorage.getItem(storageKey) !== null,
    () => true
  )
  const [justDismissed, setJustDismissed] = useState(false)

  const dismiss = useCallback(() => {
    localStorage.setItem(storageKey, "true")
    setJustDismissed(true)
  }, [storageKey])

  return { dismissed: storedDismissed || justDismissed, dismiss }
}
