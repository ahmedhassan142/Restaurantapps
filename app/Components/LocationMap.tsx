// components/LocationMap.tsx
'use client'

import { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'

// Dynamically import react-leaflet to avoid SSR
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, L: any;

const LocationMap = () => {
  const [isClient, setIsClient] = useState(false)
  const [mapComponents, setMapComponents] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Dynamically import on client side only
    const loadMapComponents = async () => {
      const leaflet = await import('leaflet')
      L = leaflet.default || leaflet
      
      const reactLeaflet = await import('react-leaflet')
      MapContainer = reactLeaflet.MapContainer
      TileLayer = reactLeaflet.TileLayer
      Marker = reactLeaflet.Marker
      Popup = reactLeaflet.Popup

      // Fix for default icons in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        iconUrl: '/leaflet/images/marker-icon.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
      })

      setMapComponents({ MapContainer, TileLayer, Marker, Popup, L })
    }

    loadMapComponents()
  }, [])

  const restaurantPosition: [number, number] = [40.7128, -74.0060]

  // Show loading state while components load
  if (!isClient || !mapComponents) {
    return (
      <div className="space-y-6">
        <div className="w-full h-[400px] rounded-lg shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
        {/* Keep the contact info grid visible */}
        <ContactInfoGrid />
      </div>
    )
  }

  const { MapContainer: MapC, TileLayer: TileL, Marker: Mark, Popup: Pop } = mapComponents

  return (
    <div className="space-y-6">
      {/* OpenStreetMap Container */}
      <div className="w-full h-[400px] rounded-lg shadow-lg overflow-hidden">
        <MapC
          center={restaurantPosition}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* OpenStreetMap Tile Layer */}
          <TileL
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Restaurant Marker */}
          <Mark position={restaurantPosition}>
            <Pop>
              <div className="p-2">
                <h3 className="font-bold text-amber-700 mb-1">Gusto Restaurant</h3>
                <p className="text-gray-700 mb-1">123 Main Street</p>
                <p className="text-gray-700 mb-2">New York, NY 10001</p>
                <a 
                  href="https://maps.google.com/?q=123+Main+Street+New+York+NY" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Get Directions
                </a>
              </div>
            </Pop>
          </Mark>
        </MapC>
      </div>
      
      <ContactInfoGrid />
    </div>
  )
}

// Separate component for contact info grid
const ContactInfoGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Address</h3>
        <p className="text-gray-600">123 Main Street</p>
        <p className="text-gray-600">New York, NY 10001</p>
      </div>
      
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Phone</h3>
        <p className="text-gray-600">(555) 123-4567</p>
        <a href="tel:5551234567" className="text-amber-600 hover:text-amber-700">
          Call Now
        </a>
      </div>
      
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Hours</h3>
        <p className="text-gray-600">Mon-Thu: 11am-10pm</p>
        <p className="text-gray-600">Fri-Sat: 11am-11pm</p>
        <p className="text-gray-600">Sun: 12pm-9pm</p>
      </div>
    </div>
  )
}

export default LocationMap