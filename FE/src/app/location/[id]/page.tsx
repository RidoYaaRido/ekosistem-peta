// src/app/location/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import ReviewList from '@/components/review/ReviewList';
import ReviewForm from '@/components/review/ReviewForm';
import PickupRequestForm from '@/components/pickup/PickupRequestForm';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Navigation,
  ArrowLeft,
  Package,
  CheckCircle,
  Calendar,
  AlertCircle,
  Globe,
  Info,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';


interface Location {
  id: string;
  name: string;
  description?: string;
  type: 'bank_sampah' | 'jasa_angkut';
  status: string;
  phone?: string;
  email?: string;
  website?: string;
  street: string;
  city: string;
  province: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  operating_hours?: any;
  pickup_service: boolean;
  dropoff_service: boolean;
  images?: string[];
  rating: number;
  total_reviews: number;
  verified: boolean;
  reviews?: any[];
  accepted_categories?: { id: string; name: string }[];
  distance_km?: number;
}

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  const locationId = params.id as string;

  useEffect(() => {
    if (locationId) {
      fetchLocationDetail(locationId);
    }
  }, [locationId]);

  const fetchLocationDetail = async (id: string) => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching location detail for ID:', id);
      
      const { data } = await api.get(`/locations/${id}`);
      
      console.log('✅ Location data received:', data);
      
      if (data.success && data.data) {
        setLocation(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('❌ Error fetching location:', error);
      console.error('Error details:', error.response?.data);
      
      toast.error(
        error.response?.data?.error || 
        'Gagal memuat detail lokasi. Silakan coba lagi.'
      );
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickupRequest = () => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      router.push('/login');
      return;
    }

    if (user?.role !== 'public') {
      toast.error('Hanya pengguna publik yang dapat melakukan request penjemputan');
      return;
    }

    if (!location?.pickup_service) {
      toast.error('Lokasi ini tidak menyediakan layanan penjemputan');
      return;
    }

    setShowPickupForm(true);
  };

  const getNavigationUrl = () => {
    if (!location) return '#';
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail lokasi...</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Lokasi Tidak Ditemukan
          </h2>
          <p className="text-gray-600 mb-4">
            Lokasi yang Anda cari tidak tersedia.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const operatingHours = location.operating_hours || {};
  const googleMapsUrl = getNavigationUrl();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Kembali</span>
          </button>
          <Link href="/" className="text-2xl font-bold text-green-600">
            Eco-Peta
          </Link>
          <div className="w-24"></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            {location.images && location.images.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <img
                  src={location.images[0]}
                  alt={location.name}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-location.jpg';
                  }}
                />
              </div>
            )}

            {/* Title & Rating */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {location.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium capitalize">
                      {location.type.replace('_', ' ')}
                    </span>
                    {location.verified && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Terverifikasi
                      </span>
                    )}
                    {location.pickup_service && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        🚚 Layanan Penjemputan
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {location.rating && location.rating > 0 && (
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">
                        {location.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {location.total_reviews || 0} ulasan
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {location.description && (
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-green-600" />
                    Deskripsi
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {location.description}
                  </p>
                </div>
              )}

              {/* Address */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Alamat
                </h3>
                <p className="text-gray-700 mb-2">
                  {location.street && `${location.street}, `}
                  {location.city}
                  {location.province && `, ${location.province}`}
                  {location.postal_code && ` ${location.postal_code}`}
                </p>
                {location.distance_km != null && (
                  <div className="flex items-center gap-1 text-green-700 font-semibold">
                    <Navigation className="w-4 h-4" />
                    <span className="text-sm">{location.distance_km.toFixed(2)} km dari Anda</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200 flex">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === 'info'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Informasi
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === 'reviews'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Ulasan ({location.total_reviews || 0})
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-green-600" />
                        Kontak
                      </h3>
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
                    </div>

                    {/* Operating Hours */}
                    {location.operating_hours && Object.keys(operatingHours).length > 0 && (
                      <div>
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          Jam Operasional
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                          {Object.entries(operatingHours).map(([day, hours]: [string, any]) => (
                            <div
                              key={day}
                              className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                              <span className="text-gray-600 capitalize font-medium">
                                {day}
                              </span>
                              <span className="text-gray-800">
                                {hours.isClosed ? 'Tutup' : `${hours.open} - ${hours.close}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Accepted Waste Categories */}
                    {location.accepted_categories && location.accepted_categories.length > 0 && (
                      <div>
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5 text-green-600" />
                          Jenis Sampah yang Diterima
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {location.accepted_categories.map((cat: any) => (
                            <span
                              key={cat.id}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-4">Layanan Tersedia</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`p-4 rounded-lg border-2 text-center ${
                            location.pickup_service
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <Calendar
                            className={`w-6 h-6 mx-auto mb-2 ${
                              location.pickup_service ? 'text-green-600' : 'text-gray-400'
                            }`}
                          />
                          <p
                            className={`text-sm font-semibold ${
                              location.pickup_service ? 'text-green-900' : 'text-gray-500'
                            }`}
                          >
                            Penjemputan
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {location.pickup_service ? 'Tersedia' : 'Tidak Tersedia'}
                          </p>
                        </div>

                        <div
                          className={`p-4 rounded-lg border-2 text-center ${
                            location.dropoff_service
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <MapPin
                            className={`w-6 h-6 mx-auto mb-2 ${
                              location.dropoff_service ? 'text-blue-600' : 'text-gray-400'
                            }`}
                          />
                          <p
                            className={`text-sm font-semibold ${
                              location.dropoff_service ? 'text-blue-900' : 'text-gray-500'
                            }`}
                          >
                            Drop-off
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {location.dropoff_service ? 'Tersedia' : 'Tidak Tersedia'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {isAuthenticated && user?.role === 'public' && (
                      <ReviewForm
                        locationId={location.id}
                        onSuccess={() => fetchLocationDetail(location.id)}
                      />
                    )}
                    <ReviewList locationId={location.id} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">Lokasi</h3>
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
                
                <p className="text-gray-700">
                  {location.street}
                  <br />
                  {location.city}, {location.province}
                  {location.postal_code && ` ${location.postal_code}`}
                </p>
              </div>

              {/* Navigate Button */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium mb-3 transition"
              >
                <Navigation className="w-5 h-5" />
                Buka di Google Maps
              </a>

              {/* Request Pickup Button */}
              {isAuthenticated && user?.role === 'public' && (
                <>
                  {location.pickup_service ? (
                    <button
                      onClick={handlePickupRequest}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                    >
                      <Calendar className="w-5 h-5" />
                      Request Penjemputan
                    </button>
                  ) : (
                    <div className="p-3 bg-gray-100 rounded-lg text-center">
                      <p className="text-sm text-gray-600">
                        Lokasi ini tidak melayani penjemputan
                      </p>
                    </div>
                  )}
                </>
              )}

              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                >
                  Login untuk Request Penjemputan
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pickup Modal */}
      {showPickupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Request Penjemputan</h2>
                <p className="text-sm text-gray-600 mt-1">Ke: {location.name}</p>
              </div>
              <button
                onClick={() => setShowPickupForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <PickupRequestForm
                locationId={location.id}
                onSuccess={() => {
                  setShowPickupForm(false);
                  toast.success('Permintaan penjemputan berhasil dibuat!');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}