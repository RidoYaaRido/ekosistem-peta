// src/app/(public)/map/page.tsx or src/app/page.tsx
'use client';

import { useState, useRef } from 'react';
import MapContainer from '@/components/map/MapContainer';
import FilterSidebar from '@/components/map/FilterSidebar';

export default function MapPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const mapContainerRef = useRef<any>(null);

  // Callback yang akan dipassing ke FilterSidebar
  // untuk trigger zoom di MapContainer
  const handleLocationClickFromSidebar = (location: any) => {
    // MapContainer akan handle zoom via internal state
    // Kita hanya perlu ensure selectedLocation ter-update
    console.log('📍 Location clicked from sidebar:', location.name);
  };

  return (
    <div className="relative w-full h-screen">
      {/* Filter Sidebar - with callback */}
      <FilterSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        onLocationClick={handleLocationClickFromSidebar}
      />
      
      {/* Map Container */}
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
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
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