// src/components/map/MapContainer.tsx - UPDATED with Custom Icons
'use client';

import { useEffect, useState, useCallback, useRef, forwardRef } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ViewStateChangeEvent,
  MapRef
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import {
  Recycle,        // Icon untuk Bank Sampah
  Truck,          // Icon untuk Jasa Angkut
  MapPin,
  Phone,
  Clock,
  Star,
  Calendar,
  Navigation,
  Info,
  X,
  Mail,
  Globe,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import PickupRequestForm from '@/components/pickup/PickupRequestForm';
import ReviewForm from '@/components/review/ReviewForm';

interface Location {
  id: string;
  name: string;
  type: 'bank_sampah' | 'jasa_angkut' | 'both';
  street: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  operating_hours?: any;
  rating?: number;
  total_reviews?: number;
  distance_km?: number;
  pickup_service?: boolean;
  dropoff_service?: boolean;
  description?: string;
  verified?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const MapContainer = forwardRef<MapRef>((props, ref) => {
  const router = useRouter();
  const { locations, userLocation, setUserLocation, fetchLocations } = useLocationStore();
  const { user, isAuthenticated } = useAuthStore();

  const [viewport, setViewport] = useState({
    longitude: 106.981563,
    latitude: -6.273813,
    zoom: 12,
    pitch: 0,
    bearing: 0
  });

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewport(evt.viewState);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(userCoords);
          setViewport(prev => ({
            ...prev,
            latitude: userCoords[0],
            longitude: userCoords[1],
            zoom: 13
          }));
          fetchLocations(userCoords[0], userCoords[1]);
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          toast.error('Gagal mendapatkan lokasi Anda.');
          fetchLocations();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      toast.error('Browser tidak mendukung geolocation.');
      fetchLocations();
    }
  }, [setUserLocation, fetchLocations]);

  const handleLocationClick = useCallback((location: Location) => {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      console.warn('Invalid location data for zoom');
      return;
    }

    setSelectedLocation(location);

    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16,
        duration: 2000,
        essential: true
      });
    } else {
      setViewport(prev => ({
        ...prev,
        longitude: location.longitude,
        latitude: location.latitude,
        zoom: 16,
      }));
    }
  }, [ref]);

  // CUSTOM MARKER COMPONENT dengan Icon yang Berbeda
  const CustomMarker = ({ location }: { location: Location }) => {
    const { longitude, latitude } = location;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.warn(`Invalid coordinates for location: ${location.name || location.id}`);
      return null;
    }

    // Tentukan warna dan icon berdasarkan tipe
    let markerColor = '#16a34a'; // green untuk bank_sampah
    let IconComponent = Recycle;   // Recycle icon untuk bank sampah

    if (location.type === 'jasa_angkut') {
      markerColor = '#2563eb'; // blue
      IconComponent = Truck;    // Truck icon untuk jasa angkut
    } else if (location.type === 'both') {
      markerColor = '#8b5cf6'; // purple
      IconComponent = MapPin;   // Icon gabungan (bisa custom SVG)
    }

    const isSelected = selectedLocation?.id === location.id;

    return (
      <Marker
        longitude={longitude}
        latitude={latitude}
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          handleLocationClick(location);
        }}
        anchor="bottom"
      >
        <div
          className={`relative transition-all duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'
            }`}
        >
          {/* IMPROVED MARKER DESIGN */}
          <div
            className="relative flex items-center justify-center cursor-pointer"
            style={{ filter: isSelected ? `drop-shadow(0 0 10px ${markerColor})` : undefined }}
            title={location.name}
          >
            {/* Background Circle */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: markerColor }}
            >
              <IconComponent className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>

            {/* Pin Pointer */}
            <div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `12px solid ${markerColor}`,
              }}
            />

            {/* Verified Badge */}
            {location.verified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Selection Ring */}
            {isSelected && (
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  backgroundColor: markerColor,
                  opacity: 0.4
                }}
              />
            )}
          </div>
        </div>
      </Marker>
    );
  };

  const getNavigationUrl = (destination: Location) => {
    const destLat = destination.latitude;
    const destLng = destination.longitude;

    if (userLocation) {
      const originLat = userLocation[0];
      const originLng = userLocation[1];
      return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
  };

  const handleViewDetail = () => {
    setShowDetailModal(true);
  };

  const handlePickupRequest = (location: Location) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      router.push('/login');
      return;
    }

    if (user?.role !== 'public') {
      toast.error('Hanya pengguna publik yang dapat melakukan request penjemputan');
      return;
    }

    if (!location.pickup_service) {
      toast.error('Lokasi ini tidak menyediakan layanan penjemputan');
      return;
    }

    setShowDetailModal(false);
    setShowPickupForm(true);
  };

  const handleReviewRequest = (location: Location) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      router.push('/login');
      return;
    }
    if (user?.role !== 'public') {
      toast.error('Hanya pengguna publik yang dapat memberikan ulasan');
      return;
    }
    setShowReviewForm(true);
  };

  const LocationDetailModal = ({ location }: { location: Location }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[1001] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{location.name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur rounded-full text-xs font-medium capitalize">
                    {location.type.replace('_', ' ')}
                  </span>
                  {location.verified && (
                    <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Terverifikasi
                    </span>
                  )}
                  {location.pickup_service && (
                    <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur rounded-full text-xs font-medium">
                      🚚 Penjemputan
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {location.rating && location.rating > 0 && (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {location.rating.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {location.total_reviews} ulasan
                    </div>
                  </div>
                </div>
              </div>
            )}

            {location.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5 text-green-600" />
                  Deskripsi
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">{location.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Alamat
              </h3>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-gray-700 mb-2">
                  {location.street && `${location.street}, `}
                  {location.city}
                </p>
                {location.distance_km != null && (
                  <div className="flex items-center gap-1 text-green-700 font-semibold">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm">{location.distance_km.toFixed(2)} km dari Anda</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {location.phone && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Telepon</p>
                    <a
                      href={`tel:${location.phone}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {location.phone}
                    </a>
                  </div>
                </div>
              )}

              {location.email && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <a
                      href={`mailto:${location.email}`}
                      className="text-sm font-medium text-purple-600 hover:underline truncate block"
                    >
                      {location.email}
                    </a>
                  </div>
                </div>
              )}

              {location.website && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200 md:col-span-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs text-gray-600">Website</p>
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-indigo-600 hover:underline truncate block"
                    >
                      {location.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {location.operating_hours?.monday && !location.operating_hours.monday.isClosed && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Jam Operasional
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm">
                    <span className="font-semibold">Senin - Jumat:</span> {location.operating_hours.monday.open} - {location.operating_hours.monday.close}
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Layanan Tersedia</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-lg border-2 text-center ${location.pickup_service
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                  }`}>
                  <Calendar className={`w-6 h-6 mx-auto mb-2 ${location.pickup_service ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  <p className={`text-sm font-semibold ${location.pickup_service ? 'text-green-900' : 'text-gray-500'
                    }`}>
                    Penjemputan
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {location.pickup_service ? 'Tersedia' : 'Tidak Tersedia'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border-2 text-center ${location.dropoff_service
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                  }`}>
                  <MapPin className={`w-6 h-6 mx-auto mb-2 ${location.dropoff_service ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  <p className={`text-sm font-semibold ${location.dropoff_service ? 'text-blue-900' : 'text-gray-500'
                    }`}>
                    Drop-off
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {location.dropoff_service ? 'Tersedia' : 'Tidak Tersedia'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <a
                href={getNavigationUrl(location)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-md hover:shadow-lg"
              >
                <Navigation className="w-5 h-5" />
                Navigasi ke Lokasi
              </a>

              {location.pickup_service && (
                <button
                  onClick={() => handlePickupRequest(location)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition shadow-md hover:shadow-lg"
                >
                  <Calendar className="w-5 h-5" />
                  Request Penjemputan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-5rem)]">
      {!MAPBOX_TOKEN ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
          <p className="text-red-600 font-semibold text-center p-4">
            Error: Mapbox Access Token missing!
          </p>
        </div>
      ) : (
        <Map
          ref={ref}
          {...viewport}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={handleMove}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <FullscreenControl position="top-right" />
          <GeolocateControl
            position="top-right"
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation={true}
            showUserHeading
            onGeolocate={(pos) => {
              const userCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
              setUserLocation(userCoords);
              setViewport(prev => ({
                ...prev,
                latitude: userCoords[0],
                longitude: userCoords[1],
                zoom: 14
              }));
              fetchLocations(userCoords[0], userCoords[1]);
            }}
          />

          {userLocation && (
            <Marker longitude={userLocation[1]} latitude={userLocation[0]} anchor="center">
              <div className="relative">
                <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg z-10"></div>
                <div className="absolute inset-0 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-ping opacity-75"></div>
              </div>
            </Marker>
          )}

          {locations.map((loc) => (
            <CustomMarker key={loc.id} location={loc} />
          ))}

          {selectedLocation && !showDetailModal && !showPickupForm && !showReviewForm && (
            <Popup
              longitude={selectedLocation.longitude}
              latitude={selectedLocation.latitude}
              onClose={() => setSelectedLocation(null)}
              closeOnClick={false}
              anchor="bottom"
              offset={35}
              className="custom-popup"
              maxWidth="360px"
            >
              <div className="p-4 w-[320px] max-w-full">
                <h3 className="font-bold text-base mb-2 text-gray-900 truncate" title={selectedLocation.name}>
                  {selectedLocation.name}
                </h3>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium capitalize">
                      {selectedLocation.type.replace('_', ' ')}
                    </span>
                    {selectedLocation.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      {selectedLocation.street && `${selectedLocation.street}, `}
                      {selectedLocation.city}
                    </span>
                  </div>

                  {selectedLocation.rating && selectedLocation.rating > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-sm text-gray-800">
                        {selectedLocation.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({selectedLocation.total_reviews} ulasan)
                      </span>
                    </div>
                  )}

                  {selectedLocation.distance_km != null && (
                    <div className="flex items-center gap-1 text-sm text-green-600 font-semibold p-2 bg-green-50 rounded-lg">
                      <Navigation className="w-4 h-4" />
                      {selectedLocation.distance_km.toFixed(2)} km
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={handleViewDetail}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium transition"
                  >
                    <Info className="w-4 h-4" />
                    Detail
                  </button>

                  <button
                    onClick={() => handleReviewRequest(selectedLocation)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition"
                  >
                    <Star className="w-4 h-4" />
                    Ulas
                  </button>


                </div>
              </div>
            </Popup>
          )}
        </Map>
      )}

      {showDetailModal && selectedLocation && (
        <LocationDetailModal location={selectedLocation} />
      )}

      {showPickupForm && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1002] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Request Penjemputan</h2>
                <p className="text-sm text-gray-600 mt-1">Ke: {selectedLocation.name}</p>
              </div>
              <button
                onClick={() => setShowPickupForm(false)}
                // --- PERBAIKAN KELAS CSS DI BAWAH INI ---
                className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 hover:text-red-700 transition-all duration-200 focus:outline-none"
                aria-label="Tutup"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <PickupRequestForm
                locationId={selectedLocation.id}
                onSuccess={() => {
                  setShowPickupForm(false);
                  toast.success('Permintaan penjemputan berhasil dibuat!');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showReviewForm && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1002] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tulis Ulasan</h2>
                <p className="text-sm text-gray-600 mt-1">Untuk: {selectedLocation.name}</p>
              </div>
              <button
                onClick={() => setShowReviewForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <ReviewForm
                locationId={selectedLocation.id}
                onSuccess={() => {
                  setShowReviewForm(false);
                  toast.success('Ulasan Anda berhasil dikirim!');
                  if (userLocation) {
                    fetchLocations(userLocation[0], userLocation[1]);
                  } else {
                    fetchLocations();
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
MapContainer.displayName = 'MapContainer';
export default MapContainer;
                                    
