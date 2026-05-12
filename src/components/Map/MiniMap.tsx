'use client'

import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function CrosshairMap({ onLocationChange }: { onLocationChange: (pos: [number, number]) => void }) {
  useMapEvents({
    moveend(e) {
      const center = e.target.getCenter()
      onLocationChange([center.lat, center.lng])
    }
  })
  return null
}

interface MiniMapProps {
  latitude: number
  longitude: number
  onLocationChange: (pos: [number, number]) => void
}

export default function MiniMap({ latitude, longitude, onLocationChange }: MiniMapProps) {
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <CrosshairMap onLocationChange={onLocationChange} />
      </MapContainer>

      {/* Crosshair pin overlay — always centered over the map */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -100%)',
          zIndex: 1000,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
        }}
      >
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16 0C7.16 0 0 7.16 0 16C0 27.25 16 42 16 42C16 42 32 27.25 32 16C32 7.16 24.84 0 16 0Z"
            fill="#E8692A"
          />
          <circle cx="16" cy="16" r="6" fill="white" />
        </svg>
      </div>
    </div>
  )
}
