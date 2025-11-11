// src/components/dashboard/pickups/AdminPickupManager.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ManagePickupModal from './ManagePickupModal'; // Modal yang sama dengan Mitra
import { Calendar, User, MapPin, AlertTriangle } from 'lucide-react';

// Interface untuk data penjemputan
interface PickupRequest {
  id: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  user: { name: string };
  location: { name: string }; // Admin perlu tahu lokasinya
  waste_items: {
    category: { name: string, id: string };
    estimated_weight: number;
    actual_weight: number;
    unit: string;
  }[];
}

export default function AdminPickupManager() {
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all'); // Admin lihat semua

  useEffect(() => {
    fetchAllPickups();
  }, [filter]);

  const fetchAllPickups = async () => {
    setIsLoading(true);
    try {
      // Panggil endpoint 'getPickups'
      const { data } = await api.get('/pickups', {
        params: { status: filter === 'all' ? '' : filter }
      });
      setPickups(data.data);
    } catch (error) {
      toast.error('Gagal memuat semua penjemputan');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenModal = (pickup: PickupRequest) => {
    setSelectedPickup(pickup);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPickup(null);
  };

  const handleUpdateSuccess = () => {
    handleCloseModal();
    fetchAllPickups(); // Refresh data
  };
  
  const getStatusInfo = (status: string) => {
    // (Fungsi helper yang sama)
    switch (status) {
      case 'pending': return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'accepted': return { text: 'Diterima', color: 'bg-blue-100 text-blue-800' };
      case 'scheduled': return { text: 'Dijadwalkan', color: 'bg-blue-100 text-blue-800' };
      case 'in_progress': return { text: 'Dalam Perjalanan', color: 'bg-indigo-100 text-indigo-800' };
      case 'completed': return { text: 'Selesai', color: 'bg-green-100 text-green-800' };
      case 'cancelled': return { text: 'Dibatalkan', color: 'bg-red-100 text-red-800' };
      default: return { text: 'N/A', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Semua Penjemputan</h1>
      <p className="text-gray-600">Pantau dan kelola semua permintaan penjemputan di sistem.</p>
      
      {/* TODO: Tambahkan Filter Tabs di sini */}
      
      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>
      ) : pickups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada data penjemputan.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Pengguna</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Mitra (Lokasi)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pickups.map(pickup => {
                const statusInfo = getStatusInfo(pickup.status);
                return (
                  <tr key={pickup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-gray-500"/></div>
                        <span className="text-sm font-medium text-gray-800">{pickup.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><MapPin className="w-4 h-4 text-gray-500"/></div>
                        <span className="text-sm font-medium text-gray-800">{pickup.location.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(pickup.scheduled_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenModal(pickup)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal untuk Mengelola Pickup */}
      {isModalOpen && selectedPickup && (
        <ManagePickupModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleUpdateSuccess}
          pickup={selectedPickup}
          isAdmin={true} // Beri tahu modal bahwa ini adalah Admin
        />
      )}
    </div>
  );
}