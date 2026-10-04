export const SERVICE_META = {
  hospital: { label: 'Hospital', color: 'var(--cat-hospital)', tone: 'hospital' },
  ambulance: { label: 'Ambulance', color: 'var(--cat-ambulance)', tone: 'ambulance' },
  police: { label: 'Police', color: 'var(--cat-police)', tone: 'police' },
  fire: { label: 'Fire', color: 'var(--cat-fire)', tone: 'fire' },
  pharmacy: { label: 'Pharmacy', color: 'var(--cat-pharmacy)', tone: 'pharmacy' },
}

export const STATUS_LABELS = {
  request_sent: 'Request Sent',
  service_notified: 'Service Notified',
  en_route: 'En Route',
  arriving_soon: 'Arriving Soon',
  help_arrived: 'Help Arrived',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function formatDistance(km) {
  if (km == null) return '—'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function mapsDirectionsUrl(lat, lng, destinationName = '', originLat = null, originLng = null) {
  const originParam = (originLat != null && originLng != null) ? `&origin=${originLat},${originLng}` : ''
  if (destinationName) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationName)}&travelmode=driving${originParam}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving${originParam}`
}

export function googleMapsPlaceUrl(name, address, lat, lng) {
  const query = [name, address].filter(Boolean).join(', ')
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function googleMapsTraceUrl(lat, lng, label = '') {
  if (lat == null || lng == null) return 'https://www.google.com/maps'
  if (label) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label + ' ' + lat + ',' + lng)}`
  }
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function googleMapsHospitalsUrl(city = 'Palghar', lat = null, lng = null, queryTerm = 'emergency hospitals') {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/${encodeURIComponent(queryTerm)}/@${lat},${lng},14z`
  }
  const query = `${queryTerm} in ${city}, Palghar district, Maharashtra`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function telHref(phone) {
  return `tel:${String(phone).replace(/\s+/g, '')}`
}
