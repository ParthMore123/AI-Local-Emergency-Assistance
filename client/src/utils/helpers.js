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

export function mapsDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export function telHref(phone) {
  return `tel:${String(phone).replace(/\s+/g, '')}`
}
