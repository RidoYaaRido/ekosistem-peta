// src/components/dashboard/pickups/ManagePickupModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Package, CheckCircle, XCircle, Info } from 'lucide-react';

// Interface untuk data penjemputan yang diterima dari props
interface PickupRequest {
  id: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  waste_items: {
    category: { name: string, id: string };
    estimated_weight: number;
    actual_weight: number; // Ini bisa null
    unit: string;
  }[];
  // Tambahkan field lain jika perlu ditampilkan di modal
  user?: { name: string; phone: string };
  pickup_street?: string;
  pickup_city?: string;
  user_notes?: string;
}

interface ManagePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pickup: PickupRequest;
  isAdmin?: boolean;
}

// Data untuk item sampah yang akan di-update
interface ActualWasteItem {
  category_id: string;
  actual_weight: number;
}

export default function ManagePickupModal({ isOpen, onClose, onSuccess, pickup, isAdmin = false }: ManagePickupModalProps) {
  const [newStatus, setNewStatus] = useState(pickup.status);
  const [cancellationReason, setCancellationReason] = useState('');
  const [actualItems, setActualItems] = useState<ActualWasteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Inisialisasi state actualItems saat modal dibuka
  useEffect(() => {
    if (pickup) {
      setNewStatus(pickup.status);
      setActualItems(pickup.waste_items.map(item => ({
        category_id: item.category.id,
        // Gunakan actual_weight jika ada, jika tidak, fallback ke estimated_weight
        actual_weight: item.actual_weight || item.estimated_weight 
      })));
    }
  }, [pickup, isOpen]);

  const handleWeightChange = (category_id: string, weight: number) => {
    setActualItems(prevItems =>
      prevItems.map(item =>
        item.category_id === category_id ? { ...item, actual_weight: weight } : item
      )
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Memperbarui status...');
    
    // Siapkan payload berdasarkan endpoint 'updatePickupStatus'
    const payload: any = {
      status: newStatus,
    };
    
    if (newStatus === 'completed') {
      // Validasi berat aktual
      if (actualItems.some(item => item.actual_weight <= 0)) {
        toast.error('Berat aktual harus lebih dari 0', { id: toastId });
        setIsLoading(false);
        return;
      }
      payload.actual_weight_items = actualItems;
      payload.driver_notes = 'Telah diselesaikan oleh Mitra/Admin';
    }
    
    if (newStatus === 'cancelled') {
      if (!cancellationReason.trim()) {
        toast.error('Alasan pembatalan harus diisi', { id: toastId });
        setIsLoading(false);
        return;
      }
      // 'cancellation_reason' diisi melalui field 'driver_notes'
      payload.driver_notes = cancellationReason; 
    }

    try {
      // Panggil API untuk update status
      await api.put(`/pickups/${pickup.id}/status`, payload);
      toast.success('Status berhasil diperbarui!', { id: toastId });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memperbarui status', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Tentukan status apa saja yang bisa dipilih
  const getStatusOptions = () => {
    const options = [
      { value: 'pending', label: 'Pending (Menunggu Konfirmasi)' },
      { value: 'accepted', label: 'Terima Permintaan' },
      { value: 'scheduled', label: 'Jadwalkan Penjemputan' },
      { value: 'in_progress', label: 'Dalam Perjalanan' },
      { value: 'completed', label: 'Selesaikan (Selesai)' },
      { value: 'cancelled', label: 'Batalkan' },
    ];
    
    // Mitra/Admin tidak bisa mengembalikan status ke 'pending' jika sudah diproses
    if (pickup.status !== 'pending') {
      return options.filter(opt => opt.value !== 'pending');
    }
    return options;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Penjemputan">
      <div className="space-y-6">
        
        {/* Informasi Pengguna & Alamat (jika ada) */}
        {pickup.user && (
           <div className="bg-gray-50 p-4 rounded-lg border">
             <h4 className="font-semibold text-gray-800 mb-2">Detail Pemesan</h4>
             <p className="text-sm text-gray-700"><strong>Nama:</strong> {pickup.user.name}</p>
             <p className="text-sm text-gray-700"><strong>Telepon:</strong> {pickup.user.phone}</p>
             <p className="text-sm text-gray-700"><strong>Alamat:</strong> {pickup.pickup_street}, {pickup.pickup_city}</p>
             {pickup.user_notes && <p className="text-sm text-gray-700 mt-2"><strong>Catatan:</strong> {pickup.user_notes}</p>}
           </div>
        )}

        {/* Pilihan Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubah Status Permintaan
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-800"
          >
            {getStatusOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Form Input Berat Aktual (jika status 'Selesai') */}
        {newStatus === 'completed' && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Input Berat Aktual & Poin
            </h4>
            <p className="text-xs text-gray-500">
              Masukkan berat sampah yang sebenarnya ditimbang untuk menghitung poin pengguna.
            </p>
            <div className="space-y-3">
              {pickup.waste_items.map((item, index) => (
                <div key={item.category.id} className="grid grid-cols-5 gap-3 items-center">
                  <label className="text-sm text-gray-600 col-span-3">{item.category.name}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={actualItems[index]?.actual_weight || 0}
                    onChange={(e) => handleWeightChange(item.category.id, parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right col-span-2"
                  />
                </div>
              ))}
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
               <p className="text-sm text-green-800 flex items-center gap-2">
                 <CheckCircle className="w-4 h-4"/>
                 Poin akan otomatis diberikan ke pengguna saat Anda menyimpan.
               </p>
            </div>
          </div>
        )}

        {/* Form Alasan Pembatalan (jika status 'Batal') */}
        {newStatus === 'cancelled' && (
          <div className="pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alasan Pembatalan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Contoh: Pengguna tidak ada di lokasi..."
            />
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}