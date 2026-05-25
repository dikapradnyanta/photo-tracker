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

const createCustomIcon = (url: string, spotData: SpotWithPhoto) => {
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative w-12 h-12 rounded-lg border-2 border-[#E8692A] overflow-hidden shadow-lg transform transition-transform hover:scale-110">
        <img src="${url}" class="w-full h-full object-cover" />
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48]
  })
    ; (icon.options as any).spotData = spotData;
  return icon
}

const createClusterCustomIcon = function (cluster: any) {
  const childMarkers = cluster.getAllChildMarkers();
  let firstSpotData = null;

  if (childMarkers.length > 0 && childMarkers[0].options.icon) {
    firstSpotData = childMarkers[0].options.icon.options.spotData;
  }

  const coverUrl = firstSpotData?.hero_photo_url || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=150&q=80';
  const count = childMarkers.length;

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div class="relative w-16 h-16 rounded-2xl border-4 border-background shadow-2xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-amber-primary/30 group">
        <img src="${coverUrl}" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors"></div>
        <div class="absolute top-1 right-1 bg-amber-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
          ${count}
        </div>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 64]
  });
}

interface MainMapProps {
  spots: SpotWithPhoto[]
  onBoundsChange: (bounds: any) => void
  onSpotClick: (spot: SpotWithPhoto) => void
  onClusterClick: (spots: SpotWithPhoto[]) => void
}

export default function MainMap({ spots, onBoundsChange, onSpotClick, onClusterClick }: MainMapProps) {
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

      <MarkerClusterGroup
        iconCreateFunction={createClusterCustomIcon}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={false}
        onClick={(e: any) => {
          if (e.layer && e.layer.getAllChildMarkers) {
            const markers = e.layer.getAllChildMarkers();
            const clusterSpots = markers
              .map((m: any) => m.options.icon?.options?.spotData)
              .filter(Boolean);
            onClusterClick(clusterSpots);
          }
        }}
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.latitude, spot.longitude]}
            icon={createCustomIcon(spot.hero_photo_url || 'https://via.placeholder.com/150', spot)}
            eventHandlers={{
              click: () => onSpotClick(spot)
            }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
