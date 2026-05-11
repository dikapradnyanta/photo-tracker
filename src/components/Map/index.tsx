'use client'

import dynamic from 'next/dynamic'

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-64px)] w-full bg-sand animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-display font-bold text-xl">Loading Map...</p>
      </div>
    </div>
  )
})

export default Map
