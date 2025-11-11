// src/components/dashboard/EditUserModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Interface yang sudah disesuaikan dengan backend Supabase
interface User {
  id: string; // <-- Diperbaiki dari _id
  name: string;
  email: string;
  role: 'public' | 'mitra' | 'admin';
  is_active: boolean; // <-- Diperbaiki dari isActive
  created_at: string; // <-- Diperbaiki dari createdAt
}

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export default function EditUserModal({ user, isOpen, onClose, onUserUpdated }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'public' as 'public' | 'mitra' | 'admin',
    is_active: true, // <-- Diperbaiki ke is_active
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update form ketika user berubah
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        is_active: user.is_active, // <-- Diperbaiki ke user.is_active
      });
    }
  }, [user]);

  // Reset form ketika modal ditutup
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        role: 'public',
        is_active: true,
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Panggil endpoint PUT dengan field yang sesuai backend
      await api.put(`/admin/users/${user.id}`, formData); // <-- Diperbaiki ke user.id
      toast.success('Data user berhasil diperbarui');
      onUserUpdated();
      onClose();
    } catch (error: any) { // <-- PERBAIKAN: Kurung kurawal ditambahkan di sini
      toast.error(error.response?.data?.error || 'Gagal memperbarui data user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
            <button
              onClick={onClose}
              className="p-2  hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
            </div>

            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full text-gray-800 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'public' | 'mitra' | 'admin' })}
                required
                className="w-full text-gray-800 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="public">Public (Pengguna Umum)</option>
                <option value="mitra">Mitra (Bank Sampah/Jasa Angkut Sampah)</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Status Aktif */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active} // <-- Diperbaiki ke formData.is_active
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} // <-- Diperbaiki ke is_active
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Akun Aktif
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                User yang nonaktif tidak dapat login ke sistem
              </p>
            </div>

            {/* Info Tambahan */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Dibuat:</strong> {new Date(user.created_at).toLocaleDateString('id-ID', { // <-- Diperbaiki ke user.created_at
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}