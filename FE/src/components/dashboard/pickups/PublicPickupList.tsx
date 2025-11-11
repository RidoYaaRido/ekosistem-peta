// src/components/dashboard/pickups/PublicPickupList.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Package, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-react';

// Interface untuk data penjemputan
interface PickupRequest {
  id: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  location: {
    id: string;
    name: string;
    phone: string;
    street?: string;
    city?: string;
  };
  waste_items?: {
    category: { name: string };
    estimated_weight: number;
    actual_weight?: number;
    unit: string;
  }[];
  pickup_street?: string;
  pickup_city?: string;
  user_notes?: string;
  cancellation_reason?: string;
  estimated_points?: number;
  actual_points?: number;
  created_at: string;
}

export default function PublicPickupList() {
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchMyPickups();
  }, [statusFilter]);

  const fetchMyPickups = async () => {
    setIsLoading(true);
    try {
      // PERBAIKAN: Gunakan endpoint yang benar '/my-pickups'
      const { data } = await api.get('/pickups/my-pickups', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      
      console.log('✅ Pickups loaded:', data.data.length);
      setPickups(data.data || []);
    } catch (error: any) {
      console.error('❌ Error fetching pickups:', error);
      toast.error(error.response?.data?.error || 'Gagal memuat riwayat permintaan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPickup = async (pickupId: string) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan permintaan ini?')) {
      const toastId = toast.loading('Membatalkan permintaan...');
      try {
        await api.put(`/pickups/${pickupId}/cancel`, {
          reason: 'Dibatalkan oleh pengguna',
        });
        toast.success('Permintaan berhasil dibatalkan', { id: toastId });
        fetchMyPickups(); // Refresh data
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Gagal membatalkan', { id: toastId });
      }
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          text: 'Menunggu Konfirmasi', 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Clock 
        };
      case 'accepted':
        return { 
          text: 'Diterima', 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: CheckCircle 
        };
      case 'scheduled':
        return { 
          text: 'Dijadwalkan', 
          color: 'text-indigo-600', 
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          icon: Calendar 
        };
      case 'in_progress':
        return { 
          text: 'Dalam Perjalanan', 
          color: 'text-purple-600', 
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: MapPin 
        };
      case 'completed':
        return { 
          text: 'Selesai', 
          color: 'text-green-600', 
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle 
        };
      case 'cancelled':
        return { 
          text: 'Dibatalkan', 
          color: 'text-red-600', 
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: XCircle 
        };
      default:
        return { 
          text: 'N/A', 
          color: 'text-gray-500', 
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: AlertTriangle 
        };
    }
  };

  const getTimeSlotLabel = (slot: string) => {
    switch(slot) {
      case 'morning': return 'Pagi (08:00 - 12:00)';
      case 'afternoon': return 'Siang (12:00 - 16:00)';
      case 'evening': return 'Sore (16:00 - 18:00)';
      default: return slot;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Riwayat Penjemputan</h1>
        <p className="text-gray-600">Lacak semua permintaan penjemputan sampah Anda</p>
      </div>

      {/* Filter Status */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <label className="font-medium text-gray-700">Filter Status:</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'pending', label: 'Pending' },
            { value: 'accepted', label: 'Diterima' },
            { value: 'scheduled', label: 'Dijadwalkan' },
            { value: 'in_progress', label: 'Dalam Perjalanan' },
            { value: 'completed', label: 'Selesai' },
            { value: 'cancelled', label: 'Dibatalkan' },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === filter.value
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : pickups.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum Ada Permintaan Penjemputan
          </h3>
          <p className="text-gray-500 mb-4">
            {statusFilter === 'all' 
              ? 'Anda belum membuat permintaan penjemputan.'
              : `Tidak ada permintaan dengan status "${statusFilter}".`
            }
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <MapPin className="w-5 h-5" />
            Cari Lokasi Mitra
          </a>
        </div>
      ) : (
        /* Pickup List */
        <div className="space-y-4">
          {pickups.map(pickup => {
            const statusInfo = getStatusInfo(pickup.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div 
                key={pickup.id} 
                className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${statusInfo.borderColor} hover:shadow-md transition`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.text}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {pickup.location.name}
                    </h3>
                    
                    {pickup.location.street && (
                      <p className="text-sm text-gray-600 flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {pickup.location.street}, {pickup.location.city}
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2 sm:justify-end">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {new Date(pickup.scheduled_date).toLocaleDateString('id-ID', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2 sm:justify-end">
                      <Clock className="w-4 h-4" />
                      {getTimeSlotLabel(pickup.time_slot)}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>

                {/* Waste Items */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-600" />
                    Item Sampah:
                  </h4>
                  <div className="space-y-2">
                    {pickup.waste_items && pickup.waste_items.length > 0 ? (
                      pickup.waste_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span className="text-gray-700 font-medium">{item.category.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">
                              Est: {item.estimated_weight} {item.unit}
                            </span>
                            {item.actual_weight && (
                              <span className="text-green-700 font-semibold">
                                Aktual: {item.actual_weight} {item.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">Tidak ada detail item</p>
                    )}
                  </div>
                </div>

                {/* Points Info */}
                {pickup.status === 'completed' && pickup.actual_points && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800 font-semibold">
                      ✨ Poin yang didapat: <span className="text-lg">{pickup.actual_points}</span> poin
                    </p>
                  </div>
                )}

                {/* Estimated Points */}
                {pickup.status !== 'completed' && pickup.estimated_points && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      💡 Estimasi poin: <span className="font-semibold">{pickup.estimated_points}</span> poin
                    </p>
                  </div>
                )}

                {/* User Notes */}
                {pickup.user_notes && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-gray-600 mb-1">Catatan Anda:</p>
                    <p className="text-sm text-gray-800">{pickup.user_notes}</p>
                  </div>
                )}

                {/* Cancellation Reason */}
                {pickup.status === 'cancelled' && pickup.cancellation_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-red-600 mb-1">Alasan Pembatalan:</p>
                    <p className="text-sm text-red-800 font-medium">{pickup.cancellation_reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {['pending', 'accepted', 'scheduled'].includes(pickup.status) && (
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      ID: {pickup.id.substring(0, 8)}...
                    </p>
                    <button
                      onClick={() => handleCancelPickup(pickup.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition"
                    >
                      Batalkan Permintaan
                    </button>
                  </div>
                )}

                {/* Info Footer for Completed/Cancelled */}
                {['completed', 'cancelled'].includes(pickup.status) && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      ID: {pickup.id.substring(0, 8)}... • Dibuat: {new Date(pickup.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}