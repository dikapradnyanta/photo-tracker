'use client'

import { MapContainer, TileLayer, Marker, ZoomControl, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { SpotWithPhoto } from '@/types/database'

// Dynamic import for clustering
const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), { ssr: false })


function MapUpdater({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
  const map = useMapEvents({
    moveend() {
      onBoundsChange(map.getBounds())
    },
    zoomend() {
      onBoundsChange(map.getBounds())
    }
  })
  
  useEffect(() => {
    onBoundsChange(map.getBounds())
  }, []) // eslint-disable-line

  return null
}

const createCustomIcon = (url: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative w-12 h-12 rounded-lg border-2 border-[#E8692A] overflow-hidden shadow-lg transform transition-transform hover:scale-110">
        <img src="${url}" class="w-full h-full object-cover" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48]
  })
}

interface MainMapProps {
  spots: SpotWithPhoto[]
  onBoundsChange: (bounds: any) => void
  onSpotClick: (spot: SpotWithPhoto) => void
}

export default function MainMap({ spots, onBoundsChange, onSpotClick }: MainMapProps) {
  return (
    <MapContainer 
      center={[-8.4095, 115.1889]} 
      zoom={10} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <MapUpdater onBoundsChange={onBoundsChange} />
      
      <MarkerClusterGroup>
        {spots.map((spot) => (
          <Marker 
            key={spot.id} 
            position={[spot.latitude, spot.longitude]}
            icon={createCustomIcon(spot.hero_photo_url || 'https://via.placeholder.com/150')}
            eventHandlers={{
              click: () => onSpotClick(spot)
            }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
