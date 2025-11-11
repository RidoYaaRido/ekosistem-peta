// src/components/dashboard/MitraDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  MapPin, 
  Package, 
  Star, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  Award
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  locations: {
    total: number;
    active: number;
    verified: number;
    pending: number;
  };
  pickups: {
    total: number;
    pending: number;
    today: number;
    completed: number;
  };
  performance: {
    totalWasteCollected: number;
    averageRating: number;
    totalTransactions: number;
  };
  recentActivity: {
    pickups: any[];
    reviews: any[];
  };
}

export default function MitraDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      // Fetch overview stats
      const { data: overviewData } = await api.get('/dashboard/overview');
      
      // Fetch recent pickups
      const { data: pickupsData } = await api.get('/pickups/schedule', {
        params: { limit: 5, status: 'pending,accepted,scheduled,in_progress' }
      });
      
      // Fetch recent reviews
      const { data: reviewsData } = await api.get('/reviews', {
        params: { limit: 5, sort: '-created_at' }
      });

      setStats({
        ...overviewData.data,
        recentActivity: {
          pickups: pickupsData.data || [],
          reviews: reviewsData.data || []
        }
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Selamat Datang, {user?.name}! 👋
            </h1>
            <p className="text-green-100 text-lg">
              Dashboard Mitra - Kelola lokasi dan layanan Anda
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur">
              <Award className="w-16 h-16 text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Lokasi */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {stats?.locations.total || 0}
              </p>
              <p className="text-sm text-gray-600">Total Lokasi</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              {stats?.locations.active || 0} Aktif
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {stats?.locations.verified || 0} Verified
            </span>
          </div>
        </div>

        {/* Penjemputan Hari Ini */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {stats?.pickups.today || 0}
              </p>
              <p className="text-sm text-gray-600">Jadwal Hari Ini</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Penjemputan yang dijadwalkan</p>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-yellow-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {stats?.pickups.pending || 0}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Menunggu konfirmasi Anda</p>
        </div>

        {/* Total Completed */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {stats?.pickups.completed || 0}
              </p>
              <p className="text-sm text-gray-600">Selesai</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Penjemputan berhasil</p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Sampah Terkumpul */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.performance.totalWasteCollected.toFixed(1) || 0} kg
              </p>
              <p className="text-sm text-gray-600">Total Sampah Terkumpul</p>
            </div>
          </div>
        </div>

        {/* Rating Rata-rata */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md border border-yellow-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-600 rounded-xl flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.performance.averageRating.toFixed(1) || 0} ⭐
              </p>
              <p className="text-sm text-gray-600">Rating Rata-rata</p>
            </div>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.performance.totalTransactions || 0}
              </p>
              <p className="text-sm text-gray-600">Total Transaksi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link 
            href="/dashboard/locations" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition">
                <MapPin className="w-8 h-8 text-green-600 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-green-600 transition">
                  Kelola Lokasi
                </p>
                <p className="text-xs text-gray-600 mt-1">Tambah/Edit lokasi</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/dashboard/pickups" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition">
                <Package className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-blue-600 transition">
                  Jadwal Pickup
                </p>
                <p className="text-xs text-gray-600 mt-1">Kelola penjemputan</p>
              </div>
            </div>
          </Link>
          
          <Link 
            href="/dashboard/reviews" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-yellow-500"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-600 transition">
                <Star className="w-8 h-8 text-yellow-600 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-yellow-600 transition">
                  Ulasan
                </p>
                <p className="text-xs text-gray-600 mt-1">Tanggapi feedback</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/transactions" 
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition">
                <DollarSign className="w-8 h-8 text-purple-600 group-hover:text-white transition" />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-purple-600 transition">
                  Transaksi
                </p>
                <p className="text-xs text-gray-600 mt-1">Riwayat transaksi</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pickups */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Penjemputan Terbaru
          </h3>
          {stats?.recentActivity.pickups && stats.recentActivity.pickups.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.pickups.slice(0, 5).map((pickup: any) => (
                <div key={pickup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{pickup.user?.name}</p>
                    <p className="text-xs text-gray-600">{new Date(pickup.scheduled_date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    pickup.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    pickup.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    pickup.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {pickup.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada penjemputan terbaru</p>
          )}
          <Link 
            href="/dashboard/pickups"
            className="block text-center mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Lihat Semua →
          </Link>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            Ulasan Terbaru
          </h3>
          {stats?.recentActivity.reviews && stats.recentActivity.reviews.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.reviews.slice(0, 5).map((review: any) => (
                <div key={review.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-gray-900">{review.user?.name}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada ulasan</p>
          )}
          <Link 
            href="/dashboard/reviews"
            className="block text-center mt-4 text-sm font-medium text-yellow-600 hover:text-yellow-700"
          >
            Lihat Semua →
          </Link>
        </div>
      </div>
    </div>
  );
}
