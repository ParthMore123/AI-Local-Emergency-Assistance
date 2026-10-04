import { createContext, useContext, useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'
import { DEFAULT_PALGHAR_LOCATION, PALGHAR_DISTRICT_CITIES, REGIONS_VIEW } from '../utils/cities'

const LocationContext = createContext(null)

const FALLBACK = DEFAULT_PALGHAR_LOCATION

async function reverseGeocode(lat, lng) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { Accept: 'application/json' }, signal: controller.signal }
    )
    clearTimeout(timer)
    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || addr.county || ''
      const city = addr.city || addr.town || addr.county || 'Palghar'
      const state = addr.state || 'Maharashtra'
      const label = [area, city, state].filter(Boolean).join(', ') || data.display_name || `${city}, ${state}`
      return { label, city, district: addr.state_district || addr.county || 'Palghar', state }
    }
  } catch {
    /* fallback to coordinate/default label */
  }
  return null
}

export function LocationProvider({ children }) {
  const { token } = useAuth()
  const [location, setLocation] = useState(FALLBACK)
  const [permission, setPermission] = useState('prompt')
  const [locating, setLocating] = useState(false)
  const [isLiveTracing, setIsLiveTracing] = useState(false)
  const [traceHistory, setTraceHistory] = useState([])
  const watchIdRef = useRef(null)

  async function selectCity(cityObj) {
    const next = {
      lat: cityObj.lat,
      lng: cityObj.lng,
      label: `${cityObj.name}, Maharashtra`,
      city: cityObj.city || cityObj.name,
      district: 'Palghar',
      state: 'Maharashtra',
      source: 'manual_selection',
    }
    setLocation(next)
    if (token) {
      try {
        await api.put('/auth/profile', { location: next })
      } catch {
        /* non-blocking */
      }
    }
    return next
  }

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
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const accuracy = Math.round(pos.coords.accuracy || 0)

          let geo = null
          try {
            geo = await reverseGeocode(lat, lng)
          } catch {
            /* ignore */
          }

          const next = {
            lat,
            lng,
            accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            label: geo?.label || `Live Traced GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            city: geo?.city || 'Palghar District',
            district: geo?.district || 'Palghar',
            state: geo?.state || 'Maharashtra',
            source: 'device_gps',
            updatedAt: Date.now(),
          }

          setLocation(next)
          setPermission('granted')
          setLocating(false)
          setTraceHistory((prev) => {
            const point = [lat, lng]
            if (prev.length > 0) {
              const last = prev[prev.length - 1]
              if (last[0] === lat && last[1] === lng) return prev
            }
            return [...prev.slice(-49), point]
          })

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

  function startLiveTracing() {
    if (!navigator.geolocation) {
      setPermission('unsupported')
      return false
    }

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    setIsLiveTracing(true)
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const accuracy = Math.round(pos.coords.accuracy || 0)

        setLocation((prev) => ({
          ...prev,
          lat,
          lng,
          accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          source: 'live_tracing',
          updatedAt: Date.now(),
        }))

        setTraceHistory((prev) => {
          const point = [lat, lng]
          if (prev.length > 0) {
            const last = prev[prev.length - 1]
            if (last[0] === lat && last[1] === lng) return prev
          }
          return [...prev.slice(-49), point]
        })
      },
      () => {
        setIsLiveTracing(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )

    watchIdRef.current = id
    return true
  }

  function stopLiveTracing() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsLiveTracing(false)
  }

  function toggleLiveTracing() {
    if (isLiveTracing) {
      stopLiveTracing()
    } else {
      startLiveTracing()
    }
  }

  function clearTraceHistory() {
    setTraceHistory([])
  }

  useEffect(() => {
    refreshLocation()
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <LocationContext.Provider
      value={{
        location,
        permission,
        locating,
        refreshLocation,
        setLocation,
        selectCity,
        isLiveTracing,
        traceHistory,
        startLiveTracing,
        stopLiveTracing,
        toggleLiveTracing,
        clearTraceHistory,
        palgharCities: PALGHAR_DISTRICT_CITIES,
        regions: REGIONS_VIEW,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationCtx() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocationCtx must be used within LocationProvider')
  return ctx
}
