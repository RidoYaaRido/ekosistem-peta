// src/app/(dashboard)/locations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import LocationTable from '@/components/dashboard/LocationTable';
import LocationActionModal from '@/components/dashboard/LocationActionModal';
import CreateLocationForm from '@/components/dashboard/CreateLocationForm';
import EditLocationForm from '@/components/dashboard/EditLocationForm';
import AdminEditLocationForm from '@/components/dashboard/AdminEditLocationForm';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Filter, AlertCircle } from 'lucide-react';

// Interface "datar" sesuai database
interface Location {
  id: string; // Gunakan id dari SQL
  name: string;
  owner?: { name: string; email?: string; phone?: string };
  type: 'bank_sampah' | 'jasa_angkut';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string; // Ganti nama dari createdAt
  
  // Field "datar" (flat)
  street: string;
  city: string;
  province: string;
  postal_code?: string;
  phone: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  
  operating_hours?: any;
  pickup_service: boolean;
  dropoff_service: boolean;
  
  // Field Admin/Edit
  rejection_reason?: string;
  verified: boolean;
  is_active: boolean; // Ganti nama dari isActive
  
  // Field Mongoose lama (jika masih ada di data)
  _id?: string;
}

export default function ManageLocationsPage() {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const isAdmin = user?.role === 'admin';
  const isMitra = user?.role === 'mitra';
  
  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.type = filterType;

      // Panggil endpoint dashboard yang sudah benar
      const { data } = await api.get('/locations/dashboard', { params });
      
      setLocations(data.data);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      toast.error(error.response?.data?.error || 'Gagal memuat data lokasi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) { // Pastikan user sudah ada sebelum fetch
      fetchLocations();
    }
  }, [filterStatus, filterType, user]); // Tambahkan user sebagai dependency

  const handleViewDetails = (location: Location) => {
    setSelectedLocation(location);
    setIsActionModalOpen(true);
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsEditModalOpen(true);
  };

  const handleCloseActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedLocation(null);
  };

  const handleActionComplete = () => {
    fetchLocations();
  };

  const handleCreateSuccess = () => {
    fetchLocations();
    // Toast sudah ada di dalam form
  };

  const handleEditSuccess = () => {
    fetchLocations();
    // Toast sudah ada di dalam form
  };

  // Statistik
  const pendingCount = locations.filter(l => l.status === 'pending').length;
  const approvedCount = locations.filter(l => l.status === 'approved').length;
  const rejectedCount = locations.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Kelola Semua Lokasi' : 'Lokasi Saya'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin 
              ? 'Kelola dan moderasi semua lokasi mitra' 
              : 'Kelola lokasi yang Anda daftarkan'}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md transition-colors"
        >
          <Plus className="w-5 h-5" /> Tambah Lokasi
        </button>
      </div>

      {/* Info Alert untuk Mitra */}
      {isMitra && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Informasi untuk Mitra</p>
            <p>
              Lokasi yang Anda tambahkan/edit akan melalui proses verifikasi oleh admin. 
              Status lokasi Anda: <span className="font-semibold">{pendingCount} pending</span>, 
              <span className="font-semibold text-green-700"> {approvedCount} disetujui</span>, 
              <span className="font-semibold text-red-700"> {rejectedCount} ditolak</span>.
            </p>
          </div>
        </div>
      )}

      {/* Statistik Cards untuk Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Lokasi</p>
            <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-700">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">{pendingCount}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-700">Disetujui</p>
            <p className="text-2xl font-bold text-green-800">{approvedCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <p className="text-sm text-red-700">Ditolak</p>
            <p className="text-2xl font-bold text-red-800">{rejectedCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Filter</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="all">Semua Tipe</option>
              <option value="bank_sampah">Bank Sampah</option>
              <option value="jasa_angkut">Jasa Angkut Sampah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          <LocationTable 
            locations={locations} 
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            isAdmin={isAdmin}
          />
          {locations.length === 0 && (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500">
                {isMitra 
                  ? 'Anda belum memiliki lokasi. Tambahkan lokasi pertama Anda!'
                  : 'Tidak ada lokasi yang sesuai dengan filter.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <LocationActionModal
        location={selectedLocation}
        isOpen={isActionModalOpen}
        onClose={handleCloseActionModal}
        onActionComplete={handleActionComplete}
        isAdmin={isAdmin}
      />

      <CreateLocationForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Pisahkan form edit: Admin vs Mitra */}
      {isAdmin ? (
        <AdminEditLocationForm
          location={selectedLocation}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedLocation(null);
          }}
          onSuccess={handleEditSuccess}
        />
      ) : (
        <EditLocationForm
          location={selectedLocation}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedLocation(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}