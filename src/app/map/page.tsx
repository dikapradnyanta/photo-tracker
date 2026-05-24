import Navbar from '@/components/Navbar'
import Map from '@/components/Map'

export default function MapPage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 relative">
        <Map />
      </div>
    </main>
  )
}
