"use client"

import { useState, useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "userLocation"
const DEFAULT_LAT = 60.17
const DEFAULT_LON = 24.94

interface LocationData {
  lat: number
  lon: number
}

interface UseGeolocationResult {
  lat: number
  lon: number
  isDefault: boolean
  loading: boolean
  error: string | null
  permissionDenied: boolean
  cityName: string | null
  requestLocation: () => void
}

interface SavedLocation extends LocationData {
  cityName?: string
}

const emptySubscribe = () => () => {}

// The snapshot must return a stable reference between renders, so the parsed
// value is cached keyed by the raw localStorage string.
let savedLocationRaw: string | null | undefined
let savedLocationCache: SavedLocation | null = null

function getSavedLocationSnapshot(): SavedLocation | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = null
  }
  if (raw !== savedLocationRaw) {
    savedLocationRaw = raw
    savedLocationCache = null
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
          savedLocationCache = { lat: parsed.lat, lon: parsed.lon, cityName: parsed.cityName }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  return savedLocationCache
}

const getServerLocationSnapshot = () => null

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { "Accept-Language": "en" } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.municipality || null
  } catch {
    return null
  }
}

export function useGeolocation(): UseGeolocationResult {
  const saved = useSyncExternalStore(emptySubscribe, getSavedLocationSnapshot, getServerLocationSnapshot)
  const [requested, setRequested] = useState<SavedLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const location = requested ?? saved

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported")
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: Math.round(position.coords.latitude * 100) / 100,
          lon: Math.round(position.coords.longitude * 100) / 100,
        }
        setRequested(coords)
        setLoading(false)

        const city = await reverseGeocode(coords.lat, coords.lon)
        if (city) setRequested({ ...coords, cityName: city })

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...coords, cityName: city }))
        } catch {
          // Ignore storage errors
        }
      },
      (err) => {
        setError(err.message)
        setPermissionDenied(err.code === GeolocationPositionError.PERMISSION_DENIED)
        setLoading(false)
        // Keep Helsinki defaults
      },
      { timeout: 10000, maximumAge: 600000 }
    )
  }, [])

  return {
    lat: location?.lat ?? DEFAULT_LAT,
    lon: location?.lon ?? DEFAULT_LON,
    isDefault: location === null,
    loading,
    error,
    permissionDenied,
    cityName: location?.cityName ?? null,
    requestLocation,
  }
}
