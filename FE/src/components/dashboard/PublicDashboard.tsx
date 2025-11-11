// src/components/dashboard/PublicDashboard.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import { MapPin, Package, Award, Calendar, TrendingUp, Star, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  city: string;
  province: string;
  type: string;
  street: string;
  rating: number;
  total_reviews: number;
  verified: boolean;
  pickup_service: boolean;
}

interface DashboardStats {
  totalPickups: number;
  pendingPickups: number;
  completedPickups: number;
  totalPoints: number;
  badge: string;
}

export default function PublicDashboard() {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchLocations();
    fetchStats();
  }, []);

  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const { data } = await api.get('/locations', {
        params: { limit: 6, sort: '-rating' }
      });
      setLocations(data.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Gagal memuat lokasi mitra.');
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const { data } = await api.get('/pickups/my-pickups', {
        params: { limit: 1000 }
      });
      
      const pickups = data.data || [];
      const completed = pickups.filter((p: any) => p.status === 'completed').length;
      const pending = pickups.filter((p: any) => p.status === 'pending').length;
      
      setStats({
        totalPickups: pickups.length,
        pendingPickups: pending,
        completedPickups: completed,
        totalPoints: user?.points || 0,
        badge: user?.badge || 'Bronze'
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      // Set default stats jika error
      setStats({
        totalPickups: 0,
        pendingPickups: 0,
        completedPickups: 0,
        totalPoints: user?.points || 0,
        badge: user?.badge || 'Bronze'
      });
      
      // Tampilkan error hanya jika bukan 404
      if (error.response?.status !== 404) {
        toast.error('Gagal memuat statistik pickup');
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Selamat Datang, {user?.name}! 👋
            </h1>
            <p className="text-green-100 text-lg">
              Terus berkontribusi untuk lingkungan yang lebih bersih
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur">
              <Award className="w-16 h-16 text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Poin */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-7 h-7 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {isLoadingStats ? '...' : stats?.totalPoints || 0}
              </p>
              <p className="text-sm text-gray-600">Total Poin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              {stats?.badge || 'Bronze'}
            </span>
            <span className="text-xs text-gray-500">Badge Anda</span>
          </div>
        </div>

        {/* Total Penjemputan */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {isLoadingStats ? '...' : stats?.totalPickups || 0}
              </p>
              <p className="text-sm text-gray-600">Total Request</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Penjemputan sampah</p>
        </div>

        {/* Pending */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-7 h-7 text-yellow-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {isLoadingStats ? '...' : stats?.pendingPickups || 0}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Menunggu konfirmasi</p>
        </div>

        {/* Completed */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {isLoadingStats ? '...' : stats?.completedPickups || 0}
              </p>
              <p className="text-sm text-gray-600">Selesai</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Penjemputan berhasil</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition">
                <MapPin className="w-8 h-8 text-green-600 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-green-600 transition">
                  Cari Lokasi
                </p>
                <p className="text-sm text-gray-600">Temukan mitra terdekat</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/dashboard/pickups" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition">
                <Package className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                  Riwayat Pickup
                </p>
                <p className="text-sm text-gray-600">Lihat status request</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/dashboard/profile" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition">
                <Award className="w-8 h-8 text-purple-600 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-purple-600 transition">
                  Profil & Badge
                </p>
                <p className="text-sm text-gray-600">Lihat pencapaian</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Top Locations */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Lokasi Mitra Terbaik
          </h2>
          <Link href="/" className="text-sm font-medium text-green-600 hover:text-green-700">
            Lihat Semua →
          </Link>
        </div>

        {isLoadingLocations ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat lokasi...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center">
            <MapPin className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Belum ada lokasi mitra</p>
            <p className="text-sm text-gray-400">Lokasi mitra akan muncul di sini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-green-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition line-clamp-1">
                    {loc.name}
                  </h3>
                  {loc.verified && (
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold capitalize">
                    {loc.type.replace('_', ' ')}
                  </span>
                  {loc.pickup_service && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      🚚 Pickup
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {loc.street}, {loc.city}
                  </p>
                </div>

                {loc.rating > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg mb-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-sm text-gray-900">
                      {loc.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({loc.total_reviews} ulasan)
                    </span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link 
                    href={`/location/${loc.id}`}
                    className="block w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition text-center"
                  >
                    Lihat Detail & Request
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          💡 Tips Mengumpulkan Poin
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">1</span>
            </div>
            <p className="text-gray-700">
              <strong>Sortir sampah</strong> berdasarkan kategori untuk poin maksimal
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">2</span>
            </div>
            <p className="text-gray-700">
              <strong>Bersihkan sampah</strong> dari kotoran sebelum disetor
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">3</span>
            </div>
            <p className="text-gray-700">
              <strong>Jadwalkan pickup</strong> secara rutin setiap bulan
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">4</span>
            </div>
            <p className="text-gray-700">
              <strong>Berikan ulasan</strong> untuk membantu pengguna lain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}