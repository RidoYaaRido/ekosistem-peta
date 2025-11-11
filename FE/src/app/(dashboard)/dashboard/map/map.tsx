// src/app/(public)/map/page.tsx or src/app/page.tsx
'use client';

// STEP 1: Impor 'useCallback' dan 'MapRef'
import { useState, useRef, useCallback } from 'react';
import { MapRef } from 'react-map-gl'; // <-- Impor tipe ref dari react-map-gl

import MapContainer from '@/components/map/MapContainer';
import FilterSidebar from '@/components/map/FilterSidebar';
import { Location } from '@/types'; // <-- Impor tipe Location global

export default function MapPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // STEP 2: Beri tipe yang benar pada 'ref'
  const mapContainerRef = useRef<MapRef>(null);

  // STEP 3: Perbaiki fungsi handleLocationClick
  // 'useCallback' digunakan untuk optimasi
  const handleLocationClickFromSidebar = useCallback((location: Location) => {
    console.log('📍 Location clicked from sidebar:', location.name);
    
    // Gunakan 'ref' untuk memerintahkan peta agar 'flyTo'
    if (mapContainerRef.current && location.latitude && location.longitude) {
      mapContainerRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16, // Zoom lebih dekat
        duration: 2000, // Durasi animasi
        essential: true
      });
    }
  }, []); // Dependency array kosong, fungsi ini dibuat sekali

  return (
    <div className="relative w-full h-screen">
      {/* Filter Sidebar - sekarang dengan fungsi yg benar */}
      <FilterSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        // Pastikan 'onLocationClick' di FilterSidebar menerima tipe 'Location'
        onLocationClick={handleLocationClickFromSidebar}
      />

      {/* Map Container - Menerima 'ref' */}
      <MapContainer ref={mapContainerRef} />

      {/* Legend/Info Panel (Optional) */}
      <div className="hidden lg:block fixed bottom-6 right-6 bg-white p-4 rounded-lg shadow-lg z-[900] max-w-xs">
        <h3 className="font-bold text-sm text-gray-800 mb-3">Legenda</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600"></div>
            <span className="text-gray-700">Bank Sampah</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
            <span className="text-gray-700">Jasa Angkut</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-600"></div>
            <span className="text-gray-700">Bank Sampah & Jasa Angkut</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Ganti bg-blue-500 ke bg-red-500 agar konsisten dengan MapContainer */}
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-gray-700">Lokasi Anda</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <strong>Tips:</strong> Klik marker atau item di sidebar untuk melihat detail lokasi
          </p>
        </div>
      </div>
    </div>
  );
}
