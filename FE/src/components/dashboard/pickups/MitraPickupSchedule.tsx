// src/components/dashboard/pickups/MitraPickupSchedule.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ManagePickupModal from './ManagePickupModal'; // Modal baru
import { Calendar, Clock, User, AlertTriangle } from 'lucide-react';

// Interface untuk data penjemputan
interface PickupRequest {
  id: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  time_slot: string;
  user: { name: string; phone: string };
  pickup_street: string;
  pickup_city: string;
  waste_items: {
    category: { name: string, id: string };
    estimated_weight: number;
    actual_weight: number;
    unit: string;
  }[];
}

export default function MitraPickupSchedule() {
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('pending,accepted,scheduled,in_progress'); // Tampilkan yang aktif

  useEffect(() => {
    fetchMitraPickups();
  }, [filter]);

  const fetchMitraPickups = async () => {
    setIsLoading(true);
    try {
      // Panggil endpoint 'schedule'
      const { data } = await api.get('/pickups/schedule', {
        params: { status: filter }
      });
      setPickups(data.data);
    } catch (error) {
      toast.error('Gagal memuat jadwal');
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
    fetchMitraPickups(); // Refresh data
  };
  
  const getStatusInfo = (status: string) => {
    // (Fungsi helper yang sama seperti di PublicPickupList)
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
      <h1 className="text-3xl font-bold text-gray-900">Jadwal Penjemputan</h1>
      <p className="text-gray-600">Kelola permintaan penjemputan dari pengguna.</p>
      
      {/* TODO: Tambahkan Filter Tabs di sini jika mau */}

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>
      ) : pickups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Tidak ada jadwal penjemputan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pickups.map(pickup => {
            const statusInfo = getStatusInfo(pickup.status);
            return (
              <div key={pickup.id} className="bg-white rounded-lg shadow-sm border flex flex-col">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                    <div className="text-right">
                       <p className="text-sm font-medium text-gray-800">
                         {new Date(pickup.scheduled_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </p>
                       <p className="text-xs text-gray-500 capitalize">{pickup.time_slot}</p>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900">{pickup.user.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{pickup.pickup_street}, {pickup.pickup_city}</p>
                  <p className="text-sm text-gray-500">{pickup.user.phone}</p>
                  
                  <div className="my-3 border-t border-gray-100"></div>
                  
                  <ul className="space-y-1 text-sm">
                    {pickup.waste_items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span className="text-gray-600">{item.category.name}</span>
                        <span className="text-gray-800">{item.estimated_weight} {item.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-auto p-4 bg-gray-50 border-t">
                  <button
                    onClick={() => handleOpenModal(pickup)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Kelola Permintaan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal untuk Mengelola Pickup */}
      {isModalOpen && selectedPickup && (
        <ManagePickupModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleUpdateSuccess}
          pickup={selectedPickup}
        />
      )}
    </div>
  );
}