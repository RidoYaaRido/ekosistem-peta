// src/components/dashboard/LocationActionModal.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, MapPin, Phone, Clock } from 'lucide-react';
import { Location } from '@/types';

interface LocationActionModalProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
  isAdmin?: boolean;
}

export default function LocationActionModal({ 
  location, 
  isOpen, 
  onClose, 
  onActionComplete,
  isAdmin = false 
}: LocationActionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!location) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Menyetujui lokasi...');
    try {
      await api.put(`/locations/${location.id || location._id}/approve`);
      toast.success('Lokasi berhasil disetujui', { id: toastId });
      onActionComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menyetujui lokasi', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!location) return;
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading('Menolak lokasi...');
    try {
      await api.put(`/locations/${location.id || location._id}/reject`, { reason: rejectionReason });
      toast.success('Lokasi berhasil ditolak', { id: toastId });
      setRejectionReason('');
      onActionComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menolak lokasi', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location) return null;
  
  const operatingHours = location.operating_hours || {};
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detail Lokasi: ${location.name}`}>
      <div className="space-y-4 text-sm">
        {/* Informasi Dasar */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-xs">Status</p>
            <div className="mt-1">
              {location.status === 'approved' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  Disetujui
                </span>
              )}
              {location.status === 'pending' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  Pending
                </span>
              )}
              {location.status === 'rejected' && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                  Ditolak
                </span>
              )}
              {location.status === 'suspended' && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                  Ditangguhkan
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-xs">Tipe</p>
            <p className="text-gray-900 font-medium mt-1 capitalize">
              {location.type.replace('_', ' ')}
            </p>
          </div>
        </div>

        {location.description && (
          <div>
            <p className="text-gray-600 text-xs">Deskripsi</p>
            <p className="text-gray-800 mt-1">{location.description}</p>
          </div>
        )}

        {/* Alamat & Kontak (Perbaikan) */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            Alamat & Kontak
          </h4>
          <div className="space-y-2">
            <div>
              <p className="text-gray-600 text-xs">Alamat Lengkap</p>
              <p className="text-gray-800 mt-1">
                {location.street}, {location.city}, {location.province}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-xs">Telepon</p>
                <p className="text-gray-800 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {location.phone}
                </p>
              </div>
              {location.email && (
                <div>
                  <p className="text-gray-600 text-xs">Email</p>
                  <p className="text-gray-800 mt-1">{location.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pemilik (Admin) */}
        {isAdmin && location.owner && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Informasi Pemilik (Mitra)</h4>
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
              <div>
                <p className="text-gray-600 text-xs">Nama</p>
                <p className="text-gray-800 font-medium mt-1">{location.owner.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {location.owner.email && (
                  <div>
                    <p className="text-gray-600 text-xs">Email</p>
                    <p className="text-gray-800 mt-1 text-xs">{location.owner.email}</p>
                  </div>
                )}
                {location.owner.phone && (
                  <div>
                    <p className="text-gray-600 text-xs">Telepon</p>
                    <p className="text-gray-800 mt-1">{location.owner.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jam Operasional (Perbaikan) */}
        {location.operating_hours && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              Jam Operasional
            </h4>
            <div className="space-y-1 text-xs">
              {Object.entries(operatingHours).map(([day, hours]: [string, any]) => (
                <div key={day} className="flex justify-between py-1">
                  <span className="text-gray-600 capitalize">{day}</span>
                  <span className="text-gray-800 font-medium">
                    {hours.isClosed ? 'Tutup' : `${hours.open} - ${hours.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alasan Penolakan */}
        {location.status === 'rejected' && location.rejection_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-800 text-xs mb-1">Alasan Penolakan:</p>
            <p className="text-red-700 text-sm">{location.rejection_reason}</p>
          </div>
        )}

        {/* Form Alasan Penolakan */}
        {isAdmin && location.status === 'pending' && (
          <div className="pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Penolakan (jika ditolak) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-400 text-sm"
              placeholder="Jelaskan mengapa lokasi ini ditolak..."
            />
            <p className="text-xs text-gray-500 mt-1">
              * Wajib diisi jika Anda akan menolak lokasi ini
            </p>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          {isAdmin && location.status === 'pending' && (
            <>
              <button type="button" onClick={onClose} /* ... (Batal) ... */ >Batal</button>
              <button type="button" onClick={handleReject} /* ... (Tolak) ... */ >Tolak</button>
              <button type="button" onClick={handleApprove} /* ... (Setujui) ... */ >Setujui</button>
            </>
          )}
          {(isAdmin && location.status !== 'pending' || !isAdmin) && (
            <button type="button" onClick={onClose} /* ... (Tutup) ... */ >Tutup</button>
          )}
        </div>
      </div>
    </Modal>
  );
}
