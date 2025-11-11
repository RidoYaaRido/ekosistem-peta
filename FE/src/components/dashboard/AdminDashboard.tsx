// src/components/dashboard/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Users, MapPin, Package, TrendingUp, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalMitra: number;
  totalPickupsThisMonth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationStats, setLocationStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchLocationStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Gagal mengambil statistik admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocationStats = async () => {
    try {
      const { data } = await api.get('/locations/admin/stats');
      setLocationStats(data.data);
    } catch (error) {
      console.error('Gagal mengambil statistik lokasi:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Gagal Memuat Data</h2>
        <p className="text-red-600">Tidak dapat mengambil statistik dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-pink-600 text-white p-8 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Admin Dashboard 🛡️
            </h1>
            <p className="text-xl text-red-100">
              Panel Kontrol & Moderasi Sistem
            </p>
            <p className="text-red-200 mt-1">
              Kelola pengguna, lokasi, dan aktivitas platform
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur">
              <TrendingUp className="w-16 h-16 text-red-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-gray-600">Pengguna</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total pengguna terdaftar</p>
            <Link href="/dashboard/users" className="text-blue-600 font-medium hover:underline text-sm">
              Kelola →
            </Link>
          </div>
        </div>

        {/* Total Mitra */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gray-900">{stats.totalMitra}</p>
              <p className="text-sm text-gray-600">Mitra</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Bank Sampah & Jasa Angkut Sampah</p>
            <Link href="/dashboard/locations" className="text-green-600 font-medium hover:underline text-sm">
              Lihat →
            </Link>
          </div>
        </div>

        {/* Monthly Pickups */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-gray-900">{stats.totalPickupsThisMonth}</p>
              <p className="text-sm text-gray-600">Penjemputan</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Selesai bulan ini</p>
            <Link href="/dashboard/pickups" className="text-orange-600 font-medium hover:underline text-sm">
              Detail →
            </Link>
          </div>
        </div>
      </div>

      {/* Location Status Overview */}
      {locationStats && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📍 Status Lokasi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Total Lokasi</h3>
                <MapPin className="w-5 h-5 text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {locationStats.byStatus?.total || 0}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Disetujui</h3>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-700">
                {locationStats.byStatus?.approved || 0}
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Pending</h3>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-700">
                {locationStats.byStatus?.pending || 0}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-md border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Ditolak</h3>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-700">
                {locationStats.byStatus?.rejected || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Types */}
      {locationStats?.byType && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🏢 Tipe Lokasi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Bank Sampah</h3>
              <p className="text-4xl font-bold text-green-600">
                {locationStats.byType.bank_sampah || 0}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Jasa Angkut</h3>
              <p className="text-4xl font-bold text-blue-600">
                {locationStats.byType.jasa_angkut || 0}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Keduanya</h3>
              <p className="text-4xl font-bold text-purple-600">
                {locationStats.byType.both || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">⚡ Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/dashboard/users"
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition mb-4">
                <Users className="w-10 h-10 text-blue-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition mb-1">
                Kelola Pengguna
              </h3>
              <p className="text-sm text-gray-600">Lihat & edit user</p>
            </div>
          </Link>

          <Link
            href="/dashboard/locations"
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition mb-4">
                <MapPin className="w-10 h-10 text-green-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition mb-1">
                Moderasi Lokasi
              </h3>
              <p className="text-sm text-gray-600">Approve/reject lokasi</p>
            </div>
          </Link>

          <Link
            href="/dashboard/pickups"
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-600 transition mb-4">
                <Package className="w-10 h-10 text-orange-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition mb-1">
                Monitor Pickup
              </h3>
              <p className="text-sm text-gray-600">Pantau aktivitas</p>
            </div>
          </Link>

          <Link
            href="/dashboard/reviews"
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition mb-4">
                <Eye className="w-10 h-10 text-purple-600 group-hover:text-white transition" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition mb-1">
                Moderasi Ulasan
              </h3>
              <p className="text-sm text-gray-600">Review flagged content</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Top Rated Locations */}
      {locationStats?.topRated && locationStats.topRated.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">⭐ Top 5 Lokasi Rating Tertinggi</h2>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Nama Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Total Ulasan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locationStats.topRated.map((loc: any, index: number) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{loc.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-bold text-gray-900">
                          {loc.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {loc.total_reviews || 0} ulasan
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alert if pending locations */}
      {locationStats?.byStatus?.pending > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-2 text-lg">
                ⚠️ Lokasi Menunggu Moderasi
              </h3>
              <p className="text-yellow-800 mb-4">
                Ada <strong>{locationStats.byStatus.pending} lokasi</strong> yang menunggu persetujuan Anda.
              </p>
              <Link
                href="/dashboard/locations?status=pending"
                className="inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold shadow-md hover:shadow-lg transition"
              >
                Moderasi Sekarang →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}