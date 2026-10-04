import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { Phone, Navigation, MapPin, ExternalLink, Layers, LocateFixed } from 'lucide-react'
import { SERVICE_META, formatDistance, mapsDirectionsUrl, googleMapsPlaceUrl, googleMapsHospitalsUrl, googleMapsTraceUrl, telHref } from '../utils/helpers'
import { useLocationCtx } from '../context/LocationContext'

const MAP_LAYERS = {
  googleRoadmap: {
    id: 'googleRoadmap',
    name: 'Google Maps',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  googleSatellite: {
    id: 'googleSatellite',
    name: 'Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite',
    maxZoom: 20,
  },
  googleTerrain: {
    id: 'googleTerrain',
    name: 'Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
    maxZoom: 20,
  },
  osm: {
    id: 'osm',
    name: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
}

function createServiceIcon(type, isSelected) {
  const meta = {
    hospital: { emoji: '🏥', bg: '#dc2626' },
    ambulance: { emoji: '🚑', bg: '#ea580c' },
    police: { emoji: '🚓', bg: '#2563eb' },
    fire: { emoji: '🚒', bg: '#e11d48' },
    pharmacy: { emoji: '💊', bg: '#059669' },
  }[type] || { emoji: '📍', bg: '#475569' }

  const size = isSelected ? 38 : 32
  return L.divIcon({
    className: 'custom-service-pin',
    html: `<div style="
      background: ${meta.bg};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    ">
      <span style="transform: rotate(45deg); font-size: ${isSelected ? '16px' : '14px'}; line-height: 1;">${meta.emoji}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

const userLocationIcon = L.divIcon({
  className: 'custom-user-pin',
  html: `<div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: pulse 2s infinite;"></div>
    <div style="width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

function MapRecenter({ center, zoom = 13 }) {
  const map = useMap()
  useEffect(() => {
    if (center?.lat && center?.lng) {
      map.setView([center.lat, center.lng], zoom, { animate: true })
    }
  }, [center?.lat, center?.lng, zoom, map])
  return null
}

export default function EmergencyMap({ center, services = [], selectedId, zoom = 13, traceHistory = [] }) {
  const locCtx = useLocationCtx()
  const [activeLayer, setActiveLayer] = useState('googleRoadmap')

  if (!center?.lat || !center?.lng) {
    return <div className="panel">Waiting for location in Maharashtra…</div>
  }

  const currentLayer = MAP_LAYERS[activeLayer] || MAP_LAYERS.googleRoadmap
  const points = traceHistory.length > 0 ? traceHistory : (locCtx?.traceHistory || [])
  const isTracing = locCtx?.isLiveTracing

  return (
    <div className="map-wrapper" style={{ position: 'relative' }}>
      {/* Top Map Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--line)',
          borderBottom: 'none',
          borderRadius: '14px 14px 0 0',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--charcoal)' }}>
            <Layers size={15} /> Layer:
          </span>
          {Object.values(MAP_LAYERS).map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              style={{
                border: 'none',
                background: activeLayer === layer.id ? '#2563eb' : '#f1f5f9',
                color: activeLayer === layer.id ? '#ffffff' : '#334155',
                padding: '3px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: activeLayer === layer.id ? 600 : 500,
                fontSize: '0.78rem',
              }}
            >
              {layer.name}
            </button>
          ))}
          {isTracing && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#dcfce7',
                color: '#15803d',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              <LocateFixed size={13} /> Live Tracing Active ({points.length} pts)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <a
            href={googleMapsTraceUrl(center.lat, center.lng)}
            target="_blank"
            rel="noopener noreferrer"
            title="Open your exact location pin in Google Maps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 9px',
              borderRadius: 6,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <MapPin size={13} color="#ea4335" /> Trace on Google Maps
            <ExternalLink size={11} />
          </a>
          <a
            href={googleMapsHospitalsUrl(center.city || 'Palghar', center.lat, center.lng, 'emergency hospitals')}
            target="_blank"
            rel="noopener noreferrer"
            title="Search verified nearby hospitals in Google Maps"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 9px',
              borderRadius: 6,
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            🏥 Search Hospitals in G-Maps
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <div
        className="map-wrap"
        role="region"
        aria-label="Google Maps Emergency Services Map"
        style={{ borderRadius: '0 0 14px 14px', borderTop: 'none' }}
      >
        <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom style={{ width: '100%', height: '100%' }}>
          <MapRecenter center={center} zoom={zoom} />
          <TileLayer attribution={currentLayer.attribution} url={currentLayer.url} maxZoom={currentLayer.maxZoom} />

          {/* User Live Traced Path */}
          {points.length > 1 && (
            <Polyline
              positions={points}
              pathOptions={{
                color: '#2563eb',
                weight: 4,
                opacity: 0.85,
                dashArray: '6, 6',
              }}
            />
          )}

          {/* User Location Accuracy Circle */}
          {center.accuracy && (
            <Circle
              center={[center.lat, center.lng]}
              radius={Math.min(center.accuracy, 1500)}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#60a5fa',
                fillOpacity: 0.15,
                weight: 1,
              }}
            />
          )}

          {/* User Current Location Marker */}
          <Marker position={[center.lat, center.lng]} icon={userLocationIcon}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 2 }}>📍 Your Traced Location</div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>{center.label || 'Current location'}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  Coords: {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
                  {center.accuracy ? ` · ±${center.accuracy}m` : ''}
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <a
                    href={googleMapsTraceUrl(center.lat, center.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}
                  >
                    Open in Google Maps &rarr;
                  </a>
                  <a
                    href={googleMapsHospitalsUrl(center.city, center.lat, center.lng, 'emergency hospitals')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}
                  >
                    Find nearby hospitals &rarr;
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Service & Hospital Markers */}
          {services.map((service) => {
            const [lng, lat] = service.location.coordinates
            const isSelected = selectedId === service._id
            const meta = SERVICE_META[service.type]
            return (
              <Marker
                key={service._id}
                position={[lat, lng]}
                icon={createServiceIcon(service.type, isSelected)}
                opacity={selectedId && selectedId !== service._id ? 0.6 : 1}
              >
                <Popup>
                  <div style={{ minWidth: 210 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: service.type === 'hospital' ? '#fee2e2' : '#e0f2fe',
                        color: service.type === 'hospital' ? '#b91c1c' : '#0369a1',
                        marginBottom: 4,
                      }}
                    >
                      {meta?.label || service.type}
                    </span>
                    <strong style={{ display: 'block', fontSize: '0.98rem', marginBottom: 2 }}>{service.name}</strong>
                    <div style={{ fontSize: '0.82rem', color: '#444', marginBottom: 4 }}>{service.address}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a', marginBottom: 6 }}>
                      {formatDistance(service.distanceKm)} away
                      {service.emergencyDept && ' · 24/7 ER Casualty'}
                    </div>

                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      {service.phone && (
                        <a
                          href={telHref(service.phone)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.78rem',
                            background: '#2563eb',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: 4,
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={11} /> Call {service.phone}
                        </a>
                      )}
                      <a
                        href={mapsDirectionsUrl(lat, lng, service.name, center.lat, center.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.78rem',
                          background: '#f1f5f9',
                          color: '#0f172a',
                          padding: '4px 8px',
                          borderRadius: 4,
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        <Navigation size={11} color="#ea4335" /> Directions
                      </a>
                      <a
                        href={googleMapsPlaceUrl(service.name, service.address, lat, lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.78rem',
                          background: '#f8fafc',
                          color: '#334155',
                          padding: '4px 8px',
                          borderRadius: 4,
                          textDecoration: 'none',
                        }}
                      >
                        <MapPin size={11} color="#ea4335" /> View in G-Maps
                      </a>
                    </div>
                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                      <Link to={`/services/${service._id}`} style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                        View facility details &rarr;
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

