import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const LocationContext = createContext(null)

const FALLBACK = { lat: 12.9716, lng: 77.5946, label: 'Bengaluru (demo fallback)', source: 'fallback' }

export function LocationProvider({ children }) {
  const { token } = useAuth()
  const [location, setLocation] = useState(FALLBACK)
  const [permission, setPermission] = useState('prompt')
  const [locating, setLocating] = useState(false)

  async function refreshLocation() {
    if (!navigator.geolocation) {
      setPermission('unsupported')
      setLocation(FALLBACK)
      return FALLBACK
    }

    setLocating(true)
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: 'Current location',
            source: 'device',
          }
          setLocation(next)
          setPermission('granted')
          setLocating(false)
          if (token) {
            try {
              await api.put('/auth/profile', { location: next })
            } catch {
              /* non-blocking */
            }
          }
          resolve(next)
        },
        () => {
          setPermission('denied')
          setLocation(FALLBACK)
          setLocating(false)
          resolve(FALLBACK)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  useEffect(() => {
    refreshLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <LocationContext.Provider value={{ location, permission, locating, refreshLocation, setLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationCtx() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocationCtx must be used within LocationProvider')
  return ctx
}
