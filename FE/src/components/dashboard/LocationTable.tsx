// src/components/dashboard/LocationTable.tsx
'use client';

import { Edit, Eye, Edit2 } from 'lucide-react';
import { useEffect } from 'react';

// Interface "datar"
interface Location {
  id: string; // Gunakan id
  name: string;
  owner?: { name: string };
  type: 'bank_sampah' | 'jasa_angkut';
  city: string; // Ganti dari address.city
  province: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string; // Ganti dari createdAt
  _id?: string; // ID lama (jika ada)
}

interface LocationTableProps {
  locations: Location[];
  onViewDetails: (location: Location) => void;
  onEdit: (location: Location) => void;
  isAdmin?: boolean;
}

export default function LocationTable({ 
  locations, 
  onViewDetails, 
  onEdit,
  isAdmin = false 
}: LocationTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Disetujui</span>;
      case 'pending':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'rejected':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Ditolak</span>;
      case 'suspended':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Ditangguhkan</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'bank_sampah': 'Bank Sampah',
      'jasa_angkut': 'Jasa Angkut Sampah',
    };
    return typeMap[type] || type;
  };

  if (!locations || locations.length === 0) {
    // Jangan render apa-apa, halaman utama akan menangani pesan "kosong"
    return null;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Lokasi
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pemilik (Mitra)
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kota
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((location) => (
              <tr key={location.id || location._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{location.name}</div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{location.owner?.name || '-'}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {getTypeLabel(location.type)}
                </td>
                {/* Perbaikan: Baca location.city */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {location.city}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(location.status)}
                </td>
                {/* Perbaikan: Baca location.created_at */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(location.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetails(location)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      title={isAdmin ? "Lihat Detail & Moderasi" : "Lihat Detail"}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit(location)}
                      className="text-green-600 hover:text-green-900 flex items-center gap-1"
                      title={isAdmin ? "Edit Lokasi (Admin)" : "Edit Lokasi"}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
    </div>

  );
}