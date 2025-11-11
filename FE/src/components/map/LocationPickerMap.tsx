// LocationPickerMap.tsx - Component untuk pick location dari peta
import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'your-mapbox-token-here';

interface LocationData {
  coordinates: [number, number]; // [lng, lat]
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

interface LocationPickerMapProps {
  onLocationSelect: (data: LocationData) => void;
  initialCoordinates?: [number, number];
}

export default function LocationPickerMap({ 
  onLocationSelect, 
  initialCoordinates 
}: LocationPickerMapProps) {
  const [viewport, setViewport] = useState({
    longitude: initialCoordinates?.[0] || 106.8229,
    latitude: initialCoordinates?.[1] || -6.2088,
    zoom: 12
  });

  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    initialCoordinates || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [addressInfo, setAddressInfo] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Reverse Geocoding function
  const reverseGeocode = async (lng: number, lat: number) => {
    setIsLoading(true);
    setIsSuccess(false);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=id`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const contexts = feature.context || [];
        
        // Extract address components
        let street = feature.text || '';
        let city = '';
        let province = '';
        let postalCode = '';
        
        // Parse context untuk mendapatkan city, province, postal code
        contexts.forEach((ctx: any) => {
          if (ctx.id.includes('place')) {
            city = ctx.text;
          } else if (ctx.id.includes('region')) {
            province = ctx.text;
          } else if (ctx.id.includes('postcode')) {
            postalCode = ctx.text;
          }
        });

        // Jika street kosong, gunakan place name
        if (!street && feature.place_name) {
          street = feature.place_name.split(',')[0];
        }

        const locationData: LocationData = {
          coordinates: [lng, lat],
          address: {
            street: street || 'Jalan tidak diketahui',
            city: city || 'Kota tidak diketahui',
            province: province || 'Provinsi tidak diketahui',
            postalCode: postalCode || ''
          }
        };

        setAddressInfo(feature.place_name || 'Alamat tidak diketahui');
        setIsSuccess(true);
        onLocationSelect(locationData);
        
        // Auto-hide success indicator after 2s
        setTimeout(() => setIsSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddressInfo('Gagal mendapatkan alamat');
      
      // Fallback: tetap kirim koordinat meski alamat gagal
      onLocationSelect({
        coordinates: [lng, lat],
        address: {
          street: '',
          city: '',
          province: '',
          postalCode: ''
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle map click
  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    setMarkerPosition([lng, lat]);
    reverseGeocode(lng, lat);
  }, []);

  // Get user's current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setViewport(prev => ({
            ...prev,
            longitude,
            latitude,
            zoom: 15
          }));
          setMarkerPosition([longitude, latitude]);
          reverseGeocode(longitude, latitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLoading(false);
          alert('Gagal mendapatkan lokasi Anda');
        }
      );
    } else {
      alert('Browser tidak mendukung geolokasi');
    }
  };

  return (
    <div className="space-y-3">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Cara menggunakan:</strong> Klik di peta untuk memilih lokasi. 
          Koordinat dan alamat akan otomatis terisi.
        </p>
      </div>

      {/* Get Current Location Button */}
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengambil lokasi...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4" />
            Gunakan Lokasi Saya Saat Ini
          </>
        )}
      </button>

      {/* Map Container */}
      <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
        <Map
          {...viewport}
          onMove={(evt) => setViewport(evt.viewState)}
          onClick={handleMapClick}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '400px' }}
          cursor="crosshair"
        >
          {/* Controls */}
          <NavigationControl position="top-right" />
          <GeolocateControl
            position="top-right"
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation
            onGeolocate={(pos) => {
              const { longitude, latitude } = pos.coords;
              setMarkerPosition([longitude, latitude]);
              reverseGeocode(longitude, latitude);
            }}
          />

          {/* Marker */}
          {markerPosition && (
            <Marker longitude={markerPosition[0]} latitude={markerPosition[1]} anchor="bottom">
              <div className="relative">
                <div className="w-10 h-10 bg-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
            </Marker>
          )}
        </Map>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              <span className="text-sm font-medium text-gray-700">Mencari alamat...</span>
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {isSuccess && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10 animate-pulse">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Lokasi berhasil dipilih!</span>
          </div>
        )}
      </div>

      {/* Address Info Display */}
      {addressInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-600 mb-1">Alamat yang dipilih:</p>
          <p className="text-sm text-gray-900 font-medium">{addressInfo}</p>
          {markerPosition && (
            <p className="text-xs text-gray-500 mt-2">
              Koordinat: {markerPosition[1].toFixed(6)}, {markerPosition[0].toFixed(6)}
            </p>
          )}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center">
        Tip: Zoom in untuk hasil yang lebih akurat. Anda dapat menggeser peta dan klik ulang untuk memilih lokasi lain.
      </p>
    </div>
  );
}